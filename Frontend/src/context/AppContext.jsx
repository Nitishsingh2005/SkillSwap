import React, { createContext, useContext, useReducer } from 'react';

// Initial state
const initialState = {
  currentUser: null,
  users: [],
  sessions: [],
  messages: [],
  reviews: [],
  notifications: [],
  matches: [],
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
      return {
        ...state,
        currentUser: { ...state.currentUser, ...action.payload },
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
    default:
      return state;
  }
};

// Create context
const AppContext = createContext(null);

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
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
