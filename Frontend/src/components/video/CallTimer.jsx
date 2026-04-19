import React, { useState, useEffect, useRef } from "react";

/**
 * CallTimer — displays elapsed call time (MM:SS) since call started.
 */
const CallTimer = ({ startTime }) => {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!startTime) return;

    const updateElapsed = () => {
      const now = Date.now();
      const start =
        startTime instanceof Date
          ? startTime.getTime()
          : new Date(startTime).getTime();
      setElapsed(Math.floor((now - start) / 1000));
    };

    updateElapsed();
    intervalRef.current = setInterval(updateElapsed, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTime]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(
        2,
        "0"
      )}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (!startTime) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
      <span className="text-white text-sm font-mono tracking-wider">
        {formatTime(elapsed)}
      </span>
    </div>
  );
};

export default CallTimer;
