import React, { useEffect, useRef, useState, ChangeEvent, FormEvent } from 'react';
import { io, Socket } from 'socket.io-client';
import type {Message} from "../../../../shared/types.ts";
import {CallPanel} from "../../../call/ui/CallPanel.tsx";


const SERVER_URL = 'http://localhost:5000';

export function ChatMessageBlock() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState('');
    const [name] = useState(`User${Math.floor(Math.random() * 1000)}`);
    const [room] = useState('general');
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const socket = io(SERVER_URL, { transports: ['websocket'], withCredentials: true });
        socketRef.current = socket;

        socket.emit('newUser', { name, room });
        socket.on('message', (msg: Message) => setMessages(prev => [...prev, msg]));

        return () => {
            socket.emit('leaveChat');
            socket.disconnect();
        };
    }, [name, room]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;
        const newMsg: Message = {
            id: `${socketRef.current?.id}-${Date.now()}`,
            name,
            text: message,
            socketId: socketRef.current?.id || '',
            roomId: room,
        };
        socketRef.current?.emit('sendMessage', newMsg);
        setMessage('');
    };

    return (
        <div className="flex flex-col h-full p-4">
            <CallPanel localUserId={socketRef.current?.id || ''} room={room} socket={socketRef.current} />
            <div className="flex-1 overflow-y-auto border p-2 mb-2">
                {messages.map(msg => (
                    <div key={msg.id} className={msg.socketId === socketRef.current?.id ? 'text-right' : 'text-left'}>
                        <b>{msg.name}: </b>{msg.text}
                    </div>
                ))}
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    value={message}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                    placeholder="Введите сообщение"
                    className="flex-grow border p-2"
                />
                <button type="submit" className="bg-green-600 text-white px-4">Отправить</button>
            </form>
        </div>
    );
}
