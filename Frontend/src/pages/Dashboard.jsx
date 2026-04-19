import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { sessionsAPI, messagesAPI } from '../services/api';
import { 
  Calendar, 
  MessageCircle, 
  Star, 
  Users, 
  Clock,
  TrendingUp,
  Award,
  ArrowRight,
  Search
} from 'lucide-react';

const Dashboard = () => {
  const { state, dispatch, api } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load real data when dashboard mounts
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!state.isAuthenticated || !state.currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch sessions and conversations in parallel for real-time data
        const [sessionsData, conversationsData] = await Promise.allSettled([
          sessionsAPI.getSessions(),
          messagesAPI.getConversations(),
        ]);

        if (sessionsData.status === 'fulfilled' && sessionsData.value?.sessions) {
          dispatch({ type: 'SET_SESSIONS', payload: sessionsData.value.sessions });
        }

        if (conversationsData.status === 'fulfilled' && conversationsData.value?.conversations) {
          dispatch({ type: 'SET_CONVERSATIONS', payload: conversationsData.value.conversations });
        }

      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError(`Failed to load dashboard: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [state.isAuthenticated, state.currentUser, dispatch]);

  // Calculate statistics from state
  const currentId = state.currentUser?._id || state.currentUser?.id;
  const upcomingSessions = (state.sessions || []).filter((session) => {
    const hostId = session.hostId?._id || session.hostId;
    const partnerId = session.partnerId?._id || session.partnerId;
    return (hostId === currentId || partnerId === currentId) &&
      new Date(session.scheduledAt) > new Date() &&
      session.status !== 'cancelled';
  });
  const recentNotifications = [];

  // Real statistics calculations from user profile
  const completedSessions = (state.sessions || []).filter(s => s.status === 'completed').length;
  const averageRating = state.currentUser?.rating || 0;
  const reviewCount = state.currentUser?.reviewCount || 0;
  const skillsOffered = (state.currentUser?.skills || []).filter(skill => skill.offering).length;
  const skillsLearning = (state.currentUser?.skills || []).filter(skill => !skill.offering).length;
  const unreadConversations = (state.conversations || []).filter(c => c.unreadCount > 0).length;
  const newMatches = 0; // Will be updated when matches API is available


  const stats = [
    {
      label: 'Skills Teaching',
      value: skillsOffered,
      icon: Award,
      color: 'bg-gradient-to-r from-cyan-500 to-teal-500',
      change: skillsOffered > 0 ? `${skillsOffered} skills` : 'Add teaching skills',
    },
    {
      label: 'Skills Learning',
      value: skillsLearning,
      icon: Star,
      color: 'bg-gradient-to-r from-amber-500 to-orange-500',
      change: skillsLearning > 0 ? `${skillsLearning} skills` : 'Add learning skills',
    },
    {
      label: 'Total Skills',
      value: (state.currentUser?.skills || []).length,
      icon: TrendingUp,
      color: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      change: (state.currentUser?.skills || []).length > 0 ? 'Profile complete' : 'Add your skills',
    },
    {
      label: 'Profile Rating',
      value: averageRating > 0 ? averageRating.toFixed(1) : 'New user',
      icon: Users,
      color: 'bg-gradient-to-r from-purple-500 to-violet-500',
      change: reviewCount > 0 ? `${reviewCount} reviews` : 'No reviews yet',
    },
  ];

  const getPartnerName = (session) => {
    const currentUserId = state.currentUser?._id || state.currentUser?.id;
    const partnerId = session.partnerId === currentUserId ? session.hostId : session.partnerId;
    const partner = state.users.find(u => (u._id || u.id) === partnerId);
    return partner?.name || 'Unknown Partner';
  };

  // Show loading state
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto bg-slate-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state only for critical errors
  if (error && (error.includes('Authentication') || error.includes('401') || error.includes('403'))) {
    return (
      <div className="p-6 max-w-7xl mx-auto bg-slate-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Authentication Error</h2>
          <p className="text-slate-300 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:from-cyan-600 hover:to-teal-600 transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show empty state if no user
  if (!state.currentUser) {
    return (
      <div className="p-6 max-w-7xl mx-auto bg-slate-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-slate-300 text-xl">👤</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Please Log In</h2>
          <p className="text-slate-300 mb-4">You need to be logged in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  console.log('Dashboard rendering with state:', {
    isAuthenticated: state.isAuthenticated,
    currentUser: state.currentUser,
    loading,
    error
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-surface min-h-screen font-sans text-ink">

      {/* Welcome Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center space-x-5">
          {state.currentUser?.avatar ? (
            <img
              src={state.currentUser.avatar.startsWith("http") ? state.currentUser.avatar : `${import.meta.env.VITE_API_URL}${state.currentUser.avatar}`}
              alt={state.currentUser.name}
              className="w-20 h-20 rounded-full object-cover shadow-sm border border-border"
              onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
            />
          ) : null}
          {!state.currentUser?.avatar && (
            <div className="w-20 h-20 bg-surface-2 rounded-full flex items-center justify-center shadow-sm border border-border">
              <span className="text-3xl font-display font-medium text-ink">
                {state.currentUser?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-4xl font-display font-medium text-ink tracking-tight mb-2">
              Welcome back, {state.currentUser?.name.split(' ')[0]}.
            </h1>
            <p className="text-ink-muted text-lg">
              Here is your command center for teaching and learning.
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
            <Link
              to="/booking"
              className="px-5 py-2.5 rounded-full border border-border text-ink font-medium hover:bg-surface-2 transition-colors flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" /> Schedule
            </Link>
            <Link
              to="/search"
              className="px-5 py-2.5 rounded-full bg-accent text-white font-medium hover:bg-opacity-90 transition-transform hover:scale-105 shadow-sm flex items-center gap-2"
            >
              Find a Swap
            </Link>
        </div>
      </div>

      {/* Stats Line */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-surface rounded-2xl p-5 border border-border shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 bg-surface-2 rounded-xl flex items-center justify-center">
                <Icon className="w-5 h-5 text-ink-muted" />
              </div>
              <div>
                <div className="text-2xl font-display font-medium text-ink tracking-tight">{stat.value}</div>
                <div className="text-sm text-ink-muted">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3-Column Layout */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Main Content (Cols 1 & 2) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Upcoming Sessions Card */}
          <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-display font-medium tracking-tight">Your Next Session</h2>
              <Link to="/booking" className="text-sm text-blue font-medium hover:underline flex items-center gap-1">
                View Calendar <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            {upcomingSessions.length > 0 ? (
               <div className="p-6">
                 {/* Only show the soonest session here for brevity */}
                 {upcomingSessions.slice(0, 1).map(session => (
                    <div key={session._id} className="flex flex-col sm:flex-row items-center justify-between p-5 bg-surface-2 rounded-xl border border-border">
                        <div className="flex items-center gap-4 mb-4 sm:mb-0">
                           <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center border border-border">
                             <Calendar className="w-5 h-5 text-accent" />
                           </div>
                           <div>
                             <h3 className="font-semibold text-ink">Swap with {getPartnerName(session)}</h3>
                             <p className="text-sm text-ink-muted">{new Date(session.scheduledAt).toLocaleString()}</p>
                           </div>
                        </div>
                        <Link to="/booking" className="w-full sm:w-auto px-4 py-2 bg-ink text-white rounded-full text-sm font-medium text-center hover:bg-black transition-colors">
                           Join Room
                        </Link>
                    </div>
                 ))}
               </div>
            ) : (
              <div className="p-10 text-center">
                <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                  <Clock className="w-6 h-6 text-ink-muted" />
                </div>
                <h3 className="text-lg font-semibold text-ink mb-1">No upcoming sessions</h3>
                <p className="text-ink-muted text-sm mb-5">Your schedule is wide open. Time to learn something new.</p>
                <Link
                  to="/search"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-surface-2 text-ink border border-border hover:bg-surface font-medium transition-colors"
                >
                  <Search className="w-4 h-4" /> Browse Skills
                </Link>
              </div>
            )}
          </div>

          {/* Activity Breakdown & Quick Actions */}
          <div className="grid md:grid-cols-2 gap-8">
             {/* Quick Actions */}
             <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
                <h2 className="text-xl font-display font-medium tracking-tight mb-5">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/search" className="flex flex-col items-start p-4 bg-surface-2 rounded-xl hover:bg-[#F2F1EC] transition-colors border border-transparent hover:border-border">
                    <Users className="w-6 h-6 text-ink mb-3" />
                    <span className="font-medium text-sm">Find Matches</span>
                  </Link>
                  <Link to="/profile" className="flex flex-col items-start p-4 bg-surface-2 rounded-xl hover:bg-[#F2F1EC] transition-colors border border-transparent hover:border-border">
                    <Star className="w-6 h-6 text-accent mb-3" />
                    <span className="font-medium text-sm">Edit Skills</span>
                  </Link>
                  <Link to="/chat" className="flex flex-col items-start p-4 bg-surface-2 rounded-xl hover:bg-[#F2F1EC] transition-colors border border-transparent hover:border-border">
                    <MessageCircle className="w-6 h-6 text-blue mb-3" />
                    <span className="font-medium text-sm">Messages</span>
                  </Link>
                  <Link to="/friends" className="flex flex-col items-start p-4 bg-surface-2 rounded-xl hover:bg-[#F2F1EC] transition-colors border border-transparent hover:border-border">
                    <Award className="w-6 h-6 text-green mb-3" />
                    <span className="font-medium text-sm">Network</span>
                  </Link>
                </div>
             </div>

             {/* Profile Progress Widget */}
             <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 flex flex-col justify-between">
                <div>
                   <h2 className="text-xl font-display font-medium tracking-tight mb-2">Teaching & Learning</h2>
                   <p className="text-sm text-ink-muted mb-6">A healthy swap ratio builds trust in the community.</p>
                </div>
                
                <div className="space-y-4">
                   <div>
                     <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Teaching ({skillsOffered})</span>
                        <span className="text-ink-muted">{Math.round((skillsOffered / Math.max(stats[2].value, 1)) * 100)}%</span>
                     </div>
                     <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${(skillsOffered / Math.max(stats[2].value, 1)) * 100}%` }} />
                     </div>
                   </div>
                   
                   <div>
                     <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Learning ({skillsLearning})</span>
                        <span className="text-ink-muted">{Math.round((skillsLearning / Math.max(stats[2].value, 1)) * 100)}%</span>
                     </div>
                     <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                        <div className="h-full bg-green rounded-full" style={{ width: `${(skillsLearning / Math.max(stats[2].value, 1)) * 100}%` }} />
                     </div>
                   </div>
                </div>
             </div>
          </div>
          
        </div>

        {/* Right Sidebar (Col 3) */}
        <div className="space-y-8">
          
          {/* Unread Messages / Feed */}
          <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-5 border-b border-border bg-surface flex items-center justify-between">
              <h3 className="text-lg font-display font-medium tracking-tight">Inbox</h3>
              {unreadConversations > 0 && (
                <span className="bg-accent text-white text-xs px-2 py-0.5 rounded-full font-bold">{unreadConversations} New</span>
              )}
            </div>
            
            <div className="p-2">
              {state.conversations.length > 0 ? (
                <div className="space-y-1">
                   {state.conversations.slice(0, 4).map((chat) => (
                      <Link key={chat._id} to={`/chat?user=${chat.user?._id || chat._id}`} className="flex items-center gap-3 p-3 hover:bg-surface-2 rounded-xl transition-colors">
                         <div className="relative">
                            {chat.user?.avatar ? (
                              <img src={chat.user.avatar.startsWith('http') ? chat.user.avatar : `${import.meta.env.VITE_API_URL}${chat.user.avatar}`} alt="" className="w-10 h-10 rounded-full object-cover border border-border" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center font-medium text-sm">
                                {chat.user?.name?.charAt(0) || '?'}
                              </div>
                            )}
                            {chat.unreadCount > 0 && <div className="absolute top-0 right-0 w-3 h-3 bg-accent rounded-full border-2 border-surface" />}
                         </div>
                         <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-0.5">
                               <p className={`text-sm truncate ${chat.unreadCount > 0 ? 'font-bold text-ink' : 'font-medium text-ink'}`}>{chat.user?.name || 'Unknown'}</p>
                            </div>
                            <p className={`text-xs truncate ${chat.unreadCount > 0 ? 'font-medium text-ink' : 'text-ink-muted'}`}>
                               {chat.lastMessage?.content || "Click to view messages"}
                            </p>
                         </div>
                      </Link>
                   ))}
                </div>
              ) : (
                <div className="p-8 text-center border-t border-transparent">
                  <div className="w-10 h-10 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-3 border border-border">
                    <MessageCircle className="w-5 h-5 text-ink-muted" />
                  </div>
                  <p className="text-sm font-medium text-ink">It's quiet here.</p>
                  <p className="text-xs text-ink-muted mt-1">Start a conversation with a match.</p>
                </div>
              )}
            </div>
            
            <Link to="/chat" className="block p-3 text-center text-sm font-medium text-blue border-t border-border hover:bg-surface-2 transition-colors">
               Open Messages
            </Link>
          </div>

          {/* Featured Skills / Tags preview */}
          <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
             <h3 className="text-lg font-display font-medium tracking-tight mb-4">Your Arsenal</h3>
             {state.currentUser?.skills?.length ? (
               <div className="flex flex-wrap gap-2">
                 {state.currentUser.skills.map((skill, index) => (
                    <span 
                      key={index} 
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                        skill.offering 
                         ? 'bg-accent-soft text-accent border-accent/20' 
                         : 'bg-surface text-ink-muted border-border'
                      }`}
                    >
                      {skill.name}
                    </span>
                 ))}
               </div>
             ) : (
                <p className="text-sm text-ink-muted text-center py-4">No skills added yet.</p>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
