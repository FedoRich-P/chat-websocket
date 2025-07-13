import {useSocket} from "../../shared";
import {ChatMessageBlock, ChatSidebar} from "../../features/chat";
import {useNavigate} from "react-router";
import {PATH} from "../../app/paths.ts";
import {clearMessages} from "../../entities";
import {useDispatch} from "react-redux";

export function Chat() {
    const navigate = useNavigate();
    const socket = useSocket();
    const dispatch = useDispatch();

    const handleLeaveChat = () => {
        socket.emit('leaveChat');
        dispatch(clearMessages());
        navigate(PATH.HOME);
        setTimeout(() => {
            localStorage.removeItem('user');
        }, 100);
    };

    return (
        <div className="flex h-screen font-inter bg-gray-50 rounded-tr-lg">
            <main className="flex-1 p-6 flex flex-col ">
                <header
                    className="flex justify-end items-center p-4 bg-white border-b border-gray-200 shadow-md rounded-tr-lg">
                    <button
                        onClick={handleLeaveChat}
                        className="px-6 py-2 rounded-md bg-red-500 text-white font-semibold hover:bg-red-600 transition duration-200 ease-in-out shadow-md"
                    >
                        Покинуть чат
                    </button>
                </header>
                <ChatMessageBlock/>
            </main>
            <ChatSidebar/>
        </div>
    );
}