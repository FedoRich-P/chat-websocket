import { useEffect } from 'react';
import { useGetMessagesQuery } from '../../../shared/api/chatApi';
import { userRoomSelector } from '../../../entities/user/userSlice';
import { useAppDispatch, useAppSelector } from '../../../shared/hooks/hooks.ts'
import { useSocket } from '../../../shared'
import type { Message } from '../../../shared/types.ts'
import { addMessage, removeMessage } from '../../../entities'
import { messagesSelector, setMessages } from '../../../entities/messages/messagesSlice.ts'

export function useChatMessages()  {
    const dispatch = useAppDispatch();
    const socket = useSocket();

    const room = useAppSelector(userRoomSelector);
    const messages = useAppSelector(messagesSelector);

    const { data: fetchedMessages, isLoading } = useGetMessagesQuery(room, {
        refetchOnMountOrArgChange: true,
        skip: !room,
    });

    useEffect(() => {
        if (fetchedMessages) {
            dispatch(setMessages(fetchedMessages));
        }
    }, [fetchedMessages, dispatch]);

    useEffect(() => {
        const messageHandler = (data: Message) => {
            dispatch(addMessage(data));

            const isSystem = data.name === 'Система';
            const isJoinOrLeave = data.text.includes('присоединился') || data.text.includes('покинул');

            if (isSystem && isJoinOrLeave) {
                setTimeout(() => dispatch(removeMessage(data.id)), 5000);
            }
        };

        socket.on('message', messageHandler);

        return () => {
            socket.off('message', messageHandler);
        };
    }, [socket, dispatch]);

    return {
        messages,
        isLoading,
    };
};