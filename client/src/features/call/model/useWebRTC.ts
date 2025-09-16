import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

interface IncomingCallData {
    from: string;
    signal: RTCSessionDescriptionInit;
    name?: string | null;
    mode: 'audio' | 'video';
}

export function useWebRTC(socket: Socket, localUserId: string, remoteUserId?: string) {
    const localVideo = useRef<HTMLVideoElement | null>(null);
    const remoteVideo = useRef<HTMLVideoElement | null>(null);

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
    const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
    const [canPlayRingtone, setCanPlayRingtone] = useState(false);

    const ringtoneRef = useRef<HTMLAudioElement | null>(null);
    if (!ringtoneRef.current) {
        ringtoneRef.current = new Audio("/call.mp3");
        ringtoneRef.current.loop = true;
    }

    const tryPlayRingtone = () => {
        if (!ringtoneRef.current) return;
        ringtoneRef.current.play()
            .then(() => setCanPlayRingtone(true))
            .catch(() => setCanPlayRingtone(false));
    };

    async function ensureLocalStream(mode: 'audio' | 'video') {
        if (localStreamRef.current && localStreamRef.current.active) return localStreamRef.current;

        try {
            const constraints = mode === 'audio'
                ? { audio: true, video: false }
                : { audio: true, video: true };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            localStreamRef.current = stream;
            if (localVideo.current) localVideo.current.srcObject = stream;
            return stream;
        } catch (err) {
            console.error("Ошибка доступа к медиа:", err);
            throw err;
        }
    }

    async function createPeerConnection() {
        if (pcRef.current) return pcRef.current;

        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "turn:turn.anyfirewall.com:443?transport=udp", username: "webrtc", credential: "webrtc" },
            ],
        });

        pc.onicecandidate = (e) => {
            if (e.candidate && remoteUserId) {
                socket.emit("iceCandidate", { to: remoteUserId, candidate: e.candidate });
            }
        };

        pc.ontrack = (e) => {
            if (remoteVideo.current) remoteVideo.current.srcObject = e.streams[0];
        };

        pcRef.current = pc;
        return pc;
    }

    async function startCall(mode: 'audio' | 'video' = 'video') {
        if (!remoteUserId) return;

        try {
            const pc = await createPeerConnection();
            const stream = await ensureLocalStream(mode);
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.emit("callUser", { userToCall: remoteUserId, signal: offer, from: localUserId, mode });
        } catch (err) {
            console.error("Ошибка при старте звонка:", err);
        }
    }

    async function acceptCall(mode: 'audio' | 'video' = 'video') {
        if (!incomingCall) return;

        ringtoneRef.current?.pause();
        ringtoneRef.current!.currentTime = 0;

        try {
            const pc = await createPeerConnection();
            const stream = await ensureLocalStream(mode);
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));

            for (const c of pendingCandidates.current) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(c));
                } catch (err) {
                    console.warn("Не удалось добавить ICE-кандидат:", err);
                }
            }
            pendingCandidates.current = [];

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit("answerCall", { to: incomingCall.from, signal: answer, mode });
            setIncomingCall(null);
        } catch (err) {
            console.error("Ошибка при принятии звонка:", err);
        }
    }

    function endCall() {
        if (pcRef.current) {
            try {
                pcRef.current.close();
            } catch (err) {
                console.warn("Ошибка при закрытии PeerConnection:", err);
            }
        }
        pcRef.current = null;

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        if (localVideo.current) localVideo.current.srcObject = null;
        if (remoteVideo.current) remoteVideo.current.srcObject = null;

        ringtoneRef.current?.pause();
        ringtoneRef.current!.currentTime = 0;

        if (remoteUserId) socket.emit("endCall", { to: remoteUserId });
    }

    useEffect(() => {
        socket.on("incomingCall", (data: IncomingCallData) => {
            if (data.from === localUserId) return;
            setIncomingCall(data);
            tryPlayRingtone();
        });

        socket.on("callAccepted", async (signal: RTCSessionDescriptionInit) => {
            try {
                if (!pcRef.current) await createPeerConnection();
                await pcRef.current!.setRemoteDescription(new RTCSessionDescription(signal));

                for (const c of pendingCandidates.current) {
                    try { await pcRef.current!.addIceCandidate(new RTCIceCandidate(c)); } catch (err) {
                        console.warn("Ошибка добавления ICE-кандидата после callAccepted:", err);
                    }
                }
                pendingCandidates.current = [];

                ringtoneRef.current?.pause();
                ringtoneRef.current!.currentTime = 0;
            } catch (err) {
                console.error("Ошибка при callAccepted:", err);
            }
        });

        socket.on("iceCandidate", async (candidate: RTCIceCandidateInit) => {
            try {
                if (pcRef.current && pcRef.current.remoteDescription?.type) {
                    await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } else {
                    pendingCandidates.current.push(candidate);
                }
            } catch (err) {
                console.warn("Ошибка добавления ICE-кандидата:", err);
            }
        });

        socket.on("callEnded", () => endCall());
        socket.on("callError", (err) => console.warn(err));

        return () => {
            socket.off("incomingCall");
            socket.off("callAccepted");
            socket.off("iceCandidate");
            socket.off("callEnded");
            socket.off("callError");
        };
    }, [socket, localUserId, remoteUserId]);

    const playRingtoneManually = () => {
        if (!canPlayRingtone) {
            ringtoneRef.current?.play().then(() => setCanPlayRingtone(true)).catch(console.warn);
        }
    };

    return { localVideo, remoteVideo, incomingCall, startCall, acceptCall, endCall, playRingtoneManually };
}



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
