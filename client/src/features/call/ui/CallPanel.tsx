import { useState } from "react";
import type { Socket } from "socket.io-client";
import { useWebRTC } from "../model/useWebRTC";

interface Props {
    localUserId: string;
    remoteUserId?: string;
    remoteUserName?: string;
    socket: Socket;
}

export function CallPanel({ localUserId, remoteUserId, remoteUserName, socket }: Props) {
    const [callMode, setCallMode] = useState<'audio' | 'video'>('video');
    const { localVideo, remoteVideo, incomingCall, startCall, acceptCall, endCall } =
        useWebRTC(socket, localUserId, remoteUserId);

    const callActive = Boolean(remoteVideo.current?.srcObject);

    const handleStartCall = (mode: 'audio' | 'video') => {
        setCallMode(mode);
        startCall(mode);
    };

    const handleAcceptCall = () => {
        if (incomingCall) acceptCall(incomingCall.mode);
    };

    const renderIncomingLabel = () => {
        if (!incomingCall) return null;
        return (
            <div className="text-white bg-blue-600 px-3 py-1 rounded text-sm mb-1">
                Входящий {incomingCall.mode}-звонок от {incomingCall.name || "Собеседника"}
            </div>
        );
    };

    const renderActiveLabel = () => {
        if (!callActive) return null;
        const mode = incomingCall?.mode || callMode;
        return (
            <div className="text-white bg-green-600 px-3 py-1 rounded text-sm mb-1">
                {mode === 'video' ? 'Видеозвонок' : 'Аудиозвонок'} с {remoteUserName || "Собеседником"}
            </div>
        );
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 p-4 bg-gray-100 rounded-xl shadow-md w-full max-w-3xl mx-auto">
            <div className="flex flex-col items-center gap-2 w-full md:w-1/2">
                {renderIncomingLabel()}
                {renderActiveLabel()}
                {callMode === 'video' || incomingCall?.mode === 'video' ? (
                    <video
                        ref={localVideo}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-64 md:h-72 bg-black rounded-lg object-cover"
                    />
                ) : (
                    <div className="w-full h-16 bg-black rounded-lg flex items-center justify-center text-white">
                        Аудио звонок
                    </div>
                )}
                <span className="text-sm text-gray-600">Вы</span>
            </div>

            <div className="flex flex-col items-center gap-2 w-full md:w-1/2">
                {callMode === 'video' || incomingCall?.mode === 'video' ? (
                    <video
                        ref={remoteVideo}
                        autoPlay
                        playsInline
                        className="w-full h-64 md:h-72 bg-black rounded-lg object-cover"
                    />
                ) : (
                    <div className="w-full h-16 bg-black rounded-lg flex items-center justify-center text-white">
                        Аудио звонок
                    </div>
                )}
                <span className="text-sm text-gray-600">Собеседник</span>
            </div>

            <div className="flex flex-wrap justify-center gap-2 w-full mt-4 md:mt-0 md:col-span-2">
                {incomingCall && !callActive && (
                    <button
                        onClick={handleAcceptCall}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded transition"
                    >
                        Ответить
                    </button>
                )}

                {remoteUserId && !callActive && !incomingCall && (
                    <>
                        <button
                            onClick={() => handleStartCall('video')}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded transition"
                        >
                            Видеозвонок
                        </button>
                        <button
                            onClick={() => handleStartCall('audio')}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded transition"
                        >
                            Аудиозвонок
                        </button>
                    </>
                )}

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




// import type { Socket } from "socket.io-client";
// import { useWebRTC } from "../model/useWebRTC";
//
// interface Props {
//     localUserId: string;
//     remoteUserId?: string;
//     remoteUserName?: string;
//     socket: Socket;
// }
//
// export function CallPanel({ localUserId, remoteUserId, remoteUserName, socket }: Props) {
//     const { localVideo, remoteVideo, incomingCall, startCall, acceptCall, endCall } =
//         useWebRTC(socket, localUserId, remoteUserId);
//     const callActive = Boolean(remoteVideo.current?.srcObject);
//
//     return (
//         <div className="flex flex-col md:flex-row gap-4 md:gap-6 p-4 bg-gray-100 rounded-xl shadow-md w-full max-w-3xl mx-auto">
//             <div className="flex flex-col items-center gap-2 w-full md:w-1/2">
//                 {incomingCall && incomingCall.from === remoteUserId && !callActive && (
//                     <div className="text-white bg-blue-600 px-3 py-1 rounded text-sm mb-1">
//                         Входящий звонок от {remoteUserName || "Собеседника"}
//                     </div>
//                 )}
//                 {callActive && (
//                     <div className="text-white bg-green-600 px-3 py-1 rounded text-sm mb-1">
//                         Звонок с {remoteUserName || "Собеседником"}
//                     </div>
//                 )}
//                 <video ref={localVideo} autoPlay muted playsInline className="w-full h-64 md:h-72 bg-black rounded-lg object-cover" />
//                 <span className="text-sm text-gray-600">Вы</span>
//             </div>
//
//             <div className="flex flex-col items-center gap-2 w-full md:w-1/2">
//                 <video ref={remoteVideo} autoPlay playsInline className="w-full h-64 md:h-72 bg-black rounded-lg object-cover" />
//                 <span className="text-sm text-gray-600">Собеседник</span>
//             </div>
//
//             <div className="flex flex-wrap justify-center gap-2 w-full mt-4 md:mt-0 md:col-span-2">
//                 {incomingCall && incomingCall.from === remoteUserId && !callActive && (
//                     <button onClick={acceptCall} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded transition">
//                         Ответить
//                     </button>
//                 )}
//
//                 {remoteUserId && !callActive && !incomingCall && (
//                     <button onClick={startCall} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded transition">
//                         Позвонить
//                     </button>
//                 )}
//
//                 {callActive && (
//                     <button onClick={endCall} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded transition">
//                         Завершить
//                     </button>
//                 )}
//             </div>
//         </div>
//     );
// }





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
