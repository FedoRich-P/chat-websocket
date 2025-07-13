import { SocketProvider as BaseSocketProvider } from '../../shared/lib/socket/SocketContext';
import { io } from 'socket.io-client';
import type {ReactNode} from "react";

const socket = io(import.meta.env.VITE_API_URL);

type Props ={
    children: ReactNode
}

export function SocketProvider({ children } : Props) {
    return (
        <BaseSocketProvider value={socket}>
            {children}
        </BaseSocketProvider>
    );
}