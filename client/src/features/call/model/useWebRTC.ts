// useWebRTC.ts
import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

export function useWebRTC(socket: Socket, localUserId: string, remoteUserId?: string) {
    const localVideo = useRef<HTMLVideoElement | null>(null);
    const remoteVideo = useRef<HTMLVideoElement | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const [incomingCall, setIncomingCall] = useState<{ from: string; signal: any } | null>(null);
    const candidateBufferRef = useRef<any[]>([]);
    const currentRemoteIdRef = useRef<string | null>(null);

    // helper: create pc targeted to 'toId' (toId overrides remoteUserId)
    async function createPeerConnection(toId?: string) {
        // reuse if exists
        if (pcRef.current) return pcRef.current;

        const pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                const target = toId || currentRemoteIdRef.current || remoteUserId;
                if (target) {
                    socket.emit("iceCandidate", { to: target, candidate: event.candidate });
                    // debug
                    // console.log('[client] emit iceCandidate to', target, event.candidate);
                }
            }
        };

        pc.ontrack = (e) => {
            if (remoteVideo.current) {
                remoteVideo.current.srcObject = e.streams[0];
            }
        };

        // get or reuse local stream
        if (!localStreamRef.current) {
            try {
                localStreamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            } catch (err) {
                console.error("getUserMedia failed", err);
                throw err;
            }
        }

        if (localVideo.current && localStreamRef.current) {
            localVideo.current.srcObject = localStreamRef.current;
        }

        // add tracks
        localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current as MediaStream));

        pcRef.current = pc;

        // flush buffered candidates if any
        if (candidateBufferRef.current.length > 0) {
            candidateBufferRef.current.forEach(async (c) => {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(c));
                } catch (e) {
                    console.warn("addIceCandidate (buffered) failed", e);
                }
            });
            candidateBufferRef.current = [];
        }

        return pc;
    }

    async function startCall() {
        if (!remoteUserId) {
            console.warn("startCall: no remoteUserId");
            return;
        }
        currentRemoteIdRef.current = remoteUserId;

        const pc = await createPeerConnection(remoteUserId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("callUser", { userToCall: remoteUserId, signal: offer, from: localUserId });
        // console.log('[client] callUser emitted', remoteUserId);
    }

    async function acceptCall() {
        if (!incomingCall) return;
        const callerId = incomingCall.from;
        currentRemoteIdRef.current = callerId;

        const pc = await createPeerConnection(callerId);
        // set remote (offer)
        await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("answerCall", { to: callerId, signal: answer });
        setIncomingCall(null);
    }

    function endCall() {
        // close pc and stop local tracks (optionally)
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }

        if (remoteVideo.current) {
            remoteVideo.current.srcObject = null;
        }

        // don't stop local stream completely if you want to keep cam on; if you want to stop:
        // localStreamRef.current?.getTracks().forEach(t => t.stop());
        const target = currentRemoteIdRef.current || remoteUserId;
        if (target) {
            socket.emit("endCall", { to: target });
        }

        currentRemoteIdRef.current = null;
        candidateBufferRef.current = [];
    }

    useEffect(() => {
        // incoming call (someone called you)
        const onIncoming = (data: { from: string; signal: any; name?: string }) => {
            // show caller info
            setIncomingCall({ from: data.from, signal: data.signal });
            // store caller id so we can answer and send candidates
            // currentRemoteIdRef.current = data.from; // set only on accept to avoid confusion
        };

        const onCallAccepted = async (signal: any) => {
            // remote accepted our offer -> set remote desc
            const pc = pcRef.current;
            if (pc) {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(signal));
                } catch (e) {
                    console.error("setRemoteDescription failed on callAccepted", e);
                }
            } else {
                console.warn("callAccepted but no peerConnection yet");
            }
        };

        const onIce = async (candidate: any) => {
            const pc = pcRef.current;
            if (pc) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.warn("addIceCandidate failed", e);
                }
            } else {
                // buffer until pc created
                candidateBufferRef.current.push(candidate);
            }
        };

        const onCallEnded = () => {
            // remote ended: cleanup
            if (pcRef.current) {
                pcRef.current.close();
                pcRef.current = null;
            }
            if (remoteVideo.current) remoteVideo.current.srcObject = null;
            setIncomingCall(null);
            currentRemoteIdRef.current = null;
            candidateBufferRef.current = [];
        };

        socket.on("incomingCall", onIncoming);
        socket.on("callAccepted", onCallAccepted);
        socket.on("iceCandidate", onIce);
        socket.on("callEnded", onCallEnded);

        return () => {
            socket.off("incomingCall", onIncoming);
            socket.off("callAccepted", onCallAccepted);
            socket.off("iceCandidate", onIce);
            socket.off("callEnded", onCallEnded);
        };
    }, [socket]); // don't include peerConnection in deps — we use refs

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
