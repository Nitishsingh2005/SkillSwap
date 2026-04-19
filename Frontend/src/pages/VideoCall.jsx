import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { sessionsAPI } from "../services/api";
import socketService from "../services/socketService";
import WebRTCService from "../services/webrtcService";
import VideoPlayer from "../components/video/VideoPlayer";
import ControlBar from "../components/video/ControlBar";
import WaitingRoom from "../components/video/WaitingRoom";
import InCallChat from "../components/video/InCallChat";
import Whiteboard from "../components/video/Whiteboard";
import ReactionOverlay from "../components/video/ReactionOverlay";
import CallTimer from "../components/video/CallTimer";
import { AlertTriangle, ArrowLeft } from "lucide-react";

const VideoCall = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { state } = useApp();

  // Refs
  const webrtcRef = useRef(null);
  const hasJoined = useRef(false);

  // Session state
  const [session, setSession] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Call state
  const [callStatus, setCallStatus] = useState("initializing"); // initializing | waiting | connecting | connected | ended | error
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStartTime, setCallStartTime] = useState(null);

  // Media toggles
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Peer media state
  const [peerAudioOff, setPeerAudioOff] = useState(false);
  const [peerVideoOff, setPeerVideoOff] = useState(false);
  const [peerScreenSharing, setPeerScreenSharing] = useState(false);

  // Peer info
  const [peerInfo, setPeerInfo] = useState({ name: "", avatar: "" });

  // UI panels
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [remoteStroke, setRemoteStroke] = useState(null);

  // Reactions
  const [reactions, setReactions] = useState([]);
  const [handRaised, setHandRaised] = useState(false);
  const reactionIdRef = useRef(0);
  const strokeIdRef = useRef(0);

  // ICE servers config
  const [iceServers, setIceServers] = useState([]);

  // ── Step 1: Initialize — fetch session, get ICE config, setup local media ──
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        setLoading(true);

        // Ensure socket is connected
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Not authenticated. Please log in.");
          setLoading(false);
          return;
        }
        socketService.connect(token);

        // Fetch session join info
        const joinData = await sessionsAPI.joinSession(sessionId);
        if (cancelled) return;

        setSession(joinData.session);
        setIsHost(joinData.isHost);

        // Determine peer info
        const peer = joinData.isHost
          ? joinData.session.partnerId
          : joinData.session.hostId;
        setPeerInfo({
          name: peer?.name || "Partner",
          avatar: peer?.avatar || "",
        });

        // Fetch ICE config
        try {
          const iceData = await sessionsAPI.getIceConfig(sessionId);
          if (!cancelled) setIceServers(iceData.iceServers || []);
        } catch {
          // Use defaults
          setIceServers([
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ]);
        }

        // Initialize WebRTC service + local media
        webrtcRef.current = new WebRTCService();
        const stream = await webrtcRef.current.initLocalStream(true, true);
        if (cancelled) return;

        setLocalStream(stream);
        setVideoEnabled(
          stream.getVideoTracks().length > 0 &&
            stream.getVideoTracks()[0].enabled
        );
        setAudioEnabled(
          stream.getAudioTracks().length > 0 &&
            stream.getAudioTracks()[0].enabled
        );
        setCallStatus("waiting");
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.error("Video call init error:", err);
          setError(err.message || "Failed to initialize video call");
          setLoading(false);
        }
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // ── Step 2: Register socket listeners + join room ──
  useEffect(() => {
    if (callStatus !== "waiting") return;
    // Reset hasJoined on each effect run (fixes React StrictMode double-mount)
    hasJoined.current = true;

    const registerListeners = () => {
      // Room joined — server confirms we're in
      socketService.onRoomJoined((data) => {
        console.log("📹 Room joined:", data);
        if (data.peerPresent) {
          setCallStatus("connecting");
        }
      });

      // Peer ready — both in room, initiate WebRTC
      socketService.onPeerReady((data) => {
        console.log("📹 Peer ready, initiator:", data.isInitiator);
        setPeerInfo({
          name: data.peer?.name || "Partner",
          avatar: data.peer?.avatar || "",
        });
        setCallStatus("connecting");
        startPeerConnection(data.isInitiator);
      });

      // Receive WebRTC signal — buffer-aware
      socketService.onSignal((data) => {
        console.log("📹 Signal received, peer exists:", !!webrtcRef.current?.peer);
        if (webrtcRef.current) {
          webrtcRef.current.signal(data.signalData);
        }
      });

      // Peer left
      socketService.onPeerLeft(() => {
        console.log("📹 Peer left the call");
        setRemoteStream(null);
        setCallStatus("ended");
      });

      // Peer media state
      socketService.onMediaStateChanged((data) => {
        setPeerAudioOff(!data.audio);
        setPeerVideoOff(!data.video);
      });

      // In-call chat
      socketService.onVideoChatMessage((data) => {
        setChatMessages((prev) => [...prev, data.message]);
      });

      // Whiteboard
      socketService.onWhiteboardDraw((data) => {
        setRemoteStroke({ ...data.strokeData, _id: ++strokeIdRef.current });
      });

      socketService.onWhiteboardClear(() => {
        setRemoteStroke({ clear: true, _id: ++strokeIdRef.current });
      });

      // Reactions
      socketService.onReaction((data) => {
        const id = ++reactionIdRef.current;
        setReactions((prev) => [...prev, { id, ...data }]);
        setTimeout(() => {
          setReactions((prev) => prev.filter((r) => r.id !== id));
        }, 3500);
      });

      // Screen share notifications
      socketService.onScreenShareStarted(() => setPeerScreenSharing(true));
      socketService.onScreenShareStopped(() => setPeerScreenSharing(false));

      // Errors
      socketService.onVideoError((data) => {
        console.error("📹 Video error:", data.message);
        setError(data.message);
      });
    };

    // Clean previous listeners before re-registering (StrictMode safety)
    socketService.removeVideoListeners();
    registerListeners();

    // Join the video room
    socketService.joinVideoRoom(sessionId);
  }, [callStatus, sessionId]);

  // ── Start Peer Connection ──
  const startPeerConnection = useCallback(
    (isInitiator) => {
      if (!webrtcRef.current) return;

      const webrtc = webrtcRef.current;

      // On signal → send to peer via server
      webrtc.onSignal = (signalData) => {
        socketService.sendSignal(sessionId, signalData);
      };

      // Remote stream received
      webrtc.onRemoteStream = (stream) => {
        console.log("📹 Remote stream set");
        setRemoteStream(stream);
        setCallStatus("connected");
        setCallStartTime(new Date());
      };

      // Peer closed
      webrtc.onClose = () => {
        setRemoteStream(null);
        setCallStatus("ended");
      };

      // Error
      webrtc.onError = (err) => {
        console.error("📹 WebRTC error:", err);
        if (callStatus === "connecting") {
          setError("Failed to connect. Please try again.");
        }
      };

      // Create the peer
      webrtc.createPeer(isInitiator, iceServers);
    },
    [sessionId, iceServers, callStatus]
  );

  // ── Media Controls ──
  const handleToggleAudio = () => {
    if (webrtcRef.current) {
      const newState = webrtcRef.current.toggleAudio();
      setAudioEnabled(newState);
      socketService.sendMediaState(sessionId, {
        audio: newState,
        video: videoEnabled,
      });
    }
  };

  const handleToggleVideo = () => {
    if (webrtcRef.current) {
      const newState = webrtcRef.current.toggleVideo();
      setVideoEnabled(newState);
      socketService.sendMediaState(sessionId, {
        audio: audioEnabled,
        video: newState,
      });
    }
  };

  const handleToggleScreenShare = async () => {
    if (!webrtcRef.current) return;
    try {
      if (isScreenSharing) {
        webrtcRef.current.stopScreenShare();
        setIsScreenSharing(false);
        socketService.notifyScreenShareStopped(sessionId);
      } else {
        await webrtcRef.current.startScreenShare();
        setIsScreenSharing(true);
        socketService.notifyScreenShareStarted(sessionId);

        // Listen for browser stop
        const screenTrack = webrtcRef.current.screenStream?.getVideoTracks()[0];
        if (screenTrack) {
          screenTrack.onended = () => {
            if (webrtcRef.current) {
              webrtcRef.current.stopScreenShare();
            }
            setIsScreenSharing(false);
            socketService.notifyScreenShareStopped(sessionId);
          };
        }
      }
    } catch (err) {
      console.error("Screen share error:", err);
    }
  };

  // ── Chat ──
  const handleSendChatMessage = (message) => {
    socketService.sendVideoChatMessage(sessionId, message);
  };

  // ── Whiteboard ──
  const handleWhiteboardDraw = (strokeData) => {
    socketService.sendWhiteboardDraw(sessionId, strokeData);
  };

  const handleWhiteboardClear = () => {
    socketService.clearWhiteboard(sessionId);
  };

  // ── Reactions ──
  const handleRaiseHand = () => {
    const newState = !handRaised;
    setHandRaised(newState);
    if (newState) {
      socketService.sendReaction(sessionId, "✋");
    }
  };

  const handleReaction = (emoji) => {
    socketService.sendReaction(sessionId, emoji);
  };

  // ── End Call ──
  const handleEndCall = async () => {
    // Cleanup WebRTC
    if (webrtcRef.current) {
      webrtcRef.current.destroy();
      webrtcRef.current = null;
    }

    // Leave socket room
    socketService.leaveVideoRoom(sessionId);
    socketService.removeVideoListeners();

    // End call on server
    try {
      await sessionsAPI.endCall(sessionId);
    } catch (err) {
      console.error("End call API error:", err);
    }

    setCallStatus("ended");
    setRemoteStream(null);
    setLocalStream(null);
  };

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      if (webrtcRef.current) {
        webrtcRef.current.destroy();
      }
      socketService.leaveVideoRoom(sessionId);
      socketService.removeVideoListeners();
    };
  }, [sessionId]);

  // ── Loading State ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-lg">Setting up your video call...</p>
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-6">
        <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">
          Unable to Join Call
        </h2>
        <p className="text-gray-400 text-center mb-6 max-w-md">{error}</p>
        <button
          onClick={() => navigate("/booking")}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sessions
        </button>
      </div>
    );
  }

  // ── Call Ended ──
  if (callStatus === "ended") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-6">
        <div className="bg-gray-800 rounded-2xl p-8 text-center max-w-md border border-gray-700">
          <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-cyan-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Call Ended</h2>
          <p className="text-gray-400 mb-2">
            Session with <span className="text-cyan-400">{peerInfo.name}</span>
          </p>
          {session?.skillExchange && (
            <p className="text-gray-500 text-sm mb-6">
              {session.skillExchange.hostSkill} ↔{" "}
              {session.skillExchange.partnerSkill}
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/reviews")}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-6 py-3 rounded-lg transition-all"
            >
              Leave Review
            </button>
            <button
              onClick={() => navigate("/booking")}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Back to Sessions
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Waiting Room ──
  if (callStatus === "waiting") {
    return (
      <WaitingRoom
        localStream={localStream}
        session={session}
        isHost={isHost}
        audioEnabled={audioEnabled}
        videoEnabled={videoEnabled}
        onToggleAudio={handleToggleAudio}
        onToggleVideo={handleToggleVideo}
        peerName={peerInfo.name}
        peerAvatar={peerInfo.avatar}
      />
    );
  }

  // ── Active / Connecting Call ──
  const currentUserId = state.currentUser?._id || state.currentUser?.id;

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Top bar */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CallTimer startTime={callStartTime} />
            {peerScreenSharing && (
              <div className="bg-blue-500/80 text-white text-xs px-3 py-1.5 rounded-lg">
                Partner is sharing screen
              </div>
            )}
            {callStatus === "connecting" && (
              <div className="bg-yellow-500/80 text-yellow-900 text-xs px-3 py-1.5 rounded-lg animate-pulse">
                Connecting...
              </div>
            )}
          </div>
          <div className="text-gray-400 text-sm">
            {session?.skillExchange?.hostSkill} ↔{" "}
            {session?.skillExchange?.partnerSkill}
          </div>
        </div>

        {/* Reactions overlay */}
        <ReactionOverlay reactions={reactions} />

        {/* Video grid */}
        <div className="flex-1 flex items-center justify-center p-4 pt-16 pb-24">
          {/* Remote video (large) */}
          <div className="w-full h-full max-w-5xl">
            <VideoPlayer
              stream={remoteStream}
              label={peerInfo.name}
              audioOff={peerAudioOff}
              videoOff={(peerVideoOff && !peerScreenSharing) || !remoteStream}
              avatar={peerInfo.avatar}
              userName={peerInfo.name}
            />
          </div>

          {/* Local video (PiP) */}
          <div className="absolute bottom-28 right-6 z-10">
            <VideoPlayer
              stream={localStream}
              muted={true}
              mirrored={true}
              isSmall={true}
              label="You"
              videoOff={!videoEnabled}
              audioOff={!audioEnabled}
              userName="You"
            />
          </div>
        </div>

        {/* Control Bar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <ControlBar
            audioEnabled={audioEnabled}
            videoEnabled={videoEnabled}
            isScreenSharing={isScreenSharing}
            isChatOpen={isChatOpen}
            isWhiteboardOpen={isWhiteboardOpen}
            handRaised={handRaised}
            onToggleAudio={handleToggleAudio}
            onToggleVideo={handleToggleVideo}
            onToggleScreenShare={handleToggleScreenShare}
            onToggleChat={() => {
              setIsChatOpen(!isChatOpen);
              setIsWhiteboardOpen(false);
            }}
            onToggleWhiteboard={() => {
              setIsWhiteboardOpen(!isWhiteboardOpen);
              setIsChatOpen(false);
            }}
            onRaiseHand={handleRaiseHand}
            onReaction={handleReaction}
            onEndCall={handleEndCall}
          />
        </div>
      </div>

      {/* Side Panel — Chat or Whiteboard */}
      {(isChatOpen || isWhiteboardOpen) && (
        <div className="w-80 h-full border-l border-gray-700 flex-shrink-0">
          {isChatOpen && (
            <InCallChat
              messages={chatMessages}
              onSendMessage={handleSendChatMessage}
              onClose={() => setIsChatOpen(false)}
              currentUserId={currentUserId}
              partnerId={
                session
                  ? (isHost
                      ? session.partnerId?._id || session.partnerId
                      : session.hostId?._id || session.hostId)
                  : undefined
              }
            />
          )}
          {isWhiteboardOpen && (
            <Whiteboard
              onDraw={handleWhiteboardDraw}
              onClear={handleWhiteboardClear}
              remoteStroke={remoteStroke}
              onClose={() => setIsWhiteboardOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default VideoCall;
