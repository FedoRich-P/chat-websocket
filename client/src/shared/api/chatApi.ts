import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {Message} from "../types.ts";

export const chatApi = createApi({
    reducerPath: 'chatApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:5000/api/' }),
    endpoints: (builder) => ({
        getMessages: builder.query<Message[], string>({
            query: (roomId) => `messages?room=${roomId}`,
        }),
    }),
});

export const { useGetMessagesQuery } = chatApi;