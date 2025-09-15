import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:5000";

export function useWebRTC(localUserId: string, remoteUserId?: string) {
    const socket = useRef(io(SERVER_URL));
    const localVideo = useRef<HTMLVideoElement>(null);
    const remoteVideo = useRef<HTMLVideoElement>(null);
    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
    const [incomingCall, setIncomingCall] = useState<{ from: string; signal: any } | null>(null);

    async function createPeerConnection() {
        const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });

        pc.onicecandidate = (event) => {
            if (event.candidate && remoteUserId) {
                socket.current.emit("iceCandidate", { to: remoteUserId, candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            if (remoteVideo.current) remoteVideo.current.srcObject = event.streams[0];
        };

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localVideo.current) localVideo.current.srcObject = stream;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        setPeerConnection(pc);
        return pc;
    }

    async function startCall() {
        if (!remoteUserId) return;
        const pc = await createPeerConnection();
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.current.emit("callUser", { userToCall: remoteUserId, signal: offer, from: localUserId });
    }

    async function acceptCall() {
        if (!incomingCall) return;
        const pc = await createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.current.emit("answerCall", { to: incomingCall.from, signal: answer });
        setIncomingCall(null);
    }

    function endCall() {
        peerConnection?.close();
        setPeerConnection(null);
        if (remoteVideo.current) remoteVideo.current.srcObject = null;
        if (remoteUserId) socket.current.emit("endCall", { to: remoteUserId });
    }

    useEffect(() => {
        socket.current.on("incomingCall", ({ from, signal }) => setIncomingCall({ from, signal }));
        socket.current.on("callAccepted", async (signal) => {
            if (peerConnection) await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
        });
        socket.current.on("iceCandidate", async (candidate) => {
            if (peerConnection) await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        });
        socket.current.on("callEnded", () => endCall());

        return () => {
            socket.current.off("incomingCall");
            socket.current.off("callAccepted");
            socket.current.off("iceCandidate");
            socket.current.off("callEnded");
        };
    }, [peerConnection]);

    return { localVideo, remoteVideo, incomingCall, startCall, acceptCall, endCall };
}
