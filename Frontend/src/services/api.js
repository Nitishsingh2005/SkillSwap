const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  try {
    console.log('Making API request to:', url);
    console.log('Request config:', config);
    
    const response = await fetch(url, config);
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response received:', text.substring(0, 200));
      throw new Error(`Server returned non-JSON response. Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP Error: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  register: async (userData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  
  login: async (credentials) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  
  getProfile: async () => {
    return apiRequest('/auth/profile');
  },
  
  updateProfile: async (updates) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  
  // Portfolio Links
  addPortfolioLink: async (linkData) => {
    return apiRequest('/auth/portfolio-links', {
      method: 'POST',
      body: JSON.stringify(linkData),
    });
  },
  
  removePortfolioLink: async (linkId) => {
    return apiRequest(`/auth/portfolio-links/${linkId}`, {
      method: 'DELETE',
    });
  },
  
  // Availability
  addAvailability: async (availabilityData) => {
    return apiRequest('/auth/availability', {
      method: 'POST',
      body: JSON.stringify(availabilityData),
    });
  },
  
  removeAvailability: async (slotId) => {
    return apiRequest(`/auth/availability/${slotId}`, {
      method: 'DELETE',
    });
  },
  
  logout: async () => {
    return apiRequest('/auth/logout', {
      method: 'POST',
    });
  },
};

// Skills API
export const skillsAPI = {
  getUsers: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters);
    return apiRequest(`/skills/users?${queryParams}`);
  },
  
  getUserById: async (userId) => {
    return apiRequest(`/skills/users/${userId}`);
  },
  
  addSkill: async (userId, skillData) => {
    return apiRequest(`/skills/users/${userId}/skills`, {
      method: 'POST',
      body: JSON.stringify(skillData),
    });
  },
  
  updateSkill: async (userId, skillId, updates) => {
    return apiRequest(`/skills/users/${userId}/skills/${skillId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  
  removeSkill: async (userId, skillId) => {
    return apiRequest(`/skills/users/${userId}/skills/${skillId}`, {
      method: 'DELETE',
    });
  },
};

// Sessions API
export const sessionsAPI = {
  getSessions: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters);
    return apiRequest(`/requests/sessions?${queryParams}`);
  },
  
  bookSession: async (sessionData) => {
    return apiRequest('/requests/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  },
  
  updateSession: async (sessionId, updates) => {
    return apiRequest(`/requests/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  
  cancelSession: async (sessionId) => {
    return apiRequest(`/requests/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  },
};

// Messages API
export const messagesAPI = {
  getConversations: async () => {
    return apiRequest('/messages/conversations');
  },
  
  getMessages: async (conversationId) => {
    return apiRequest(`/messages/conversations/${conversationId}/messages`);
  },
  
  sendMessage: async (conversationId, messageData) => {
    return apiRequest(`/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  },
  
  markMessageRead: async (messageId) => {
    return apiRequest(`/messages/${messageId}/read`, {
      method: 'PUT',
    });
  },
};

// Reviews API
export const reviewsAPI = {
  getReviews: async (userId) => {
    return apiRequest(`/reviews/${userId}`);
  },
  
  createReview: async (reviewData) => {
    return apiRequest('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  },
};

// Matches API
export const matchesAPI = {
  getMatches: async () => {
    return apiRequest('/matches');
  },
  
  generateMatches: async () => {
    return apiRequest('/matches/generate', {
      method: 'POST',
    });
  },
  
  likeMatch: async (matchId) => {
    return apiRequest(`/matches/${matchId}/like`, {
      method: 'PUT',
    });
  },
  
  passMatch: async (matchId) => {
    return apiRequest(`/matches/${matchId}/pass`, {
      method: 'PUT',
    });
  },
};

// Notifications API
export const notificationsAPI = {
  getNotifications: async () => {
    return apiRequest('/notifications');
  },
  
  markNotificationRead: async (notificationId) => {
    return apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  },
  
  markAllNotificationsRead: async () => {
    return apiRequest('/notifications/read-all', {
      method: 'PUT',
    });
  },
};
