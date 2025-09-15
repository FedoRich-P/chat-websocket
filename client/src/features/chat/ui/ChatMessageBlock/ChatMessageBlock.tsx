import {useDispatch, useSelector} from "react-redux";
import {ChatBody} from "../ChatBody/ChatBody";
import {useGetMessagesQuery} from "../../../../shared/api/chatApi";
import type {RootState} from "../../../../app/store";
import {type ChangeEvent, type FormEvent, useEffect, useState} from "react";
import type {Message, User} from "../../../../shared/types";
import {CallPanel} from "../../../call/ui/CallPanel";
import {ChatSidebar} from "../ChatSidebar/ChatSidebar";
import {useSocket} from "../../../../shared";
import {addMessage, removeMessage, setMessages} from "../../../../entities/messages/messagesSlice.ts";
import {setSocketId} from "../../../../entities";

export function ChatMessageBlock() {
    const socket = useSocket();
    const dispatch = useDispatch();
    const [message, setMessage] = useState("");
    const [remoteUser, setRemoteUser] = useState<User | null>(null);

    const { name, room, socketId } = useSelector((s: RootState) => s.user);
    const messages = useSelector((s: RootState) => s.messages.messages);

    // Получаем историю сообщений через RTK Query
    const { data: history } = useGetMessagesQuery(room ?? "", {
        refetchOnMountOrArgChange: true,
        skip: !room,
    });

    // Заполняем Redux slice историей сообщений
    useEffect(() => {
        if (history) dispatch(setMessages(history));
    }, [history, dispatch]);

    // Прослушивание входящих сообщений
    useEffect(() => {
        const handler = (data: Message) => {
            dispatch(addMessage(data));

            const isSystem = data.name === "Система";
            const isJoinOrLeave = data.text.includes("присоединился") || data.text.includes("покинул");
            if (isSystem && isJoinOrLeave) {
                setTimeout(() => dispatch(removeMessage(data.id)), 5000);
            }
        };

        socket.on("message", handler);
        return () => {
            socket.off("message", handler);
        };
    }, [socket, dispatch]);

    // Сохраняем socketId в Redux после подключения
    useEffect(() => {
        const onConnect = () => {
            if (socket.id) dispatch(setSocketId(socket.id));
        };

        socket.on("connect", onConnect);
        if (socket.connected) onConnect();

        return () => {
            socket.off("connect", onConnect);
        };
    }, [socket, dispatch]);

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!message.trim() || !name || !socket.id || !room) return;

        const newMsg: Message = {
            id: `${socket.id}-${Date.now()}`,
            name,
            text: message,
            sender: "Вы",
            socketId: socket.id,
            roomId: room,
        };

        socket.emit("sendMessage", newMsg);
        dispatch(addMessage(newMsg));
        setMessage("");
    }

    return (
        <div className="flex flex-col h-full">
            <ChatSidebar onSelectUser={(user) => setRemoteUser(user)} />
            <CallPanel
                localUserId={socketId ?? ""}
                remoteUserId={remoteUser?.id ?? ""}
                socket={socket}
            />
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


//
// export function ChatMessageBlock() {
//     const socket = useSocket();
//     const dispatch = useDispatch();
//     const [message, setMessage] = useState('');
//     const {name, room, socketId} = useSelector((state: RootState) => state.user);
//     const messages = useSelector((state: RootState) => state.messages.messages);
//
//     useGetMessagesQuery(room, {
//         refetchOnMountOrArgChange: true,
//         skip: !room,
//     });
//
//     const [remoteUser, setRemoteUser] = useState<User | null>(null);
//
//     useEffect(() => {
//         const handler = (data: Message) => {
//             dispatch(addMessage(data));
//
//             const isSystem = data.name === 'Система';
//             const isJoinOrLeave = data.text.includes('присоединился') || data.text.includes('покинул');
//
//             if (isSystem && isJoinOrLeave) {
//                 setTimeout(() => dispatch(removeMessage(data.id)), 5000);
//             }
//         };
//
//         socket.on('message', handler);
//         return () => {
//             socket.off('message', handler);
//         };
//     }, [socket, dispatch]);
//
//     function handleSubmit(e: FormEvent<HTMLFormElement>) {
//         e.preventDefault();
//         if (message.trim() && name) {
//             const newMsg = {
//                 id: `${socket.id}-${Date.now()}`,
//                 name,
//                 text: message,
//                 sender: 'Вы',
//                 socketId: socket.id,
//                 roomId: room,
//             };
//             socket.emit('sendMessage', newMsg);
//             setMessage('');
//         }
//     }
//
//     return (
//         <div className="flex flex-col h-full">
//             <ChatSidebar onSelectUser={(user) => setRemoteUser(user)} />
//             <CallPanel localUserId={socketId !} remoteUserId={remoteUser?.id} socket={socket} />
//             <ChatBody messages={messages}/>
//             <form onSubmit={handleSubmit} className="flex gap-3 p-2 mt-4">
//                 <input
//                     type="text"
//                     value={message}
//                     onChange={(e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
//                     placeholder="Введите сообщение..."
//                     className="flex-grow p-3 border border-gray-300 rounded-md"
//                 />
//                 <button type="submit" className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700">
//                     Написать
//                 </button>
//             </form>
//         </div>
//     );
// }
