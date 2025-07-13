import express, { Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import {Server, ServerOptions, Socket} from 'socket.io';

const PORT = process.env.PORT || 5000;

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
} as Partial<ServerOptions>);

app.use(cors());
app.use(express.json());

interface Message {
    id: string;
    name: string;
    text: string;
    socketId: string;
    roomId: string;
}

const messages: Record<string, Message[]> = {}; // { roomId: Message[] }
const users = new Map<string, { id: string; name: string; room: string }>();

app.get('/api/messages', (req: Request<any, any, any, { room?: string }>, res: Response) => {
    const room = req.query.room || 'general';
    res.json(messages[room] || []);
});

// (app.get as any)('/api/messages', (req: Request, res: Response) => {
//     const room: string = typeof req.query.room === 'string' ? req.query.room : 'general';
//     res.json(messages[room] || []);
// });

io.on('connection', (socket: Socket) => {
    // Отправляем список пользователей сразу после подключения
    function emitUsers(room: string) {
        const roomUsers = Array.from(users.values()).filter(u => u.room === room);
        io.to(room).emit('users', roomUsers);
    }

    socket.on('newUser', ({ name, room }) => {
        users.set(socket.id, { id: socket.id, name, room });
        socket.join(room);

        // Сообщение о входе
        const joinMsg: Message = {
            id: `join-${socket.id}-${Date.now()}`,
            name: 'Система',
            text: `${name} присоединился к комнате`,
            socketId: 'system',
            roomId: room,
        };

        if (!messages[room]) messages[room] = [];
        messages[room].push(joinMsg);
        io.to(room).emit('message', joinMsg);

        // Только после отправляем обновлённый список пользователей
        emitUsers(room);
    });

    socket.on('sendMessage', (msg: Message) => {
        const { roomId } = msg;
        if (!messages[roomId]) messages[roomId] = [];
        messages[roomId].push(msg);
        io.to(roomId).emit('message', msg);
    });

    socket.on('leaveChat', (data?: { name?: string }) => {
        const user = users.get(socket.id);
        const userName = user?.name || data?.name;

        if (user) {
            users.delete(socket.id);
            socket.leave(user.room);
            emitUsers(user.room);

            const leaveMsg: Message = {
                id: `leave-${socket.id}-${Date.now()}`,
                name: 'Система',
                text: `${userName} покинул комнату`,
                socketId: 'system',
                roomId: user.room,
            };

            if (!messages[user.room]) messages[user.room] = [];
            messages[user.room].push(leaveMsg);
            io.to(user.room).emit('message', leaveMsg);
        }
    });

    socket.on('disconnect', () => {
        const user = users.get(socket.id);
        if (user) {
            users.delete(socket.id);
            socket.leave(user.room);

            const leaveMsg: Message = {
                id: `leave-${socket.id}-${Date.now()}`,
                name: 'Система',
                text: `${user.name} покинул комнату`,
                socketId: 'system',
                roomId: user.room,
            };

            if (!messages[user.room]) messages[user.room] = [];
            messages[user.room].push(leaveMsg);
            io.to(user.room).emit('message', leaveMsg);

            emitUsers(user.room); // вызываем после
        }
    });

    socket.on('getUsers', (room: string) => {
        const roomUsers = Array.from(users.values()).filter(u => u.room === room);
        socket.emit('users', roomUsers); // только этому сокету
    });
});

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
