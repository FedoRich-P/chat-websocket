import { useState, useEffect } from "react";
import { useWebRTC } from "../model/useWebRTC";
import { useSocket } from "../../../shared";

interface RoomUser {
    id: string;
    name: string;
}

export function CallPanel({ localUserId, room }: { localUserId: string; room: string }) {
    const socket = useSocket();
    const [users, setUsers] = useState<RoomUser[]>([]);
    const [remoteUserId, setRemoteUserId] = useState<string | null>(null);

    const { localVideo, remoteVideo, incomingCall, startCall, acceptCall, endCall } = useWebRTC(
        localUserId,
        remoteUserId || undefined
    );

    useEffect(() => {
        if (!room) return;

        const handleUsers = (roomUsers: RoomUser[]) => {
            setUsers(roomUsers.filter((u: RoomUser) => u.id !== localUserId));
        };

        socket.emit("getUsers", room);
        socket.on("users", handleUsers);

        return () => {
            socket.off("users", handleUsers);
        };
    }, [socket, room, localUserId]);

    return (
        <div className="p-4 border rounded-lg space-y-3">
            <video ref={localVideo} autoPlay playsInline muted className="w-1/2 border" />
            <video ref={remoteVideo} autoPlay playsInline className="w-1/2 border" />

            <select
                onChange={(e) => setRemoteUserId(e.target.value)}
                className="border p-2 rounded"
            >
                <option value="">Выберите пользователя</option>
                {users.map((u) => (
                    <option key={u.id} value={u.id}>
                        {u.name}
                    </option>
                ))}
            </select>

            <div className="flex gap-2">
                <button onClick={startCall} className="bg-green-500 text-white px-4 py-2 rounded">
                    📞 Позвонить
                </button>
                <button onClick={endCall} className="bg-red-500 text-white px-4 py-2 rounded">
                    🔴 Завершить
                </button>
            </div>

            {incomingCall && (
                <div className="mt-4 p-2 border rounded bg-yellow-100">
                    <p>Входящий звонок от {incomingCall.from}</p>
                    <button
                        onClick={acceptCall}
                        className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
                    >
                        ✅ Принять
                    </button>
                </div>
            )}
        </div>
    );
}
