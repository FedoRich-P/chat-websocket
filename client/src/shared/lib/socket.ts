import { io } from "socket.io-client";

export const socket = io(import.meta.env.VITE_API_URL, {
    transports: ["websocket"], // Важно для Vercel
    autoConnect: false, // Подключаем вручную
});