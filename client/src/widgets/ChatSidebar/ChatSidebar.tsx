import { useEffect, useState } from "react";
import { useSocket } from "../../shared";
import { useSelector } from "react-redux";
import type {RootState} from "../../app/store.ts";

interface User {
    id: string;
    name: string;
    room: string;
}

export function ChatSidebar() {
    const socket = useSocket();
    const [users, setUsers] = useState<User[]>([]);
    const { room } = useSelector((state: RootState) => state.user);

    useEffect(() => {
        const handleUsers = (users: User[]) => {
            setUsers(users);
        };

        socket.on('users', handleUsers);

        if (room) {
            socket.emit('getUsers', room);
        }

        return () => {
            socket.off('users', handleUsers);
        };
    }, [socket, room]);

    return (
        <aside className="w-64 bg-gray-100 p-6 border-r border-gray-200 flex flex-col shadow-lg rounded-tl-lg rounded-bl-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Пользователи</h2>
            <ul className="space-y-3 flex-1 overflow-y-auto">
                {users.length === 0 ? (
                    <li className="text-gray-500 italic">Нет активных пользователей</li>
                ) : (
                    users.map((user) => (
                        <li key={user.id} className="p-2 rounded-md hover:bg-gray-200 cursor-pointer text-gray-700 font-medium">
                            {user.name} {user.id === socket.id && '(Вы)'}
                        </li>
                    ))
                )}
            </ul>
        </aside>
    );
}
