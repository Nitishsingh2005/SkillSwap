import React, { useEffect, useRef } from "react";

/**
 * VideoPlayer — renders a <video> element bound to a MediaStream.
 * Props:
 *   stream       - MediaStream to display
 *   muted        - true for local video (avoid echo)
 *   mirrored     - true for local camera (flip horizontally)
 *   label        - overlay name label
 *   isSmall      - PiP style (small corner video)
 *   audioOff     - show mic-off indicator
 *   videoOff     - show camera-off indicator / avatar
 *   avatar       - user avatar URL (shown when video off)
 *   userName     - user's name
 */
const VideoPlayer = ({
  stream,
  muted = false,
  mirrored = false,
  label = "",
  isSmall = false,
  audioOff = false,
  videoOff = false,
  avatar = "",
  userName = "",
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !stream) return;

    videoEl.srcObject = stream;

    // Force play in case autoplay is blocked
    const tryPlay = () => {
      videoEl.play().catch(() => {
        // Autoplay blocked — user interaction needed, silently ignore
      });
    };

    // Handle tracks added dynamically (WebRTC can add tracks after stream is set)
    const onTrackAdded = () => {
      console.log("📹 Track added to stream, re-attaching");
      videoEl.srcObject = stream;
      tryPlay();
    };

    stream.addEventListener("addtrack", onTrackAdded);
    tryPlay();

    return () => {
      stream.removeEventListener("addtrack", onTrackAdded);
    };
  }, [stream]);

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gray-800 ${
        isSmall
          ? "w-48 h-36 shadow-lg border-2 border-gray-600"
          : "w-full h-full"
      }`}
    >
      {/* Video element - keep mounted for audio, hide visually when off */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`w-full h-full object-cover ${
          mirrored ? "scale-x-[-1]" : ""
        } ${videoOff || !stream ? "hidden" : "block"}`}
      />

      {/* Avatar placeholder when video is off */}
      {(videoOff || !stream) && (
        <div className="w-full h-full flex items-center justify-center bg-gray-700">
          {avatar ? (
            <img
              src={avatar}
              alt={userName}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white text-2xl font-bold">
              {initials}
            </div>
          )}
        </div>
      )}

      {/* Name label */}
      {label && (
        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md flex items-center gap-1.5">
          {audioOff && (
            <svg
              className="w-3 h-3 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
              />
            </svg>
          )}
          <span>{label}</span>
        </div>
      )}

      {/* Video off indicator */}
      {videoOff && (
        <div className="absolute top-2 right-2 bg-red-500/80 text-white text-xs px-2 py-1 rounded-md">
          Camera Off
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
