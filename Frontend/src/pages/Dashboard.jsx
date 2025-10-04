import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { sampleUsers, sampleSessions, sampleNotifications, sampleMatches } from '../utils/sampleData';
import { 
  Calendar, 
  MessageCircle, 
  Star, 
  Users, 
  Clock,
  TrendingUp,
  Award,
  ArrowRight
} from 'lucide-react';

const Dashboard = () => {
  const { state, dispatch } = useApp();
  
  // Debug logging for avatar updates
  console.log("Dashboard render - currentUser:", state.currentUser);
  console.log("Dashboard render - avatar:", state.currentUser?.avatar);

  useEffect(() => {
    // Initialize sample data if not already loaded
    if (state.users.length === 0) {
      dispatch({ type: 'SET_USERS', payload: sampleUsers });
    }
    if (state.notifications.length === 0) {
      sampleNotifications.forEach(notification => {
        dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
      });
    }
    if (state.matches.length === 0) {
      dispatch({ type: 'SET_MATCHES', payload: sampleMatches });
    }
    
    // Add sample sessions
    sampleSessions.forEach(session => {
      dispatch({ type: 'ADD_SESSION', payload: session });
    });
  }, [dispatch, state.users.length, state.notifications.length, state.matches.length]);

  const upcomingSessions = state.sessions
    .filter(session => session.scheduledAt > new Date() && session.status === 'confirmed')
    .slice(0, 3);
    
  const recentNotifications = state.notifications
    .filter(n => !n.read)
    .slice(0, 4);

  const completedSessions = state.sessions.filter(s => s.status === 'completed').length;
  const averageRating = state.currentUser?.rating || 0;
  const skillCount = state.currentUser?.skills?.length || 0;

  const stats = [
    {
      label: 'Completed Sessions',
      value: completedSessions,
      icon: Award,
      color: 'bg-gradient-to-r from-cyan-500 to-teal-500',
      change: '+12%',
    },
    {
      label: 'Average Rating',
      value: averageRating.toFixed(1),
      icon: Star,
      color: 'bg-gradient-to-r from-amber-500 to-orange-500',
      change: '+0.2',
    },
    {
      label: 'Skills Offered',
      value: skillCount,
      icon: TrendingUp,
      color: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      change: '+2',
    },
    {
      label: 'New Matches',
      value: state.matches.length,
      icon: Users,
      color: 'bg-gradient-to-r from-purple-500 to-violet-500',
      change: '+5',
    },
  ];

  const getPartnerName = (session) => {
    const partnerId = session.partnerId === state.currentUser?.id ? session.hostId : session.partnerId;
    const partner = state.users.find(u => u.id === partnerId);
    return partner?.name || 'Unknown';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-slate-900 min-h-screen">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          {state.currentUser?.avatar ? (
            <img
              src={
                state.currentUser.avatar.startsWith("http")
                  ? state.currentUser.avatar
                  : `http://localhost:5000${state.currentUser.avatar}`
              }
              alt={state.currentUser.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-slate-600"
              onError={(e) => {
                console.error("Image load error:", e.target.src);
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
          ) : null}
          {!state.currentUser?.avatar && (
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-600">
              <span className="text-2xl font-bold text-slate-200 tracking-tight">
                {state.currentUser?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-2 tracking-tight">
              Welcome back, {state.currentUser?.name}! 👋
            </h1>
            <p className="text-slate-300 font-medium">
              Here's what's happening with your skill swapping journey.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm text-emerald-400 font-medium">{stat.change}</span>
              </div>
              <div className="mb-1">
                <span className="text-2xl font-bold text-slate-100 tracking-tight">{stat.value}</span>
              </div>
              <p className="text-sm text-slate-300 font-medium">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Sessions */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-100 tracking-tight">Upcoming Sessions</h2>
              <Link 
                to="/booking" 
                className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1 transition-colors"
              >
                <span>View all</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            {upcomingSessions.length > 0 ? (
              <div className="space-y-4">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center space-x-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:border-cyan-500/30 transition-all duration-300">
                    <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-100 tracking-tight">
                        Session with {getPartnerName(session)}
                      </h3>
                      <p className="text-sm text-slate-300 font-medium">
                        {session.skillExchange.hostSkill} ↔ {session.skillExchange.partnerSkill}
                      </p>
                      <p className="text-sm text-slate-400 flex items-center mt-1 font-medium">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(session.scheduledAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        session.type === 'video' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}>
                        {session.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-100 mb-2 tracking-tight">No upcoming sessions</h3>
                <p className="text-slate-300 mb-4 font-medium">Start by searching for skill partners or check your matches.</p>
                <div className="flex justify-center space-x-4">
                  <Link
                    to="/search"
                    className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:from-cyan-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 font-semibold"
                  >
                    Browse Skills
                  </Link>
                  <Link
                    to="/matches"
                    className="border border-slate-600 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 font-semibold"
                  >
                    View Matches
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300">
            <h2 className="text-xl font-semibold text-slate-100 mb-6 tracking-tight">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                to="/search"
                className="flex flex-col items-center p-4 bg-slate-700/50 rounded-lg hover:bg-slate-600/50 border border-slate-600/50 hover:border-cyan-500/30 transition-all duration-300"
              >
                <Users className="w-8 h-8 text-cyan-400 mb-2" />
                <span className="text-sm font-semibold text-slate-200">Find Partners</span>
              </Link>
              <Link
                to="/chat"
                className="flex flex-col items-center p-4 bg-slate-700/50 rounded-lg hover:bg-slate-600/50 border border-slate-600/50 hover:border-emerald-500/30 transition-all duration-300"
              >
                <MessageCircle className="w-8 h-8 text-emerald-400 mb-2" />
                <span className="text-sm font-semibold text-slate-200">Messages</span>
              </Link>
              <Link
                to="/booking"
                className="flex flex-col items-center p-4 bg-slate-700/50 rounded-lg hover:bg-slate-600/50 border border-slate-600/50 hover:border-purple-500/30 transition-all duration-300"
              >
                <Calendar className="w-8 h-8 text-purple-400 mb-2" />
                <span className="text-sm font-semibold text-slate-200">Schedule</span>
              </Link>
              <Link
                to="/profile"
                className="flex flex-col items-center p-4 bg-slate-700/50 rounded-lg hover:bg-slate-600/50 border border-slate-600/50 hover:border-orange-500/30 transition-all duration-300"
              >
                <Star className="w-8 h-8 text-orange-400 mb-2" />
                <span className="text-sm font-semibold text-slate-200">Profile</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Recent Notifications */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-100 tracking-tight">Recent Activity</h3>
              <Link 
                to="/notifications" 
                className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                View all
              </Link>
            </div>
            
            {recentNotifications.length > 0 ? (
              <div className="space-y-4">
                {recentNotifications.map((notification) => (
                  <div key={notification.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-100">{notification.title}</h4>
                      <p className="text-sm text-slate-300 font-medium">{notification.content}</p>
                      <p className="text-xs text-slate-400 mt-1 font-medium">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-4 font-medium">No new notifications</p>
            )}
          </div>

          {/* Skill Progress */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300">
            <h3 className="text-lg font-semibold text-slate-100 mb-6 tracking-tight">Your Skills</h3>
            {state.currentUser?.skills?.length ? (
              <div className="space-y-4">
                {state.currentUser.skills.slice(0, 4).map((skill, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-100">{skill.name}</h4>
                      <p className="text-xs text-slate-300 font-medium">{skill.category}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      skill.level === 'Expert' 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : skill.level === 'Intermediate'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      {skill.level}
                    </span>
                  </div>
                ))}
                <Link
                  to="/profile"
                  className="block text-center text-sm text-cyan-400 hover:text-cyan-300 font-semibold mt-4 transition-colors"
                >
                  Manage Skills
                </Link>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-400 text-sm mb-4 font-medium">Add your skills to get started</p>
                <Link
                  to="/profile"
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-4 py-2 rounded-lg text-sm hover:from-cyan-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 font-semibold"
                >
                  Add Skills
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
