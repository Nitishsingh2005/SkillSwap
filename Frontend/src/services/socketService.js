import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.currentSessionId = null;
    this.currentConversation = null;
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    this.socket = io(import.meta.env.VITE_API_URL || window.location.origin, {
      auth: {
        token: token,
      },
      extraHeaders: {
        "ngrok-skip-browser-warning": "true",
      },
      autoConnect: true,
    });

    this.socket.on("connect", () => {
      console.log("✅ Socket connected successfully:", this.socket.id);
      console.log("Socket connection details:", {
        id: this.socket.id,
        connected: this.socket.connected,
        transport: this.socket.io.engine.transport.name,
      });
      this.isConnected = true;

      // Automatically rejoin video room if reconnected
      if (this.currentSessionId) {
        console.log("🔄 Re-joining video room on reconnect:", this.currentSessionId);
        this.socket.emit("video:join_room", { sessionId: this.currentSessionId });
      }

      // Automatically rejoin text chat conversation if reconnected
      if (this.currentConversation) {
        console.log("🔄 Re-joining conversation on reconnect:", this.currentConversation.conversationId);
        this.socket.emit("join_conversation", this.currentConversation);
      }
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      console.error("Error details:", {
        message: error.message,
        description: error.description,
        context: error.context,
        type: error.type,
      });
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Join a conversation room
  joinConversation(conversationId, otherUserId) {
    this.currentConversation = { conversationId, otherUserId };
    if (this.socket && this.isConnected) {
      this.socket.emit("join_conversation", {
        conversationId,
        otherUserId,
      });
    }
  }

  // Leave conversation room
  leaveConversation() {
    this.currentConversation = null;
  }

  // Send a message
  sendMessage(receiverId, content, messageType = "text") {
    console.log("SocketService.sendMessage called:", {
      receiverId,
      content,
      messageType,
      isConnected: this.isConnected,
      hasSocket: !!this.socket,
    });

    if (this.socket && this.isConnected) {
      console.log("Emitting send_message event");
      this.socket.emit("send_message", {
        receiverId,
        content,
        messageType,
      });
    } else {
      console.error(
        "Cannot send message: Socket not connected or not available"
      );
    }
  }

  // Start typing indicator
  startTyping(receiverId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("typing_start", { receiverId });
    }
  }

  // Stop typing indicator
  stopTyping(receiverId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("typing_stop", { receiverId });
    }
  }

  // Listen for new messages
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on("new_message", callback);
    }
  }

  // Listen for message sent confirmation
  onMessageSent(callback) {
    if (this.socket) {
      this.socket.on("message_sent", callback);
    }
  }

  // Listen for typing indicators
  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on("user_typing", callback);
    }
  }

  // Listen for message errors
  onMessageError(callback) {
    if (this.socket) {
      this.socket.on("message_error", callback);
    }
  }

  // Listen for global online users
  onOnlineUsers(callback) {
    if (this.socket) {
      this.socket.on("online_users", callback);
    }
  }

  // Request the current online users list manually
  requestOnlineUsers() {
    if (this.socket && this.isConnected) {
      this.socket.emit("request_online_users");
    }
  }

  // Remove chat-specific listeners
  removeChatListeners() {
    if (this.socket) {
      this.socket.off("new_message");
      this.socket.off("message_sent");
      this.socket.off("user_typing");
      this.socket.off("message_error");
      this.socket.off("online_users");
    }
  }

  // Listen for real-time session updates from the partner
  onSessionUpdated(callback) {
    if (this.socket) {
      this.socket.off('session_updated'); // prevent duplicate listeners
      this.socket.on('session_updated', callback);
    }
  }

  // Listen for new session creation (partner booked a session with you)
  onSessionCreated(callback) {
    if (this.socket) {
      this.socket.off('session_created');
      this.socket.on('session_created', callback);
    }
  }

  // Remove session listeners
  removeSessionListeners() {
    if (this.socket) {
      this.socket.off('session_updated');
      this.socket.off('session_created');
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }

  // ─── Video Call Methods ────────────────────────────────────────

  // Join a video room
  joinVideoRoom(sessionId) {
    this.currentSessionId = sessionId;
    if (this.socket && this.isConnected) {
      this.socket.emit("video:join_room", { sessionId });
    }
  }

  // Leave a video room
  leaveVideoRoom(sessionId) {
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = null;
    }
    if (this.socket && this.isConnected) {
      this.socket.emit("video:leave_room", { sessionId });
    }
  }

  // Send WebRTC signal data
  sendSignal(sessionId, signalData) {
    if (this.socket && this.isConnected) {
      this.socket.emit("video:signal", { sessionId, signalData });
    }
  }

  // Send media state change (mic/camera toggle)
  sendMediaState(sessionId, { audio, video }) {
    if (this.socket && this.isConnected) {
      this.socket.emit("video:toggle_media", { sessionId, audio, video });
    }
  }

  // Send in-call chat message
  sendVideoChatMessage(sessionId, message) {
    if (this.socket && this.isConnected) {
      this.socket.emit("video:chat_message", { sessionId, message });
    }
  }

  // Send whiteboard draw data
  sendWhiteboardDraw(sessionId, strokeData) {
    if (this.socket && this.isConnected) {
      this.socket.emit("video:whiteboard_draw", { sessionId, strokeData });
    }
  }

  // Clear whiteboard
  clearWhiteboard(sessionId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("video:whiteboard_clear", { sessionId });
    }
  }

  // Send reaction (raise hand, emoji)
  sendReaction(sessionId, type) {
    if (this.socket && this.isConnected) {
      this.socket.emit("video:reaction", { sessionId, type });
    }
  }

  // Notify screen share started
  notifyScreenShareStarted(sessionId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("video:screen_share_started", { sessionId });
    }
  }

  // Notify screen share stopped
  notifyScreenShareStopped(sessionId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("video:screen_share_stopped", { sessionId });
    }
  }

  // ─── Video Call Listeners ──────────────────────────────────────

  onRoomJoined(callback) {
    if (this.socket) this.socket.on("video:room_joined", callback);
  }

  onPeerReady(callback) {
    if (this.socket) this.socket.on("video:peer_ready", callback);
  }

  onSignal(callback) {
    if (this.socket) this.socket.on("video:signal", callback);
  }

  onPeerLeft(callback) {
    if (this.socket) this.socket.on("video:peer_left", callback);
  }

  onMediaStateChanged(callback) {
    if (this.socket) this.socket.on("video:media_state_changed", callback);
  }

  onVideoChatMessage(callback) {
    if (this.socket) this.socket.on("video:chat_message", callback);
  }

  onWhiteboardDraw(callback) {
    if (this.socket) this.socket.on("video:whiteboard_draw", callback);
  }

  onWhiteboardClear(callback) {
    if (this.socket) this.socket.on("video:whiteboard_clear", callback);
  }

  onReaction(callback) {
    if (this.socket) this.socket.on("video:reaction", callback);
  }

  onVideoError(callback) {
    if (this.socket) this.socket.on("video:error", callback);
  }

  onCallInvitation(callback) {
    if (this.socket) this.socket.on("video:call_invitation", callback);
  }

  onScreenShareStarted(callback) {
    if (this.socket) this.socket.on("video:screen_share_started", callback);
  }

  onScreenShareStopped(callback) {
    if (this.socket) this.socket.on("video:screen_share_stopped", callback);
  }

  // Remove video-specific listeners
  removeVideoListeners() {
    if (this.socket) {
      const events = [
        "video:room_joined",
        "video:peer_ready",
        "video:signal",
        "video:peer_left",
        "video:media_state_changed",
        "video:chat_message",
        "video:whiteboard_draw",
        "video:whiteboard_clear",
        "video:reaction",
        "video:error",
        "video:call_invitation",
        "video:screen_share_started",
        "video:screen_share_stopped",
      ];
      events.forEach((event) => this.socket.off(event));
    }
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;
