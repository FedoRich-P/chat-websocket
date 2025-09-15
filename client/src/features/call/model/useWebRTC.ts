import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

export function useWebRTC(socket: Socket, localUserId: string, remoteUserId?: string) {
    const localVideo = useRef<HTMLVideoElement>(null);
    const remoteVideo = useRef<HTMLVideoElement>(null);
    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
    const [incomingCall, setIncomingCall] = useState<{ from: string; signal: any } | null>(null);

    // один общий стрим
    const localStreamRef = useRef<MediaStream | null>(null);

    // инициализация стрима
    async function initLocalStream() {
        if (localStreamRef.current && localStreamRef.current.active) {
            return localStreamRef.current;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            if (localVideo.current) {
                localVideo.current.srcObject = stream;
            }
            return stream;
        } catch (err) {
            console.error("Ошибка доступа к медиа:", err);
            return null;
        }
    }

    async function createPeerConnection() {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        pc.onicecandidate = (e) => {
            if (e.candidate && remoteUserId) {
                socket.emit("iceCandidate", { to: remoteUserId, candidate: e.candidate });
            }
        };

        pc.ontrack = (e) => {
            if (remoteVideo.current) {
                remoteVideo.current.srcObject = e.streams[0];
            }
        };

        const stream = await initLocalStream();
        if (stream) {
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        }

        setPeerConnection(pc);
        return pc;
    }

    async function startCall() {
        if (!remoteUserId) return;
        const pc = await createPeerConnection();
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("callUser", {
            userToCall: remoteUserId,
            signal: offer,
            from: localUserId,
        });
    }

    async function acceptCall() {
        if (!incomingCall) return;
        const pc = await createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answerCall", { to: incomingCall.from, signal: answer });
        setIncomingCall(null);
    }

    function endCall() {
        peerConnection?.close();
        setPeerConnection(null);

        if (remoteVideo.current) {
            remoteVideo.current.srcObject = null;
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
        }

        if (remoteUserId) {
            socket.emit("endCall", { to: remoteUserId });
        }
    }

    useEffect(() => {
        socket.on("incomingCall", (data) => setIncomingCall(data));

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
                    console.error("Ошибка добавления ICE:", err);
                }
            }
        });

        socket.on("callEnded", () => {
            endCall();
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



// import { useEffect, useRef, useState } from "react";
// import { io } from "socket.io-client";
//
// const SERVER_URL = "http://localhost:5000";
//
// export function useWebRTC(localUserId: string, remoteUserId?: string) {
//     const socket = useRef(io(SERVER_URL));
//     const localVideo = useRef<HTMLVideoElement>(null);
//     const remoteVideo = useRef<HTMLVideoElement>(null);
//     const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
//     const [incomingCall, setIncomingCall] = useState<{ from: string; signal: any } | null>(null);
//
//     async function createPeerConnection() {
//         const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
//
//         pc.onicecandidate = (event) => {
//             if (event.candidate && remoteUserId) {
//                 socket.current.emit("iceCandidate", { to: remoteUserId, candidate: event.candidate });
//             }
//         };
//
//         pc.ontrack = (event) => {
//             if (remoteVideo.current) remoteVideo.current.srcObject = event.streams[0];
//         };
//
//         const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//         if (localVideo.current) localVideo.current.srcObject = stream;
//         stream.getTracks().forEach(track => pc.addTrack(track, stream));
//
//         setPeerConnection(pc);
//         return pc;
//     }
//
//     async function startCall() {
//         if (!remoteUserId) return;
//         const pc = await createPeerConnection();
//         const offer = await pc.createOffer();
//         await pc.setLocalDescription(offer);
//
//         socket.current.emit("callUser", { userToCall: remoteUserId, signal: offer, from: localUserId });
//     }
//
//     async function acceptCall() {
//         if (!incomingCall) return;
//         const pc = await createPeerConnection();
//         await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));
//         const answer = await pc.createAnswer();
//         await pc.setLocalDescription(answer);
//
//         socket.current.emit("answerCall", { to: incomingCall.from, signal: answer });
//         setIncomingCall(null);
//     }
//
//     function endCall() {
//         peerConnection?.close();
//         setPeerConnection(null);
//         if (remoteVideo.current) remoteVideo.current.srcObject = null;
//         if (remoteUserId) socket.current.emit("endCall", { to: remoteUserId });
//     }
//
//     useEffect(() => {
//         socket.current.on("incomingCall", ({ from, signal }) => setIncomingCall({ from, signal }));
//         socket.current.on("callAccepted", async (signal) => {
//             if (peerConnection) await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
//         });
//         socket.current.on("iceCandidate", async (candidate) => {
//             if (peerConnection) await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
//         });
//         socket.current.on("callEnded", () => endCall());
//
//         return () => {
//             socket.current.off("incomingCall");
//             socket.current.off("callAccepted");
//             socket.current.off("iceCandidate");
//             socket.current.off("callEnded");
//         };
//     }, [peerConnection]);
//
//     return { localVideo, remoteVideo, incomingCall, startCall, acceptCall, endCall };
// }
