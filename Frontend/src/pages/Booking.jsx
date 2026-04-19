import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { sessionsAPI, friendRequestAPI, skillsAPI } from "../services/api";
import socketService from "../services/socketService";
import {
  Calendar,
  Clock,
  Video,
  MessageCircle,
  User as UserIcon,
  Plus,
  Phone,
} from "lucide-react";

const Booking = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    partnerId: "",
    skillExchange: { hostSkill: "", partnerSkill: "" },
    type: "video",
    date: "",
    time: "",
  });
  const [allUsers, setAllUsers] = useState([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  // Read friends from global state — updated by Friends.jsx after acceptance
  const friends = state.friends;

  // Fetch sessions + friends + all users on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoadingPartners(true);
      try {
        // Fetch sessions
        // Fetch sessions
        if (state.currentUser) {  
            try {
              const sessionsData = await sessionsAPI.getSessions();
              if (sessionsData.sessions) {
                dispatch({ type: "SET_SESSIONS", payload: sessionsData.sessions });
              }
            } catch (err) {
              console.error("Failed to fetch sessions:", err);
            }
        }

        // Fetch friends list explicitly from DATABASE
        try {
          console.log("Booking.jsx: Fetching friends from DATABASE...");
          const friendsData = await friendRequestAPI.getFriends();
          const fl = friendsData.friends || [];
          console.log(`Booking.jsx: Database returned ${fl.length} friends`);
          
          if (fl.length > 0) {
             console.log("Friend[0] (DB):", fl[0]);
          }

          dispatch({ type: "SET_FRIENDS", payload: fl });
        } catch (err) {
          console.error("Failed to fetch friends from DB:", err);
        }

        // Fetch all users as fallback
        try {
          console.log("Booking.jsx: Fetching all users...");
          const usersData = await skillsAPI.getUsers();
          const usersList = usersData.users || usersData || [];
          console.log(`Booking.jsx: Received ${usersList.length} users`);
          setAllUsers(usersList);
        } catch (err) {
          console.error("Failed to fetch users:", err);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoadingPartners(false);
      }
    };
    if (state.currentUser || localStorage.getItem('token')) {
      fetchData();
    }

    // Re-fetch when window regains focus (coming back from another tab)
    const handleVisibilityChange = () => {
      if (!document.hidden && (state.currentUser || localStorage.getItem('token'))) {
        fetchData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also re-fetch friends when a friend request is accepted in any component
    const handleFriendAccepted = () => {
      friendRequestAPI.getFriends().then((data) => {
        const fl = data.friends || [];
        dispatch({ type: 'SET_FRIENDS', payload: fl });
      }).catch(() => {});
    };
    window.addEventListener('friendRequestAccepted', handleFriendAccepted);

    // Subscribe to real-time session events via socket
    socketService.onSessionUpdated(({ session }) => {
      if (session) {
        dispatch({
          type: "UPDATE_SESSION",
          payload: { id: session._id, updates: session },
        });
      }
    });

    socketService.onSessionCreated(({ session }) => {
      if (session) {
        dispatch({ type: "ADD_SESSION", payload: session });
        sessionsAPI.getSessions().then((data) => {
          if (data?.sessions) {
            dispatch({ type: "SET_SESSIONS", payload: data.sessions });
          }
        }).catch(() => {});
      }
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('friendRequestAccepted', handleFriendAccepted);
      socketService.removeSessionListeners();
    };
  }, [dispatch, state.currentUser]);

  // ── Skill-match helper ───────────────────────────────────────────────────
  // Returns { matched: bool, myTeachSkill: string, theirTeachSkill: string }
  const computeSkillMatch = (friend) => {
    const mySkills = state.currentUser?.skills || [];
    const theirSkills = friend.skills || [];
    const myTeaching = mySkills.filter((s) => s.offering).map((s) => s.name.toLowerCase());
    const myLearning = mySkills.filter((s) => !s.offering).map((s) => s.name.toLowerCase());
    const theirTeaching = theirSkills.filter((s) => s.offering).map((s) => s.name.toLowerCase());
    const theirLearning = theirSkills.filter((s) => !s.offering).map((s) => s.name.toLowerCase());

    // Mutual match: I teach what they want to learn AND they teach what I want to learn
    const iTeachTheyLearn = myTeaching.find((s) => theirLearning.includes(s));
    const theyTeachILearn = theirTeaching.find((s) => myLearning.includes(s));

    if (iTeachTheyLearn && theyTeachILearn) {
      return { matched: true, score: 2, myTeachSkill: iTeachTheyLearn, theirTeachSkill: theyTeachILearn };
    }
    if (iTeachTheyLearn) {
      return { matched: true, score: 1, myTeachSkill: iTeachTheyLearn, theirTeachSkill: '' };
    }
    if (theyTeachILearn) {
      return { matched: true, score: 1, myTeachSkill: '', theirTeachSkill: theyTeachILearn };
    }
    return { matched: false, score: 0, myTeachSkill: '', theirTeachSkill: '' };
  };

  // Build partner list — skill-matched friends first, then other friends, then all users
  const currentId = (state.currentUser?._id || state.currentUser?.id)?.toString();
  const partnerList = (() => {
    const friendIds = new Set();
    const matched = [];
    const unmatched = [];

    // Process friends with skill-match scoring
    friends.forEach((f) => {
      if (!f) return;
      const id = (f._id || f.id)?.toString();
      if (!id || id === currentId) return;
      friendIds.add(id);
      const skillMatch = computeSkillMatch(f);
      const entry = { id, name: f.name, avatar: f.avatar, isFriend: true, skills: f.skills || [], ...skillMatch };
      if (skillMatch.matched) {
        matched.push(entry);
      } else {
        unmatched.push(entry);
      }
    });

    // Sort matched by score descending
    matched.sort((a, b) => b.score - a.score);

    // Add remaining users (not friends) without skill-match computation
    const others = [];
    allUsers.forEach((u) => {
      const id = (u._id || u.id)?.toString();
      if (id && id !== currentId && !friendIds.has(id)) {
        others.push({ id, name: u.name, avatar: u.avatar, isFriend: false, skills: u.skills || [], matched: false, score: 0, myTeachSkill: '', theirTeachSkill: '' });
      }
    });

    return { matched, unmatched, others };
  })();

  // All entries flat for lookup
  const allPartners = [...partnerList.matched, ...partnerList.unmatched, ...partnerList.others];
  const selectedPartner = allPartners.find((p) => p.id === bookingForm.partnerId);
  const totalCount = allPartners.length;

  // Custom partner picker open state
  const [partnerPickerOpen, setPartnerPickerOpen] = useState(false);

  // When a partner is selected, auto-fill skill exchange if there is a match
  const handleSelectPartner = (partner) => {
    const updates = { ...bookingForm, partnerId: partner.id };
    if (partner.matched && (partner.myTeachSkill || partner.theirTeachSkill)) {
      updates.skillExchange = {
        hostSkill: partner.myTeachSkill
          ? partner.myTeachSkill.charAt(0).toUpperCase() + partner.myTeachSkill.slice(1)
          : bookingForm.skillExchange.hostSkill,
        partnerSkill: partner.theirTeachSkill
          ? partner.theirTeachSkill.charAt(0).toUpperCase() + partner.theirTeachSkill.slice(1)
          : bookingForm.skillExchange.partnerSkill,
      };
    }
    setBookingForm(updates);
    setPartnerPickerOpen(false);
  };
  const sessions = state.sessions.filter((session) => {
    const hostId = session.hostId?._id || session.hostId;
    const partnerId = session.partnerId?._id || session.partnerId;
    const currentId = state.currentUser?._id || state.currentUser?.id;
    return hostId === currentId || partnerId === currentId;
  });

  const upcomingSessions = sessions.filter(
    (session) =>
      new Date(session.scheduledAt) > new Date() &&
      session.status !== "cancelled"
  );

  const pastSessions = sessions.filter(
    (session) =>
      new Date(session.scheduledAt) <= new Date() ||
      session.status === "completed"
  );

  const getPartnerInfo = (session) => {
    const currentId = state.currentUser?._id || state.currentUser?.id;
    // If populated objects from backend
    if (
      typeof session.hostId === "object" && session.hostId !== null &&
      typeof session.partnerId === "object" && session.partnerId !== null
    ) {
      return session.hostId._id === currentId
        ? session.partnerId
        : session.hostId;
    }
    // Fallback for local state
    const partnerId =
      session.partnerId === currentId ? session.hostId : session.partnerId;
    return state.users.find((u) => (u._id || u.id) === partnerId);
  };

  const handleBookSession = async () => {
    if (
      !state.currentUser ||
      !bookingForm.partnerId ||
      !bookingForm.date ||
      !bookingForm.time
    )
      return;

    const scheduledAt = new Date(`${bookingForm.date}T${bookingForm.time}`);

    try {
      const result = await sessionsAPI.bookSession({
        partnerId: bookingForm.partnerId,
        scheduledAt: scheduledAt.toISOString(),
        type: bookingForm.type,
        skillExchange: bookingForm.skillExchange,
      });

      if (result.session) {
        dispatch({ type: "ADD_SESSION", payload: result.session });
      }
    } catch (err) {
      console.error("Booking error:", err);
    }

    setBookingForm({
      partnerId: "",
      skillExchange: { hostSkill: "", partnerSkill: "" },
      type: "video",
      date: "",
      time: "",
    });
    setShowBookingForm(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "completed":
        return "bg-blue-100 text-blue-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleJoinSession = (session) => {
    const sessionIdentifier = session._id || session.id;
    if (session.type === "video") {
      navigate(`/video/${sessionIdentifier}`);
    } else {
      navigate(`/chat`);
    }
  };

  return (
    <div className="min-h-screen bg-surface p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink mb-2 tracking-tight">
            Schedule & Sessions
          </h1>
          <p className="text-ink-muted text-lg">
            Manage your skill exchange sessions and bookings.
          </p>
          
        </div>
        <button
          onClick={() => setShowBookingForm(true)}
          className="w-full md:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-6 py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
        >
          <Plus className="w-5 h-5" />
          <span>Book Session</span>
        </button>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface-2 backdrop-blur-sm rounded-xl shadow-lg border border-border p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-ink mb-6 tracking-tight">
              Book a Session
            </h2>
            <div className="space-y-4">
              {/* Custom Partner Picker */}
              <div>
                <label className="block text-sm font-medium text-ink-muted mb-2">
                  Select Partner
                  {totalCount > 0 && (
                    <span className="ml-2 text-xs text-ink-muted">({totalCount} available)</span>
                  )}
                </label>

                {/* Trigger button */}
                <button
                  type="button"
                  onClick={() => setPartnerPickerOpen((v) => !v)}
                  className="w-full bg-surface border-border border border-border rounded-lg px-3 py-2.5 text-left flex items-center justify-between hover:border-cyan-500/50 transition-colors"
                >
                  {selectedPartner ? (
                    <span className="flex items-center gap-2">
                      {selectedPartner.matched && <span className="text-yellow-400">⭐</span>}
                      <span className="text-ink">{selectedPartner.name}</span>
                      {selectedPartner.isFriend && <span className="text-xs text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">Friend</span>}
                    </span>
                  ) : (
                    <span className="text-ink-muted">
                      {loadingPartners ? 'Loading partners...' : 'Choose a partner'}
                    </span>
                  )}
                  <svg className={`w-4 h-4 text-ink-muted transition-transform ${partnerPickerOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {/* Dropdown panel */}
                {partnerPickerOpen && (
                  <div className="mt-1 bg-surface-2 border border-border rounded-lg shadow-xl max-h-64 overflow-y-auto z-10 relative">

                    {/* ⭐ Skill Matches */}
                    {partnerList.matched.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-xs font-semibold text-yellow-400 bg-yellow-400/5 border-b border-border sticky top-0">
                          ⭐ Skill Matches ({partnerList.matched.length})
                        </div>
                        {partnerList.matched.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectPartner(p)}
                            className={`w-full text-left px-3 py-2.5 hover:bg-surface border-border transition-colors border-b border-border last:border-0 ${
                              bookingForm.partnerId === p.id ? 'bg-cyan-500/10' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-ink font-medium">{p.name}</span>
                              <span className="text-xs text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">Friend</span>
                            </div>
                            {(p.myTeachSkill || p.theirTeachSkill) && (
                              <div className="text-xs text-ink-muted mt-0.5 flex gap-3">
                                {p.myTeachSkill && <span className="text-emerald-400">You teach: {p.myTeachSkill}</span>}
                                {p.theirTeachSkill && <span className="text-amber-400">They teach: {p.theirTeachSkill}</span>}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Friends (no match) */}
                    {partnerList.unmatched.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-xs font-semibold text-ink-muted bg-surface border-border border-b border-border sticky top-0">
                          Friends ({partnerList.unmatched.length})
                        </div>
                        {partnerList.unmatched.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectPartner(p)}
                            className={`w-full text-left px-3 py-2.5 hover:bg-surface border-border transition-colors border-b border-border last:border-0 ${
                              bookingForm.partnerId === p.id ? 'bg-cyan-500/10' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-ink">{p.name}</span>
                              <span className="text-xs text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">Friend</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Other users */}
                    {partnerList.others.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-xs font-semibold text-ink-muted bg-surface border-border border-b border-border sticky top-0">
                          Other Users ({partnerList.others.length})
                        </div>
                        {partnerList.others.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectPartner(p)}
                            className={`w-full text-left px-3 py-2.5 hover:bg-surface border-border transition-colors border-b border-border last:border-0 ${
                              bookingForm.partnerId === p.id ? 'bg-cyan-500/10' : ''
                            }`}
                          >
                            <span className="text-ink">{p.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {totalCount === 0 && !loadingPartners && (
                      <p className="text-xs text-amber-400 px-3 py-4 text-center">
                        No users found. Add friends from the Friends page first!
                      </p>
                    )}
                  </div>
                )}

                {/* Skill match hint when partner is selected */}
                {selectedPartner?.matched && (
                  <p className="text-xs text-emerald-400 mt-1.5">
                    ✓ Skill match detected — exchange fields pre-filled below!
                  </p>
                )}
                {selectedPartner && !selectedPartner.matched && selectedPartner.isFriend && (
                  <p className="text-xs text-ink-muted mt-1.5">
                    No automatic skill match found. Fill in the exchange below manually.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-muted mb-2">
                    Your Skill
                  </label>
                  <input
                    type="text"
                    value={bookingForm.skillExchange.hostSkill}
                    onChange={(e) =>
                      setBookingForm({
                        ...bookingForm,
                        skillExchange: {
                          ...bookingForm.skillExchange,
                          hostSkill: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-surface border-border border border-border rounded-lg px-3 py-2 text-ink placeholder-slate-400"
                    placeholder="What you'll teach"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-muted mb-2">
                    Their Skill
                  </label>
                  <input
                    type="text"
                    value={bookingForm.skillExchange.partnerSkill}
                    onChange={(e) =>
                      setBookingForm({
                        ...bookingForm,
                        skillExchange: {
                          ...bookingForm.skillExchange,
                          partnerSkill: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-surface border-border border border-border rounded-lg px-3 py-2 text-ink placeholder-slate-400"
                    placeholder="What you'll learn"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-muted mb-2">
                  Session Type
                </label>
                <select
                  value={bookingForm.type}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, type: e.target.value })
                  }
                  className="w-full bg-surface border-border border border-border rounded-lg px-3 py-2 text-ink"
                >
                  <option value="video">Video Call</option>
                  <option value="chat">Text Chat</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-muted mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={bookingForm.date}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, date: e.target.value })
                    }
                    className="w-full bg-surface border-border border border-border rounded-lg px-3 py-2 text-ink"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-muted mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={bookingForm.time}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, time: e.target.value })
                    }
                    className="w-full bg-surface border-border border border-border rounded-lg px-3 py-2 text-ink"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-4 mt-8">
              <button
                onClick={handleBookSession}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-6 py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
              >
                Book Session
              </button>
              <button
                onClick={() => setShowBookingForm(false)}
                className="flex-1 border border-border text-ink-muted px-6 py-3 rounded-lg hover:bg-surface border-border transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upcoming Sessions */}
        <div className="bg-surface-2 backdrop-blur-sm rounded-xl shadow-lg border border-border p-6">
          <h2 className="text-xl font-semibold text-ink mb-6 tracking-tight">
            Upcoming Sessions
          </h2>
          {upcomingSessions.length > 0 ? (
            upcomingSessions.map((session) => {
              const partner = getPartnerInfo(session);
              return (
                <div
                  key={session.id}
                  className="p-4 bg-surface border-border border border-border rounded-lg mb-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {partner?.avatar ? (
                        <img
                          src={partner.avatar}
                          alt={partner.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-gray-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-ink">
                          {partner?.name || "Unknown User"}
                        </h3>
                        <p className="text-sm text-ink-muted">
                          {session.skillExchange.hostSkill} ↔{" "}
                          {session.skillExchange.partnerSkill}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          session.status
                        )}`}
                      >
                        {session.status}
                      </span>
                      <div className="flex items-center space-x-1 text-gray-500">
                        {session.type === "video" ? (
                          <Video className="w-4 h-4" />
                        ) : (
                          <MessageCircle className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-ink-muted">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(session.scheduledAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Date(session.scheduledAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {session.status === "pending" && (
                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={async () => {
                          const sessionId = session._id || session.id;
                          try {
                            await sessionsAPI.updateSession(sessionId, {
                              status: "confirmed",
                            });
                            dispatch({
                              type: "UPDATE_SESSION",
                              payload: {
                                id: sessionId,
                                updates: { status: "confirmed" },
                              },
                            });
                          } catch (err) {
                            console.error("Failed to confirm session:", err);
                          }
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={async () => {
                          const sessionId = session._id || session.id;
                          try {
                            await sessionsAPI.updateSession(sessionId, {
                              status: "cancelled",
                            });
                            dispatch({
                              type: "UPDATE_SESSION",
                              payload: {
                                id: sessionId,
                                updates: { status: "cancelled" },
                              },
                            });
                          } catch (err) {
                            console.error("Failed to cancel session:", err);
                          }
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {/* Show Join button for any confirmed session (no time gate) */}
                  {session.status === "confirmed" && (
                    <button
                      onClick={() => handleJoinSession(session)}
                      className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 flex items-center justify-center gap-2"
                    >
                      {session.type === "video" ? (
                        <><Video className="w-4 h-4" /> Join Video Call</>
                      ) : (
                        <><MessageCircle className="w-4 h-4" /> Start Chat</>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-ink-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-ink mb-2">
                No upcoming sessions
              </h3>
              <p className="text-ink-muted mb-4">
                Book your first skill exchange session!
              </p>
              <button
                onClick={() => setShowBookingForm(true)}
                className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-6 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
              >
                Book Session
              </button>
            </div>
          )}
        </div>

        {/* Session History */}
        <div className="bg-surface-2 backdrop-blur-sm rounded-xl shadow-lg border border-border p-6">
          <h2 className="text-xl font-semibold text-ink mb-6 tracking-tight">
            Session History
          </h2>
          {pastSessions.length > 0 ? (
            pastSessions.slice(0, 5).map((session) => {
              const partner = getPartnerInfo(session);
              return (
                <div
                  key={session.id}
                  className="p-4 bg-surface border-border rounded-lg mb-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {partner?.avatar ? (
                        <img
                          src={partner.avatar}
                          alt={partner.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                      <h3 className="font-medium text-ink text-sm">
                        {partner?.name || "Unknown User"}
                      </h3>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        session.status
                      )}`}
                    >
                      {session.status}
                    </span>
                  </div>
                  <p className="text-sm text-ink-muted mb-2">
                    {session.skillExchange.hostSkill} ↔{" "}
                    {session.skillExchange.partnerSkill}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {new Date(session.scheduledAt).toLocaleDateString()} at{" "}
                    {new Date(session.scheduledAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {session.status === "completed" && (
                    <button className="w-full mt-3 text-cyan-400 hover:text-cyan-300 text-sm font-medium">
                      Leave Review
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-ink-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-ink mb-2">
                No past sessions
              </h3>
              <p className="text-ink-muted">
                Your completed sessions will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;
