import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";

interface UseWebRTCProps {
    socket: Socket;
    localUserId: string;
    remoteUserId?: string;
}

export function useWebRTC({ socket, localUserId, remoteUserId }: UseWebRTCProps) {
    const localVideo = useRef<HTMLVideoElement>(null);
    const remoteVideo = useRef<HTMLVideoElement>(null);
    const [incomingCall, setIncomingCall] = useState<any>(null);
    const [callActive, setCallActive] = useState(false);
    const [callSound] = useState(() => new Audio("/call-tone.mp3")); // добавь звуковой файл
    const pcRef = useRef<RTCPeerConnection | null>(null);

    // ICE configuration
    const config: RTCConfiguration = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

    useEffect(() => {
        socket.on("incomingCall", (data) => {
            setIncomingCall(data);
            callSound.loop = true;
            callSound.play();
        });

        socket.on("callAccepted", async (signal) => {
            callSound.pause();
            if (!pcRef.current) return;
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal));
            setCallActive(true);
        });

        socket.on("iceCandidate", async (candidate) => {
            if (pcRef.current && candidate) await pcRef.current.addIceCandidate(candidate);
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
    }, [socket]);

    const startCall = async (type: "audio" | "video") => {
        pcRef.current = new RTCPeerConnection(config);

        // Локальный стрим
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: type === "video",
        });
        stream.getTracks().forEach((track) => pcRef.current!.addTrack(track, stream));
        if (localVideo.current) localVideo.current.srcObject = stream;

        pcRef.current.ontrack = (event) => {
            if (remoteVideo.current) remoteVideo.current.srcObject = event.streams[0];
        };

        pcRef.current.onicecandidate = (event) => {
            if (event.candidate && remoteUserId) {
                socket.emit("iceCandidate", { to: remoteUserId, candidate: event.candidate });
            }
        };

        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);

        if (remoteUserId) {
            socket.emit("callUser", { userToCall: remoteUserId, signal: offer, from: localUserId });
        }
    };

    const acceptCall = async () => {
        if (!incomingCall) return;
        callSound.pause();
        pcRef.current = new RTCPeerConnection(config);

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        });
        stream.getTracks().forEach((track) => pcRef.current!.addTrack(track, stream));
        if (localVideo.current) localVideo.current.srcObject = stream;

        pcRef.current.ontrack = (event) => {
            if (remoteVideo.current) remoteVideo.current.srcObject = event.streams[0];
        };

        pcRef.current.onicecandidate = (event) => {
            if (event.candidate && incomingCall.from) {
                socket.emit("iceCandidate", { to: incomingCall.from, candidate: event.candidate });
            }
        };

        await pcRef.current.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);

        socket.emit("answerCall", { to: incomingCall.from, signal: answer });
        setCallActive(true);
        setIncomingCall(null);
    };

    const endCall = () => {
        pcRef.current?.close();
        pcRef.current = null;
        setCallActive(false);
        setIncomingCall(null);
        if (remoteUserId) socket.emit("endCall", { to: remoteUserId });
    };

    return {
        localVideo,
        remoteVideo,
        incomingCall,
        callActive,
        startCall,
        acceptCall,
        endCall,
    };
}




// // useWebRTC.ts
// import { useEffect, useRef, useState } from "react";
// import type { Socket } from "socket.io-client";
//
// interface IncomingCallData {
//     from: string;
//     signal: RTCSessionDescriptionInit;
//     name?: string | null;
// }
//
// export function useWebRTC(socket: Socket, localUserId: string, remoteUserId?: string) {
//     const localVideo = useRef<HTMLVideoElement | null>(null);
//     const remoteVideo = useRef<HTMLVideoElement | null>(null);
//
//     const pcRef = useRef<RTCPeerConnection | null>(null);
//     const localStreamRef = useRef<MediaStream | null>(null);
//     const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
//
//     const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
//
//     async function ensureLocalStream() {
//         if (localStreamRef.current && localStreamRef.current.active) return localStreamRef.current;
//         try {
//             const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//             localStreamRef.current = s;
//             if (localVideo.current) localVideo.current.srcObject = s;
//             return s;
//         } catch (err) {
//             console.error("Ошибка доступа к медиа:", err);
//             throw err;
//         }
//     }
//
//     async function createPeerConnection() {
//         if (pcRef.current) return pcRef.current;
//
//         const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
//
//         pc.onicecandidate = (e) => {
//             if (e.candidate && remoteUserId) {
//                 socket.emit("iceCandidate", { to: remoteUserId, candidate: e.candidate });
//             }
//         };
//
//         pc.ontrack = (e) => {
//             if (remoteVideo.current) remoteVideo.current.srcObject = e.streams[0];
//         };
//
//         const stream = await ensureLocalStream();
//         stream.getTracks().forEach((t) => pc.addTrack(t, stream));
//
//         pcRef.current = pc;
//         return pc;
//     }
//
//     async function startCall() {
//         if (!remoteUserId) return;
//         const pc = await createPeerConnection();
//         const offer = await pc.createOffer();
//         await pc.setLocalDescription(offer);
//         socket.emit("callUser", { userToCall: remoteUserId, signal: offer, from: localUserId });
//     }
//
//     async function acceptCall() {
//         if (!incomingCall) return;
//         // ignore incoming call if from self (safety)
//         if (incomingCall.from === localUserId) {
//             setIncomingCall(null);
//             return;
//         }
//
//         const pc = await createPeerConnection();
//         await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));
//
//         // apply pending ICEs
//         for (const c of pendingCandidates.current) {
//             try {
//                 await pc.addIceCandidate(new RTCIceCandidate(c));
//             } catch (err) {
//                 console.error("addIceCandidate error (apply pending):", err);
//             }
//         }
//         pendingCandidates.current = [];
//
//         const answer = await pc.createAnswer();
//         await pc.setLocalDescription(answer);
//         socket.emit("answerCall", { to: incomingCall.from, signal: answer });
//         setIncomingCall(null);
//     }
//
//     function endCall() {
//         pcRef.current?.close();
//         pcRef.current = null;
//
//         if (localStreamRef.current) {
//             localStreamRef.current.getTracks().forEach((t) => t.stop());
//             localStreamRef.current = null;
//         }
//
//         if (localVideo.current) localVideo.current.srcObject = null;
//         if (remoteVideo.current) remoteVideo.current.srcObject = null;
//
//         if (remoteUserId) socket.emit("endCall", { to: remoteUserId });
//     }
//
//     useEffect(() => {
//         socket.on("incomingCall", (data: IncomingCallData) => {
//             // ignore calls from self
//             if (data.from === localUserId) return;
//             setIncomingCall(data);
//         });
//
//         socket.on("callAccepted", async (signal: RTCSessionDescriptionInit) => {
//             if (!pcRef.current) {
//                 // create PC in caller if not exists and then set remote
//                 await createPeerConnection();
//             }
//             try {
//                 await pcRef.current!.setRemoteDescription(new RTCSessionDescription(signal));
//             } catch (err) {
//                 console.error("setRemoteDescription error (callAccepted):", err);
//             }
//
//             // apply any pending ICE after remote desc
//             for (const c of pendingCandidates.current) {
//                 try {
//                     await pcRef.current!.addIceCandidate(new RTCIceCandidate(c));
//                 } catch (err) {
//                     console.error("addIceCandidate error (post-accepted):", err);
//                 }
//             }
//             pendingCandidates.current = [];
//         });
//
//         socket.on("iceCandidate", async (candidate: RTCIceCandidateInit) => {
//             if (pcRef.current && pcRef.current.remoteDescription && pcRef.current.remoteDescription.type) {
//                 try {
//                     await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
//                 } catch (err) {
//                     console.error("addIceCandidate error:", err);
//                 }
//             } else {
//                 pendingCandidates.current.push(candidate);
//             }
//         });
//
//         socket.on("callEnded", () => {
//             endCall();
//         });
//
//         socket.on("callError", (err) => {
//             console.warn("callError from server:", err);
//         });
//
//         return () => {
//             socket.off("incomingCall");
//             socket.off("callAccepted");
//             socket.off("iceCandidate");
//             socket.off("callEnded");
//             socket.off("callError");
//         };
//     }, [socket, localUserId, remoteUserId, createPeerConnection, endCall]);
//
//     return { localVideo, remoteVideo, incomingCall, startCall, acceptCall, endCall };
// }





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
