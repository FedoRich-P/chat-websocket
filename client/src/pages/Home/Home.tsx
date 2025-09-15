import React, { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import {getSocket} from "../../shared/socket.ts";
import {setRoom, setUser} from "../../entities";
import {PATH} from "../../app/paths.ts";



export function Home() {
    const [userName, setUserNameState] = useState("");
    const [roomName, setRoomNameState] = useState("general");
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const socket = getSocket();

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const name = userName.trim();
        const room = roomName.trim() || "general";
        if (name) {
            localStorage.setItem("user", name);
            dispatch(setUser(name));
            dispatch(setRoom(room));
            socket.emit("newUser", { name, room });
            navigate(PATH.CHAT);
        }
    }

    return (
        <section className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 font-inter">
            <div className="p-8 max-w-md w-full bg-white rounded-lg shadow-xl border border-gray-200">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Добро пожаловать!</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        placeholder="Введите ваше имя"
                        value={userName}
                        onChange={(e) => setUserNameState(e.target.value)}
                        className="p-3 rounded-md border border-gray-300"
                    />
                    <input
                        placeholder="Комната (например: general)"
                        value={roomName}
                        onChange={(e) => setRoomNameState(e.target.value)}
                        className="p-3 rounded-md border border-gray-300"
                    />
                    <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Войти
                    </button>
                </form>
            </div>
        </section>
    );
}






// import { useDispatch } from "react-redux";
// import { useSocket } from "../../shared";
// import { PATH } from "../../app/paths";
// import {setRoom, setUser} from "../../entities";
// import {type FormEvent, useState} from "react";
// import {useNavigate} from "react-router";
//
// export function Home() {
//     const [userName, setUserName] = useState('');
//     const [room, setRoomName] = useState('general');
//     const navigate = useNavigate();
//     const socket = useSocket();
//     const dispatch = useDispatch();
//
//     function handleSubmit(e: FormEvent<HTMLFormElement>) {
//         e.preventDefault();
//         if (userName.trim()) {
//             localStorage.setItem('user', userName);
//             dispatch(setUser(userName));
//             dispatch(setRoom(room));
//             socket.emit('newUser', { name: userName, room });
//             navigate(PATH.CHAT);
//         }
//     }
//
//     return (
//         <section className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 font-inter">
//             <div className="p-8 max-w-md w-full bg-white rounded-lg shadow-xl border border-gray-200">
//                 <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Добро пожаловать!</h2>
//                 <form onSubmit={handleSubmit} className="flex flex-col gap-4">
//                     <input
//                         placeholder="Введите ваше имя"
//                         value={userName}
//                         onChange={(e) => setUserName(e.target.value)}
//                         className="p-3 rounded-md border border-gray-300"
//                     />
//                     <input
//                         placeholder="Комната (например: general)"
//                         value={room}
//                         onChange={(e) => setRoomName(e.target.value)}
//                         className="p-3 rounded-md border border-gray-300"
//                     />
//                     <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
//                         Войти
//                     </button>
//                 </form>
//             </div>
//         </section>
//     );
// }
