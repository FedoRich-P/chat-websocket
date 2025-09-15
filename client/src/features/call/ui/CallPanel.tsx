import type { Socket } from "socket.io-client";
import { useWebRTC } from "../model/useWebRTC";


interface Props {
    localUserId: string;
    remoteUserId?: string;
    socket: Socket;
}

export function CallPanel({ localUserId, remoteUserId, socket }: Props) {
    const {
        localVideo,
        remoteVideo,
        incomingCall,
        startCall,
        acceptCall,
        endCall,
    } = useWebRTC(socket, localUserId, remoteUserId);

    return (
        <div className="flex gap-2 mb-2 items-center">
            {/* Локальное видео */}
            <video
                ref={localVideo}
                autoPlay
                muted
                playsInline
                className="w-40 h-40 bg-black rounded"
            />
            {/* Удалённое видео */}
            <video
                ref={remoteVideo}
                autoPlay
                playsInline
                className="w-40 h-40 bg-black rounded"
            />

            {/* Панель управления */}
            <div className="flex flex-col gap-2">
                {/* Ответить доступно только если есть входящий звонок */}
                {incomingCall && (
                    <button
                        onClick={acceptCall}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                    >
                        Ответить
                    </button>
                )}

                {/* Позвонить можно только если выбран собеседник */}
                {remoteUserId && !incomingCall && (
                    <button
                        onClick={startCall}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                    >
                        Позвонить
                    </button>
                )}

                {/* Завершить звонок */}
                <button
                    onClick={endCall}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                >
                    Завершить
                </button>
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
