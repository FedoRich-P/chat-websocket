import {useWebRTC} from "../model/useWebRTC.ts";


export function CallPanel({ remoteUserId }: { remoteUserId: string }) {
    const { localVideo, remoteVideo, incomingCall, startCall, acceptCall } = useWebRTC("me", remoteUserId);

    return (
        <div className="p-4 border rounded-lg space-y-3">
            <video ref={localVideo} autoPlay playsInline muted className="w-1/2 border" />
            <video ref={remoteVideo} autoPlay playsInline className="w-1/2 border" />

            <button onClick={startCall} className="bg-green-500 text-white px-4 py-2 rounded">
                📞 Позвонить
            </button>

            {incomingCall && (
                <div className="mt-4 p-2 border rounded bg-yellow-100">
                    <p>Входящий звонок от {incomingCall.from}</p>
                    <button onClick={acceptCall} className="bg-blue-500 text-white px-4 py-2 rounded mt-2">
                        ✅ Принять
                    </button>
                </div>
            )}
        </div>
    );
}
