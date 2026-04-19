import React, { useState, useRef, useEffect } from "react";
import { Send, X, Paperclip, FileText } from "lucide-react";
import { messagesAPI } from "../../services/api";

/**
 * InCallChat — side panel for in-call text chat.
 * Fix #6: messages are now persisted to the database via POST /api/messages/send
 * and history is loaded on mount via GET /api/messages/with/:partnerId
 */
const InCallChat = ({ messages, onSendMessage, onClose, currentUserId, partnerId }) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [localMessages, setLocalMessages] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Load chat history from DB when chat opens
  useEffect(() => {
    if (!partnerId || historyLoaded) return;
    messagesAPI.getMessagesByUser(partnerId)
      .then((res) => {
        if (res.messages) {
          // Convert DB message format to InCallChat format
          const prior = res.messages.map((m) => ({
            id: m._id,
            content: m.content,
            messageType: m.messageType || "text",
            senderId: typeof m.senderId === "object" ? m.senderId._id : m.senderId,
            senderName: typeof m.senderId === "object" ? m.senderId.name : "User",
            timestamp: m.createdAt || m.timestamp,
          }));
          setLocalMessages(prior);
        }
      })
      .catch((err) => console.warn("InCallChat: could not load message history:", err))
      .finally(() => setHistoryLoaded(true));
  }, [partnerId, historyLoaded]);

  // Merge local history with live messages passed in from VideoCall via socket
  const allMessages = React.useMemo(() => {
    const seenIds = new Set(localMessages.map((m) => m.id));
    const newLive = messages.filter((m) => !seenIds.has(m.id));
    return [...localMessages, ...newLive];
  }, [localMessages, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");

    const msgObj = {
      id: "temp_" + Date.now().toString(),
      content: text,
      messageType: "text",
      senderId: currentUserId,
      senderName: "Me",
      timestamp: new Date().toISOString()
    };

    // Send via socket (for real-time delivery to the peer)
    onSendMessage(msgObj);

    // Persist to DB if we have partnerId
    if (partnerId) {
      try {
        await messagesAPI.sendDirectMessage(partnerId, text, "text");
      } catch (err) {
        console.warn("InCallChat: failed to persist message:", err);
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !partnerId) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size should be less than 10MB");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await messagesAPI.uploadFile(formData);

      if (response && response.fileUrl) {
        const msgObj = {
          id: "temp_" + Date.now().toString(),
          content: response.fileUrl,
          messageType: response.messageType,
          senderId: currentUserId,
          senderName: "Me",
          timestamp: new Date().toISOString()
        };
        onSendMessage(msgObj);
        await messagesAPI.sendDirectMessage(partnerId, response.fileUrl, response.messageType);
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col h-full h-full bg-surface shadow-inner">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {allMessages.length === 0 ? (
          <p className="text-ink-muted text-center text-sm font-medium mt-8">
            No messages yet. Say something!
          </p>
        ) : (
          allMessages.map((msg, idx) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id || idx}
                className={`flex flex-col ${
                  isMe ? "items-end" : "items-start"
                }`}
              >
                {!isMe && (
                  <span className="text-xs text-ink-muted mb-1 font-medium ml-1">
                    {msg.senderName}
                  </span>
                )}
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl shadow-sm leading-relaxed ${
                    isMe
                      ? "bg-accent text-white rounded-br-sm"
                      : "bg-surface-2 border border-border text-ink rounded-bl-sm"
                  }`}
                >
                  {msg.messageType === 'image' ? (
                    <img src={msg.content} alt="Attachment" className="max-w-full rounded-lg" />
                  ) : msg.messageType === 'video' ? (
                    <video src={msg.content} controls className="max-w-full rounded-lg" />
                  ) : msg.messageType === 'file' ? (
                    <a href={msg.content} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                      <FileText className="w-4 h-4" />
                      <span>Document</span>
                    </a>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                <span className="text-[10px] text-ink-muted mt-1 font-medium mx-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="p-4 border-t border-border bg-surface"
      >
        <div className="flex items-center gap-2">
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,video/*,.pdf,.doc,.docx"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2.5 text-ink-muted hover:text-ink hover:bg-surface-2 rounded-xl transition-all disabled:opacity-50 flex-shrink-0"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all duration-300"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2.5 bg-ink hover:bg-black disabled:bg-surface-2 disabled:text-ink-muted text-surface disabled:cursor-not-allowed rounded-xl transition-all shadow-sm transform hover:scale-105 disabled:transform-none"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default InCallChat;
