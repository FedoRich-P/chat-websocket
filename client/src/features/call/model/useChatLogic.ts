import { useSocket } from '../../../shared'
import { useAppSelector } from '../../../shared/hooks/hooks.ts'
import { type FormEvent, useState } from 'react'
import { userNameSelector, userRoomSelector } from '../../../entities/user/userSlice.ts'

export const useChatLogic = () => {
	const [message, setMessage] = useState('')
	const socket = useSocket();

	const name = useAppSelector(userNameSelector)
	const room = useAppSelector(userRoomSelector)

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		if (message.trim() && name) {
			const newMsg = {
				id: `${socket.id}-${Date.now()}`,
				name,
				text: message,
				sender: 'Вы',
				socketId: socket.id,
				roomId: room
			}
			socket.emit('sendMessage', newMsg)
			setMessage('')
		}
	};

	const handleMessage = (value: string) => {
		setMessage(value);
	};


	return {
		message,
		handleMessage,
		handleSubmit,
		userName: name,
		currentRoom: room,
	};
};