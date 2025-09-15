import { useEffect, useRef, useState } from "react";
import { useSocket } from "../../../shared";

export function useWebRTC(localUserId: string, remoteUserId?: string) {
    const socket = useSocket();
    const peerRef = useRef<RTCPeerConnection | null>(null);

    const localVideo = useRef<HTMLVideoElement | null>(null);
    const remoteVideo = useRef<HTMLVideoElement | null>(null);

    const [incomingCall, setIncomingCall] = useState<null | { from: string; signal: any }>(null);

    useEffect(() => {
        peerRef.current = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });

        peerRef.current.onicecandidate = (event) => {
            if (event.candidate && remoteUserId) {
                socket.emit("iceCandidate", { to: remoteUserId, candidate: event.candidate });
            }
        };

        peerRef.current.ontrack = (event) => {
            if (remoteVideo.current) remoteVideo.current.srcObject = event.streams[0];
        };

        return () => peerRef.current?.close();
    }, [socket, remoteUserId]);

    const startCall = async () => {
        if (!remoteUserId) return alert("Выберите пользователя для звонка");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localVideo.current) localVideo.current.srcObject = stream;
        stream.getTracks().forEach(track => peerRef.current?.addTrack(track, stream));

        const offer = await peerRef.current!.createOffer();
        await peerRef.current!.setLocalDescription(offer);

        socket.emit("callUser", {
            userToCall: remoteUserId,
            signal: offer,
            from: localUserId,
            name: "Caller",
        });
    };

    const acceptCall = async () => {
        if (!incomingCall) return;

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localVideo.current) localVideo.current.srcObject = stream;
        stream.getTracks().forEach(track => peerRef.current?.addTrack(track, stream));

        await peerRef.current!.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));

        const answer = await peerRef.current!.createAnswer();
        await peerRef.current!.setLocalDescription(answer);

        socket.emit("answerCall", { to: incomingCall.from, signal: answer });
        setIncomingCall(null);
    };

    useEffect(() => {
        socket.on("incomingCall", ({ from, signal }) => setIncomingCall({ from, signal }));
        socket.on("callAccepted", async (signal) => {
            await peerRef.current!.setRemoteDescription(new RTCSessionDescription(signal));
        });
        socket.on("iceCandidate", async (candidate) => {
            try { await peerRef.current?.addIceCandidate(new RTCIceCandidate(candidate)); }
            catch (err) { console.error(err); }
        });

        return () => {
            socket.off("incomingCall");
            socket.off("callAccepted");
            socket.off("iceCandidate");
        };
    }, [socket]);

    return { localVideo, remoteVideo, incomingCall, startCall, acceptCall };
}
