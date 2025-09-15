import { useEffect, useRef, useState } from "react";
import { useSocket } from "../../../shared";

export function useWebRTC(localUserId: string, remoteUserId?: string) {
    const socket = useSocket();
    const localVideo = useRef<HTMLVideoElement>(null);
    const remoteVideo = useRef<HTMLVideoElement>(null);
    const peerRef = useRef<RTCPeerConnection | null>(null);
    const [incomingCall, setIncomingCall] = useState<{ from: string; signal: any } | null>(null);

    useEffect(() => {
        socket.on("incomingCall", ({ from, signal }) => {
            setIncomingCall({ from, signal });
        });

        socket.on("callAccepted", async ({ signal }) => {
            await peerRef.current?.setRemoteDescription(new RTCSessionDescription(signal));
        });

        socket.on("iceCandidate", async ({ candidate }) => {
            try {
                await peerRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
                console.error("Error adding ICE candidate", err);
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
    }, [socket]);

    async function startCall() {
        if (!remoteUserId) return;
        peerRef.current = new RTCPeerConnection();

        peerRef.current.onicecandidate = (event) => {
            if (event.candidate && remoteUserId) {
                socket.emit("iceCandidate", { to: remoteUserId, candidate: event.candidate });
            }
        };

        peerRef.current.ontrack = (event) => {
            if (remoteVideo.current) {
                remoteVideo.current.srcObject = event.streams[0];
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localVideo.current) localVideo.current.srcObject = stream;
        stream.getTracks().forEach(track => peerRef.current?.addTrack(track, stream));

        const offer = await peerRef.current.createOffer();
        await peerRef.current.setLocalDescription(offer);

        socket.emit("callUser", {
            userToCall: remoteUserId,
            signal: offer,
            from: localUserId,
            name: "Caller",
        });
    }

    async function acceptCall() {
        if (!incomingCall) return;

        peerRef.current = new RTCPeerConnection();

        peerRef.current.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("iceCandidate", { to: incomingCall.from, candidate: event.candidate });
            }
        };

        peerRef.current.ontrack = (event) => {
            if (remoteVideo.current) {
                remoteVideo.current.srcObject = event.streams[0];
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localVideo.current) localVideo.current.srcObject = stream;
        stream.getTracks().forEach(track => peerRef.current?.addTrack(track, stream));

        await peerRef.current.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));

        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);

        socket.emit("answerCall", { to: incomingCall.from, signal: answer });
        setIncomingCall(null);
    }

    function endCall() {
        if (peerRef.current) {
            peerRef.current.getSenders().forEach((sender) => sender.track?.stop());
            peerRef.current.close();
            peerRef.current = null;
        }
        if (localVideo.current?.srcObject) {
            (localVideo.current.srcObject as MediaStream)
                .getTracks()
                .forEach((track) => track.stop());
            localVideo.current.srcObject = null;
        }
        if (remoteVideo.current) {
            remoteVideo.current.srcObject = null;
        }
        if (remoteUserId) {
            socket.emit("endCall", { to: remoteUserId });
        }
    }

    return { localVideo, remoteVideo, incomingCall, startCall, acceptCall, endCall };
}

