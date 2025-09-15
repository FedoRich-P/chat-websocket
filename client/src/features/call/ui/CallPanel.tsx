// CallPanel.tsx
import type { Socket } from "socket.io-client";
import { useWebRTC } from "../model/useWebRTC";

interface Props {
    localUserId: string;
    remoteUserId?: string;
    socket: Socket;
}

export function CallPanel({ localUserId, remoteUserId, socket }: Props) {
    const { localVideo, remoteVideo, incomingCall, startCall, acceptCall, endCall } =
        useWebRTC(socket, localUserId, remoteUserId);

    return (
        <div className="flex gap-2 mb-2 items-center">
            <video ref={localVideo} autoPlay muted playsInline className="w-40 h-40 bg-black" />
            <video ref={remoteVideo} autoPlay playsInline className="w-40 h-40 bg-black" />

            <div className="flex gap-2">
                {incomingCall && (
                    <button onClick={acceptCall} className="bg-blue-600 text-white px-2">
                        Ответить
                    </button>
                )}

                {remoteUserId ? (
                    <button onClick={startCall} className="bg-green-600 text-white px-2">
                        Позвонить
                    </button>
                ) : (
                    <button disabled className="px-2 opacity-50">Нет абонента</button>
                )}

                <button onClick={endCall} className="bg-red-600 text-white px-2">
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
