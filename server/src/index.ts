import express, { Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { Server, Socket } from 'socket.io';

const PORT = process.env.PORT || 5000;

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: [
            'https://chat-websocket-ashy.vercel.app',
            'http://localhost:5173'
        ],
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

app.use(cors());
app.use(express.json());

interface Message {
    id: string;
    name: string;
    text: string;
    socketId: string;
    roomId: string;
}

interface User {
    id: string;
    name: string;
    room: string;
}

const messages: Record<string, Message[]> = {};
const users = new Map<string, User>();

function emitUsersInRoom(room: string) {
    const roomUsers = Array.from(users.values()).filter(u => u.room === room);
    io.to(room).emit('users', roomUsers);
    console.log(`Emitted users to room ${room}:`, roomUsers.map(u => u.name));
}

function handleUserLeave(socketId: string) {
    const user = users.get(socketId);
    if (user) {
        users.delete(socketId);
        emitUsersInRoom(user.room);

        const leaveMsg: Message = {
            id: `leave-${socketId}-${Date.now()}`,
            name: 'System',
            text: `${user.name} покинул комнату`,
            socketId: 'system',
            roomId: user.room,
        };
        if (!messages[user.room]) messages[user.room] = [];
        messages[user.room].push(leaveMsg);
        io.to(user.room).emit('message', leaveMsg);
        console.log(`User ${user.name} (${socketId}) left room ${user.room}.`);
    }
}

app.get('/api/messages', (req: Request, res: Response) => {
    const room = typeof req.query.room === 'string' ? req.query.room : 'general';
    res.json(messages[room] || []);
});

io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('requestUsersInRoom', (room: string) => {
        console.log(`Client ${socket.id} requested users list for room ${room}.`);
        const roomUsers = Array.from(users.values()).filter(u => u.room === room);
        socket.emit('users', roomUsers);
    });

    socket.on('newUser', ({ name, room }: { name: string; room: string }) => {
        const existingUser = users.get(socket.id);
        if (existingUser && existingUser.room !== room) {
            handleUserLeave(socket.id);
        }

        users.set(socket.id, { id: socket.id, name, room });
        socket.join(room);

        const joinMsg: Message = {
            id: `join-${socket.id}-${Date.now()}`,
            name: 'System',
            text: `${name} присоединился к комнате`,
            socketId: 'system',
            roomId: room,
        };

        if (!messages[room]) messages[room] = [];
        messages[room].push(joinMsg);
        io.to(room).emit('message', joinMsg);

        emitUsersInRoom(room);
        console.log(`User ${name} (${socket.id}) joined room ${room}.`);
    });

    socket.on('sendMessage', (msg: Message) => {
        const { roomId } = msg;
        if (!messages[roomId]) messages[roomId] = [];
        messages[roomId].push(msg);
        io.to(roomId).emit('message', msg);
        console.log(`Message from ${msg.name} in room ${roomId}: ${msg.text}`);
    });

    socket.on('leaveChat', (data?: { name?: string }) => {
        const user = users.get(socket.id);
        const userName = user?.name || data?.name;

        if (user) {
            users.delete(socket.id);
            socket.leave(user.room); // Вызов socket.leave() здесь
            emitUsersInRoom(user.room);

            const leaveMsg: Message = {
                id: `leave-${socket.id}-${Date.now()}`,
                name: 'System',
                text: `${userName || 'Неизвестный пользователь'} покинул комнату`,
                socketId: 'system',
                roomId: user.room,
            };

            if (!messages[user.room]) messages[user.room] = [];
            messages[user.room].push(leaveMsg);
            io.to(user.room).emit('message', leaveMsg);
            console.log(`User ${userName || 'Неизвестный пользователь'} (${socket.id}) left room ${user.room}.`);
        }
    });

    socket.on('disconnect', () => {
        const user = users.get(socket.id);
        if (user) {
            users.delete(socket.id);
            socket.leave(user.room);

            const leaveMsg: Message = {
                id: `leave-${socket.id}-${Date.now()}`,
                name: 'System',
                text: `${user.name} покинул комнату`,
                socketId: 'system',
                roomId: user.room,
            };

            if (!messages[user.room]) messages[user.room] = [];
            messages[user.room].push(leaveMsg);
            io.to(user.room).emit('message', leaveMsg);

            emitUsersInRoom(user.room);
            console.log(`Client disconnected: ${socket.id}`);
        }
    });

    socket.on('getUsers', (room: string) => {
        const roomUsers = Array.from(users.values()).filter(u => u.room === room);
        socket.emit('users', roomUsers);
    });
});

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
