import React, { useState, useEffect } from "react";

/**
 * ReactionOverlay — displays floating reactions/raise-hand indicators.
 * Reactions auto-fade after 3 seconds.
 */
const ReactionOverlay = ({ reactions }) => {
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none z-20">
      {reactions.map((reaction) => (
        <ReactionBubble key={reaction.id} reaction={reaction} />
      ))}
    </div>
  );
};

const ReactionBubble = ({ reaction }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const isHand = reaction.type === "✋";

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg animate-bounce-in border border-border ${
        isHand
          ? "bg-accent/10 text-accent font-medium"
          : "bg-surface text-ink"
      }`}
      style={{
        animation:
          "reactionFadeIn 0.3s ease-out, reactionFadeOut 0.5s ease-in 2.5s forwards",
      }}
    >
      <span className="text-xl">{reaction.type}</span>
      <span className="text-xs font-medium">{reaction.userName}</span>
    </div>
  );
};

export default ReactionOverlay;
