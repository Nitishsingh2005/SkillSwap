import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import socketService from '../services/socketService';
import { messagesAPI, friendRequestAPI } from '../services/api';
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
  Smile
} from 'lucide-react';

const Chat = () => {
  const { state, dispatch } = useApp();
  const [searchParams] = useSearchParams();
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle URL parameter for direct user selection
  useEffect(() => {
    const userIdFromUrl = searchParams.get('user');
    if (userIdFromUrl) {
      setSelectedUserId(userIdFromUrl);
    }
  }, [searchParams]);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (state.currentUser && state.isAuthenticated) {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('Connecting to Socket.IO with token:', token.substring(0, 20) + '...');
        socketService.connect(token);
        
        // Set up event listeners
        socketService.onNewMessage((data) => {
          console.log('🔔 New message received via Socket.IO:', data);
          
          if (data.message) {
            // Format the message to match frontend expectations
            const formattedMessage = {
              _id: data.message._id,
              content: data.message.content,
              senderId: data.message.senderId._id || data.message.senderId,
              receiverId: data.message.receiverId._id || data.message.receiverId,
              timestamp: data.message.createdAt || data.message.timestamp,
              messageType: data.message.messageType || 'text',
              isSending: false,
              isDelivered: true,
              isRead: false
            };
            
            console.log('✅ Formatted message for frontend:', formattedMessage);
            
            // Check if message already exists to avoid duplicates
            const messageExists = state.messages.some(msg => 
              msg._id === formattedMessage._id
            );
            
            if (!messageExists) {
              dispatch({ type: 'ADD_MESSAGE', payload: formattedMessage });
              console.log('✅ Message added to state successfully');
              
              // Show notification for new message
              if (String(formattedMessage.senderId) !== String(state.currentUser?._id || state.currentUser?.id)) {
                console.log('🔔 Showing notification for new message');
                dispatch({ 
                  type: 'ADD_NOTIFICATION', 
                  payload: {
                    id: Date.now().toString(),
                    type: 'message',
                    title: 'New Message',
                    content: `You received a new message`,
                    read: false,
                    timestamp: new Date()
                  }
                });
              }
            } else {
              console.log('⚠️ Message already exists, skipping duplicate');
            }
          } else {
            console.log('❌ No message data in Socket.IO payload');
          }
        });

        socketService.onMessageSent((data) => {
          console.log('Message sent confirmation:', data);
          if (data.message) {
            // Format the message to match frontend expectations
            const formattedMessage = {
              _id: data.message._id,
              content: data.message.content,
              senderId: data.message.senderId._id || data.message.senderId,
              receiverId: data.message.receiverId._id || data.message.receiverId,
              timestamp: data.message.createdAt || data.message.timestamp,
              messageType: data.message.messageType || 'text',
              isSending: false,
              isDelivered: true,
              isRead: false
            };
            
            console.log('Formatted sent message for frontend:', formattedMessage);
            
            // Find and update the temporary message with the real message data
            const tempMessage = state.messages.find(msg => 
              msg.content === formattedMessage.content && 
              msg.isSending === true &&
              msg.senderId === formattedMessage.senderId &&
              msg.receiverId === formattedMessage.receiverId
            );
            
            if (tempMessage) {
              console.log('Updating temporary message with real data:', tempMessage._id);
              dispatch({
                type: 'UPDATE_MESSAGE',
                payload: {
                  tempId: tempMessage._id,
                  realMessage: formattedMessage
                }
              });
            } else {
              // Check if message already exists by ID or content+timestamp
              const messageExists = state.messages.some(msg => 
                msg._id === formattedMessage._id || 
                (msg.content === formattedMessage.content && 
                 msg.senderId === formattedMessage.senderId && 
                 msg.receiverId === formattedMessage.receiverId &&
                 Math.abs(new Date(msg.timestamp) - new Date(formattedMessage.timestamp)) < 5000) // Within 5 seconds
              );
              
              if (!messageExists) {
                console.log('Adding new message to state');
                dispatch({ type: 'ADD_MESSAGE', payload: formattedMessage });
              } else {
                console.log('Message already exists, skipping duplicate');
              }
            }
          }
        });

        socketService.onUserTyping((data) => {
          if (data.userId === selectedUserId) {
            setIsTyping(data.isTyping);
          }
        });

        socketService.onMessageError((error) => {
          console.error('Message error:', error);
        });
      } else {
        console.log('No token found for Socket.IO connection');
      }
    } else {
      console.log('User not authenticated for Socket.IO connection');
    }

    return () => {
      socketService.removeAllListeners();
    };
  }, [state.currentUser, state.isAuthenticated, selectedUserId, dispatch]);

  // Join conversation when user is selected and load messages for that conversation
  useEffect(() => {
    if (selectedUserId && state.currentUser) {
      const conversationId = `${state.currentUser._id || state.currentUser.id}_${selectedUserId}`;
      console.log('🔗 Joining conversation:', conversationId);
      socketService.joinConversation(conversationId, selectedUserId);
      
      // Load messages for the selected conversation
      const loadConversationMessages = async () => {
        try {
          console.log('Loading messages for conversation with:', selectedUserId);
          const messagesResponse = await messagesAPI.getMessages(selectedUserId);
          if (messagesResponse.messages) {
            // Format messages to match frontend expectations
            const formattedMessages = messagesResponse.messages.map(msg => ({
              _id: msg._id,
              content: msg.content,
              senderId: msg.senderId._id || msg.senderId,
              receiverId: msg.receiverId._id || msg.receiverId,
              timestamp: msg.createdAt || msg.timestamp,
              messageType: msg.messageType || 'text'
            }));
            
            console.log('Loaded conversation messages:', formattedMessages);
            
            // Merge messages with existing ones (avoid duplicates)
            const existingMessageIds = state.messages.map(m => m._id);
            const newMessages = formattedMessages.filter(msg => !existingMessageIds.includes(msg._id));
            
            console.log('✅ Conversation messages loaded:', formattedMessages.length);
            console.log('✅ New messages to add:', newMessages.length);
            
            if (newMessages.length > 0) {
              console.log('✅ Adding conversation messages to state');
              for (const message of newMessages) {
                dispatch({ type: 'ADD_MESSAGE', payload: message });
              }
            }
          }
        } catch (error) {
          console.error('Error loading conversation messages:', error);
        }
      };
      
      loadConversationMessages();
    }
  }, [selectedUserId, state.currentUser, dispatch]);

  // Load friends and messages when component mounts
  useEffect(() => {
    const loadData = async () => {
      if (state.currentUser && state.isAuthenticated) {
        setIsLoading(true);
        try {
          console.log('Loading friends for user:', state.currentUser.name);
          
          // Load friends list
          const friendsResponse = await friendRequestAPI.getFriends();
          if (friendsResponse.friends) {
            console.log('Loaded friends:', friendsResponse.friends);
            dispatch({ type: 'SET_USERS', payload: friendsResponse.friends });
            
            // Load messages for all friends
            const allMessages = [];
            for (const friend of friendsResponse.friends) {
              try {
                console.log(`Loading messages for friend: ${friend.name} (${friend._id})`);
                const messagesResponse = await messagesAPI.getMessages(friend._id);
                
                if (messagesResponse.messages && messagesResponse.messages.length > 0) {
                  // Format messages to match frontend expectations
                  const formattedMessages = messagesResponse.messages.map(msg => ({
                    _id: msg._id,
                    content: msg.content,
                    senderId: msg.senderId._id || msg.senderId,
                    receiverId: msg.receiverId._id || msg.receiverId,
                    timestamp: msg.createdAt || msg.timestamp,
                    messageType: msg.messageType || 'text'
                  }));
                  allMessages.push(...formattedMessages);
                  console.log(`Added ${formattedMessages.length} messages for ${friend.name}`);
                }
              } catch (error) {
                console.error(`Error loading messages for ${friend.name}:`, error);
              }
            }
            
            // Add all messages to state (avoid duplicates)
            if (allMessages.length > 0) {
              const existingMessageIds = state.messages.map(m => m._id);
              const newMessages = allMessages.filter(msg => !existingMessageIds.includes(msg._id));
              
              console.log('✅ Total messages loaded from database:', allMessages.length);
              console.log('✅ New messages to add:', newMessages.length);
              console.log('✅ Existing messages in state:', state.messages.length);
              
              if (newMessages.length > 0) {
                console.log('✅ Adding new messages to state:', newMessages.length);
                for (const message of newMessages) {
                  dispatch({ type: 'ADD_MESSAGE', payload: message });
                }
              } else if (state.messages.length === 0 && allMessages.length > 0) {
                // If no messages in state but we have messages from database, set them all
                console.log('✅ Setting all messages from database to state');
                dispatch({ type: 'SET_MESSAGES', payload: allMessages });
              }
            }
          }
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadData();
  }, [state.currentUser, state.isAuthenticated, dispatch]);

  // Get conversations
  console.log('Current users in state:', state.users);
  console.log('Current user:', state.currentUser);
  console.log('All messages in state:', state.messages);
  console.log('Selected user ID:', selectedUserId);
  
  const conversations = state.users
    .filter(user => String(user._id) !== String(state.currentUser?._id || state.currentUser?.id))
    .map(user => {
      const userMessages = state.messages.filter(m => {
        // Convert all IDs to strings for comparison
        const senderId = String(m.senderId);
        const receiverId = String(m.receiverId);
        const userId = String(user._id);
        const currentUserId = String(state.currentUser?._id || state.currentUser?.id);
        
        const isMatch = (senderId === userId && receiverId === currentUserId) ||
                       (senderId === currentUserId && receiverId === userId);
        
        return isMatch;
      });

      return {
        user,
        messages: userMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
        lastMessage: userMessages[userMessages.length - 1],
        unreadCount: userMessages.filter(m => {
          const senderId = String(m.senderId);
          const userId = String(user._id);
          return senderId === userId && !m.isRead;
        }).length
      };
    })
    .filter(conv => true) // Show all friends
    .sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
    });

  const selectedConversation = conversations.find(conv => String(conv.user._id) === String(selectedUserId));
  
  // Auto-deduplicate messages when they change
  useEffect(() => {
    if (state.messages.length > 0) {
      const uniqueMessages = [];
      const seen = new Set();
      
      // Sort messages by timestamp to keep the latest one
      const sortedMessages = [...state.messages].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      sortedMessages.forEach(msg => {
        const key = `${msg.content}_${msg.senderId}_${msg.receiverId}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueMessages.push(msg);
        }
      });
      
      // Sort back by timestamp
      uniqueMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Only update if there are actually duplicates
      if (uniqueMessages.length !== state.messages.length) {
        console.log(`🔄 Auto-removed ${state.messages.length - uniqueMessages.length} duplicate messages`);
        dispatch({ type: 'SET_MESSAGES', payload: uniqueMessages });
      }
    }
  }, [state.messages.length]);

  // Mark messages as read when conversation is viewed
  useEffect(() => {
    if (selectedUserId && state.messages.length > 0) {
      const messagesToMark = state.messages.filter(m => {
        const senderId = String(m.senderId);
        const receiverId = String(m.receiverId);
        const userId = String(selectedUserId);
        const currentUserId = String(state.currentUser?._id || state.currentUser?.id);
        
        return (senderId === userId && receiverId === currentUserId) ||
               (senderId === currentUserId && receiverId === userId);
      });
      
      messagesToMark.forEach(msg => {
        if (!msg.isRead && String(msg.senderId) !== String(state.currentUser?._id || state.currentUser?.id)) {
          dispatch({
            type: 'UPDATE_MESSAGE',
            payload: {
              tempId: msg._id,
              realMessage: { ...msg, isRead: true }
            }
          });
        }
      });
    }
  }, [selectedUserId, state.messages.length]);
  
  console.log('🎯 Selected user ID:', selectedUserId);
  console.log('🎯 Available conversations:', conversations.map(c => ({ id: c.user._id, name: c.user.name })));
  console.log('🎯 Selected conversation:', selectedConversation);
  console.log('🎯 Selected conversation messages:', selectedConversation?.messages);
  
  // Debug function to test message loading
  window.debugChat = {
    loadMessages: async (userId) => {
      try {
        const response = await messagesAPI.getMessages(userId);
        console.log('Debug - Messages for user', userId, ':', response);
        return response;
      } catch (error) {
        console.error('Debug - Error loading messages:', error);
      }
    },
    getState: () => {
      console.log('Debug - Current state:', {
        users: state.users,
        messages: state.messages,
        currentUser: state.currentUser,
        selectedUserId
      });
      return state;
    },
    reloadMessages: async () => {
      console.log('🔄 Manually reloading messages...');
      try {
        const friendsResponse = await friendRequestAPI.getFriends();
        if (friendsResponse.friends) {
          const allMessages = [];
          for (const friend of friendsResponse.friends) {
            try {
              console.log(`🔄 Loading messages for friend: ${friend.name} (${friend._id})`);
              const messagesResponse = await messagesAPI.getMessages(friend._id);
              console.log(`🔄 Messages response for ${friend.name}:`, messagesResponse);
              
              if (messagesResponse.messages && messagesResponse.messages.length > 0) {
                const formattedMessages = messagesResponse.messages.map(msg => ({
                  _id: msg._id,
                  content: msg.content,
                  senderId: msg.senderId._id || msg.senderId,
                  receiverId: msg.receiverId._id || msg.receiverId,
                  timestamp: msg.createdAt || msg.timestamp,
                  messageType: msg.messageType || 'text'
                }));
                allMessages.push(...formattedMessages);
                console.log(`🔄 Added ${formattedMessages.length} messages for ${friend.name}`);
              } else {
                console.log(`🔄 No messages found for ${friend.name}`);
              }
            } catch (error) {
              console.error(`Error loading messages for ${friend.name}:`, error);
            }
          }
          console.log('🔄 Total messages loaded:', allMessages);
          dispatch({ type: 'SET_MESSAGES', payload: allMessages });
        }
      } catch (error) {
        console.error('Error reloading messages:', error);
      }
    },
    clearMessages: () => {
      console.log('🗑️ Clearing all messages from state');
      dispatch({ type: 'SET_MESSAGES', payload: [] });
    },
    selectConversation: (userId) => {
      console.log('🎯 Manually selecting conversation for user:', userId);
      setSelectedUserId(userId);
    },
    getConversations: () => {
      console.log('📋 Current conversations:', conversations);
      return conversations;
    },
    removeDuplicates: () => {
      console.log('🔄 Removing duplicate messages...');
      const uniqueMessages = [];
      const seen = new Set();
      
      state.messages.forEach(msg => {
        const key = `${msg.content}_${msg.senderId}_${msg.receiverId}_${msg.timestamp}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueMessages.push(msg);
        }
      });
      
      console.log(`🔄 Removed ${state.messages.length - uniqueMessages.length} duplicate messages`);
      dispatch({ type: 'SET_MESSAGES', payload: uniqueMessages });
    },
    removeDuplicatesAdvanced: () => {
      console.log('🔄 Advanced duplicate removal...');
      const uniqueMessages = [];
      const seen = new Set();
      
      // Sort messages by timestamp to keep the latest one
      const sortedMessages = [...state.messages].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      sortedMessages.forEach(msg => {
        const key = `${msg.content}_${msg.senderId}_${msg.receiverId}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueMessages.push(msg);
        }
      });
      
      // Sort back by timestamp
      uniqueMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      console.log(`🔄 Removed ${state.messages.length - uniqueMessages.length} duplicate messages`);
      dispatch({ type: 'SET_MESSAGES', payload: uniqueMessages });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId || !state.currentUser) {
      console.log('Cannot send message:', {
        hasMessage: !!newMessage.trim(),
        hasSelectedUser: !!selectedUserId,
        hasCurrentUser: !!state.currentUser,
        selectedUserId,
        currentUserId: state.currentUser?.id
      });
      return;
    }

    console.log('Sending message:', {
      to: selectedUserId,
      from: state.currentUser.id,
      message: newMessage.trim()
    });

    // Send message via Socket.IO only
    socketService.sendMessage(selectedUserId, newMessage.trim());
    
    // Add message to local state immediately for instant UI feedback
    const newMessageObj = {
      _id: 'temp_' + Date.now().toString(),
      senderId: state.currentUser._id || state.currentUser.id,
      receiverId: selectedUserId,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      messageType: 'text',
      isSending: true,
      isDelivered: false,
      isRead: false
    };
    
    // Remove any existing temporary messages with the same content to prevent duplicates
    const existingTempMessages = state.messages.filter(msg => 
      msg.content === newMessage.trim() && 
      msg.isSending === true &&
      msg.senderId === newMessageObj.senderId &&
      msg.receiverId === newMessageObj.receiverId
    );
    
    if (existingTempMessages.length > 0) {
      console.log('🧹 Removing existing temporary messages:', existingTempMessages.length);
      existingTempMessages.forEach(msg => {
        dispatch({ type: 'REMOVE_MESSAGE', payload: msg._id });
      });
    }
    
    // Also remove any existing confirmed messages with the same content (in case of rapid sending)
    const existingConfirmedMessages = state.messages.filter(msg => 
      msg.content === newMessage.trim() && 
      !msg.isSending &&
      msg.senderId === newMessageObj.senderId &&
      msg.receiverId === newMessageObj.receiverId &&
      Math.abs(new Date(msg.timestamp) - new Date()) < 2000 // Within 2 seconds
    );
    
    if (existingConfirmedMessages.length > 0) {
      console.log('🧹 Removing recent confirmed messages:', existingConfirmedMessages.length);
      existingConfirmedMessages.forEach(msg => {
        dispatch({ type: 'REMOVE_MESSAGE', payload: msg._id });
      });
    }
    
    console.log('📤 Adding temporary message:', newMessageObj);
    dispatch({ type: 'ADD_MESSAGE', payload: newMessageObj });
    
    // Set timeout to remove temporary message if not confirmed within 10 seconds
    setTimeout(() => {
      const tempMessage = state.messages.find(msg => msg._id === newMessageObj._id && msg.isSending);
      if (tempMessage) {
        console.log('Removing unconfirmed temporary message');
        dispatch({ type: 'REMOVE_MESSAGE', payload: newMessageObj._id });
      }
    }, 10000);
    
    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Conversations List */}
      <div className="w-80 border-r border-slate-700/50 flex flex-col bg-slate-800/30 backdrop-blur-xl shadow-2xl">
        <div className="p-6 border-b border-slate-700/50">
          <h1 className="text-2xl font-bold text-white mb-6 tracking-tight bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Messages
          </h1>
          
          {/* Search */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search conversations..."
              className="block w-full pl-12 pr-4 py-3 bg-slate-700/40 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 text-sm transition-all duration-300 hover:bg-slate-700/60"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400">Loading conversations...</p>
              </div>
            </div>
          ) : conversations.length > 0 ? (
            <div className="px-4 py-2 space-y-2">
              {conversations.map((conversation) => (
                <button
                  key={conversation.user._id}
                  onClick={() => setSelectedUserId(conversation.user._id)}
                  className={`w-full p-4 text-left rounded-xl transition-all duration-300 group ${
                    String(selectedUserId) === String(conversation.user._id) 
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 shadow-lg shadow-cyan-500/10' 
                      : 'hover:bg-slate-700/40 hover:shadow-lg hover:shadow-slate-500/5'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      {conversation.user.avatar ? (
                        <img
                          src={conversation.user.avatar.startsWith('http') ? conversation.user.avatar : `http://localhost:5000${conversation.user.avatar}`}
                          alt={conversation.user.name}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-slate-600/50 group-hover:ring-cyan-400/50 transition-all duration-300"
                          onError={(e) => {
                            console.log('Conversation avatar load error:', e.target.src);
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-14 h-14 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center ring-2 ring-slate-600/50 group-hover:ring-cyan-400/50 transition-all duration-300 ${conversation.user.avatar ? 'hidden' : ''}`}>
                        <User className="w-7 h-7 text-slate-300" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800"></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-base font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
                          {conversation.user.name}
                        </p>
                        {conversation.lastMessage && (
                          <p className="text-xs text-slate-400 font-medium">
                            {new Date(conversation.lastMessage.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                      
                      {conversation.lastMessage ? (
                        <p className="text-sm text-slate-300 truncate group-hover:text-slate-200 transition-colors">
                          {conversation.lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-400 italic">No messages yet</p>
                      )}
                      
                      {conversation.unreadCount > 0 && (
                        <div className="mt-2">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold leading-none text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-lg">
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
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8" />
                </div>
                <p className="text-lg font-medium text-slate-300 mb-2">No friends yet</p>
                <p className="text-sm text-slate-400 mb-4">Add friends from the Friends page to start chatting!</p>
                <button 
                  onClick={() => window.location.href = '/friends'}
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-4 py-2 rounded-lg text-sm transition-all duration-300"
                >
                  Go to Friends
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-800/20 to-slate-900/40 backdrop-blur-xl">
        {selectedConversation || selectedUserId ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {selectedConversation?.user?.avatar ? (
                      <img
                        src={selectedConversation.user.avatar.startsWith('http') ? selectedConversation.user.avatar : `http://localhost:5000${selectedConversation.user.avatar}`}
                        alt={selectedConversation.user.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-600/50"
                        onError={(e) => {
                          console.log('Chat header avatar load error:', e.target.src);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center ring-2 ring-slate-600/50 ${selectedConversation?.user?.avatar ? 'hidden' : ''}`}>
                      <User className="w-6 h-6 text-slate-300" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800"></div>
                  </div>
                  
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {selectedConversation?.user?.name || 'Unknown User'}
                    </h2>
                    <p className="text-sm text-green-400 flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      Online
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button className="p-3 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-3 text-slate-400 hover:text-green-400 hover:bg-slate-700/50 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
                    <Video className="w-5 h-5" />
                  </button>
                  <button className="p-3 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-xl transition-all duration-300 hover:shadow-lg">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" onScroll={() => {
              // Mark messages as read when scrolled to bottom
              const messagesContainer = document.querySelector('.flex-1.overflow-y-auto');
              if (messagesContainer) {
                const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
                if (scrollTop + clientHeight >= scrollHeight - 10) {
                  // Mark all messages in this conversation as read
                  const messagesToMark = state.messages.filter(m => {
                    const senderId = String(m.senderId);
                    const receiverId = String(m.receiverId);
                    const userId = String(selectedUserId);
                    const currentUserId = String(state.currentUser?._id || state.currentUser?.id);
                    
                    return (senderId === userId && receiverId === currentUserId) ||
                           (senderId === currentUserId && receiverId === userId);
                  });
                  
                  messagesToMark.forEach(msg => {
                    if (!msg.isRead && String(msg.senderId) !== String(state.currentUser?._id || state.currentUser?.id)) {
                      dispatch({
                        type: 'UPDATE_MESSAGE',
                        payload: {
                          tempId: msg._id,
                          realMessage: { ...msg, isRead: true }
                        }
                      });
                    }
                  });
                }
              }
            }}>
              {(() => {
                // Get messages for the selected user from global state if selectedConversation is null
                const messagesToShow = selectedConversation?.messages || 
                  (selectedUserId ? state.messages.filter(m => {
                    const senderId = String(m.senderId);
                    const receiverId = String(m.receiverId);
                    const userId = String(selectedUserId);
                    const currentUserId = String(state.currentUser?._id || state.currentUser?.id);
                    
                    return (senderId === userId && receiverId === currentUserId) ||
                           (senderId === currentUserId && receiverId === userId);
                  }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) : []);
                
                return messagesToShow.length > 0 ? (
                  messagesToShow.map((message, index) => {
                    const isFromCurrentUser = String(message.senderId) === String(state.currentUser?._id || state.currentUser?.id);
                    const previousMessage = index > 0 ? messagesToShow[index - 1] : null;
                    const showAvatar = !previousMessage || 
                      String(previousMessage.senderId) !== String(message.senderId) ||
                      new Date(message.timestamp) - new Date(previousMessage.timestamp) > 300000; // 5 minutes
                    
                    // Get user info for avatar
                    const messageUserId = isFromCurrentUser ? 
                      (state.currentUser?._id || state.currentUser?.id) : 
                      (String(message.senderId) === String(state.currentUser?._id || state.currentUser?.id) ? 
                        selectedUserId : message.senderId);
                    
                    const userInfo = isFromCurrentUser ? 
                      state.currentUser : 
                      (selectedConversation?.user || 
                       state.users.find(user => String(user._id) === String(messageUserId)) ||
                       conversations.find(conv => String(conv.user._id) === String(messageUserId))?.user);
                    
                    
                    return (
                      <div
                        key={message._id || message.id}
                        className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}
                      >
                        <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isFromCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          {/* Avatar for received messages */}
                          {!isFromCurrentUser && showAvatar && (
                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                              {userInfo?.avatar ? (
                                <img
                                  src={userInfo.avatar.startsWith('http') ? userInfo.avatar : `http://localhost:5000${userInfo.avatar}`}
                                  alt={userInfo.name || 'User'}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    console.log('Avatar load error:', e.target.src);
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className={`w-full h-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center ${userInfo?.avatar ? 'hidden' : ''}`}>
                                <User className="w-4 h-4 text-slate-300" />
                              </div>
                            </div>
                          )}
                          
                          {/* Avatar for sent messages */}
                          {isFromCurrentUser && showAvatar && (
                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                              {userInfo?.avatar ? (
                                <img
                                  src={userInfo.avatar.startsWith('http') ? userInfo.avatar : `http://localhost:5000${userInfo.avatar}`}
                                  alt={userInfo.name || 'You'}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    console.log('Avatar load error:', e.target.src);
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className={`w-full h-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center ${userInfo?.avatar ? 'hidden' : ''}`}>
                                <User className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          )}
                          
                          {/* Spacer for messages without avatar */}
                          {!showAvatar && (
                            <div className="w-8 h-8 flex-shrink-0"></div>
                          )}
                          
                          {/* Message bubble */}
                          <div className={`px-4 py-3 rounded-2xl shadow-lg transition-all duration-300 group-hover:shadow-xl ${
                            isFromCurrentUser 
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-br-md' 
                              : 'bg-slate-700/80 text-slate-100 rounded-bl-md backdrop-blur-sm'
                          }`}>
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            <div className={`flex items-center justify-between mt-2 text-xs ${
                              isFromCurrentUser ? 'text-cyan-100' : 'text-slate-400'
                            }`}>
                              <div className="flex items-center">
                                {new Date(message.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-slate-400 mt-8">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                );
              })()}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-700/50 text-slate-300 px-4 py-3 rounded-lg">
                    <div className="flex items-center space-x-1">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs ml-2">typing...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-6 border-t border-slate-700/50 bg-slate-800/30 backdrop-blur-xl shadow-lg">
              <div className="flex items-end space-x-4">
                <button className="p-3 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 mb-1">
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <div className="flex-1 relative group">
                  <textarea
                    value={newMessage}
                    onChange={handleTyping}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full resize-none bg-slate-700/40 border border-slate-600/50 rounded-xl px-4 py-3 pr-16 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all duration-300 hover:bg-slate-700/60"
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    <button className="p-1 text-slate-400 hover:text-cyan-400 transition-colors">
                      <Smile className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <MessageCircle className="w-10 h-10 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Select a conversation</h2>
              <p className="text-slate-300 text-lg">Choose from your existing conversations or start a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
