import { io, Socket } from "socket.io-client";

const SERVER_URL = "http://localhost:5000";

let socket: Socket | null = null;

export function getSocket(): Socket {
    if (!socket) {
        socket = io(SERVER_URL);
    }
    return socket;
}
