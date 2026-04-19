import React, { useEffect, useRef } from "react";
import { Video, VideoOff, Mic, MicOff, Loader2 } from "lucide-react";
import VideoPlayer from "./VideoPlayer";

/**
 * WaitingRoom — shown while waiting for the other participant.
 * Allows mic/camera preview + toggles before the call starts.
 */
const WaitingRoom = ({
  localStream,
  session,
  isHost,
  audioEnabled,
  videoEnabled,
  onToggleAudio,
  onToggleVideo,
  peerName,
  peerAvatar,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-ink p-6">
      {/* Session Info */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-display font-medium tracking-tight text-white mb-3">Getting Ready...</h1>
        <p className="text-surface/70 text-lg">
          Waiting for{" "}
          <span className="text-accent font-medium">
            {peerName || "your partner"}
          </span>{" "}
          to join
        </p>
        {session?.skillExchange && (
          <p className="text-surface/60 mt-4 text-sm bg-black/20 px-4 py-2 rounded-full inline-block">
            {session.skillExchange.hostSkill} ↔{" "}
            {session.skillExchange.partnerSkill}
          </p>
        )}
      </div>

      {/* Local Video Preview */}
      <div className="w-96 h-72 mb-8 rounded-3xl overflow-hidden shadow-2xl border-4 border-surface/10 bg-black">
        <VideoPlayer
          stream={localStream}
          muted={true}
          mirrored={true}
          label={isHost ? "You (Host)" : "You"}
          videoOff={!videoEnabled}
          userName="You"
        />
      </div>

      {/* Pre-call Controls */}
      <div className="flex items-center gap-4 mb-8 bg-surface/10 p-2 rounded-2xl backdrop-blur-md">
        <button
          onClick={onToggleAudio}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium transition-all duration-300 shadow-sm ${
            audioEnabled
              ? "bg-surface text-ink hover:bg-surface-2"
              : "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
          }`}
        >
          {audioEnabled ? (
            <Mic className="w-5 h-5" />
          ) : (
            <MicOff className="w-5 h-5" />
          )}
          <span>
            {audioEnabled ? "Mic On" : "Mic Off"}
          </span>
        </button>

        <button
          onClick={onToggleVideo}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium transition-all duration-300 shadow-sm ${
            videoEnabled
              ? "bg-surface text-ink hover:bg-surface-2"
              : "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
          }`}
        >
          {videoEnabled ? (
            <Video className="w-5 h-5" />
          ) : (
            <VideoOff className="w-5 h-5" />
          )}
          <span>
            {videoEnabled ? "Camera On" : "Camera Off"}
          </span>
        </button>
      </div>

      {/* Waiting Indicator */}
      <div className="flex items-center gap-3 text-surface/60 font-medium">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Waiting for partner to join...</span>
      </div>

      {/* Partner Info */}
      {peerName && (
        <div className="mt-8 flex items-center gap-4 bg-surface/10 rounded-2xl px-6 py-4 border border-white/10 backdrop-blur-md">
          {peerAvatar ? (
            <img
              src={peerAvatar.startsWith("http") ? peerAvatar : `${import.meta.env.VITE_API_URL}${peerAvatar}`}
              alt={peerName}
              className="w-12 h-12 rounded-full object-cover border-2 border-surface/20 shadow-sm"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
          ) : null}
          <div className={`w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white font-display font-bold shadow-sm ${peerAvatar ? "hidden" : ""}`}>
            {peerName[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-white font-semibold">{peerName}</p>
            <p className="text-surface/60 text-sm font-medium">Not yet joined</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitingRoom;
