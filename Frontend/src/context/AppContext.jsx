import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, skillsAPI, sessionsAPI, messagesAPI, reviewsAPI, matchesAPI, notificationsAPI } from '../services/api';
import socketService from '../services/socketService';

// Initial state
const initialState = {
  currentUser: null,
  users: [],
  sessions: [],
  messages: JSON.parse(localStorage.getItem('messages') || '[]'),
  reviews: [],
  notifications: [],
  matches: [],
  conversations: [],
  friends: [],
  isAuthenticated: false,
  authLoading: true,  // true until the initial profile check completes
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      console.log('LOGIN reducer called with payload:', action.payload);
      return {
        ...state,
        currentUser: action.payload,
        isAuthenticated: true,
        authLoading: false,
      };
    case 'LOGOUT':
      localStorage.removeItem('messages');
      return {
        ...state,
        currentUser: null,
        isAuthenticated: false,
        authLoading: false,
        messages: [],
      };
    case 'AUTH_RESOLVED':
      // Auth check finished but user was not logged in
      return { ...state, authLoading: false };

    case 'UPDATE_PROFILE':
      if (!state.currentUser) return state;
      console.log("UPDATE_PROFILE reducer - payload:", action.payload);
      console.log("UPDATE_PROFILE reducer - currentUser before:", state.currentUser);
      const updatedUser = { ...state.currentUser, ...action.payload };
      console.log("UPDATE_PROFILE reducer - currentUser after:", updatedUser);
      return {
        ...state,
        currentUser: updatedUser,
      };
    case 'SET_BLOCKED_USERS':
      if (!state.currentUser) return state;
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          blockedUsers: action.payload,
        },
      };
    case 'ADD_SESSION':
      return {
        ...state,
        sessions: [...state.sessions, action.payload],
      };
    case 'UPDATE_SESSION':
      return {
        ...state,
        sessions: state.sessions.map((session) => {
          const sessionId = session._id || session.id;
          return sessionId === action.payload.id || sessionId?.toString() === action.payload.id?.toString()
            ? { ...session, ...action.payload.updates }
            : session;
        }),
      };
    case 'ADD_MESSAGE':
      const newMessages = [...state.messages, action.payload];
      localStorage.setItem('messages', JSON.stringify(newMessages));
      return {
        ...state,
        messages: newMessages,
      };
    case 'UPDATE_MESSAGE':
      const updatedMessages = state.messages.map(msg => 
        msg._id === action.payload.tempId ? action.payload.realMessage : msg
      );
      localStorage.setItem('messages', JSON.stringify(updatedMessages));
      return {
        ...state,
        messages: updatedMessages,
      };
    case 'UPSERT_MESSAGE': {
      let upsertedMessages;
      if (state.messages.some(msg => msg._id === action.payload._id)) {
        upsertedMessages = state.messages.map(msg => msg._id === action.payload._id ? action.payload : msg);
      } else {
        upsertedMessages = [...state.messages, action.payload];
      }
      localStorage.setItem('messages', JSON.stringify(upsertedMessages));
      return {
        ...state,
        messages: upsertedMessages,
      };
    }
    case 'CONFIRM_MESSAGE': {
      const formattedMessage = action.payload;
      let confirmMessages = [...state.messages];
      
      const tempMsgIndex = confirmMessages.findIndex(
        (msg) =>
          msg.content === formattedMessage.content &&
          msg.isSending === true &&
          msg.senderId === formattedMessage.senderId &&
          msg.receiverId === formattedMessage.receiverId
      );

      if (tempMsgIndex !== -1) {
        confirmMessages[tempMsgIndex] = formattedMessage;
      } else {
        const exists = confirmMessages.some(
          (msg) =>
            msg._id === formattedMessage._id ||
            (msg.content === formattedMessage.content &&
              msg.senderId === formattedMessage.senderId &&
              msg.receiverId === formattedMessage.receiverId &&
              Math.abs(new Date(msg.timestamp) - new Date(formattedMessage.timestamp)) < 5000)
        );
        if (!exists) {
          confirmMessages.push(formattedMessage);
        }
      }
      
      localStorage.setItem('messages', JSON.stringify(confirmMessages));
      return {
        ...state,
        messages: confirmMessages,
      };
    }
    case 'REMOVE_MESSAGE':
      const filteredMessages = state.messages.filter(msg => msg._id !== action.payload);
      localStorage.setItem('messages', JSON.stringify(filteredMessages));
      return {
        ...state,
        messages: filteredMessages,
      };
    case 'ADD_REVIEW':
      return {
        ...state,
        reviews: [...state.reviews, action.payload],
      };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map((notification) =>
          notification.id === action.payload
            ? { ...notification, read: true }
            : notification
        ),
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      };
    case 'SET_USERS':
      return {
        ...state,
        users: action.payload,
      };
    case 'SET_MATCHES':
      return {
        ...state,
        matches: action.payload,
      };
    case 'SET_SESSIONS':
      return {
        ...state,
        sessions: action.payload,
      };
    case 'SET_FRIENDS':
      return {
        ...state,
        friends: action.payload,
      };
    case 'ADD_FRIEND':
      // Avoid duplicate
      if (state.friends.some(f => (f._id || f.id)?.toString() === (action.payload._id || action.payload.id)?.toString())) {
        return state;
      }
      return {
        ...state,
        friends: [...state.friends, action.payload],
      };
    case 'SET_CONVERSATIONS':
      return {
        ...state,
        conversations: action.payload,
      };
    case 'SET_MESSAGES':
      localStorage.setItem('messages', JSON.stringify(action.payload));
      return {
        ...state,
        messages: action.payload,
      };
    case 'SET_REVIEWS':
      return {
        ...state,
        reviews: action.payload,
      };
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
      };
    default:
      return state;
  }
};

// Create context
const AppContext = createContext(null);

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user profile
      authAPI.getProfile()
        .then(response => {
          dispatch({ type: 'LOGIN', payload: response.user });
        })
        .catch(() => {
          // Token is invalid, remove it
          localStorage.removeItem('token');
        })
        .finally(() => {
          dispatch({ type: 'AUTH_RESOLVED' });
        });
    } else {
      // No token — resolve immediately
      dispatch({ type: 'AUTH_RESOLVED' });
    }
  }, []);

  // Manage socket connection based on auth state
  // Manage socket connection based on auth state
  useEffect(() => {
    if (state.isAuthenticated && localStorage.getItem('token')) {
      const token = localStorage.getItem('token');
      console.log("AppContext: connecting socket with token");
      socketService.connect(token);
      
      // Global listeners for real-time updates
      
      // 1. Session Created
      socketService.onSessionCreated(({ session }) => {
          if (session) {
             console.log("Socket: New session received", session);
             dispatch({ type: 'ADD_SESSION', payload: session });
             // Refresh notifications to show badge
             notificationsAPI.getNotifications().then(res => {
                if (res.notifications) {
                  dispatch({ type: 'SET_NOTIFICATIONS', payload: res.notifications });
                }
             }).catch(err => console.error("Failed to fetch notifications:", err));
          }
      });

      // 2. Session Updated
      socketService.onSessionUpdated(({ session }) => {
           if (session) {
              console.log("Socket: Session updated", session);
              dispatch({ type: 'UPDATE_SESSION', payload: { id: session._id, updates: session } });
              // Refresh notifications (e.g. session confirmed)
              notificationsAPI.getNotifications().then(res => {
                if (res.notifications) {
                  dispatch({ type: 'SET_NOTIFICATIONS', payload: res.notifications });
                }
             }).catch(err => console.error("Failed to fetch notifications:", err));
           }
      });
      
    } else if (!state.isAuthenticated) {
      console.log("AppContext: disconnecting socket");
      socketService.disconnect();
    }
  }, [state.isAuthenticated]);

  // API functions
  const api = {
    // Auth functions
    register: async (userData) => {
      try {
        const response = await authAPI.register(userData);
        // Do NOT log in yet — user must verify their email first
        // The response has { requiresVerification: true, email }
        return response;
      } catch (error) {
        throw error;
      }
    },

    login: async (credentials) => {
      try {
        console.log('Login attempt with credentials:', credentials);
        const response = await authAPI.login(credentials);
        console.log('Login response:', response);
        // Store both tokens (accessToken stored under 'token' for legacy compatibility)
        localStorage.setItem('token', response.accessToken || response.token);
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
        dispatch({ type: 'LOGIN', payload: response.user });
        console.log('User set in context:', response.user);
        return response;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },

    logout: async () => {
      try {
        await authAPI.logout();
      } catch (_) {
        // Proceed with logout even if API call fails
      } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        dispatch({ type: 'LOGOUT' });
      }
    },

    updateProfile: async (updates) => {
      try {
        const response = await authAPI.updateProfile(updates);
        dispatch({ type: 'UPDATE_PROFILE', payload: response.user });
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Skills functions
    getUsers: async (filters = {}) => {
      try {
        const response = await skillsAPI.getUsers(filters);
        dispatch({ type: 'SET_USERS', payload: response.users });
        return response;
      } catch (error) {
        throw error;
      }
    },

    getUserById: async (userId) => {
      try {
        return await skillsAPI.getUserById(userId);
      } catch (error) {
        throw error;
      }
    },

    addSkill: async (userId, skillData) => {
      try {
        const response = await skillsAPI.addSkill(userId, skillData);
        // Refresh current user profile if it's the same user
        if (state.currentUser && state.currentUser._id === userId) {
          const profileResponse = await authAPI.getProfile();
          dispatch({ type: 'LOGIN', payload: profileResponse.user });
        }
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Sessions functions
    getSessions: async (filters = {}) => {
      try {
        const response = await sessionsAPI.getSessions(filters);
        dispatch({ type: 'SET_SESSIONS', payload: response.sessions });
        return response;
      } catch (error) {
        throw error;
      }
    },

    bookSession: async (sessionData) => {
      try {
        const response = await sessionsAPI.bookSession(sessionData);
        dispatch({ type: 'ADD_SESSION', payload: response.session });
        return response;
      } catch (error) {
        throw error;
      }
    },

    updateSession: async (sessionId, updates) => {
      try {
        const response = await sessionsAPI.updateSession(sessionId, updates);
        dispatch({ type: 'UPDATE_SESSION', payload: { id: sessionId, updates } });
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Messages functions
    getConversations: async () => {
      try {
        const response = await messagesAPI.getConversations();
        dispatch({ type: 'SET_CONVERSATIONS', payload: response.conversations });
        return response;
      } catch (error) {
        throw error;
      }
    },

    getMessages: async (conversationId) => {
      try {
        const response = await messagesAPI.getMessages(conversationId);
        dispatch({ type: 'SET_MESSAGES', payload: response.messages });
        return response;
      } catch (error) {
        throw error;
      }
    },

    sendMessage: async (conversationId, messageData) => {
      try {
        const response = await messagesAPI.sendMessage(conversationId, messageData);
        dispatch({ type: 'ADD_MESSAGE', payload: response.message });
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Reviews functions
    getReviews: async (userId) => {
      try {
        const response = await reviewsAPI.getReviews(userId);
        dispatch({ type: 'SET_REVIEWS', payload: response.reviews });
        return response;
      } catch (error) {
        throw error;
      }
    },

    getMyReviews: async () => {
      try {
        const [receivedResp, givenResp] = await Promise.all([
          reviewsAPI.getMyReviews('received'),
          reviewsAPI.getMyReviews('given')
        ]);
        const combined = [...receivedResp.reviews, ...givenResp.reviews];
        const uniqueReviews = Array.from(new Map(combined.map(r => [r._id || r.id, r])).values());
        dispatch({ type: 'SET_REVIEWS', payload: uniqueReviews });
        return uniqueReviews;
      } catch (error) {
        throw error;
      }
    },

    createReview: async (reviewData) => {
      try {
        const response = await reviewsAPI.createReview(reviewData);
        dispatch({ type: 'ADD_REVIEW', payload: response.review });
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Matches functions
    getMatches: async () => {
      try {
        const response = await matchesAPI.getMatches();
        dispatch({ type: 'SET_MATCHES', payload: response.matches });
        return response;
      } catch (error) {
        throw error;
      }
    },

    generateMatches: async () => {
      try {
        const response = await matchesAPI.generateMatches();
        dispatch({ type: 'SET_MATCHES', payload: response.matches });
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Notifications functions
    getNotifications: async () => {
      try {
        const response = await notificationsAPI.getNotifications();
        dispatch({ type: 'SET_NOTIFICATIONS', payload: response.notifications });
        return response;
      } catch (error) {
        throw error;
      }
    },

    markNotificationRead: async (notificationId) => {
      try {
        await notificationsAPI.markNotificationRead(notificationId);
        dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notificationId });
      } catch (error) {
        throw error;
      }
    },
  };

  return (
    <AppContext.Provider value={{ state, dispatch, api }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
