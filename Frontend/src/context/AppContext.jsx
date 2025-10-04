import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, skillsAPI, sessionsAPI, messagesAPI, reviewsAPI, matchesAPI, notificationsAPI } from '../services/api';

// Initial state
const initialState = {
  currentUser: null,
  users: [],
  sessions: [],
  messages: [],
  reviews: [],
  notifications: [],
  matches: [],
  conversations: [],
  isAuthenticated: false,
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        currentUser: action.payload,
        isAuthenticated: true,
      };
    case 'LOGOUT':
      return {
        ...state,
        currentUser: null,
        isAuthenticated: false,
      };
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
    case 'ADD_SESSION':
      return {
        ...state,
        sessions: [...state.sessions, action.payload],
      };
    case 'UPDATE_SESSION':
      return {
        ...state,
        sessions: state.sessions.map((session) =>
          session.id === action.payload.id
            ? { ...session, ...action.payload.updates }
            : session
        ),
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
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
    case 'SET_CONVERSATIONS':
      return {
        ...state,
        conversations: action.payload,
      };
    case 'SET_MESSAGES':
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
        });
    }
  }, []);

  // API functions
  const api = {
    // Auth functions
    register: async (userData) => {
      try {
        const response = await authAPI.register(userData);
        localStorage.setItem('token', response.token);
        dispatch({ type: 'LOGIN', payload: response.user });
        return response;
      } catch (error) {
        throw error;
      }
    },

    login: async (credentials) => {
      try {
        const response = await authAPI.login(credentials);
        localStorage.setItem('token', response.token);
        dispatch({ type: 'LOGIN', payload: response.user });
        return response;
      } catch (error) {
        throw error;
      }
    },

    logout: async () => {
      try {
        await authAPI.logout();
        localStorage.removeItem('token');
        dispatch({ type: 'LOGOUT' });
      } catch (error) {
        // Even if API call fails, clear local state
        localStorage.removeItem('token');
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
