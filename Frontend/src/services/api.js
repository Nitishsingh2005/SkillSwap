const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

// Helper function to get auth token (always reads latest from storage)
const getAuthToken = () => {
  return localStorage.getItem("token");
};

// Attempt to silently refresh the access token using the stored refreshToken
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) throw new Error("No refresh token available");

  const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) throw new Error("Refresh failed");
  const data = await response.json();
  // Store both keys so legacy code still works
  localStorage.setItem("token", data.accessToken);
  return data.accessToken;
};

// Helper function to make API requests (with automatic token refresh on 401)
const apiRequest = async (endpoint, options = {}, _retry = false) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const config = {
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  try {
    console.log(`API Request: ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, config);
    console.log("Response status:", response.status);

    // Auto-refresh on 401 (only one retry to avoid infinite loops)
    if (response.status === 401 && !_retry) {
      try {
        await refreshAccessToken();
        return apiRequest(endpoint, options, true);
      } catch {
        // Refresh failed — let the 401 propagate so the app can redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        throw new Error("Session expired. Please log in again.");
      }
    }

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Non-JSON response received:", text.substring(0, 200));
      throw new Error(
        `Server returned non-JSON response. Status: ${response.status}`
      );
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP Error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};


// Auth API
export const authAPI = {
  register: async (userData) => {
    return apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials) => {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  verifyEmail: async (token) => {
    return apiRequest(`/auth/verify-email/${token}`);
  },

  resendVerification: async (email) => {
    return apiRequest("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  getProfile: async () => {
    return apiRequest("/auth/profile");
  },

  updateProfile: async (updates) => {
    return apiRequest("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  // Profile Picture Upload
  uploadProfilePicture: async (formData) => {
    const url = `${import.meta.env.VITE_API_URL}/api/auth/upload-avatar`;
    const token = getAuthToken();

    const config = {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        // Don't set Content-Type for FormData, let browser set it with boundary
      },
      body: formData,
    };

    try {
      console.log("Making profile picture upload request to:", url);

      const response = await fetch(url, config);
      console.log("Upload response status:", response.status);

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response received:", text.substring(0, 200));
        throw new Error(
          `Server returned non-JSON response. Status: ${response.status}`
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP Error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error("Profile picture upload error:", error);
      throw error;
    }
  },

  // Profile Picture Remove
  removeProfilePicture: async () => {
    return apiRequest("/auth/remove-avatar", {
      method: "DELETE",
    });
  },

  // Portfolio Links
  addPortfolioLink: async (linkData) => {
    return apiRequest("/auth/portfolio-links", {
      method: "POST",
      body: JSON.stringify(linkData),
    });
  },

  removePortfolioLink: async (linkId) => {
    return apiRequest(`/auth/portfolio-links/${linkId}`, {
      method: "DELETE",
    });
  },

  // Availability
  addAvailability: async (availabilityData) => {
    return apiRequest("/auth/availability", {
      method: "POST",
      body: JSON.stringify(availabilityData),
    });
  },

  removeAvailability: async (slotId) => {
    return apiRequest(`/auth/availability/${slotId}`, {
      method: "DELETE",
    });
  },

  logout: async () => {
    return apiRequest("/auth/logout", {
      method: "POST",
    });
  },
};

// Users API (Block/Report functionality)
export const usersAPI = {
  blockUser: async (userId) => {
    return apiRequest(`/users/${userId}/block`, {
      method: "POST",
    });
  },

  unblockUser: async (userId) => {
    return apiRequest(`/users/${userId}/unblock`, {
      method: "POST",
    });
  },

  getBlockedUsers: async () => {
    return apiRequest("/users/blocked");
  },

  reportUser: async (userId, reason) => {
    return apiRequest(`/users/${userId}/report`, {
      method: "POST",
      body: JSON.stringify({ reason }),
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
      method: "POST",
      body: JSON.stringify(skillData),
    });
  },

  updateSkill: async (userId, skillId, updates) => {
    return apiRequest(`/skills/users/${userId}/skills/${skillId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  removeSkill: async (userId, skillId) => {
    return apiRequest(`/skills/users/${userId}/skills/${skillId}`, {
      method: "DELETE",
    });
  },

  findSkillMatches: async () => {
    return apiRequest("/skills/matches");
  },
};

// Sessions API
export const sessionsAPI = {
  getSessions: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters);
    return apiRequest(`/requests/sessions?${queryParams}`);
  },

  bookSession: async (sessionData) => {
    return apiRequest("/requests/sessions", {
      method: "POST",
      body: JSON.stringify(sessionData),
    });
  },

  updateSession: async (sessionId, updates) => {
    return apiRequest(`/requests/sessions/${sessionId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  cancelSession: async (sessionId) => {
    return apiRequest(`/requests/sessions/${sessionId}`, {
      method: "DELETE",
    });
  },

  // Video call APIs
  joinSession: async (sessionId) => {
    return apiRequest(`/requests/sessions/${sessionId}/join`);
  },

  endCall: async (sessionId) => {
    return apiRequest(`/requests/sessions/${sessionId}/end-call`, {
      method: "PUT",
    });
  },

  getIceConfig: async (sessionId) => {
    return apiRequest(`/requests/sessions/${sessionId}/ice-config`);
  },
};

// Messages API
export const messagesAPI = {
  getConversations: async () => {
    return apiRequest("/messages/conversations");
  },

  getMessages: async (conversationId) => {
    return apiRequest(`/messages/conversations/${conversationId}/messages`);
  },

  uploadFile: async (formData) => {
    // Re-implementing a custom request for multipart/form-data
    // similar to authAPI.uploadProfilePicture
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/messages/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }
    return data;
  },

  sendMessage: async (conversationId, messageData) => {
    return apiRequest(`/messages/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify(messageData),
    });
  },

  // Direct message send by receiverId (used by InCallChat for DB persistence)
  sendDirectMessage: async (receiverId, content, messageType = "text") => {
    return apiRequest("/messages/send", {
      method: "POST",
      body: JSON.stringify({ receiverId, content, messageType }),
    });
  },

  // Get messages with a specific user by their userId
  getMessagesByUser: async (userId) => {
    return apiRequest(`/messages/with/${userId}`);
  },

  markMessageRead: async (messageId) => {
    return apiRequest(`/messages/${messageId}/read`, {
      method: "PUT",
    });
  },

  clearConversation: async (conversationId) => {
    return apiRequest(`/messages/conversations/${conversationId}/clear`, {
      method: "DELETE",
    });
  },
};

// Reviews API
export const reviewsAPI = {
  getReviews: async (userId) => {
    return apiRequest(`/reviews/users/${userId}`);
  },

  getMyReviews: async (type = 'received') => {
    return apiRequest(`/reviews?type=${type}`);
  },

  createReview: async (reviewData) => {
    return apiRequest("/reviews", {
      method: "POST",
      body: JSON.stringify(reviewData),
    });
  },
};

// Friend Requests API
export const friendRequestAPI = {
  sendFriendRequest: async (receiverId, message = "") => {
    return apiRequest("/friend-requests", {
      method: "POST",
      body: JSON.stringify({ receiverId, message }),
    });
  },

  getFriendRequests: async (type = "received") => {
    return apiRequest(`/friend-requests?type=${type}`);
  },

  acceptFriendRequest: async (requestId) => {
    return apiRequest(`/friend-requests/${requestId}/accept`, {
      method: "PUT",
    });
  },

  declineFriendRequest: async (requestId) => {
    return apiRequest(`/friend-requests/${requestId}/decline`, {
      method: "PUT",
    });
  },

  getFriends: async () => {
    return apiRequest("/friend-requests/friends");
  },
};

// Matches API
export const matchesAPI = {
  getMatches: async () => {
    return apiRequest("/matches");
  },

  generateMatches: async () => {
    return apiRequest("/matches/generate", {
      method: "POST",
    });
  },

  likeMatch: async (matchId) => {
    return apiRequest(`/matches/${matchId}/like`, {
      method: "PUT",
    });
  },

  passMatch: async (matchId) => {
    return apiRequest(`/matches/${matchId}/pass`, {
      method: "PUT",
    });
  },
};

// Notifications API
export const notificationsAPI = {
  getNotifications: async () => {
    return apiRequest("/notifications");
  },

  markNotificationRead: async (notificationId) => {
    return apiRequest(`/notifications/${notificationId}/read`, {
      method: "PUT",
    });
  },

  markAllNotificationsRead: async () => {
    return apiRequest("/notifications/read-all", {
      method: "PUT",
    });
  },
};
