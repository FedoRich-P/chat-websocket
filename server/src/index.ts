import express, { Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { Server, Socket } from 'socket.io';

const PORT = process.env.PORT || 5000;

const app = express();
const httpServer = createServer(app);

// ✅ Настройки CORS
app.use(cors({
    origin: [
        'https://chat-websocket-beryl.vercel.app',
        'http://localhost:5173'
    ],
    methods: ["GET", "POST"],
    credentials: true
}));
app.use(express.json());

// Типы
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

// Хранилища
const messages: Record<string, Message[]> = {}; // { roomId: Message[] }
const users = new Map<string, User>();

// API для истории сообщений
app.get('/api/messages', (req: Request, res: Response) => {
    const room = (req.query.room as string) || 'general';
    res.json(messages[room] || []);
});

// WebSocket
const io = new Server(httpServer, {
    cors: {
        origin: [
            'https://chat-websocket-beryl.vercel.app',
            'http://localhost:5173'
        ],
        methods: ["GET","POST"],
        credentials: true
    },
});

io.on('connection', (socket: Socket) => {

    // Отправка списка пользователей в комнате
    const emitUsers = (room: string) => {
        const roomUsers = Array.from(users.values()).filter(u => u.room === room);
        io.to(room).emit('users', roomUsers);
    };

    // Новый пользователь
    socket.on('newUser', ({ name, room }: { name: string; room: string }) => {
        if (!name || !room) return;

        users.set(socket.id, { id: socket.id, name, room });
        socket.join(room);

        // Сообщение о присоединении
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
        emitUsers(room);
    });

    // Отправка сообщения
    socket.on('sendMessage', (msg: Message) => {
        const { roomId } = msg;
        if (!roomId || !msg.text) return;

        if (!messages[roomId]) messages[roomId] = [];
        messages[roomId].push(msg);

        io.to(roomId).emit('message', msg);
    });

    // Пользователь покидает чат
    const handleLeave = (user: User | undefined) => {
        if (!user) return;

        users.delete(user.id);
        socket.leave(user.room);

        const leaveMsg: Message = {
            id: `leave-${user.id}-${Date.now()}`,
            name: 'Система',
            text: `${user.name} покинул комнату`,
            socketId: 'system',
            roomId: user.room,
        };

        if (!messages[user.room]) messages[user.room] = [];
        messages[user.room].push(leaveMsg);

        io.to(user.room).emit('message', leaveMsg);
        emitUsers(user.room);
    };

    socket.on('leaveChat', () => handleLeave(users.get(socket.id)));

    // При отключении
    socket.on('disconnect', () => handleLeave(users.get(socket.id)));

    // Получить список пользователей
    socket.on('getUsers', (room: string) => {
        if (!room) return;
        const roomUsers = Array.from(users.values()).filter(u => u.room === room);
        socket.emit('users', roomUsers);
    });

    // 🔹 WebRTC звонки
    socket.on("callUser", ({ userToCall, signal, from, name }) => {
        if (!userToCall) return;
        io.to(userToCall).emit("incomingCall", { signal, from, name });
    });

    socket.on("answerCall", ({ to, signal }) => {
        if (!to) return;
        io.to(to).emit("callAccepted", signal);
    });

    socket.on("iceCandidate", ({ to, candidate }) => {
        if (!to) return;
        io.to(to).emit("iceCandidate", candidate);
    });

});

httpServer.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});








// import express, { Request, Response } from 'express';
// import { createServer } from 'http';
// import cors from 'cors';
// import { Server, Socket } from 'socket.io';
//
// const PORT = process.env.PORT || 5000;
//
// const app = express();
// const httpServer = createServer(app);
//
// app.use(cors({
//     origin: [
//         'https://chat-websocket-beryl.vercel.app',
//         "http://localhost:5173"
//     ],
//     methods: "GET,POST,PUT,DELETE",
//     credentials: true
// }));
//
// const io = new Server(httpServer, {
//     cors: {
//         origin: [
//             'https://chat-websocket-beryl.vercel.app',
//             'http://localhost:5173'
//         ],
//         methods: ['GET', 'POST'],
//         allowedHeaders: ["Content-Type"],
//         credentials: true,
//     },
// });
//
// app.use(cors());
// app.use(express.json());
//
// interface Message {
//     id: string;
//     name: string;
//     text: string;
//     socketId: string;
//     roomId: string;
// }
//
// interface User {
//     id: string;
//     name: string;
//     room: string;
// }
//
// const messages: Record<string, Message[]> = {}; // { roomId: Message[] }
// const users = new Map<string, User>();
//
// app.get('/api/messages', (req: Request, res: Response) => {
//     const room = (req.query.room as string) || 'general';
//     res.json(messages[room] || []);
// });
//
// io.on('connection', (socket: Socket) => {
//     // Отправляем список пользователей сразу после подключения
//     function emitUsers(room: string) {
//         const roomUsers = Array.from(users.values()).filter(u => u.room === room);
//         io.to(room).emit('users', roomUsers);
//     }
//
//     socket.on('newUser', ({ name, room }: { name: string; room: string }) => {
//         users.set(socket.id, { id: socket.id, name, room });
//         socket.join(room);
//
//         const joinMsg: Message = {
//             id: `join-${socket.id}-${Date.now()}`,
//             name: 'Система',
//             text: `${name} присоединился к комнате`,
//             socketId: 'system',
//             roomId: room,
//         };
//
//         if (!messages[room]) messages[room] = [];
//         messages[room].push(joinMsg);
//         io.to(room).emit('message', joinMsg);
//
//         // Только после отправляем обновлённый список пользователей
//         emitUsers(room);
//     });
//
//     socket.on('sendMessage', (msg: Message) => {
//         const { roomId } = msg;
//         if (!messages[roomId]) messages[roomId] = [];
//         messages[roomId].push(msg);
//         io.to(roomId).emit('message', msg);
//     });
//
//     socket.on('leaveChat', (data?: { name?: string }) => {
//         const user = users.get(socket.id);
//         const userName = user?.name || data?.name;
//
//         if (user) {
//             users.delete(socket.id);
//             socket.leave(user.room);
//             emitUsers(user.room);
//
//             const leaveMsg: Message = {
//                 id: `leave-${socket.id}-${Date.now()}`,
//                 name: 'Система',
//                 text: `${userName} покинул комнату`,
//                 socketId: 'system',
//                 roomId: user.room,
//             };
//
//             if (!messages[user.room]) messages[user.room] = [];
//             messages[user.room].push(leaveMsg);
//             io.to(user.room).emit('message', leaveMsg);
//         }
//     });
//
//     socket.on('disconnect', () => {
//         const user = users.get(socket.id);
//         if (user) {
//             users.delete(socket.id);
//             socket.leave(user.room);
//
//             const leaveMsg: Message = {
//                 id: `leave-${socket.id}-${Date.now()}`,
//                 name: 'Система',
//                 text: `${user.name} покинул комнату`,
//                 socketId: 'system',
//                 roomId: user.room,
//             };
//
//             if (!messages[user.room]) messages[user.room] = [];
//             messages[user.room].push(leaveMsg);
//             io.to(user.room).emit('message', leaveMsg);
//
//             emitUsers(user.room); // вызываем после
//         }
//     });
//
//     socket.on('getUsers', (room: string) => {
//         const roomUsers = Array.from(users.values()).filter(u => u.room === room);
//         socket.emit('users', roomUsers); // только этому сокету
//     });
// });
//
// httpServer.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });

