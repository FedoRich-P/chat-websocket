import type { Socket } from "socket.io-client";
import {useWebRTC} from "../model/useWebRTC.ts";

interface Props {
    socket: Socket;
    localUserId: string;
    remoteUserId?: string;
    remoteUserName?: string;
}

export function CallPanel({ socket, localUserId, remoteUserId }: Props) {
    const { localVideo, remoteVideo, incomingCall, callActive, startCall, acceptCall, endCall } =
        useWebRTC({ socket, localUserId, remoteUserId });

    return (
        <div className="p-4 bg-gray-100 rounded shadow-md flex flex-col items-center gap-4">
            <video ref={localVideo} autoPlay muted className="w-64 h-48 bg-black rounded" />
            <video ref={remoteVideo} autoPlay className="w-64 h-48 bg-black rounded" />

            <div className="flex gap-2 mt-2">
                {!callActive && !incomingCall && remoteUserId && (
                    <>
                        <button onClick={() => startCall("audio")} className="bg-yellow-500 px-4 py-2 rounded">
                            Аудио
                        </button>
                        <button onClick={() => startCall("video")} className="bg-green-500 px-4 py-2 rounded">
                            Видео
                        </button>
                    </>
                )}

                {incomingCall && !callActive && (
                    <button onClick={acceptCall} className="bg-blue-500 px-4 py-2 rounded">
                        Ответить
                    </button>
                )}

                {callActive && (
                    <button onClick={endCall} className="bg-red-500 px-4 py-2 rounded">
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
