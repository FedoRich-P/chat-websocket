import {useDispatch, useSelector} from "react-redux";
import {ChatBody} from "../ChatBody/ChatBody";
import {useGetMessagesQuery} from "../../../../shared/api/chatApi";
import type {RootState} from "../../../../app/store.ts";
import {type ChangeEvent, type FormEvent, useEffect, useState} from "react";
import {useSocket} from "../../../../shared";
import {addMessage, removeMessage} from "../../../../entities";
import type {Message, User} from "../../../../shared/types.ts";
import {CallPanel} from "../../../call/ui/CallPanel.tsx";
import {ChatSidebar} from "../ChatSidebar/ChatSidebar.tsx";


// export function ChatMessageBlock() {
//     const socket = getSocket();
//     const dispatch = useDispatch();
//     const { name, room, socketId } = useSelector((state: RootState) => state.user);
//     const messages = useSelector((state: RootState) => state.messages.messages);
//
//     const [messageText, setMessageText] = useState("");
//     const [remoteUser, setRemoteUser] = useState<User | null>(null);
//
//         useGetMessagesQuery(room, {
//         refetchOnMountOrArgChange: true,
//         skip: !room,
//     });
//
//     // Получаем историю сообщений при заходе в комнату
//     useEffect(() => {
//         // если используешь RTK Query:
//         // useGetMessagesQuery(room, { refetchOnMountOrArgChange: true, skip: !room });
//         // Или делаем fetch manually:
//
//         async function fetchHistory() {
//             if (!room) return;
//             try {
//                 const resp = await fetch(`/api/messages?room=${room}`);
//                 const data: Message[] = await resp.json();
//                 dispatch(setMessages(data));
//             } catch (err) {
//                 console.error("Ошибка загрузки истории", err);
//             }
//         }
//         fetchHistory();
//
//         return () => {
//             dispatch(clearMessages());
//         };
//     }, [room, dispatch]);
//
//     useEffect(() => {
//         const handler = (data: Message) => {
//             dispatch(addMessage(data));
//
//             const isSystem = data.name === "Система";
//             const isJoinOrLeave = data.text.includes("присоединился") || data.text.includes("покинул");
//
//             if (isSystem && isJoinOrLeave) {
//                 setTimeout(() => {
//                     dispatch(removeMessage(data.id));
//                 }, 5000);
//             }
//         };
//
//         socket.on("message", handler);
//
//         return () => {
//             socket.off("message", handler);
//         };
//     }, [socket, dispatch]);
//
//     // Получаем socketId и сохраняем в стейте
//     useEffect(() => {
//         if (socket) {
//             dispatch({ type: "user/setSocketId", payload: socket.id });
//         }
//     }, [socket, dispatch]);
//
//     function handleSubmit(e: FormEvent<HTMLFormElement>) {
//         e.preventDefault();
//         const text = messageText.trim();
//         if (text && name && socketId) {
//             const newMsg: Message = {
//                 id: `${socketId}-${Date.now()}`,
//                 name,
//                 text,
//                 sender: "Вы",
//                 socketId: socketId,
//                 roomId: room,
//             };
//             socket.emit("sendMessage", newMsg);
//             dispatch(addMessage(newMsg));
//             setMessageText("");
//         }
//     }
//
//     return (
//         <div className="flex h-full">
//             <ChatSidebar onSelectUser={(user) => setRemoteUser(user)} />
//             <div className="flex flex-col flex-grow p-4">
//                 <CallPanel localUserId={socketId || ""} remoteUserId={remoteUser?.id} socket={socket} />
//                 <ChatBody messages={messages} />
//                 <form onSubmit={handleSubmit} className="flex gap-3 p-2 mt-4">
//                     <input
//                         type="text"
//                         value={messageText}
//                         onChange={(e) => setMessageText(e.target.value)}
//                         placeholder="Введите сообщение..."
//                         className="flex-grow p-3 border border-gray-300 rounded-md"
//                     />
//                     <button type="submit" className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700">
//                         Отправить
//                     </button>
//                 </form>
//             </div>
//         </div>
//     );
// }


export function ChatMessageBlock() {
    const socket = useSocket();
    const dispatch = useDispatch();
    const [message, setMessage] = useState('');
    const {name, room, socketId} = useSelector((state: RootState) => state.user);
    const messages = useSelector((state: RootState) => state.messages.messages);

    useGetMessagesQuery(room, {
        refetchOnMountOrArgChange: true,
        skip: !room,
    });

    const [remoteUser, setRemoteUser] = useState<User | null>(null);

    useEffect(() => {
        const handler = (data: Message) => {
            dispatch(addMessage(data));

            const isSystem = data.name === 'Система';
            const isJoinOrLeave = data.text.includes('присоединился') || data.text.includes('покинул');

            if (isSystem && isJoinOrLeave) {
                setTimeout(() => dispatch(removeMessage(data.id)), 5000);
            }
        };

        socket.on('message', handler);
        return () => {
            socket.off('message', handler);
        };
    }, [socket, dispatch]);

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (message.trim() && name) {
            const newMsg = {
                id: `${socket.id}-${Date.now()}`,
                name,
                text: message,
                sender: 'Вы',
                socketId: socket.id,
                roomId: room,
            };
            socket.emit('sendMessage', newMsg);
            setMessage('');
        }
    }

    return (
        <div className="flex flex-col h-full">
            <ChatSidebar onSelectUser={(user) => setRemoteUser(user)} />
            <CallPanel localUserId={socketId !} remoteUserId={remoteUser?.id} socket={socket} />
            <ChatBody messages={messages}/>
            <form onSubmit={handleSubmit} className="flex gap-3 p-2 mt-4">
                <input
                    type="text"
                    value={message}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                    placeholder="Введите сообщение..."
                    className="flex-grow p-3 border border-gray-300 rounded-md"
                />
                <button type="submit" className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700">
                    Написать
                </button>
            </form>
        </div>
    );
}
