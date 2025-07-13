const express = require('express');
const { createServer } = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

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
    },
});

app.use(cors());
app.use(express.json());

const messages = {};
const users = new Map();

app.get('/api/messages', (req, res) => {
    const room = typeof req.query.room === 'string' ? req.query.room : 'general';
    res.json(messages[room] || []);
});

io.on('connection', (socket) => {
    function emitUsers(room) {
        const roomUsers = Array.from(users.values()).filter(u => u.room === room);
        io.to(room).emit('users', roomUsers);
        console.log(`Emitted users to room ${room}:`, roomUsers.map(u => u.name));
    }

    socket.on('newUser', ({ name, room }) => {
        const existingUser = users.get(socket.id);
        if (existingUser && existingUser.room !== room) {
            handleUserLeave(socket.id);
        }

        users.set(socket.id, { id: socket.id, name, room });
        socket.join(room);

        const joinMsg = {
            id: `join-${socket.id}-${Date.now()}`,
            name: 'System',
            text: `${name} присоединился к комнате`,
            socketId: 'system',
            roomId: room,
        };

        if (!messages[room]) messages[room] = [];
        messages[room].push(joinMsg);
        io.to(room).emit('message', joinMsg);

        emitUsers(room);
        console.log(`User ${name} (${socket.id}) joined room ${room}.`);
    });

    socket.on('sendMessage', (msg) => {
        const { roomId } = msg;
        if (!messages[roomId]) messages[roomId] = [];
        messages[roomId].push(msg);
        io.to(roomId).emit('message', msg);
        console.log(`Message from ${msg.name} in room ${roomId}: ${msg.text}`);
    });

    socket.on('leaveChat', (data) => {
        const user = users.get(socket.id);
        const userName = user?.name || data?.name;

        if (user) {
            users.delete(socket.id);
            socket.leave(user.room);
            emitUsers(user.room);

            const leaveMsg = {
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

            const leaveMsg = {
                id: `leave-${socket.id}-${Date.now()}`,
                name: 'System',
                text: `${user.name} покинул комнату`,
                socketId: 'system',
                roomId: user.room,
            };

            if (!messages[user.room]) messages[user.room] = [];
            messages[user.room].push(leaveMsg);
            io.to(user.room).emit('message', leaveMsg);

            emitUsers(user.room);
            console.log(`Client disconnected: ${socket.id}`);
        }
    });

    socket.on('getUsers', (room) => {
        const roomUsers = Array.from(users.values()).filter(u => u.room === room);
        socket.emit('users', roomUsers);
    });
});

function handleUserLeave(socketId) {
    const user = users.get(socketId);
    if (user) {
        users.delete(socketId);
        emitUsers(user.room);

        const leaveMsg = {
            id: `leave-${socketId}-${Date.now()}`,
            name: 'System',
            text: `${user.name} покинул комнату`,
            socketId: 'system',
            roomId: user.room,
        };
        if (!messages[user.room]) messages[user.room] = [];
        messages[user.room].push(leaveMsg);
        io.to(user.room).emit('message', leaveMsg);
    }
}


httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
