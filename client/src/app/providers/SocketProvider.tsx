import { SocketProvider as BaseSocketProvider } from '../../shared/lib/socket/SocketContext';
import { io } from 'socket.io-client';
import type {ReactNode} from "react";

const socket = io('http://localhost:5000');

type Props ={
    children: ReactNode
}

export function SocketProvider({ children } : Props) {
    return (
        <BaseSocketProvider value={socket}>
            {children}
        </BaseSocketProvider>
    );
};