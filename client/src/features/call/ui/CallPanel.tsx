import type { Socket } from "socket.io-client";
import { useWebRTC } from "../model/useWebRTC.ts";

interface Props {
    localUserId: string;
    remoteUserId?: string;
    remoteUserName?: string;
    socket: Socket;
}

export function CallPanel({ localUserId, remoteUserId, remoteUserName, socket }: Props) {
    const { localVideo, remoteVideo, incomingCall, startCall, acceptCall, endCall } =
        useWebRTC(socket, localUserId, remoteUserId);

    const callActive = !!remoteVideo.current?.srcObject || !!incomingCall;

    return (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 p-4 bg-gray-100 rounded-xl shadow-md w-full max-w-3xl mx-auto">
            {/* Локальное видео */}
            <div className="flex flex-col items-center gap-2 w-full md:w-1/2">
                {incomingCall && incomingCall.from === remoteUserId && (
                    <div className="text-white bg-blue-600 px-3 py-1 rounded text-sm mb-1">
                        Входящий звонок от {remoteUserName || "Собеседника"}
                    </div>
                )}
                {callActive && !incomingCall && (
                    <div className="text-white bg-green-600 px-3 py-1 rounded text-sm mb-1">
                        Звонок с {remoteUserName || "Собеседником"}
                    </div>
                )}
                <video
                    ref={localVideo}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-64 md:h-72 bg-black rounded-lg object-cover"
                />
                <span className="text-sm text-gray-600">Вы</span>
            </div>

            {/* Удалённое видео */}
            <div className="flex flex-col items-center gap-2 w-full md:w-1/2">
                <video
                    ref={remoteVideo}
                    autoPlay
                    playsInline
                    className="w-full h-64 md:h-72 bg-black rounded-lg object-cover"
                />
                <span className="text-sm text-gray-600">Собеседник</span>
            </div>

            {/* Кнопки управления */}
            <div className="flex flex-wrap justify-center gap-2 w-full mt-4 md:mt-0 md:col-span-2">
                {/* Ответить */}
                {incomingCall && !callActive && incomingCall.from === remoteUserId && (
                    <button
                        onClick={acceptCall}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded transition"
                    >
                        Ответить
                    </button>
                )}

                {/* Позвонить */}
                {remoteUserId && !callActive && (
                    <button
                        onClick={startCall}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded transition"
                    >
                        Позвонить
                    </button>
                )}

                {/* Завершить */}
                {callActive && (
                    <button
                        onClick={endCall}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded transition"
                    >
                        Завершить
                    </button>
                )}
            </div>
        </div>
    );
}


// import {useWebRTC} from "../model/useWebRTC.ts";
//
// interface CallPanelProps {
//     localUserId: string;
//     remoteUserId?: string;
// }
//
// export function CallPanel ({ localUserId, remoteUserId } : CallPanelProps) {
//     const { localVideo, remoteVideo, incomingCall, startCall, acceptCall, endCall } = useWebRTC(localUserId, remoteUserId);
//
//     return (
//         <div className="flex gap-2 mb-2">
//             <video playsInline muted ref={localVideo} autoPlay className="w-40 h-40 bg-black" />
//             <video playsInline ref={remoteVideo} autoPlay className="w-40 h-40 bg-black" />
//             {incomingCall && <button onClick={acceptCall} className="bg-blue-600 text-white px-2">Ответить</button>}
//             <button onClick={startCall} className="bg-green-600 text-white px-2">Позвонить</button>
//             <button onClick={endCall} className="bg-red-600 text-white px-2">Завершить</button>
//         </div>
//     );
// };
