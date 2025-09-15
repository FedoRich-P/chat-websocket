
export interface Message {
    id: string;
    name: string | null;
    text: string;
    socketId: string;
    sender?: string;
    roomId: string;
}

export interface User {
    id: string;
    name: string;
    room: string;
}

// export interface Message {
//     id: string;
//     name: string;
//     text: string;
//     socketId: string;
//     roomId: string;
// }
//
// export interface User {
//     id: string;
//     name: string;
//     room: string;
// }