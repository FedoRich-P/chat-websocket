import { useSelector, useDispatch } from "react-redux";
import { ChatBody } from "../ChatBody/ChatBody";
import { useGetMessagesQuery } from "../../../../shared/api/chatApi";
import type { RootState } from "../../../../app/store";
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { useSocket } from "../../../../shared";
import { addMessage, removeMessage } from "../../../../entities";
import type { Message } from "../../../../shared/types";
import { CallPanel } from "../../../call/ui/CallPanel";

export function ChatMessageBlock() {
    const socket = useSocket();
    const dispatch = useDispatch();
    const [message, setMessage] = useState("");
    const { name, room: rawRoom } = useSelector((state: RootState) => state.user);
    const messages = useSelector((state: RootState) => state.messages.messages);

    // всегда строка
    const room: string = rawRoom ?? "general";

    useGetMessagesQuery(room, { refetchOnMountOrArgChange: true, skip: !room });

    useEffect(() => {
        const handler = (data: Message) => {
            dispatch(addMessage(data));
            const isSystem = data.name === "Система";
            const isJoinOrLeave =
                data.text.includes("присоединился") || data.text.includes("покинул");
            if (isSystem && isJoinOrLeave) {
                setTimeout(() => dispatch(removeMessage(data.id)), 5000);
            }
        };

        socket.on("message", handler);

        return () => {
            socket.off("message", handler);
        };
    }, [socket, dispatch]);

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (message.trim() && name && room) {
            const newMsg: Message = {
                id: `${socket.id}-${Date.now()}`,
                name,
                text: message,
                sender: "Вы",
                socketId: socket.id,
                roomId: room,
            };
            socket.emit("sendMessage", newMsg);
            setMessage("");
        }
    }

    return (
        <div className="flex flex-col h-full">
            <CallPanel localUserId={socket.id} room={room} />
            <ChatBody messages={messages} />
            <form onSubmit={handleSubmit} className="flex gap-3 p-2 mt-4">
                <input
                    type="text"
                    value={message}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                    placeholder="Введите сообщение..."
                    className="flex-grow p-3 border border-gray-300 rounded-md"
                />
                <button
                    type="submit"
                    className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                    Написать
                </button>
            </form>
        </div>
    );
}
