import express from "express";
import { createServer } from "http";
import cors from "cors";
import { Server, Socket } from "socket.io";

const PORT = Number(process.env.PORT) || 5000;

// Разрешённые фронты
const ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://chat-websocket-beryl.vercel.app",
];

const app = express();
const httpServer = createServer(app);

// --- CORS для HTTP ---
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        callback(new Error("CORS not allowed"));
    },
    credentials: true,
}));
app.use(express.json());

// --- Типы ---
interface Message {
    id: string;
    name: string;
    text: string;
    socketId: string;
    roomId: string;
    createdAt?: number;
}

interface User {
    id: string;
    name: string;
    room: string;
}

// --- Хранилища ---
const messages: Record<string, Message[]> = {};
const users = new Map<string, User>();

// --- HTTP API для истории сообщений ---
app.get("/api/messages", (req, res) => {
    const room = (req.query.room as string) || "general";
    res.json(messages[room] || []);
});

// --- Socket.IO сервер с рабочим CORS ---
const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
            return callback(new Error("CORS not allowed"));
        },
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// --- Вспомогательные функции ---
function emitUsersForRoom(room: string) {
    const list = Array.from(users.values()).filter(u => u.room === room);
    io.to(room).emit("users", list);
}

function log(...args: any[]) {
    console.log(new Date().toISOString(), ...args);
}

// --- События Socket.IO ---
io.on("connection", (socket: Socket) => {
    log("[io] connected", socket.id);

    // --- Пользователи ---
    socket.on("newUser", ({ name, room }: { name?: string; room?: string }) => {
        const userName = name || "Anonymous";
        const roomName = room || "general";

        users.set(socket.id, { id: socket.id, name: userName, room: roomName });
        socket.join(roomName);

        const joinMsg: Message = {
            id: `join-${socket.id}-${Date.now()}`,
            name: "Система",
            text: `${userName} присоединился к комнате`,
            socketId: "system",
            roomId: roomName,
            createdAt: Date.now(),
        };

        if (!messages[roomName]) messages[roomName] = [];
        messages[roomName].push(joinMsg);

        io.to(roomName).emit("message", joinMsg);
        emitUsersForRoom(roomName);

        socket.emit("joined", { socketId: socket.id, room: roomName });
        log(`[newUser] ${socket.id} name=${userName} room=${roomName}`);
    });

    socket.on("getUsers", (room: string) => {
        const roomUsers = Array.from(users.values()).filter(u => u.room === room);
        socket.emit("users", roomUsers);
    });

    socket.on("sendMessage", (msg: Message) => {
        if (!msg || !msg.roomId || !msg.text) return;
        msg.createdAt = Date.now();
        if (!messages[msg.roomId]) messages[msg.roomId] = [];
        messages[msg.roomId].push(msg);
        io.to(msg.roomId).emit("message", msg);
        log(`[msg] from=${msg.socketId} room=${msg.roomId} text="${msg.text}"`);
    });

    socket.on("leaveChat", (data?: { name?: string }) => {
        const user = users.get(socket.id);
        const userName = user?.name || data?.name || "Anonymous";
        if (!user) return;

        users.delete(socket.id);
        socket.leave(user.room);

        const leaveMsg: Message = {
            id: `leave-${socket.id}-${Date.now()}`,
            name: "Система",
            text: `${userName} покинул комнату`,
            socketId: "system",
            roomId: user.room,
            createdAt: Date.now(),
        };

        if (!messages[user.room]) messages[user.room] = [];
        messages[user.room].push(leaveMsg);

        io.to(user.room).emit("message", leaveMsg);
        emitUsersForRoom(user.room);
        log(`[leaveChat] ${socket.id} name=${userName} room=${user.room}`);
    });

    socket.on("disconnect", (reason) => {
        const user = users.get(socket.id);
        if (user) {
            users.delete(socket.id);
            socket.leave(user.room);

            const leaveMsg: Message = {
                id: `leave-${socket.id}-${Date.now()}`,
                name: "Система",
                text: `${user.name} покинул комнату`,
                socketId: "system",
                roomId: user.room,
                createdAt: Date.now(),
            };

            if (!messages[user.room]) messages[user.room] = [];
            messages[user.room].push(leaveMsg);

            io.to(user.room).emit("message", leaveMsg);
            emitUsersForRoom(user.room);
            log(`[disconnect] ${socket.id} name=${user.name} reason=${reason}`);
        } else {
            log(`[disconnect] ${socket.id} (no user) reason=${reason}`);
        }
    });

    // --- WebRTC signalling ---
    socket.on("callUser", (payload: { userToCall?: string; signal?: any; name?: string }) => {
        const { userToCall, signal, name } = payload || {};
        if (!userToCall || !signal) return;
        io.to(userToCall).emit("incomingCall", { from: socket.id, signal, name });
        log(`[callUser] from=${socket.id} to=${userToCall}`);
    });

    socket.on("answerCall", (payload: { to?: string; signal?: any }) => {
        const { to, signal } = payload || {};
        if (!to || !signal) return;
        io.to(to).emit("callAccepted", signal);
        log(`[answerCall] from=${socket.id} to=${to}`);
    });

    socket.on("iceCandidate", (payload: { to?: string; candidate?: any }) => {
        const { to, candidate } = payload || {};
        if (!to || !candidate) return;
        io.to(to).emit("iceCandidate", candidate);
        log(`[iceCandidate] from=${socket.id} to=${to}`);
    });

    socket.on("endCall", (payload: { to?: string }) => {
        const to = payload?.to;
        if (!to) return;
        io.to(to).emit("callEnded");
        log(`[endCall] from=${socket.id} to=${to}`);
    });
});

// --- Старт сервера ---
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
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

