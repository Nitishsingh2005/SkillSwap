import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { friendRequestAPI } from "../services/api";
import {
  UserPlus,
  UserCheck,
  UserX,
  Users,
  Clock,
  Check,
  X,
  User as UserIcon,
} from "lucide-react";

const Friends = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("requests"); // 'requests' or 'friends'
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingRequests, setProcessingRequests] = useState(new Set()); // Track which requests are being processed
  const [notifications, setNotifications] = useState([]); // Track notifications

  const blockedUserIds = React.useMemo(() => {
    if (!state.currentUser?.blockedUsers) return [];
    return state.currentUser.blockedUsers.map(u => String(typeof u === 'object' ? u._id || u.id : u));
  }, [state.currentUser?.blockedUsers]);

  const visibleRequests = friendRequests.filter(req => !blockedUserIds.includes(String(req.senderId?._id || req.senderId)));
  const visibleFriends = friends.filter(f => !blockedUserIds.includes(String(f._id)));

  // Show notification
  const showNotification = (message, type = "success") => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date(),
    };

    setNotifications((prev) => [...prev, notification]);

    // Auto remove notification after 4 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    }, 4000);
  };

  // Load friend requests
  const loadFriendRequests = async () => {
    setLoading(true);
    try {
      console.log("Loading friend requests...");
      const response = await friendRequestAPI.getFriendRequests("received");
      console.log("Friend requests response:", response);
      console.log("Setting friend requests to:", response.friendRequests || []);
      setFriendRequests(response.friendRequests || []);
    } catch (error) {
      console.error("Error loading friend requests:", error);
      setFriendRequests([]); // Clear on error
    } finally {
      setLoading(false);
    }
  };

  // Load friends list
  const loadFriends = async () => {
    setLoading(true);
    try {
      const response = await friendRequestAPI.getFriends();
      const friendsList = response.friends || [];
      setFriends(friendsList);
      // Update global state so Booking and other pages see the latest friends
      dispatch({ type: 'SET_FRIENDS', payload: friendsList });
    } catch (error) {
      console.error("Error loading friends:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    if (state.currentUser && state.isAuthenticated) {
      loadFriendRequests();
      loadFriends();
    }
  }, [state.currentUser, state.isAuthenticated]);

  // Handle accept friend request
  const handleAcceptRequest = async (requestId) => {
    if (processingRequests.has(requestId)) return;

    setProcessingRequests((prev) => new Set(prev).add(requestId));

    try {
      await friendRequestAPI.acceptFriendRequest(requestId);

      // On success, update UI
      setFriendRequests((prev) => prev.filter((r) => r._id !== requestId));
      showNotification("Friend request accepted!", "success");

      // Reload friends list (also updates global state via SET_FRIENDS dispatch)
      await loadFriends();

      // Dispatch event for other components
      const request = friendRequests.find((req) => req._id === requestId);
      if (request) {
        // Also add the new friend to global state immediately
        dispatch({ type: 'ADD_FRIEND', payload: request.senderId });
        window.dispatchEvent(
          new CustomEvent("friendRequestAccepted", {
            detail: {
              requestId,
              acceptedUserId: request.senderId._id,
              senderName: request.senderId.name,
            },
          })
        );
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
      showNotification(`Failed to accept request: ${error.message}`, "error");
    } finally {
      setProcessingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  // Handle decline friend request
  const handleDeclineRequest = async (requestId) => {
    if (processingRequests.has(requestId)) return;

    setProcessingRequests((prev) => new Set(prev).add(requestId));

    try {
      await friendRequestAPI.declineFriendRequest(requestId);

      // On success, update UI
      setFriendRequests((prev) => prev.filter((r) => r._id !== requestId));
      showNotification("Friend request declined", "info");

      // Dispatch event for other components
      const request = friendRequests.find((req) => req._id === requestId);
      if (request) {
        window.dispatchEvent(
          new CustomEvent("friendRequestDeclined", {
            detail: {
              requestId,
              declinedUserId: request.senderId._id,
              senderName: request.senderId.name,
            },
          })
        );
      }
    } catch (error) {
      console.error("Error declining friend request:", error);
      showNotification(`Failed to decline request: ${error.message}`, "error");
    } finally {
      setProcessingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  // Debug log
  console.log("Friends component render - friendRequests:", friendRequests);
  console.log("Friends component render - loading:", loading);

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 min-h-screen">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-[100] space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-xl shadow-lg border transition-all duration-300 ${
                notification.type === "success"
                  ? "bg-green/10 text-green border-green/20"
                  : notification.type === "info"
                  ? "bg-blue/10 text-blue border-blue/20"
                  : "bg-accent/10 text-accent border-accent/20"
              }`}
            >
              <div className="flex items-center space-x-2 font-medium">
                <span>{notification.message}</span>
                <button
                  onClick={() =>
                    setNotifications((prev) =>
                      prev.filter((n) => n.id !== notification.id)
                    )
                  }
                  className="opacity-70 hover:opacity-100"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-semibold text-ink mb-3 tracking-tight">
            Friends
          </h1>
          <p className="text-ink-muted text-lg max-w-xl">
            Manage your friend requests and connect with your network.
          </p>
        </div>
        <button
          onClick={() => {
            console.log("Manual refresh clicked");
            setFriendRequests([]); // Clear first
            loadFriendRequests();
            loadFriends();
          }}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-surface border border-border text-ink hover:bg-surface-2 rounded-full font-medium shadow-sm transition-transform hover:scale-105"
          disabled={loading}
        >
          <svg
            className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={() => setActiveTab("requests")}
          className={`flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-300 font-medium ${
            activeTab === "requests"
              ? "bg-ink text-surface shadow-md"
              : "bg-surface text-ink-muted hover:bg-surface-2 border border-border shadow-sm hover:text-ink"
          }`}
        >
          <UserPlus className="w-5 h-5" />
          <span>Friend Requests</span>
          {friendRequests.length > 0 && (
            <span className={`text-xs px-2.5 py-1 rounded-full ${activeTab === 'requests' ? 'bg-accent text-white' : 'bg-red-50 text-red-600 border border-red-100'}`}>
              {friendRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("friends")}
          className={`flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-300 font-medium ${
            activeTab === "friends"
              ? "bg-ink text-surface shadow-md"
              : "bg-surface text-ink-muted hover:bg-surface-2 border border-border shadow-sm hover:text-ink"
          }`}
        >
          <Users className="w-5 h-5" />
          <span>My Friends</span>
          <span className={`text-xs px-2.5 py-1 rounded-full ${activeTab === 'friends' ? 'bg-surface-2 text-ink border border-surface-2' : 'bg-surface-2 text-ink-muted border border-border'}`}>
            {friends.length}
          </span>
        </button>
      </div>

      {/* Content */}
      <div className="bg-surface rounded-3xl shadow-sm border border-border p-6 md:p-8 min-h-[400px]">
      {activeTab === "requests" ? (
        <div>
          <h2 className="text-2xl font-display font-medium text-ink mb-6">
            Friend Requests
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-ink-muted">Loading friend requests...</p>
            </div>
          ) : visibleRequests.length > 0 ? (
            <div className="space-y-4">
              {visibleRequests.map((request) => (
                <div
                  key={request._id}
                  className="bg-surface-2 rounded-2xl p-5 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm transition-all"
                >
                  <div className="flex items-center space-x-4">
                    {request.senderId.avatar ? (
                      <img
                        src={
                          request.senderId.avatar.startsWith("http")
                            ? request.senderId.avatar
                            : `${import.meta.env.VITE_API_URL}${request.senderId.avatar}`
                        }
                        alt={request.senderId.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                        onError={(e) => {
                          console.log(
                            "Friend request avatar load error:",
                            e.target.src
                          );
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-14 h-14 bg-surface rounded-full flex items-center justify-center border-2 border-white shadow-sm ${
                        request.senderId.avatar ? "hidden" : ""
                      }`}
                    >
                      <UserIcon className="w-7 h-7 text-ink-muted" />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-ink">
                        {request.senderId.name}
                      </h3>
                      <p className="text-sm text-ink-muted mt-0.5">
                        {request.message || "Wants to connect with you"}
                      </p>
                      <p className="text-xs text-ink-muted/70 flex items-center mt-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-3 w-full sm:w-auto">
                    <button
                      onClick={() => handleAcceptRequest(request._id)}
                      disabled={processingRequests.has(request._id)}
                      className={`flex-1 sm:flex-none flex items-center justify-center space-x-1 px-5 py-2.5 rounded-full transition-transform hover:scale-105 font-medium shadow-sm ${
                        processingRequests.has(request._id)
                          ? "bg-surface-2 text-ink-muted opacity-60 cursor-not-allowed border border-border"
                          : "bg-ink text-surface hover:bg-black"
                      }`}
                    >
                      {processingRequests.has(request._id) ? (
                        <>
                          <div className="w-4 h-4 border-2 border-ink-muted border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Accept</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(request._id)}
                      disabled={processingRequests.has(request._id)}
                      className={`flex-1 sm:flex-none flex items-center justify-center space-x-1 px-5 py-2.5 rounded-full transition-colors font-medium border ${
                        processingRequests.has(request._id)
                          ? "bg-surface-2 text-ink-muted opacity-60 cursor-not-allowed border-border"
                          : "bg-surface-2 text-ink border-border hover:bg-surface"
                      }`}
                    >
                      {processingRequests.has(request._id) ? (
                        <>
                          <div className="w-4 h-4 border-2 border-ink-muted border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          <span>Decline</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-surface-2 rounded-3xl border border-border">
              <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-border">
                <UserPlus className="w-10 h-10 text-ink-muted" />
              </div>
              <h3 className="text-xl font-display font-medium text-ink mb-3 tracking-tight">
                No friend requests
              </h3>
              <p className="text-ink-muted max-w-sm mx-auto">
                You don't have any pending friend requests.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-display font-medium text-ink mb-6">
            My Friends
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-ink-muted">Loading friends...</p>
            </div>
          ) : visibleFriends.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleFriends.map((friend) => (
                <div
                  key={friend._id}
                  className="bg-surface-2 rounded-3xl p-6 border border-border hover:border-accent/30 transition-all shadow-sm flex flex-col group h-full hover:shadow-md"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    {friend.avatar ? (
                      <img
                        src={
                          friend.avatar.startsWith("http")
                            ? friend.avatar
                            : `${import.meta.env.VITE_API_URL}${friend.avatar}`
                        }
                        alt={friend.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                        onError={(e) => {
                          console.log(
                            "Friend avatar load error:",
                            e.target.src
                          );
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-14 h-14 bg-surface rounded-full flex items-center justify-center border-2 border-white shadow-sm ${
                        friend.avatar ? "hidden" : ""
                      }`}
                    >
                      <UserIcon className="w-7 h-7 text-ink-muted" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-ink text-lg font-display truncate">
                        {friend.name}
                      </h3>
                      {friend.location && (
                        <p className="text-sm text-ink-muted truncate">
                          {friend.location}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center text-accent/80 bg-accent/5 p-1.5 rounded-full border border-accent/10">
                      <UserCheck className="w-4 h-4" />
                    </div>
                  </div>

                  {friend.bio ? (
                    <p className="text-sm text-ink-muted mb-6 line-clamp-2 leading-relaxed flex-1">
                      {friend.bio}
                    </p>
                  ) : (
                    <div className="flex-1 mb-6" />
                  )}

                  <div className="flex space-x-3 mt-auto pt-4 border-t border-border">
                    <button
                      onClick={() => navigate(`/chat?user=${friend._id}`)}
                      className="flex-1 bg-ink text-surface hover:bg-black px-4 py-2.5 rounded-full transition-transform hover:scale-105 shadow-sm font-medium text-sm"
                    >
                      Message
                    </button>
                    <button className="flex-1 px-4 py-2.5 bg-surface border border-border text-ink rounded-full hover:bg-surface-2 transition-colors font-medium text-sm shadow-sm"
                            onClick={() => navigate(`/profile/${friend._id}`)}>
                      Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-surface-2 rounded-3xl border border-border">
              <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-border">
                <Users className="w-10 h-10 text-ink-muted" />
              </div>
              <h3 className="text-xl font-display font-medium text-ink mb-3 tracking-tight">
                No friends yet
              </h3>
              <p className="text-ink-muted max-w-sm mx-auto">
                Start by sending friend requests to people you'd like to connect
                with.
              </p>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default Friends;
