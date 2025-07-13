import {createBrowserRouter} from "react-router";
import {Chat, Home, NotFound, UsersPage} from "../pages";
import {PATH} from "./paths.ts";
import {Layout} from "../components";

export const router = createBrowserRouter([
    {
        path: '/',
        Component: Layout,
        children: [
            { index: true, Component: Home },
            {
                path: "users",
                children: [
                    { index: true, Component: UsersPage },
                ],
            },
            { path: PATH.CHAT, Component: Chat },
            { path: PATH.NOT_FOUND, Component: NotFound },
        ],
    },
]);