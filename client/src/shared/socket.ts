import { io, type Socket } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

let socketInstance: Socket | null = null;

export function initSocket(): Socket {
    if (!socketInstance) {
        socketInstance = io(SERVER_URL, {
            transports: ["websocket"],
            autoConnect: true,
        });
    }
    return socketInstance;
}

export function getSocket(): Socket {
    return initSocket();
}
