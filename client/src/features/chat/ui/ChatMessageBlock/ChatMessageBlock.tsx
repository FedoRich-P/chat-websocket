// import {ChatBody} from "../ChatBody/ChatBody";
// import {ChatForm} from "../ChatForm/ChatForm.tsx";
// import {useChatMessages} from "../../../call/model/useChatMessages.ts";
// import {useChatLogic} from "../../../call/model/useChatLogic.ts";
//
// export function ChatMessageBlock() {
//     // const [message, setMessage] = useState("");
//     // const [remoteUser, setRemoteUser] = useState<User | null>(null);
//     const { message, handleMessage, handleSubmit } = useChatLogic()
//     const { messages } = useChatMessages()
//
//     // const { name, room, socketId } = useSelector((s: RootState) => s.user);
//     //
//     // useEffect(() => {
//     //     if (!room) return;
//     //     socket.emit("getUsers", room);
//     // }, [room, socket]);
//
//     // Слушаем входящие сообщения
//     // useEffect(() => {
//     //     const handler = (data: Message) => {
//     //         dispatch(addMessage(data));
//     //         const isSystem = data.name === "Система";
//     //         const isJoinOrLeave = data.text.includes("присоединился") || data.text.includes("покинул");
//     //         if (isSystem && isJoinOrLeave) setTimeout(() => dispatch(removeMessage(data.id)), 5000);
//     //     };
//     //     socket.on("message", handler);
//     //     return () => {socket.off("message", handler)};
//     // }, [socket, dispatch]);
//
//     // Сохраняем socketId после подключения
//     // useEffect(() => {
//     //     const onConnect = () => socket.id && dispatch(setSocketId(socket.id));
//     //     socket.on("connect", onConnect);
//     //     if (socket.connected) onConnect();
//     //     return () => {socket.off("connect", onConnect)};
//     // }, [socket, dispatch]);
//     //
//     // function handleSubmit(e: FormEvent<HTMLFormElement>) {
//     //     e.preventDefault();
//     //     if (!message.trim() || !name || !socket.id || !room) return;
//     //
//     //     const newMsg: Message = {
//     //         id: `${socket.id}-${Date.now()}`,
//     //         name,
//     //         text: message,
//     //         sender: "Вы",
//     //         socketId: socket.id,
//     //         roomId: room,
//     //     };
//     //     socket.emit("sendMessage", newMsg);
//     //     dispatch(addMessage(newMsg));
//     //     setMessage("");
//     // }
//
//     return (
//         <div className="flex flex-col h-full">
//             {/*<ChatSidebar onSelectUser={setRemoteUser} />*/}
//             {/*<CallPanel localUserId={socketId || ""} remoteUserId={remoteUser?.id} socket={socket} />*/}
//             <ChatBody messages={messages} />
//             <ChatForm handleSubmit={handleSubmit} setMessage={handleMessage} message={message} />
//         </div>
//     );
// }
//
// //
// // export function ChatMessageBlock() {
// //     const socket = useSocket();
// //     const dispatch = useDispatch();
// //     const [message, setMessage] = useState('');
// //     const {name, room, socketId} = useSelector((state: RootState) => state.user);
// //     const messages = useSelector((state: RootState) => state.messages.messages);
// //
// //     useGetMessagesQuery(room, {
// //         refetchOnMountOrArgChange: true,
// //         skip: !room,
// //     });
// //
// //     const [remoteUser, setRemoteUser] = useState<User | null>(null);
// //
// //     useEffect(() => {
// //         const handler = (data: Message) => {
// //             dispatch(addMessage(data));
// //
// //             const isSystem = data.name === 'Система';
// //             const isJoinOrLeave = data.text.includes('присоединился') || data.text.includes('покинул');
// //
// //             if (isSystem && isJoinOrLeave) {
// //                 setTimeout(() => dispatch(removeMessage(data.id)), 5000);
// //             }
// //         };
// //
// //         socket.on('message', handler);
// //         return () => {
// //             socket.off('message', handler);
// //         };
// //     }, [socket, dispatch]);
// //
// //     function handleSubmit(e: FormEvent<HTMLFormElement>) {
// //         e.preventDefault();
// //         if (message.trim() && name) {
// //             const newMsg = {
// //                 id: `${socket.id}-${Date.now()}`,
// //                 name,
// //                 text: message,
// //                 sender: 'Вы',
// //                 socketId: socket.id,
// //                 roomId: room,
// //             };
// //             socket.emit('sendMessage', newMsg);
// //             setMessage('');
// //         }
// //     }
// //
// //     return (
// //         <div className="flex flex-col h-full">
// //             <ChatSidebar onSelectUser={(user) => setRemoteUser(user)} />
// //             <CallPanel localUserId={socketId !} remoteUserId={remoteUser?.id} socket={socket} />
// //             <ChatBody messages={messages}/>
// //             <form onSubmit={handleSubmit} className="flex gap-3 p-2 mt-4">
// //                 <input
// //                     type="text"
// //                     value={message}
// //                     onChange={(e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
// //                     placeholder="Введите сообщение..."
// //                     className="flex-grow p-3 border border-gray-300 rounded-md"
// //                 />
// //                 <button type="submit" className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700">
// //                     Написать
// //                 </button>
// //             </form>
// //         </div>
// //     );
// // }
