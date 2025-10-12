import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    this.socket = io('http://localhost:5000', {
      auth: {
        token: token
      },
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected successfully:', this.socket.id);
      console.log('Socket connection details:', {
        id: this.socket.id,
        connected: this.socket.connected,
        transport: this.socket.io.engine.transport.name
      });
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      console.error('Error details:', {
        message: error.message,
        description: error.description,
        context: error.context,
        type: error.type
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
    if (this.socket && this.isConnected) {
      this.socket.emit('join_conversation', {
        conversationId,
        otherUserId
      });
    }
  }

  // Send a message
  sendMessage(receiverId, content, messageType = 'text') {
    console.log('SocketService.sendMessage called:', {
      receiverId,
      content,
      messageType,
      isConnected: this.isConnected,
      hasSocket: !!this.socket
    });
    
    if (this.socket && this.isConnected) {
      console.log('Emitting send_message event');
      this.socket.emit('send_message', {
        receiverId,
        content,
        messageType
      });
    } else {
      console.error('Cannot send message: Socket not connected or not available');
    }
  }

  // Start typing indicator
  startTyping(receiverId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_start', { receiverId });
    }
  }

  // Stop typing indicator
  stopTyping(receiverId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_stop', { receiverId });
    }
  }

  // Listen for new messages
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  // Listen for message sent confirmation
  onMessageSent(callback) {
    if (this.socket) {
      this.socket.on('message_sent', callback);
    }
  }

  // Listen for typing indicators
  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  // Listen for message errors
  onMessageError(callback) {
    if (this.socket) {
      this.socket.on('message_error', callback);
    }
  }

  // Remove all listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;
