import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import socketService from "../services/socketService";
import { messagesAPI, friendRequestAPI, sessionsAPI, usersAPI } from "../services/api";
import {
  Send,
  User,
  Phone,
  Video,
  MoreVertical,
  Search,
  Clock,
  MessageCircle,
  Paperclip,
  Smile,
  ArrowLeft,
  Trash2,
  Ban,
  Flag,
  UserX,
  X,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";

const Chat = () => {
  const { state, dispatch } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarDropdownOpen, setIsSidebarDropdownOpen] = useState(false);
  const [isBlockedUsersModalOpen, setIsBlockedUsersModalOpen] = useState(false);
  const [blockedUsersList, setBlockedUsersList] = useState([]);
  const [isLoadingBlockedUsers, setIsLoadingBlockedUsers] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const dropdownRef = useRef(null);
  const sidebarDropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (sidebarDropdownRef.current && !sidebarDropdownRef.current.contains(event.target)) {
        setIsSidebarDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      setIsLoadingBlockedUsers(true);
      const data = await usersAPI.getBlockedUsers();
      setBlockedUsersList(data.blockedUsers || []);
    } catch (error) {
      console.error("Failed to fetch blocked users:", error);
    } finally {
      setIsLoadingBlockedUsers(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages, selectedUserId]);

  // Handle URL parameter for direct user selection
  useEffect(() => {
    const userIdFromUrl = searchParams.get("user");
    if (userIdFromUrl) {
      setSelectedUserId(userIdFromUrl);
    }
  }, [searchParams]);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (state.currentUser && state.isAuthenticated) {
      const token = localStorage.getItem("token");
      if (token) {
        console.log(
          "Connecting to Socket.IO with token:",
          token.substring(0, 20) + "..."
        );
        socketService.connect(token);

        // Set up event listeners
        socketService.onNewMessage((data) => {
          console.log("🔔 New message received via Socket.IO:", data);

            if (data.message) {
            // Format the message to match frontend expectations
            const formattedMessage = {
              _id: data.message._id,
              content: data.message.content,
              senderId: data.message.senderId._id || data.message.senderId,
              receiverId:
                data.message.receiverId._id || data.message.receiverId,
              timestamp: data.message.createdAt || data.message.timestamp,
              messageType: data.message.messageType || "text",
              isSending: false,
              isDelivered: true,
              isRead: false,
            };

            console.log("✅ Formatted message for frontend:", formattedMessage);

            // Dispatch directly, letting the reducer handle deduplication
            dispatch({ type: "UPSERT_MESSAGE", payload: formattedMessage });

            // Show notification for new message
            if (
              String(formattedMessage.senderId) !==
              String(state.currentUser?._id || state.currentUser?.id)
            ) {
              console.log("🔔 Showing notification for new message");
              dispatch({
                type: "ADD_NOTIFICATION",
                payload: {
                  id: Date.now().toString(),
                  type: "message",
                  title: "New Message",
                  content: `You received a new message`,
                  read: false,
                  timestamp: new Date(),
                },
              });
            }
          } else {
            console.log("❌ No message data in Socket.IO payload");
          }
        });

        socketService.onMessageSent((data) => {
          console.log("Message sent confirmation:", data);
            if (data.message) {
            // Format the message to match frontend expectations
            const formattedMessage = {
              _id: data.message._id,
              content: data.message.content,
              senderId: data.message.senderId._id || data.message.senderId,
              receiverId:
                data.message.receiverId._id || data.message.receiverId,
              timestamp: data.message.createdAt || data.message.timestamp,
              messageType: data.message.messageType || "text",
              isSending: false,
              isDelivered: true,
              isRead: false,
            };

            console.log(
              "Formatted sent message for frontend:",
              formattedMessage
            );

            // Delegate deduplication and updating to the reducer
            dispatch({
              type: "CONFIRM_MESSAGE",
              payload: formattedMessage,
            });
          }
        });

        socketService.onUserTyping((data) => {
          if (data.userId === selectedUserId) {
            setIsTyping(data.isTyping);
          }
        });

        socketService.onMessageError((error) => {
          console.error("Message error:", error);
        });

        socketService.onOnlineUsers((users) => {
          console.log("👥 Received online users list update:", users);
          setOnlineUserIds(users);
        });

        // Request initial online users list
        socketService.requestOnlineUsers();
      } else {
        console.log("No token found for Socket.IO connection");
      }
    } else {
      console.log("User not authenticated for Socket.IO connection");
    }

    return () => {
      socketService.removeChatListeners();
    };
  }, [state.currentUser, state.isAuthenticated, selectedUserId, dispatch]);

  // Join conversation when user is selected and load messages for that conversation
  useEffect(() => {
    if (selectedUserId && state.currentUser) {
      const conversationId = `${
        state.currentUser._id || state.currentUser.id
      }_${selectedUserId}`;
      console.log("🔗 Joining conversation:", conversationId);
      socketService.joinConversation(conversationId, selectedUserId);

      // Load messages for the selected conversation
      const loadConversationMessages = async () => {
        try {
          console.log(
            "Loading messages for conversation with:",
            selectedUserId
          );
          const messagesResponse = await messagesAPI.getMessages(
            selectedUserId
          );
          if (messagesResponse.messages) {
            // Format messages to match frontend expectations
            const formattedMessages = messagesResponse.messages.map((msg) => ({
              _id: msg._id,
              content: msg.content,
              senderId: msg.senderId._id || msg.senderId,
              receiverId: msg.receiverId._id || msg.receiverId,
              timestamp: msg.createdAt || msg.timestamp,
              messageType: msg.messageType || "text",
            }));

            console.log("Loaded conversation messages:", formattedMessages);

            // Merge messages with existing ones (avoid duplicates)
            const existingMessageIds = state.messages.map((m) => m._id);
            const newMessages = formattedMessages.filter(
              (msg) => !existingMessageIds.includes(msg._id)
            );

            console.log(
              "✅ Conversation messages loaded:",
              formattedMessages.length
            );
            console.log("✅ New messages to add:", newMessages.length);

            if (newMessages.length > 0) {
              console.log("✅ Adding conversation messages to state");
              for (const message of newMessages) {
                dispatch({ type: "ADD_MESSAGE", payload: message });
              }
            }
          }
        } catch (error) {
          console.error("Error loading conversation messages:", error);
        }
      };

      loadConversationMessages();

      return () => {
        socketService.leaveConversation();
      };
    }
  }, [selectedUserId, state.currentUser, dispatch]);

  // Load friends and messages when component mounts
  useEffect(() => {
    const loadData = async () => {
      if (state.currentUser && state.isAuthenticated) {
        setIsLoading(true);
        try {
          console.log("Loading friends for user:", state.currentUser.name);

          // Load friends list
          const friendsResponse = await friendRequestAPI.getFriends();
          if (friendsResponse.friends) {
            console.log("Loaded friends:", friendsResponse.friends);
            dispatch({ type: "SET_USERS", payload: friendsResponse.friends });

            // Load messages for all friends
            const allMessages = [];
            for (const friend of friendsResponse.friends) {
              try {
                console.log(
                  `Loading messages for friend: ${friend.name} (${friend._id})`
                );
                const messagesResponse = await messagesAPI.getMessages(
                  friend._id
                );

                if (
                  messagesResponse.messages &&
                  messagesResponse.messages.length > 0
                ) {
                  // Format messages to match frontend expectations
                  const formattedMessages = messagesResponse.messages.map(
                    (msg) => ({
                      _id: msg._id,
                      content: msg.content,
                      senderId: msg.senderId._id || msg.senderId,
                      receiverId: msg.receiverId._id || msg.receiverId,
                      timestamp: msg.createdAt || msg.timestamp,
                      messageType: msg.messageType || "text",
                    })
                  );
                  allMessages.push(...formattedMessages);
                  console.log(
                    `Added ${formattedMessages.length} messages for ${friend.name}`
                  );
                }
              } catch (error) {
                console.error(
                  `Error loading messages for ${friend.name}:`,
                  error
                );
              }
            }

            // Add all messages to state (avoid duplicates)
            if (allMessages.length > 0) {
              const existingMessageIds = state.messages.map((m) => m._id);
              const newMessages = allMessages.filter(
                (msg) => !existingMessageIds.includes(msg._id)
              );

              console.log(
                "✅ Total messages loaded from database:",
                allMessages.length
              );
              console.log("✅ New messages to add:", newMessages.length);
              console.log(
                "✅ Existing messages in state:",
                state.messages.length
              );

              if (newMessages.length > 0) {
                console.log(
                  "✅ Adding new messages to state:",
                  newMessages.length
                );
                for (const message of newMessages) {
                  dispatch({ type: "ADD_MESSAGE", payload: message });
                }
              } else if (
                state.messages.length === 0 &&
                allMessages.length > 0
              ) {
                // If no messages in state but we have messages from database, set them all
                console.log("✅ Setting all messages from database to state");
                dispatch({ type: "SET_MESSAGES", payload: allMessages });
              }
            }
          }
        } catch (error) {
          console.error("Error loading data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadData();
  }, [state.currentUser, state.isAuthenticated, dispatch]);

  // Get conversations
  console.log("Current users in state:", state.users);
  console.log("Current user:", state.currentUser);
  console.log("All messages in state:", state.messages);
  console.log("Selected user ID:", selectedUserId);

  const conversations = state.users
    .filter(
      (user) =>
        String(user._id) !==
        String(state.currentUser?._id || state.currentUser?.id)
    )
    .map((user) => {
      const userMessages = state.messages.filter((m) => {
        // Convert all IDs to strings for comparison
        const senderId = String(m.senderId);
        const receiverId = String(m.receiverId);
        const userId = String(user._id);
        const currentUserId = String(
          state.currentUser?._id || state.currentUser?.id
        );

        const isMatch =
          (senderId === userId && receiverId === currentUserId) ||
          (senderId === currentUserId && receiverId === userId);

        return isMatch;
      });

      return {
        user,
        messages: userMessages.sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        ),
        lastMessage: userMessages[userMessages.length - 1],
        unreadCount: userMessages.filter((m) => {
          const senderId = String(m.senderId);
          const userId = String(user._id);
          return senderId === userId && !m.isRead;
        }).length,
      };
    })
    .filter((conv) => true) // Show all friends
    .sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return (
        new Date(b.lastMessage.timestamp).getTime() -
        new Date(a.lastMessage.timestamp).getTime()
      );
    });

  const [searchQuery, setSearchQuery] = useState("");

  const blockedUserIds = React.useMemo(() => {
    if (!state.currentUser?.blockedUsers) return [];
    return state.currentUser.blockedUsers.map(u => String(typeof u === 'object' ? u._id || u.id : u));
  }, [state.currentUser?.blockedUsers]);

  const visibleConversations = conversations.filter(conv => {
    if (blockedUserIds.includes(String(conv.user._id))) return false;
    if (searchQuery.trim() === "") return true;
    return conv.user.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedConversation = conversations.find(
    (conv) => String(conv.user._id) === String(selectedUserId)
  );

  const isSelectedUserBlocked = selectedUserId && blockedUserIds.includes(String(selectedUserId));

  // Auto-deduplicate messages when they change
  useEffect(() => {
    if (state.messages.length > 0) {
      const uniqueMessages = [];
      const seen = new Set();

      // Sort messages by timestamp to keep the latest one
      const sortedMessages = [...state.messages].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      sortedMessages.forEach((msg) => {
        const key = msg._id && !msg._id.toString().startsWith('temp_') 
          ? msg._id.toString() 
          : `${msg.content}_${msg.senderId}_${msg.receiverId}_${msg.timestamp}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueMessages.push(msg);
        }
      });

      // Sort back by timestamp
      uniqueMessages.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );

      // Only update if there are actually duplicates
      if (uniqueMessages.length !== state.messages.length) {
        console.log(
          `🔄 Auto-removed ${
            state.messages.length - uniqueMessages.length
          } duplicate messages`
        );
        dispatch({ type: "SET_MESSAGES", payload: uniqueMessages });
      }
    }
  }, [state.messages.length]);

  // Mark messages as read when conversation is viewed
  useEffect(() => {
    if (selectedUserId && state.messages.length > 0) {
      const messagesToMark = state.messages.filter((m) => {
        const senderId = String(m.senderId);
        const receiverId = String(m.receiverId);
        const userId = String(selectedUserId);
        const currentUserId = String(
          state.currentUser?._id || state.currentUser?.id
        );

        return (
          (senderId === userId && receiverId === currentUserId) ||
          (senderId === currentUserId && receiverId === userId)
        );
      });

      messagesToMark.forEach((msg) => {
        if (
          !msg.isRead &&
          String(msg.senderId) !==
            String(state.currentUser?._id || state.currentUser?.id)
        ) {
          dispatch({
            type: "UPDATE_MESSAGE",
            payload: {
              tempId: msg._id,
              realMessage: { ...msg, isRead: true },
            },
          });
        }
      });
    }
  }, [selectedUserId, state.messages.length]);

  console.log("🎯 Selected user ID:", selectedUserId);
  console.log(
    "🎯 Available conversations:",
    conversations.map((c) => ({ id: c.user._id, name: c.user.name }))
  );
  console.log("🎯 Selected conversation:", selectedConversation);
  console.log(
    "🎯 Selected conversation messages:",
    selectedConversation?.messages
  );
  console.log("🟢 Online Users:", onlineUserIds);

  // Debug function to test message loading
  window.debugChat = {
    loadMessages: async (userId) => {
      try {
        const response = await messagesAPI.getMessages(userId);
        console.log("Debug - Messages for user", userId, ":", response);
        return response;
      } catch (error) {
        console.error("Debug - Error loading messages:", error);
      }
    },
    getState: () => {
      console.log("Debug - Current state:", {
        users: state.users,
        messages: state.messages,
        currentUser: state.currentUser,
        selectedUserId,
      });
      return state;
    },
    reloadMessages: async () => {
      console.log("🔄 Manually reloading messages...");
      try {
        const friendsResponse = await friendRequestAPI.getFriends();
        if (friendsResponse.friends) {
          const allMessages = [];
          for (const friend of friendsResponse.friends) {
            try {
              console.log(
                `🔄 Loading messages for friend: ${friend.name} (${friend._id})`
              );
              const messagesResponse = await messagesAPI.getMessages(
                friend._id
              );
              console.log(
                `🔄 Messages response for ${friend.name}:`,
                messagesResponse
              );

              if (
                messagesResponse.messages &&
                messagesResponse.messages.length > 0
              ) {
                const formattedMessages = messagesResponse.messages.map(
                  (msg) => ({
                    _id: msg._id,
                    content: msg.content,
                    senderId: msg.senderId._id || msg.senderId,
                    receiverId: msg.receiverId._id || msg.receiverId,
                    timestamp: msg.createdAt || msg.timestamp,
                    messageType: msg.messageType || "text",
                  })
                );
                allMessages.push(...formattedMessages);
                console.log(
                  `🔄 Added ${formattedMessages.length} messages for ${friend.name}`
                );
              } else {
                console.log(`🔄 No messages found for ${friend.name}`);
              }
            } catch (error) {
              console.error(
                `Error loading messages for ${friend.name}:`,
                error
              );
            }
          }
          console.log("🔄 Total messages loaded:", allMessages);
          dispatch({ type: "SET_MESSAGES", payload: allMessages });
        }
      } catch (error) {
        console.error("Error reloading messages:", error);
      }
    },
    clearMessages: () => {
      console.log("🗑️ Clearing all messages from state");
      dispatch({ type: "SET_MESSAGES", payload: [] });
    },
    selectConversation: (userId) => {
      console.log("🎯 Manually selecting conversation for user:", userId);
      setSelectedUserId(userId);
    },
    getConversations: () => {
      console.log("📋 Current conversations:", conversations);
      return conversations;
    },
    removeDuplicates: () => {
      console.log("🔄 Removing duplicate messages...");
      const uniqueMessages = [];
      const seen = new Set();

      state.messages.forEach((msg) => {
        const key = `${msg.content}_${msg.senderId}_${msg.receiverId}_${msg.timestamp}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueMessages.push(msg);
        }
      });

      console.log(
        `🔄 Removed ${
          state.messages.length - uniqueMessages.length
        } duplicate messages`
      );
      dispatch({ type: "SET_MESSAGES", payload: uniqueMessages });
    },
    removeDuplicatesAdvanced: () => {
      console.log("🔄 Advanced duplicate removal...");
      const uniqueMessages = [];
      const seen = new Set();

      // Sort messages by timestamp to keep the latest one
      const sortedMessages = [...state.messages].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      sortedMessages.forEach((msg) => {
        const key = msg._id && !msg._id.toString().startsWith('temp_') 
          ? msg._id.toString() 
          : `${msg.content}_${msg.senderId}_${msg.receiverId}_${msg.timestamp}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueMessages.push(msg);
        }
      });

      // Sort back by timestamp
      uniqueMessages.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );

      console.log(
        `🔄 Removed ${
          state.messages.length - uniqueMessages.length
        } duplicate messages`
      );
      dispatch({ type: "SET_MESSAGES", payload: uniqueMessages });
    },
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId || !state.currentUser) {
      console.log("Cannot send message:", {
        hasMessage: !!newMessage.trim(),
        hasSelectedUser: !!selectedUserId,
        hasCurrentUser: !!state.currentUser,
        selectedUserId,
        currentUserId: state.currentUser?.id,
      });
      return;
    }

    console.log("Sending message:", {
      to: selectedUserId,
      from: state.currentUser.id,
      message: newMessage.trim(),
    });

    // Send message via Socket.IO only
    socketService.sendMessage(selectedUserId, newMessage.trim());

    // Add message to local state immediately for instant UI feedback
    const newMessageObj = {
      _id: "temp_" + Date.now().toString(),
      senderId: state.currentUser._id || state.currentUser.id,
      receiverId: selectedUserId,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      messageType: "text",
      isSending: true,
      isDelivered: false,
      isRead: false,
    };

    // Remove any existing temporary messages with the same content to prevent duplicates
    const existingTempMessages = state.messages.filter(
      (msg) =>
        msg.content === newMessage.trim() &&
        msg.isSending === true &&
        msg.senderId === newMessageObj.senderId &&
        msg.receiverId === newMessageObj.receiverId
    );

    if (existingTempMessages.length > 0) {
      console.log(
        "🧹 Removing existing temporary messages:",
        existingTempMessages.length
      );
      existingTempMessages.forEach((msg) => {
        dispatch({ type: "REMOVE_MESSAGE", payload: msg._id });
      });
    }

    // Also remove any existing confirmed messages with the same content (in case of rapid sending)
    const existingConfirmedMessages = state.messages.filter(
      (msg) =>
        msg.content === newMessage.trim() &&
        !msg.isSending &&
        msg.senderId === newMessageObj.senderId &&
        msg.receiverId === newMessageObj.receiverId &&
        Math.abs(new Date(msg.timestamp) - new Date()) < 2000 // Within 2 seconds
    );

    if (existingConfirmedMessages.length > 0) {
      console.log(
        "🧹 Removing recent confirmed messages:",
        existingConfirmedMessages.length
      );
      existingConfirmedMessages.forEach((msg) => {
        dispatch({ type: "REMOVE_MESSAGE", payload: msg._id });
      });
    }

    console.log("📤 Adding temporary message:", newMessageObj);
    dispatch({ type: "ADD_MESSAGE", payload: newMessageObj });

    // The confirmation process is now handled fully in the reducer.
    // Clean up temporary messages older than 10 seconds via a global dispatch interval if needed.

    setNewMessage("");
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedUserId || !state.currentUser) return;

    // Validate size
    if (file.size > 10 * 1024 * 1024) {
      alert("File size should be less than 10MB");
      return;
    }

    try {
      setIsUploadingFile(true);
      const formData = new FormData();
      formData.append("file", file);

      // Upload file directly to backend
      const response = await messagesAPI.uploadFile(formData);

      // Now send the Socket.io message using the fileUrl
      if (response && response.fileUrl) {
        // Send message via Socket.IO only
        socketService.sendMessage(selectedUserId, response.fileUrl, response.messageType);

        const newMessageObj = {
          _id: "temp_" + Date.now().toString(),
          senderId: state.currentUser._id || state.currentUser.id,
          receiverId: selectedUserId,
          content: response.fileUrl,
          timestamp: new Date().toISOString(),
          messageType: response.messageType,
          isSending: true,
          isDelivered: false,
          isRead: false,
        };

        dispatch({ type: "ADD_MESSAGE", payload: newMessageObj });
      }

    } catch (error) {
      console.error("Error uploading file:", error);
      alert(`Failed to upload file: ${error.message}`);
    } finally {
      setIsUploadingFile(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (selectedUserId) {
      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      // Start typing indicator
      socketService.startTyping(selectedUserId);

      // Set timeout to stop typing indicator
      const timeout = setTimeout(() => {
        socketService.stopTyping(selectedUserId);
      }, 1000);

      setTypingTimeout(timeout);
    }
  };

  const onEmojiClick = (emojiObject) => {
    setNewMessage((prevMessage) => prevMessage + emojiObject.emoji);
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-surface overflow-hidden">
      {/* Conversations List */}
      <div className={`w-full md:w-80 h-full border-r border-border flex flex-col bg-surface-2 ${selectedUserId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-border bg-surface relative z-10 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-display font-medium text-ink tracking-tight m-0">
              Messages
            </h1>
            <div className="relative" ref={sidebarDropdownRef}>
              <button
                onClick={() => setIsSidebarDropdownOpen(!isSidebarDropdownOpen)}
                className="p-2 text-ink-muted hover:text-ink hover:bg-surface-2 rounded-xl transition-all duration-300 flex-shrink-0"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              
              {isSidebarDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-surface border border-surface-2 rounded-xl shadow-xl z-50 overflow-hidden">
                  <button
                    className="w-full flex items-center px-4 py-3 text-sm text-ink hover:bg-surface-2 transition-colors"
                    onClick={() => {
                      setIsSidebarDropdownOpen(false);
                      setIsBlockedUsersModalOpen(true);
                      fetchBlockedUsers();
                    }}
                  >
                    <UserX className="w-4 h-4 mr-3 text-ink-muted" />
                    Blocked Users
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Search */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-ink-muted group-focus-within:text-accent transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="block w-full pl-12 pr-4 py-3 bg-surface-2 border border-border rounded-xl text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 text-sm transition-all duration-300 hover:bg-surface"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-ink-muted">Loading conversations...</p>
              </div>
            </div>
          ) : visibleConversations.length > 0 ? (
            <div className="px-4 py-3 space-y-2">
              {visibleConversations.map((conversation) => (
                <button
                  key={conversation.user._id}
                  onClick={() => {
                    setSelectedUserId(conversation.user._id);
                    setSearchParams({ user: conversation.user._id });
                  }}
                  className={`w-full p-4 text-left rounded-2xl transition-all duration-200 group ${
                    String(selectedUserId) === String(conversation.user._id)
                      ? "bg-surface shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-border ring-1 ring-accent/10"
                      : "hover:bg-surface hover:shadow-sm border border-transparent"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative shrink-0">
                      {conversation.user.avatar ? (
                        <img
                          src={
                            conversation.user.avatar.startsWith("http")
                              ? conversation.user.avatar
                              : `${import.meta.env.VITE_API_URL}${conversation.user.avatar}`
                          }
                          alt={conversation.user.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-surface group-hover:border-accent/20 transition-all duration-300 shadow-sm"
                          onError={(e) => {
                            console.log(
                              "Conversation avatar load error:",
                              e.target.src
                            );
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-14 h-14 bg-surface rounded-full flex items-center justify-center border-2 border-surface group-hover:border-accent/20 transition-all duration-300 shadow-sm ${
                          conversation.user.avatar ? "hidden" : ""
                        }`}
                      >
                        <User className="w-7 h-7 text-ink-muted" />
                      </div>
                      {onlineUserIds.includes(String(conversation.user._id)) && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green rounded-full border-2 border-surface"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`text-base font-display font-medium truncate transition-colors ${
                          String(selectedUserId) === String(conversation.user._id) ? "text-accent" : "text-ink group-hover:text-accent"
                        }`}>
                          {conversation.user.name}
                        </p>
                        {conversation.lastMessage && (
                          <p className="text-xs text-ink-muted font-medium ml-2">
                            {new Date(
                              conversation.lastMessage.timestamp || Date.now()
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>

                      {conversation.lastMessage ? (
                        <p className={`text-sm truncate transition-colors ${
                          conversation.unreadCount > 0 ? "text-ink font-medium" : "text-ink-muted"
                        }`}>
                          {conversation.lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-sm text-ink-muted italic">
                          No messages yet
                        </p>
                      )}

                      {conversation.unreadCount > 0 && (
                        <div className="mt-2 text-right absolute right-4 bottom-4">
                          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold leading-none text-white bg-accent rounded-full shadow-sm">
                            {conversation.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-ink-muted">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 border border-border shadow-sm">
                  <User className="w-8 h-8 text-ink-muted" />
                </div>
                <p className="text-lg font-medium text-ink mb-2">
                  No friends yet
                </p>
                <p className="text-sm text-ink-muted mb-6">
                  Add friends from the Friends page to start chatting!
                </p>
                <button
                  onClick={() => (window.location.href = "/friends")}
                  className="bg-ink text-surface hover:bg-black font-medium px-5 py-2.5 rounded-full text-sm transition-transform hover:scale-105 shadow-sm"
                >
                  Go to Friends
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 h-full flex flex-col min-w-0 bg-surface-2 ${!selectedUserId ? 'hidden md:flex' : 'flex'}`}>
        {selectedConversation || selectedUserId ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-border bg-surface relative z-10 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      setSelectedUserId(null);
                      setSearchParams({});
                    }}
                    className="md:hidden p-2 -ml-2 text-ink-muted hover:text-ink transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <div className="relative">
                    {selectedConversation?.user?.avatar ? (
                      <img
                        src={
                          selectedConversation.user.avatar.startsWith("http")
                            ? selectedConversation.user.avatar
                            : `${import.meta.env.VITE_API_URL}${selectedConversation.user.avatar}`
                        }
                        alt={selectedConversation.user.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-surface shadow-sm"
                        onError={(e) => {
                          console.log(
                            "Chat header avatar load error:",
                            e.target.src
                          );
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-12 h-12 bg-surface rounded-full flex items-center justify-center border-2 border-surface shadow-sm ${
                        selectedConversation?.user?.avatar ? "hidden" : ""
                      }`}
                    >
                      <User className="w-6 h-6 text-ink-muted" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-display font-medium text-ink">
                      {selectedConversation?.user?.name || "Unknown User"}
                    </h2>
                    {onlineUserIds.includes(String(selectedConversation?.user?._id)) ? (
                      <p className="text-sm font-medium text-green flex items-center">
                        <div className="w-1.5 h-1.5 bg-green rounded-full mr-2 animate-pulse"></div>
                        Online
                      </p>
                    ) : (
                      <p className="text-sm font-medium text-ink-muted flex items-center">
                        <div className="w-1.5 h-1.5 bg-ink-muted/50 rounded-full mr-2"></div>
                        Offline
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={async () => {
                      if (!selectedUserId) return;
                      try {
                        // Try to find an existing confirmed video session with this user
                        const data = await sessionsAPI.getSessions({
                          type: "video",
                        });
                        const existing = data.sessions?.find((s) => {
                          const hId =
                            typeof s.hostId === "object"
                              ? s.hostId._id
                              : s.hostId;
                          const pId =
                            typeof s.partnerId === "object"
                              ? s.partnerId._id
                              : s.partnerId;
                          const currentId =
                            state.currentUser?._id || state.currentUser?.id;
                          return (
                            ["confirmed", "in-progress"].includes(s.status) &&
                            ((hId === currentId && pId === selectedUserId) ||
                              (pId === currentId && hId === selectedUserId))
                          );
                        });
                        if (existing) {
                          navigate(`/video/${existing._id}`);
                        } else {
                          alert(
                            "No confirmed video session with this user. Book a session first from the Booking page."
                          );
                        }
                      } catch (err) {
                        console.error("Video call error:", err);
                      }
                    }}
                    className="p-2.5 text-ink-muted hover:text-green hover:bg-surface-2 rounded-xl transition-all duration-300"
                    title="Start Video Call"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                  <div className="relative" ref={dropdownRef}>
                    <button 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="p-2.5 text-ink-muted hover:text-ink hover:bg-surface-2 rounded-xl transition-all duration-300"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-surface border border-surface-2 rounded-xl shadow-xl z-50 overflow-hidden">
                        <button
                          className="w-full flex items-center px-4 py-3 text-sm text-ink hover:bg-surface-2 transition-colors"
                          onClick={async () => {
                            setIsDropdownOpen(false);
                            if (window.confirm("Are you sure you want to clear this chat? This action cannot be undone.")) {
                              try {
                                await messagesAPI.clearConversation(selectedUserId);
                                dispatch({ type: "SET_MESSAGES", payload: [] });
                              } catch (err) {
                                console.error("Failed to clear chat:", err);
                                alert("Failed to clear chat. Please try again.");
                              }
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-3 text-red-50" />
                          <span className="text-red-500">Clear Chat</span>
                        </button>
                        <button
                          className="w-full flex items-center px-4 py-3 text-sm text-ink hover:bg-surface-2 transition-colors"
                          onClick={async () => {
                            setIsDropdownOpen(false);
                            if (window.confirm("Are you sure you want to block this user?")) {
                              try {
                                const targetId = typeof selectedUserId === 'object' ? selectedUserId._id : selectedUserId;
                                const res = await usersAPI.blockUser(targetId);
                                if (res.blockedUsers) {
                                  dispatch({ type: "SET_BLOCKED_USERS", payload: res.blockedUsers });
                                }
                                alert("User blocked successfully.");
                                setSelectedUserId(null); // Deselect user after blocking
                              } catch (err) {
                                console.error("Failed to block user:", err);
                                alert(err.message || "Failed to block user.");
                              }
                            }
                          }}
                        >
                          <Ban className="w-4 h-4 mr-3 text-ink-muted" />
                          Block User
                        </button>
                        <button
                          className="w-full flex items-center px-4 py-3 test-sm text-red-500 hover:bg-red-50 transition-colors border-t border-surface-2"
                          onClick={async () => {
                            setIsDropdownOpen(false);
                            const reason = window.prompt("Please provide a reason for reporting this user:");
                            if (reason !== null && reason.trim() !== "") {
                              try {
                                await usersAPI.reportUser(selectedUserId, reason);
                                alert("User reported successfully. Our team will review this shortly.");
                              } catch (err) {
                                console.error("Failed to report user:", err);
                                alert(err.message || "Failed to report user.");
                              }
                            }
                          }}
                        >
                          <Flag className="w-4 h-4 mr-3" />
                          Report User
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
              onScroll={() => {
                // Mark messages as read when scrolled to bottom
                const messagesContainer = document.querySelector(
                  ".flex-1.overflow-y-auto"
                );
                if (messagesContainer) {
                  const { scrollTop, scrollHeight, clientHeight } =
                    messagesContainer;
                  if (scrollTop + clientHeight >= scrollHeight - 10) {
                    // Mark all messages in this conversation as read
                    const messagesToMark = state.messages.filter((m) => {
                      const senderId = String(m.senderId);
                      const receiverId = String(m.receiverId);
                      const userId = String(selectedUserId);
                      const currentUserId = String(
                        state.currentUser?._id || state.currentUser?.id
                      );

                      return (
                        (senderId === userId && receiverId === currentUserId) ||
                        (senderId === currentUserId && receiverId === userId)
                      );
                    });

                    messagesToMark.forEach((msg) => {
                      if (
                        !msg.isRead &&
                        String(msg.senderId) !==
                          String(
                            state.currentUser?._id || state.currentUser?.id
                          )
                      ) {
                        dispatch({
                          type: "UPDATE_MESSAGE",
                          payload: {
                            tempId: msg._id,
                            realMessage: { ...msg, isRead: true },
                          },
                        });
                      }
                    });
                  }
                }
              }}
            >
              {(() => {
                // Get messages for the selected user from global state if selectedConversation is null
                const messagesToShow =
                  selectedConversation?.messages ||
                  (selectedUserId
                    ? state.messages
                        .filter((m) => {
                          const senderId = String(m.senderId);
                          const receiverId = String(m.receiverId);
                          const userId = String(selectedUserId);
                          const currentUserId = String(
                            state.currentUser?._id || state.currentUser?.id
                          );

                          return (
                            (senderId === userId &&
                              receiverId === currentUserId) ||
                            (senderId === currentUserId &&
                              receiverId === userId)
                          );
                        })
                        .sort(
                          (a, b) =>
                            new Date(a.timestamp) - new Date(b.timestamp)
                        )
                    : []);

                return messagesToShow.length > 0 ? (
                  messagesToShow.map((message, index) => {
                    const isFromCurrentUser =
                      String(message.senderId) ===
                      String(state.currentUser?._id || state.currentUser?.id);
                    const previousMessage =
                      index > 0 ? messagesToShow[index - 1] : null;
                    const showAvatar =
                      !previousMessage ||
                      String(previousMessage.senderId) !==
                        String(message.senderId) ||
                      new Date(message.timestamp) -
                        new Date(previousMessage.timestamp) >
                        300000; // 5 minutes

                    // Get user info for avatar
                    const messageUserId = isFromCurrentUser
                      ? state.currentUser?._id || state.currentUser?.id
                      : String(message.senderId) ===
                        String(state.currentUser?._id || state.currentUser?.id)
                      ? selectedUserId
                      : message.senderId;

                    const userInfo = isFromCurrentUser
                      ? state.currentUser
                      : selectedConversation?.user ||
                        state.users.find(
                          (user) => String(user._id) === String(messageUserId)
                        ) ||
                        conversations.find(
                          (conv) =>
                            String(conv.user._id) === String(messageUserId)
                        )?.user;

                    return (
                    <div
                      key={message._id || index}
                      className={`flex ${
                        isFromCurrentUser ? "justify-end" : "justify-start"
                      } animate-fade-in group`}
                    >
                      {/* Avatar for received messages */}
                      {!isFromCurrentUser && showAvatar && (
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-border shadow-sm mr-2">
                          {userInfo?.avatar ? (
                            <img
                              src={
                                userInfo.avatar.startsWith("http")
                                  ? userInfo.avatar
                                  : `${import.meta.env.VITE_API_URL}${userInfo.avatar}`
                              }
                              alt={userInfo.name || "User"}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/40?text=User";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-surface-2 flex items-center justify-center">
                              <User className="w-4 h-4 text-ink-muted" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Avatar for sent messages */}
                      {isFromCurrentUser && showAvatar && (
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-border shadow-sm ml-2">
                          {userInfo?.avatar ? (
                            <img
                              src={
                                userInfo.avatar.startsWith("http")
                                  ? userInfo.avatar
                                  : `${import.meta.env.VITE_API_URL}${userInfo.avatar}`
                              }
                              alt={userInfo.name || "You"}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/40?text=You";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-accent text-white flex items-center justify-center">
                              <User className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Spacer for messages without avatar */}
                      {!showAvatar && (
                        <div className="w-8 h-8 flex-shrink-0"></div>
                      )}

                      <div
                        className={`max-w-[85%] md:max-w-[70%] ${
                          message.messageType === "image" ? "p-1" : "px-4 py-3"
                        } rounded-2xl md:rounded-3xl shadow-sm ${
                          isFromCurrentUser
                            ? "bg-accent text-white rounded-br-sm"
                            : "bg-surface border border-border text-ink rounded-bl-sm"
                        } transition-colors group-hover:shadow-md`}
                      >
                        {/* Status tracking dots for system feedback */}
                        {message.isSystemMessage && (
                          <div className="flex items-center space-x-2 text-xs opacity-75 mb-1 justify-center border-b border-border/10 pb-1">
                            {message.isSending && (
                              <Clock className="w-3 h-3 animate-spin" />
                            )}
                            <span className="font-medium tracking-wide w-full text-center">
                              {message.isSending
                                ? "Sending..."
                                : "System Note"}
                            </span>
                          </div>
                        )}

                        {message.messageType === "image" ? (
                           <div className="relative group/image">
                             <img 
                               src={`${import.meta.env.VITE_API_URL}${message.content}`} 
                               alt="Shared attachment" 
                               className={`max-w-xs md:max-w-sm w-full h-auto rounded-xl object-cover ${isFromCurrentUser ? "bg-white" : "bg-surface-2"}`}
                               onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://via.placeholder.com/300?text=Image+Load+Error";
                               }}
                             />
                           </div>
                        ) : message.messageType === "file" ? (
                           <a
                              href={`${import.meta.env.VITE_API_URL}${message.content}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center space-x-3 p-3 rounded-xl border ${isFromCurrentUser ? "border-surface-2/20 bg-white/10 hover:bg-white/20" : "border-border bg-surface-2 hover:bg-surface-2/70"} transition-colors`}
                           >
                             <div className={`p-2 rounded-lg ${isFromCurrentUser ? "bg-white/20 text-surface" : "bg-surface text-ink shadow-sm"}`}>
                               <Paperclip className="w-5 h-5" />
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className={`text-sm font-medium truncate ${isFromCurrentUser ? "text-surface" : "text-ink"}`}>
                                 {message.content.split('/').pop()}
                               </p>
                               <p className={`text-xs ${isFromCurrentUser ? "text-surface/70" : "text-ink-muted"}`}>
                                 Document
                               </p>
                             </div>
                           </a>
                        ) : (
                          <p className={`text-sm md:text-base leading-relaxed break-words whitespace-pre-wrap ${message.isSystemMessage && isFromCurrentUser ? "text-surface/90 font-medium" : ""}`}>
                            {message.content}
                          </p>
                        )}
                        <div
                          className={`flex items-center space-x-1.5 mt-1.5 md:mt-2 text-[10px] md:text-xs font-medium tracking-wide ${
                            isFromCurrentUser
                              ? "text-surface/70 justify-end"
                              : "text-ink-muted justify-start"
                          }`}
                        >
                          <span>{new Date(message.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {/* We only render read receipts if the message has been delivered to Socket OR retrieved from DB */}
                          {message.isSending ? (
                            <Clock className="w-3 h-3 text-surface/50 ml-1 opacity-70" />
                          ) : (
                            isFromCurrentUser &&
                            !message.isSending && (
                              <span
                                className={`ml-1 flex items-center ${
                                  message.isRead
                                    ? "text-blue-300"
                                    : "text-surface/70"
                                }`}
                              >
                                {message.isRead ? "••" : "•"}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-ink-muted mt-8 font-medium">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              );
            })()}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-surface border border-border text-ink-muted px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                    <div className="flex items-center space-x-1">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-ink-muted rounded-full animate-bounce"></div>
                        <div
                          className="w-1.5 h-1.5 bg-ink-muted rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-1.5 h-1.5 bg-ink-muted rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            {isSelectedUserBlocked ? (
              <div className="flex-shrink-0 p-4 border-t border-border bg-surface-2 flex flex-col items-center justify-center text-center">
                <p className="text-ink-muted text-sm mb-2">You blocked this contact.</p>
                <button 
                  onClick={async () => {
                    try {
                      const res = await usersAPI.unblockUser(selectedUserId);
                      if (res.blockedUsers) {
                        dispatch({ type: "SET_BLOCKED_USERS", payload: res.blockedUsers });
                      }
                      alert("User unblocked successfully.");
                    } catch (err) {
                      console.error("Failed to unblock user:", err);
                    }
                  }}
                  className="text-accent hover:text-accent-muted font-medium text-sm transition-colors"
                >
                  Tap to unblock
                </button>
              </div>
            ) : (
              <div className="flex-shrink-0 p-3 md:p-6 border-t border-border bg-surface z-20">
                <div className="flex items-end space-x-2 md:space-x-4">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingFile}
                    className="p-2 md:p-2.5 text-ink-muted hover:text-ink hover:bg-surface-2 rounded-xl transition-all duration-300 mb-1 hidden sm:block relative disabled:opacity-50"
                  >
                    {isUploadingFile ? (
                       <Clock className="w-5 h-5 animate-spin" />
                    ) : (
                       <Paperclip className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />

                  <div className="flex-1 relative group">
                    <textarea
                      value={newMessage}
                      onChange={handleTyping}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      rows={1}
                      className="w-full resize-none bg-surface-2 border border-border rounded-xl px-4 py-3 pr-12 md:pr-16 text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all duration-300 text-sm md:text-base"
                      style={{ minHeight: "48px", maxHeight: "120px" }}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 md:space-x-2">
                      <div className="relative">
                        <button 
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="hidden sm:block p-1.5 text-ink-muted hover:text-ink transition-colors"
                        >
                          <Smile className="w-5 h-5" />
                        </button>
                        
                        {showEmojiPicker && (
                          <div className="absolute bottom-full right-0 mb-4 z-50">
                            <div className="fixed inset-0" onClick={() => setShowEmojiPicker(false)}></div>
                            <div className="relative shadow-2xl rounded-xl overflow-hidden border border-border">
                              <EmojiPicker 
                                onEmojiClick={onEmojiClick}
                                autoFocusSearch={false}
                                theme="light"
                                searchPosition="none"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="p-2 bg-ink text-surface hover:bg-black rounded-lg transition-transform hover:scale-105 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-ink-muted bg-surface">
            <div className="text-center p-8 bg-surface-2 rounded-3xl border border-border shadow-sm max-w-sm w-full mx-4">
              <div className="w-16 h-16 bg-surface border border-border rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <MessageCircle className="w-8 h-8 text-ink-muted" />
              </div>
              <h2 className="text-2xl font-display font-medium text-ink mb-3 tracking-tight">
                Select a conversation
              </h2>
              <p className="text-ink-muted text-sm leading-relaxed">
                Choose from your existing conversations or start a new one directly from your Friends page.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Blocked Users Modal */}
      {isBlockedUsersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-surface-2">
              <h2 className="text-xl font-display font-bold text-ink">
                Blocked Users
              </h2>
              <button
                onClick={() => setIsBlockedUsersModalOpen(false)}
                className="p-2 text-ink-muted hover:text-ink hover:bg-surface-2 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {isLoadingBlockedUsers ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-surface-2 border-t-accent rounded-full animate-spin"></div>
                </div>
              ) : blockedUsersList.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserX className="w-8 h-8 text-ink-muted" />
                  </div>
                  <h3 className="text-lg font-medium text-ink mb-2">
                    No Blocked Users
                  </h3>
                  <p className="text-sm text-ink-muted">
                    You haven't blocked anyone yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {blockedUsersList.map((user) => (
                    <div key={user._id} className="flex items-center justify-between p-4 rounded-xl bg-surface-2 border border-surface-2">
                      <div className="flex items-center space-x-3">
                        {user.avatar ? (
                          <img
                            src={user.avatar.startsWith("http") ? user.avatar : `${import.meta.env.VITE_API_URL}${user.avatar}`}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-surface rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-ink-muted" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-ink">{user.name}</p>
                          <p className="text-xs text-ink-muted truncate max-w-[150px]">{user.bio || "No bio"}</p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const res = await usersAPI.unblockUser(user._id);
                            if (res.blockedUsers) {
                              dispatch({ type: "SET_BLOCKED_USERS", payload: res.blockedUsers });
                            }
                            // Optimistically update list
                            setBlockedUsersList(prev => prev.filter(u => u._id !== user._id));
                          } catch (err) {
                            console.error("Failed to unblock user:", err);
                            alert("Failed to unblock user. Please try again.");
                          }
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-ink bg-surface border border-surface-2 hover:border-ink/20 rounded-lg transition-all"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
