import { useEffect, useRef, useState } from "react";
import { useSocket } from "../../../shared";

export function useWebRTC(localUserId: string, remoteUserId?: string) {
    const socket = useSocket();
    const localVideo = useRef<HTMLVideoElement>(null);
    const remoteVideo = useRef<HTMLVideoElement>(null);
    const [incomingCall, setIncomingCall] = useState<{ from: string; signal: any } | null>(null);
    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);

    // === Создать новый PeerConnection ===
    async function createPeerConnection() {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        pc.onicecandidate = (event) => {
            if (event.candidate && remoteUserId) {
                socket.emit("iceCandidate", { to: remoteUserId, candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            if (remoteVideo.current) {
                remoteVideo.current.srcObject = event.streams[0];
            }
        };

        // Захват локального видео/аудио
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localVideo.current) {
            localVideo.current.srcObject = stream;
        }
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        setPeerConnection(pc);
        return pc;
    }

    // === Начать звонок ===
    async function startCall() {
        if (!remoteUserId) return;
        const pc = await createPeerConnection();
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("callUser", { userToCall: remoteUserId, signal: offer, from: localUserId, name: localUserId });
    }

    // === Принять звонок ===
    async function acceptCall() {
        if (!incomingCall) return;
        const pc = await createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("answerCall", { to: incomingCall.from, signal: answer });
        setIncomingCall(null);
    }

    // === Завершить звонок ===
    function endCall() {
        if (remoteUserId) {
            socket.emit("endCall", { to: remoteUserId });
        }
        peerConnection?.close();
        setPeerConnection(null);
        if (remoteVideo.current) {
            remoteVideo.current.srcObject = null;
        }
    }

    // === Слушатели socket.io ===
    useEffect(() => {
        socket.on("incomingCall", ({ signal, from }) => {
            setIncomingCall({ from, signal });
        });

        socket.on("callAccepted", async (signal) => {
            if (peerConnection) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
            }
        });

        socket.on("iceCandidate", async (candidate) => {
            if (peerConnection) {
                try {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error("Ошибка добавления ICE кандидата", err);
                }
            }
        });

        socket.on("callEnded", () => {
            peerConnection?.close();
            setPeerConnection(null);
            if (remoteVideo.current) {
                remoteVideo.current.srcObject = null;
            }
        });

        return () => {
            socket.off("incomingCall");
            socket.off("callAccepted");
            socket.off("iceCandidate");
            socket.off("callEnded");
        };
    }, [socket, peerConnection]);

    return { localVideo, remoteVideo, incomingCall, startCall, acceptCall, endCall };
}
