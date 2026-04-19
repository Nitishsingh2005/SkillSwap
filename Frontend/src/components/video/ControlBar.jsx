import React from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  PenTool,
  Hand,
  PhoneOff,
  Smile,
} from "lucide-react";

/**
 * ControlBar — bottom control strip for the video call.
 */
const ControlBar = ({
  audioEnabled,
  videoEnabled,
  isScreenSharing,
  isChatOpen,
  isWhiteboardOpen,
  handRaised,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onToggleWhiteboard,
  onRaiseHand,
  onReaction,
  onEndCall,
}) => {
  const ControlButton = ({ onClick, active, danger, children, tooltip }) => (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`p-3.5 rounded-full transition-all duration-300 shadow-sm hover:shadow-md ${
          danger
            ? "bg-red-500 hover:bg-red-600 text-white"
            : active
            ? "bg-surface/20 hover:bg-surface/30 text-white backdrop-blur-sm"
            : "bg-surface text-ink hover:bg-surface-2"
        }`}
      >
        {children}
      </button>
      {tooltip && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-ink text-surface text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          {tooltip}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 py-4 px-6 md:px-8 bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-2xl">
      {/* Mic */}
      <ControlButton
        onClick={onToggleAudio}
        active={audioEnabled}
        tooltip={audioEnabled ? "Mute" : "Unmute"}
      >
        {audioEnabled ? (
          <Mic className="w-5 h-5" />
        ) : (
          <MicOff className="w-5 h-5 text-red-400" />
        )}
      </ControlButton>

      {/* Camera */}
      <ControlButton
        onClick={onToggleVideo}
        active={videoEnabled}
        tooltip={videoEnabled ? "Stop Camera" : "Start Camera"}
      >
        {videoEnabled ? (
          <Video className="w-5 h-5" />
        ) : (
          <VideoOff className="w-5 h-5 text-red-400" />
        )}
      </ControlButton>

      {/* Screen Share */}
      <ControlButton
        onClick={onToggleScreenShare}
        active={isScreenSharing}
        tooltip={isScreenSharing ? "Stop Sharing" : "Share Screen"}
      >
        {isScreenSharing ? (
          <MonitorOff className="w-5 h-5 text-accent" />
        ) : (
          <Monitor className="w-5 h-5" />
        )}
      </ControlButton>

      <div className="w-px h-10 bg-white/20 mx-1 md:mx-2 rounded-full" />

      {/* Chat */}
      <ControlButton onClick={onToggleChat} active={isChatOpen} tooltip="Chat">
        <MessageSquare className="w-5 h-5" />
      </ControlButton>

      {/* Whiteboard */}
      <ControlButton
        onClick={onToggleWhiteboard}
        active={isWhiteboardOpen}
        tooltip="Whiteboard"
      >
        <PenTool className="w-5 h-5" />
      </ControlButton>

      {/* Raise Hand */}
      <ControlButton
        onClick={onRaiseHand}
        active={handRaised}
        tooltip={handRaised ? "Lower Hand" : "Raise Hand"}
      >
        <Hand className={`w-5 h-5 ${handRaised ? "text-accent fill-current" : ""}`} />
      </ControlButton>

      {/* Reactions */}
      <div className="relative group">
        <button className="p-3.5 rounded-full bg-surface text-ink hover:bg-surface-2 transition-all duration-300 shadow-sm hover:shadow-md">
          <Smile className="w-5 h-5" />
        </button>
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 hidden group-hover:flex gap-2 bg-surface rounded-2xl p-2.5 shadow-xl border border-border pb-3">
          {["👍", "❤️", "😂", "🎉", "🤔"].map((emoji) => (
            <button
              key={emoji}
              onClick={() => onReaction(emoji)}
              className="text-2xl hover:scale-125 transition-transform px-1 origin-bottom"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-10 bg-white/20 mx-1 md:mx-2 rounded-full" />

      {/* End Call */}
      <ControlButton onClick={onEndCall} danger tooltip="End Call">
        <PhoneOff className="w-5 h-5" />
      </ControlButton>
    </div>
  );
};

export default ControlBar;
