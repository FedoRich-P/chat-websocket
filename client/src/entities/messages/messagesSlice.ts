import {createSlice, type PayloadAction} from "@reduxjs/toolkit";
import type {Message} from "../../shared/types.ts";

interface MessagesState {
    messages: Message[];
}

const initialState: MessagesState = {
    messages: [],
};

export const messagesSlice = createSlice({
    name: 'messages',
    initialState,
    reducers: {
        addMessage: (state, action: PayloadAction<Message>) => {
            state.messages.push(action.payload);
        },
        clearMessages: (state) => {
            state.messages = [];
        },
        removeMessage: (state, action: PayloadAction<string>) => {
            state.messages = state.messages.filter(msg => msg.id !== action.payload);
        },
    },
});

export const { addMessage, clearMessages, removeMessage } = messagesSlice.actions;
