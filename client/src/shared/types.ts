export interface Message {
    id: string;
    name: string;
    text: string;
    socketId?: string;
    roomId: string;
}

export interface User {
    id: string;
    name: string;
    room: string;
}