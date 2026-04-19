import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
//import { sampleUsers } from '../utils/sampleData';
import { skillsAPI, friendRequestAPI } from "../services/api";
import {
  Search as SearchIcon,
  Filter,
  MapPin,
  Star,
  Video,
  MessageCircle,
  User as UserIcon,
  Users,
  BookOpen,
  GraduationCap,
  UserPlus,
} from "lucide-react";

const Search = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({});
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [skillMatches, setSkillMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState("search"); // 'matches' or 'search'
  const [sendingRequests, setSendingRequests] = useState(new Set()); // Track which requests are being sent
  const [sentRequests, setSentRequests] = useState(new Set()); // Track which requests have been sent
  const [friends, setFriends] = useState(new Set()); // Track current friends
  const friendsRef = useRef(new Set()); // Track friends for reliable difference checking
  const [notifications, setNotifications] = useState([]); // Track notifications
  const initialLoadRef = useRef(true); // Track initial load of friend data

  const blockedUserIds = React.useMemo(() => {
    if (!state.currentUser?.blockedUsers) return [];
    return state.currentUser.blockedUsers.map(u => String(typeof u === 'object' ? u._id || u.id : u));
  }, [state.currentUser?.blockedUsers]);

  const visibleFilteredUsers = React.useMemo(() => {
    return filteredUsers.filter(user => !blockedUserIds.includes(String(user.id || user._id)));
  }, [filteredUsers, blockedUserIds]);

  const visibleSkillMatches = React.useMemo(() => {
    return skillMatches.filter(user => !blockedUserIds.includes(String(user._id || user.id)));
  }, [skillMatches, blockedUserIds]);


  // Show notification
  const showNotification = (message, type = "success") => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date(),
    };

    setNotifications((prev) => [...prev, notification]);

    // Auto remove notification after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    }, 5000);
  };

  // Load existing friend requests and friends
  const loadFriendData = async () => {
    if (!state.currentUser) return;

    try {
      // Load sent friend requests
      const sentRequestsResponse = await friendRequestAPI.getFriendRequests(
        "sent"
      );
      const sentRequestIds =
        sentRequestsResponse.friendRequests?.map(
          (req) => req.receiverId._id || req.receiverId
        ) || [];
      setSentRequests(new Set(sentRequestIds));

      // Load friends list
      const friendsResponse = await friendRequestAPI.getFriends();
      const friendIds =
        friendsResponse.friends?.map((friend) => friend._id || friend.id) || [];

      // Check for new friends (users who were in sentRequests but are now friends)
      const previousFriends = friendsRef.current;
      const newFriends = friendIds.filter((id) => !previousFriends.has(id));

      if (!initialLoadRef.current && previousFriends.size > 0 && newFriends.length > 0) {
        showNotification(
          `${newFriends.length} friend request(s) accepted! 🎉`,
          "success"
        );
      }

      initialLoadRef.current = false;

      const newFriendsSet = new Set(friendIds);
      friendsRef.current = newFriendsSet;
      setFriends(newFriendsSet);

      console.log("Loaded friend data:", {
        sentRequests: sentRequestIds,
        friends: friendIds,
      });
    } catch (error) {
      console.warn("Could not load friend data:", error.message);
      // Don't show error to user, just continue without friend data
    }
  };

  // Load friend data when component mounts
  useEffect(() => {
    if (state.currentUser) {
      loadFriendData();
    }
  }, [state.currentUser]);

  // Refresh friend data when switching between search modes
  useEffect(() => {
    if (state.currentUser && searchMode === "matches") {
      loadFriendData();
    }
  }, [searchMode, state.currentUser]);

  // Refresh friend data when component becomes visible (user returns from Friends page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && state.currentUser) {
        loadFriendData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [state.currentUser]);

  // Listen for friend request acceptance events from Friends page
  useEffect(() => {
    const handleFriendRequestAccepted = (event) => {
      const { acceptedUserId, senderName } = event.detail;
      console.log("Friend request accepted:", { acceptedUserId, senderName });

      // Add to friends set immediately
      setFriends((prev) => {
        const newSet = new Set(prev).add(acceptedUserId);
        friendsRef.current = newSet;
        return newSet;
      });

      // Remove from sent requests if it was there
      setSentRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(acceptedUserId);
        return newSet;
      });

      // Show notification
      showNotification(
        `${senderName} accepted your friend request! 🎉`,
        "success"
      );

      // Refresh friend data to ensure consistency
      loadFriendData();
    };

    window.addEventListener(
      "friendRequestAccepted",
      handleFriendRequestAccepted
    );
    return () =>
      window.removeEventListener(
        "friendRequestAccepted",
        handleFriendRequestAccepted
      );
  }, []);

  // Listen for friend request decline events from Friends page
  useEffect(() => {
    const handleFriendRequestDeclined = (event) => {
      const { declinedUserId, senderName } = event.detail;
      console.log("Friend request declined:", { declinedUserId, senderName });

      // Remove from sent requests if it was there
      setSentRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(declinedUserId);
        return newSet;
      });

      // Show notification
      showNotification(`${senderName} declined your friend request`, "info");

      // Refresh friend data to ensure consistency
      loadFriendData();
    };

    window.addEventListener(
      "friendRequestDeclined",
      handleFriendRequestDeclined
    );
    return () =>
      window.removeEventListener(
        "friendRequestDeclined",
        handleFriendRequestDeclined
      );
  }, []);

  // Fetch skill matches from API
  const fetchSkillMatches = async () => {
    console.log("fetchSkillMatches called - currentUser:", state.currentUser);
    console.log(
      "fetchSkillMatches called - isAuthenticated:",
      state.isAuthenticated
    );

    if (!state.currentUser) {
      console.log("No current user found, cannot fetch skill matches");
      setSkillMatches([]);
      return;
    }

    setLoading(true);
    try {
      console.log("Fetching skill matches for user:", state.currentUser.name);
      const response = await skillsAPI.findSkillMatches();
      console.log("Skill matches response:", response);
      setSkillMatches(response.matches || []);
    } catch (error) {
      console.error("Error fetching skill matches:", error);
      setSkillMatches([]);
    } finally {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   if (state.users.length === 0) {
  //     dispatch({ type: 'SET_USERS', payload: sampleUsers });
  //   }
  // }, [state.users.length, dispatch]);

  // Auto-switch to matches mode when user logs in
  useEffect(() => {
    if (state.currentUser && searchMode === "search") {
      setSearchMode("matches");
    }
  }, [state.currentUser]);

  // Fetch skill matches when component mounts or user changes
  useEffect(() => {
    if (state.currentUser && searchMode === "matches") {
      fetchSkillMatches();
    }
  }, [state.currentUser, searchMode]);

  // Listen for skill updates to refresh matches
  useEffect(() => {
    const handleSkillUpdate = () => {
      if (searchMode === "matches") {
        fetchSkillMatches();
      }
    };

    window.addEventListener("skillUpdated", handleSkillUpdate);
    return () => window.removeEventListener("skillUpdated", handleSkillUpdate);
  }, [searchMode]);

  // Handle search mode changes
  useEffect(() => {
    if (searchMode === "search") {
      // Use existing search logic
      let results = state.users.filter(
        (user) => user.id !== state.currentUser?.id
      );

      if (searchTerm) {
        results = results.filter(
          (user) =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.skills.some((skill) =>
              skill.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
      }

      if (filters.skill) {
        results = results.filter((user) =>
          user.skills.some((skill) =>
            skill.name.toLowerCase().includes(filters.skill.toLowerCase())
          )
        );
      }

      if (filters.category) {
        results = results.filter((user) =>
          user.skills.some((skill) => skill.category === filters.category)
        );
      }

      if (filters.level) {
        results = results.filter((user) =>
          user.skills.some((skill) => skill.level === filters.level)
        );
      }

      if (filters.location) {
        results = results.filter((user) =>
          user.location.toLowerCase().includes(filters.location.toLowerCase())
        );
      }

      if (filters.videoCallReady !== undefined) {
        results = results.filter(
          (user) => user.videoCallReady === filters.videoCallReady
        );
      }

      setFilteredUsers(results);
    }
  }, [searchTerm, filters, state.users, state.currentUser, searchMode]);

  const skillCategories = [
    "Frontend",
    "Backend",
    "Design",
    "Data Science",
    "Mobile",
    "DevOps",
    "Marketing",
    "Other",
  ];

  const skillLevels = ["Beginner", "Intermediate", "Expert"];

  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
  };

  const getUserSkillsOffered = (user) =>
    user.skills.filter((skill) => skill.offering);
  const getUserSkillsSeeking = (user) =>
    user.skills.filter((skill) => !skill.offering);

  const handleMessageUser = (userId) => {
    // Navigate to chat with the selected user
    navigate(`/chat?user=${userId}`);
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      console.log("Sending friend request to user:", userId);
      console.log("Current user:", state.currentUser);

      if (!state.currentUser) {
        alert("Please log in to send friend requests");
        return;
      }

      if (userId === state.currentUser._id || userId === state.currentUser.id) {
        alert("You cannot send a friend request to yourself");
        return;
      }

      // Check if already friends
      if (friends.has(userId)) {
        alert("You are already friends with this user");
        return;
      }

      // Check if request already sent
      if (sentRequests.has(userId)) {
        alert("Friend request already sent to this user");
        return;
      }

      // Add to sending requests set
      setSendingRequests((prev) => new Set(prev).add(userId));

      const response = await friendRequestAPI.sendFriendRequest(userId);
      console.log("Friend request response:", response);

      // Add to sent requests set
      setSentRequests((prev) => new Set(prev).add(userId));

      // Log success details
      console.log("Friend request sent successfully to user:", userId);
      showNotification("Friend request sent successfully!", "success");
      // Refresh friend data to get latest state
      await loadFriendData();
    } catch (error) {
      console.error("Error sending friend request:", error);
      // Better error handling with specific messages
      if (error.message.includes("404")) {
        showNotification("User not found. Please try again.", "error");
      } else if (error.message.includes("400")) {
        showNotification(
          "Friend request already exists or you are already connected with this user.",
          "error"
        );
        // Update local state to reflect this
        setSentRequests((prev) => new Set(prev).add(userId));
      } else if (
        error.message.includes("401") ||
        error.message.includes("403")
      ) {
        showNotification("Please log in to send friend requests.", "error");
      } else {
        showNotification(
          `Failed to send friend request: ${error.message}`,
          "error"
        );
      }
    } finally {
      // Remove from sending requests set
      setSendingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  return (
    <div className="min-h-screen bg-surface p-6 max-w-7xl mx-auto font-sans text-ink">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-xl shadow-lg border transition-all duration-300 ${
                notification.type === "success"
                  ? "bg-green text-surface border-green/20"
                  : "bg-red-500 text-surface border-red-500/20"
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="font-medium">{notification.message}</span>
                <button
                  onClick={() =>
                    setNotifications((prev) =>
                      prev.filter((n) => n.id !== notification.id)
                    )
                  }
                  className="opacity-80 hover:opacity-100"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Header */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-display font-medium text-ink mb-3 tracking-tight">
          Find Your Skill Partner
        </h1>
        <p className="text-ink-muted text-lg md:text-xl mb-8 max-w-2xl">
          Discover people who can teach you new skills or learn from your
          expertise in our growing community.
        </p>

        {/* Search Mode Toggle - Only show when logged in */}
        {state.currentUser && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex space-x-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
              <button
                onClick={() => setSearchMode("matches")}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-300 font-medium ${
                  searchMode === "matches"
                    ? "bg-ink text-surface shadow-sm"
                    : "bg-surface-2 text-ink-muted hover:text-ink hover:bg-[#F2F1EC]"
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Skill Matches</span>
              </button>
              <button
                onClick={() => setSearchMode("search")}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-300 font-medium ${
                  searchMode === "search"
                    ? "bg-ink text-surface shadow-sm"
                    : "bg-surface-2 text-ink-muted hover:text-ink hover:bg-[#F2F1EC]"
                }`}
              >
                <SearchIcon className="w-5 h-5" />
                <span>All Users</span>
              </button>
            </div>

            <div className="flex space-x-3 w-full sm:w-auto">
              <button
                onClick={loadFriendData}
                className="flex items-center justify-center space-x-2 flex-1 sm:flex-none px-5 py-2.5 bg-surface-2 text-ink rounded-full hover:bg-[#F2F1EC] transition-colors font-medium border border-border sm:border-transparent"
                title="Refresh friend data"
              >
                <SearchIcon className="w-4 h-4" />
                <span className="sm:hidden lg:inline">Refresh</span>
              </button>
              <button
                onClick={() => navigate("/friends")}
                className="flex items-center justify-center space-x-2 flex-1 sm:flex-none px-5 py-2.5 bg-surface-2 text-ink rounded-full hover:bg-[#F2F1EC] transition-colors font-medium border border-border"
                title="View friend requests and friends"
              >
                <Users className="w-4 h-4" />
                <span>Network</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters - Only show in search mode */}
      {searchMode === "search" && (
        <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 mb-10">
          <div className="flex flex-col lg:flex-row gap-4 mb-2">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-ink-muted" />
              </div>
              <input
                type="text"
                placeholder="Search by name, skills, or bio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-11 pr-4 py-3.5 bg-surface-2 border border-border rounded-xl text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center space-x-2 px-8 py-3.5 border rounded-xl font-medium transition-colors ${
                showFilters || Object.keys(filters).length > 0
                  ? "bg-surface-2 border-border text-ink"
                  : "bg-surface border-border text-ink hover:bg-surface-2"
              }`}
            >
              <Filter className="w-5 h-5" />
              <span>Filters {Object.keys(filters).length > 0 && `(${Object.keys(filters).length})`}</span>
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 mt-4 border-t border-border">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Skill
                </label>
                <input
                  type="text"
                  placeholder="e.g., React, Python"
                  value={filters.skill || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      skill: e.target.value || undefined,
                    })
                  }
                  className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Category
                </label>
                <select
                  value={filters.category || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      category: e.target.value || undefined,
                    })
                  }
                  className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">All Categories</option>
                  {skillCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Level
                </label>
                <select
                  value={filters.level || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      level: e.target.value || undefined,
                    })
                  }
                  className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">All Levels</option>
                  {skillLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="City, State"
                  value={filters.location || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      location: e.target.value || undefined,
                    })
                  }
                  className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={filters.videoCallReady || false}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            videoCallReady: e.target.checked ? true : undefined,
                          })
                        }
                        className="w-5 h-5 border border-border rounded bg-surface focus:ring-2 focus:ring-accent focus:ring-offset-1 text-accent accent-accent transition-all cursor-pointer"
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-ink group-hover:text-accent transition-colors">
                    Video calls available
                  </span>
                </label>
                
                {Object.keys(filters).length > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-ink-muted hover:text-ink font-medium underline underline-offset-4"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mb-10">
        {searchMode === "matches" ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-medium text-ink tracking-tight">
                {loading
                  ? "Finding matches..."
                  : `${visibleSkillMatches.length} skill match${
                      visibleSkillMatches.length === 1 ? "" : "es"
                    } found`}
              </h2>
            </div>

            {!state.currentUser ? (
              <div className="text-center py-16 bg-surface rounded-2xl border border-border shadow-sm">
                <Users className="w-16 h-16 text-ink-muted mx-auto mb-5" />
                <h3 className="text-xl font-display font-medium text-ink mb-2">
                  Please log in to find skill matches
                </h3>
                <p className="text-ink-muted mb-8 max-w-md mx-auto">
                  You need to be logged in to see personalized skill matches and start connecting with others.
                </p>
                <button
                  onClick={() => (window.location.href = "/login")}
                  className="bg-accent text-white px-8 py-3 rounded-full font-medium hover:bg-opacity-90 transition-transform hover:scale-105 shadow-sm"
                >
                  Go to Login
                </button>
              </div>
            ) : loading ? (
              <div className="text-center py-16 bg-surface rounded-2xl border border-border shadow-sm">
                <div className="w-10 h-10 border-4 border-surface-2 border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-ink-muted font-medium">
                  Finding your perfect skill matches...
                </p>
              </div>
            ) : visibleSkillMatches.length > 0 && visibleSkillMatches.filter((user) => !friends.has(user._id)).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visibleSkillMatches
                    .filter((user) => !friends.has(user._id))
                    .map((user) => (
                      <div
                        key={user._id}
                        className="bg-surface rounded-2xl shadow-sm border border-border p-6 hover:shadow-md hover:border-accent/30 transition-all duration-300 flex flex-col h-full"
                      >
                        <div className="flex items-start space-x-4 mb-5">
                          {user.avatar ? (
                            <img
                              src={
                                user.avatar.startsWith("http")
                                  ? user.avatar
                                  : `${import.meta.env.VITE_API_URL}${user.avatar}`
                              }
                              alt={user.name}
                              className="w-16 h-16 rounded-full object-cover border border-border"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-16 h-16 bg-surface-2 border border-border rounded-full flex items-center justify-center ${
                              user.avatar ? "hidden" : ""
                            }`}
                          >
                            <span className="text-2xl font-display font-medium text-ink">
                               {user.name.charAt(0)}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0 pt-1">
                            <h3 className="font-display font-medium text-ink text-lg truncate">
                              {user.name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted mt-1">
                              {user.rating > 0 && (
                                <div className="flex items-center space-x-1">
                                  <Star className="w-3.5 h-3.5 text-accent fill-current" />
                                  <span className="font-medium text-ink">{user.rating.toFixed(1)}</span>
                                </div>
                              )}
                              {user.location && (
                                <div className="flex items-center space-x-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span className="truncate">{user.location}</span>
                                </div>
                              )}
                              {user.videoCallReady && (
                                <div className="flex items-center space-x-1 text-green font-medium">
                                  <Video className="w-3.5 h-3.5" />
                                  <span>Video</span>
                                </div>
                              )}
                            </div>
                            <div className="mt-2.5">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-accent-soft text-accent border border-accent/20">
                                {user.matchScore} Match{user.matchScore !== 1 ? "es" : ""}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-ink-muted text-sm mb-5 line-clamp-3 leading-relaxed flex-grow">
                          {user.bio || "No bio provided."}
                        </p>

                        {/* Matching Skills */}
                        <div className="mb-6 bg-surface-2 rounded-xl p-4 border border-border">
                          {user.matchingSkills && user.matchingSkills.length > 0 ? (
                              <div className="space-y-3">
                                {user.matchingSkills.map((skill, index) => (
                                  <div
                                    key={index}
                                    className="flex items-start justify-between"
                                  >
                                    <div className="flex items-start space-x-2.5">
                                      {skill.type === "can_teach_me" ? (
                                        <GraduationCap className="w-4 h-4 text-blue mt-0.5" />
                                      ) : (
                                        <BookOpen className="w-4 h-4 text-green mt-0.5" />
                                      )}
                                      <div className="flex flex-col">
                                        <span className="text-xs font-medium text-ink-muted mb-0.5 uppercase tracking-wider">
                                          {skill.type === "can_teach_me" ? "Can teach you" : "Wants to learn"}
                                        </span>
                                        <span className="text-sm font-semibold text-ink">
                                           {skill.name}
                                        </span>
                                      </div>
                                    </div>
                                    <span
                                      className={`px-2 py-1 rounded-md text-xs font-medium border ${
                                        skill.level === "Expert"
                                          ? "bg-green/10 text-green border-green/20"
                                          : skill.level === "Intermediate"
                                          ? "bg-blue/10 text-blue border-blue/20"
                                          : "bg-surface text-ink-muted border-border"
                                      }`}
                                    >
                                      {skill.level}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                               <p className="text-sm text-ink-muted text-center italic py-2">No specific matching skills detailed.</p>
                            )}
                        </div>

                        <div className="flex space-x-3 mt-auto pt-2 border-t border-border">
                          {friends.has(user._id) ? (
                            <button
                              disabled
                              className="flex-1 py-2.5 rounded-full bg-surface-2 text-ink-muted font-medium cursor-not-allowed flex items-center justify-center space-x-2 border border-border"
                            >
                              <UserPlus className="w-4 h-4" />
                              <span>Friends</span>
                            </button>
                          ) : sentRequests.has(user._id) ? (
                            <button
                              disabled
                              className="flex-1 py-2.5 rounded-full bg-surface-2 text-ink-muted font-medium cursor-not-allowed flex items-center justify-center space-x-2 border border-border"
                            >
                              <UserPlus className="w-4 h-4" />
                              <span>Requested</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSendFriendRequest(user._id)}
                              disabled={sendingRequests.has(user._id)}
                              className={`flex-1 py-2.5 rounded-full font-medium transition-all shadow-sm flex items-center justify-center space-x-2 ${
                                sendingRequests.has(user._id)
                                  ? "bg-surface-2 text-ink-muted cursor-not-allowed border border-border"
                                  : "bg-ink text-surface hover:bg-black hover:scale-[1.02]"
                              }`}
                            >
                              {sendingRequests.has(user._id) ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-surface-2 border-t-ink rounded-full animate-spin"></div>
                                  <span>Sending...</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-4 h-4" />
                                  <span>Connect</span>
                                </>
                              )}
                            </button>
                          )}
                          <button className="px-5 py-2.5 border border-border text-ink rounded-full hover:bg-surface-2 font-medium transition-colors">
                            Profile
                          </button>
                        </div>
                      </div>
                  ))}
                </div>
              ) : visibleSkillMatches.length > 0 ? (
                <div className="text-center py-16 bg-surface rounded-2xl border border-border shadow-sm">
                  <Users className="w-16 h-16 text-ink-muted mx-auto mb-5" />
                  <h3 className="text-xl font-display font-medium text-ink mb-2">
                    All skill matches are already friends!
                  </h3>
                  <p className="text-ink-muted mb-8 max-w-md mx-auto">
                    You're already connected with all your skill matches. Great networking! 🎉
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => navigate("/friends")}
                      className="bg-accent text-white px-8 py-3 rounded-full font-medium hover:bg-opacity-90 transition-transform hover:scale-105 shadow-sm"
                    >
                      View Friends
                    </button>
                    <button
                      onClick={() => setSearchMode("search")}
                      className="border border-border text-ink px-8 py-3 rounded-full font-medium hover:bg-surface-2 transition-colors"
                    >
                      Browse All Users
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 bg-surface rounded-2xl border border-border shadow-sm">
                  <Users className="w-16 h-16 text-ink-muted mx-auto mb-5" />
                  <h3 className="text-xl font-display font-medium text-ink mb-2">
                    No skill matches found
                  </h3>
                  <p className="text-ink-muted mb-8 max-w-md mx-auto">
                    {state.currentUser?.skills?.length === 0
                      ? "Add skills to your profile to find people who can teach you or learn from you."
                      : "No users found with complementary skills. Try adding more skills to your profile or browse all users."}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => (window.location.href = "/profile")}
                      className="bg-accent text-white px-8 py-3 rounded-full font-medium hover:bg-opacity-90 transition-transform hover:scale-105 shadow-sm"
                    >
                      Update Profile
                    </button>
                    <button
                      onClick={() => setSearchMode("search")}
                      className="border border-border text-ink px-8 py-3 rounded-full font-medium hover:bg-surface-2 transition-colors"
                    >
                      Browse All Users
                    </button>
                  </div>
                </div>
              )}
            </>
        ) : (
          <>
            <h2 className="text-2xl font-display font-medium text-ink mb-6 tracking-tight">
              {visibleFilteredUsers.length}{" "}
              {visibleFilteredUsers.length === 1 ? "person" : "people"} found
            </h2>

            {visibleFilteredUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleFilteredUsers
                  .filter((user) => !friends.has(user.id))
                  .map((user) => {
                    const skillsOffered = getUserSkillsOffered(user);
                    const skillsSeeking = getUserSkillsSeeking(user);

                    return (
                      <div
                        key={user.id}
                        className="bg-surface rounded-2xl shadow-sm border border-border p-6 hover:shadow-md hover:border-accent/30 transition-all duration-300 flex flex-col h-full"
                      >
                        <div className="flex items-start space-x-4 mb-5">
                          {user.avatar ? (
                            <img
                              src={
                                user.avatar.startsWith("http")
                                  ? user.avatar
                                  : `${import.meta.env.VITE_API_URL || ''}${user.avatar}`
                              }
                              alt={user.name}
                              className="w-16 h-16 rounded-full object-cover border border-border"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-16 h-16 bg-surface-2 border border-border rounded-full flex items-center justify-center ${
                              user.avatar ? "hidden" : ""
                            }`}
                          >
                            <span className="text-2xl font-display font-medium text-ink">
                               {user.name.charAt(0)}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0 pt-1">
                            <h3 className="font-display font-medium text-ink text-lg truncate">
                              {user.name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted mt-1">
                              {user.rating > 0 && (
                                <div className="flex items-center space-x-1">
                                  <Star className="w-3.5 h-3.5 text-accent fill-current" />
                                  <span className="font-medium text-ink">{user.rating.toFixed(1)}</span>
                                </div>
                              )}
                              {user.location && (
                                <div className="flex items-center space-x-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span className="truncate">{user.location}</span>
                                </div>
                              )}
                              {user.videoCallReady && (
                                <div className="flex items-center space-x-1 text-green font-medium">
                                  <Video className="w-3.5 h-3.5" />
                                  <span>Video</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <p className="text-ink-muted text-sm mb-6 line-clamp-3 leading-relaxed flex-grow">
                          {user.bio || "No bio provided."}
                        </p>

                        <div className="mb-6 space-y-4">
                          {skillsOffered.length > 0 && (
                            <div>
                              <h4 className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-2">
                                Offers to teach
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {skillsOffered.slice(0, 3).map((skill) => (
                                  <span
                                    key={skill.id}
                                    className="px-2.5 py-1 bg-surface-2 border border-border text-ink rounded-md text-xs font-semibold"
                                  >
                                    {skill.name}
                                  </span>
                                ))}
                                {skillsOffered.length > 3 && (
                                  <span className="px-2.5 py-1 bg-surface border border-border border-dashed text-ink-muted rounded-md text-xs font-medium">
                                    +{skillsOffered.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {skillsSeeking.length > 0 && (
                            <div>
                              <h4 className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-2">
                                Wants to learn
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {skillsSeeking.slice(0, 3).map((skill) => (
                                  <span
                                    key={skill.id}
                                    className="px-2.5 py-1 bg-surface-2 border border-border text-ink rounded-md text-xs font-semibold"
                                  >
                                    {skill.name}
                                  </span>
                                ))}
                                {skillsSeeking.length > 3 && (
                                  <span className="px-2.5 py-1 bg-surface border border-border border-dashed text-ink-muted rounded-md text-xs font-medium">
                                    +{skillsSeeking.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-3 mt-auto pt-4 border-t border-border">
                          <button
                            onClick={() => handleMessageUser(user.id)}
                            className="flex-1 bg-ink text-surface hover:bg-black font-medium py-2.5 rounded-full transition-all hover:scale-[1.02] flex items-center justify-center space-x-2 shadow-sm"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Message</span>
                          </button>
                          <button className="px-5 py-2.5 border border-border text-ink rounded-full hover:bg-surface-2 font-medium transition-colors">
                            Profile
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-20 bg-surface border border-border shadow-sm rounded-2xl">
                <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-5 border border-border">
                   <SearchIcon className="w-6 h-6 text-ink-muted" />
                </div>
                <h3 className="text-xl font-display font-medium text-ink mb-2">
                  No results found
                </h3>
                <p className="text-ink-muted mb-8 max-w-md mx-auto">
                  Try adjusting your search terms or filters to find more
                  people.
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-surface-2 text-ink border border-border px-8 py-3 rounded-full font-medium hover:bg-[#F2F1EC] transition-colors shadow-sm"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Search;
