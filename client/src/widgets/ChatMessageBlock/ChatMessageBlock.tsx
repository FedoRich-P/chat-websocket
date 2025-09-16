import {useChatLogic} from "../../features/call/model/useChatLogic.ts";
import {useChatMessages} from "../../features/call/model/useChatMessages.ts";
import {ChatBody} from "../../features/chat";
import {ChatForm} from "../../features/chat/ui/ChatForm/ChatForm.tsx";
import {CallPanel} from "../../features/call/ui/CallPanel.tsx";
import {useSocket} from "../../shared";
import {useAppDispatch, useAppSelector} from "../../shared/hooks/hooks.ts";
import {setSocketId, userRoomSelector, userSocketIdSelector} from "../../entities/user/userSlice.ts";
import type {User} from "../../shared/types.ts";
import {useEffect, useState} from "react";

export function ChatMessageBlock() {
    const socket = useSocket();
	const { message, handleMessage, handleSubmit } = useChatLogic()
    const socketId = useAppSelector(userSocketIdSelector)
    const { messages, isLoading } = useChatMessages()
    const room = useAppSelector(userRoomSelector)
    const [users, setUsers] = useState<User[]>([])
    const dispatch = useAppDispatch();

    const [remoteUserId, setRemoteUserId] = useState<string>('')

    useEffect(() => {
        const handleJoined = (data: { socketId: string }) => {
            dispatch(setSocketId(data.socketId));
        };

        socket.on("joined", handleJoined);

        // fallback: если сокет уже подключён, можно сразу задать
        if (socket.connected && socket.id) {
            dispatch(setSocketId(socket.id));
        }

        return () => {
            socket.off("joined", handleJoined);
        };
    }, [socket, dispatch]);

    // Получаем список пользователей в комнате
    useEffect(() => {
        if (!room) return;

        const handleUsers = (usersList: User[]) => {
            setUsers(usersList.filter(u => u.id !== socketId)) // исключаем себя
        }

        socket.on('users', handleUsers)
        socket.emit('getUsers', room)

        return () => {
            socket.off('users', handleUsers)
        }
    }, [socket, room, socketId])

    // Берём первого доступного пользователя для звонка
    useEffect(() => {
        if (users.length > 0) {
            setRemoteUserId(users[0].id)
        } else {
            setRemoteUserId('')
        }
    }, [users])



	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-full text-gray-500">
				Загрузка сообщений...
			</div>
		)
	}

	return (
		<div className="flex flex-col h-full">
            <div>
                <CallPanel
                    localUserId={socketId ?? ""}
                    remoteUserId={remoteUserId}
                    socket={socket}
                />
            </div>
			<ChatBody messages={messages} />

			<ChatForm handleSubmit={handleSubmit} setMessage={handleMessage} message={message} />
		</div>
	)
}
