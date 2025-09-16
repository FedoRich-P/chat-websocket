import express from "express";
import { createServer } from "http";
import cors from "cors";
import { Server, Socket } from "socket.io";

const PORT = Number(process.env.PORT) || 5000;
const ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://chat-websocket-beryl.vercel.app",
    ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",") : []),
];

const app = express();
const httpServer = createServer(app);

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
            callback(new Error("CORS not allowed"));
        },
        methods: ["GET", "POST"],
        credentials: true,
    })
);
app.use(express.json());

interface Message {
    id: string;
    name: string;
    text: string;
    socketId: string;
    roomId: string;
    sender?: string;
    createdAt?: number;
}
interface User {
    id: string;
    name: string;
    room: string;
}

const messages: Record<string, Message[]> = {};
const users = new Map<string, User>();

app.get("/api/messages", (req, res) => {
    const room = (req.query.room as string) || "general";
    res.json(messages[room] || []);
});

function log(...args: any[]) {
    console.log(new Date().toISOString(), ...args);
}

const io = new Server(httpServer, {
    cors: {
        origin: ALLOWED_ORIGINS,
        methods: ["GET", "POST"],
        credentials: true,
    },
});

function emitUsersForRoom(room: string) {
    const list = Array.from(users.values()).filter((u) => u.room === room);
    io.to(room).emit("users", list);
}

io.on("connection", (socket: Socket) => {
    log("[io] connected", socket.id);

    socket.on("getUsers", (room: string) => {
        if (!room) return socket.emit("error", { code: "no_room" });
        const roomUsers = Array.from(users.values()).filter((u) => u.room === room);
        socket.emit("users", roomUsers);
    });

    socket.on("newUser", (payload: { name?: string; room?: string }) => {
        const name = payload?.name || "Anonymous";
        const room = payload?.room || "general";

        users.set(socket.id, { id: socket.id, name, room });
        socket.join(room);

        const joinMsg: Message = {
            id: `join-${socket.id}-${Date.now()}`,
            name: "Система",
            text: `${name} присоединился к комнате`,
            socketId: "system",
            roomId: room,
            createdAt: Date.now(),
        };

        if (!messages[room]) messages[room] = [];
        messages[room].push(joinMsg);

        // Emit join message to room and updated users list
        io.to(room).emit("message", joinMsg);
        emitUsersForRoom(room);

        // ack the joining socket with its id and room (client uses this to set socketId)
        socket.emit("joined", { socketId: socket.id, room });
        log(`[newUser] ${socket.id} name=${name} room=${room}`);
    });

    socket.on("sendMessage", (msg: Message) => {
        if (!msg || !msg.roomId || !msg.text) {
            socket.emit("error", { code: "invalid_message" });
            return;
        }
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
    socket.on("callUser", (payload: { userToCall?: string; signal?: any; from?: string; name?: string }) => {
        const { userToCall, signal, name } = payload || {};
        log(`[callUser] from=${socket.id} to=${userToCall}`);
        if (!userToCall || !signal) {
            return socket.emit("callError", { code: "invalid_payload", message: "Missing userToCall or signal" });
        }
        if (!io.sockets.sockets.has(userToCall)) {
            return socket.emit("callError", { code: "target_not_found", message: "User not connected", to: userToCall });
        }
        io.to(userToCall).emit("incomingCall", { from: socket.id, signal, name: users.get(socket.id)?.name || name || "Anonymous" });
    });

    socket.on("answerCall", (payload: { to?: string; signal?: any }) => {
        const { to, signal } = payload || {};
        log(`[answerCall] from=${socket.id} to=${to}`);
        if (!to || !signal) return socket.emit("callError", { code: "invalid_payload", message: "Missing 'to' or 'signal'" });
        if (!io.sockets.sockets.has(to)) return socket.emit("callError", { code: "target_not_found", message: "User not connected", to });
        io.to(to).emit("callAccepted", signal);
    });

    socket.on("iceCandidate", (payload: { to?: string; candidate?: any }) => {
        const { to, candidate } = payload || {};
        log(`[iceCandidate] from=${socket.id} to=${to} hasCandidate=${!!candidate}`);
        if (!to || !candidate) return socket.emit("callError", { code: "invalid_payload", message: "Missing 'to' or 'candidate'" });
        if (!io.sockets.sockets.has(to)) return socket.emit("callError", { code: "target_not_found", message: "User not connected", to });
        io.to(to).emit("iceCandidate", candidate);
    });

    socket.on("endCall", (payload: { to?: string }) => {
        const to = payload?.to;
        log(`[endCall] from=${socket.id} to=${to}`);
        if (!to) return socket.emit("callError", { code: "invalid_payload", message: "Missing 'to'" });
        if (!io.sockets.sockets.has(to)) {
            // уведомляем вызывающего, что цель недоступна
            return socket.emit("callEndedAck", { to });
        }
        io.to(to).emit("callEnded");
    });
});

httpServer.listen(PORT, () => {
    log(`Server is running on port ${PORT}`);
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

