import {createSlice, type PayloadAction} from "@reduxjs/toolkit";

interface UserState {
    name: string | null;
    socketId: string | null;
    room: string;
}

const initialState: UserState = {
    name: localStorage.getItem('user') || null,
    socketId: null,
    room: 'general',
};

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<string>) => {
            state.name = action.payload;
        },
        setSocketId: (state, action: PayloadAction<string>) => {
            state.socketId = action.payload;
        },
        setRoom: (state, action: PayloadAction<string>) => {
            state.room = action.payload;
        },
        logout: (state) => {
            state.name = null;
            state.socketId = null;
            localStorage.removeItem('user');
        },
    },
});

export const { setUser, setSocketId, logout, setRoom } = userSlice.actions;
