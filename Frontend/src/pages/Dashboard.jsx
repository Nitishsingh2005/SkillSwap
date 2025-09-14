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
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      label: 'Average Rating',
      value: averageRating.toFixed(1),
      icon: Star,
      color: 'bg-yellow-500',
      change: '+0.2',
    },
    {
      label: 'Skills Offered',
      value: skillCount,
      icon: TrendingUp,
      color: 'bg-green-500',
      change: '+2',
    },
    {
      label: 'New Matches',
      value: state.matches.length,
      icon: Users,
      color: 'bg-purple-500',
      change: '+5',
    },
  ];

  const getPartnerName = (session) => {
    const partnerId = session.partnerId === state.currentUser?.id ? session.hostId : session.partnerId;
    const partner = state.users.find(u => u.id === partnerId);
    return partner?.name || 'Unknown';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {state.currentUser?.name}! 👋
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your skill swapping journey.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm text-green-600 font-medium">{stat.change}</span>
              </div>
              <div className="mb-1">
                <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
              </div>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Sessions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Sessions</h2>
              <Link 
                to="/booking" 
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
              >
                <span>View all</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            {upcomingSessions.length > 0 ? (
              <div className="space-y-4">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        Session with {getPartnerName(session)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {session.skillExchange.hostSkill} ↔ {session.skillExchange.partnerSkill}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center mt-1">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(session.scheduledAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        session.type === 'video' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {session.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming sessions</h3>
                <p className="text-gray-600 mb-4">Start by searching for skill partners or check your matches.</p>
                <div className="flex justify-center space-x-4">
                  <Link
                    to="/search"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse Skills
                  </Link>
                  <Link
                    to="/matches"
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    View Matches
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                to="/search"
                className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Users className="w-8 h-8 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-blue-700">Find Partners</span>
              </Link>
              <Link
                to="/chat"
                className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <MessageCircle className="w-8 h-8 text-green-600 mb-2" />
                <span className="text-sm font-medium text-green-700">Messages</span>
              </Link>
              <Link
                to="/booking"
                className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <Calendar className="w-8 h-8 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-purple-700">Schedule</span>
              </Link>
              <Link
                to="/profile"
                className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <Star className="w-8 h-8 text-orange-600 mb-2" />
                <span className="text-sm font-medium text-orange-700">Profile</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Recent Notifications */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <Link 
                to="/notifications" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all
              </Link>
            </div>
            
            {recentNotifications.length > 0 ? (
              <div className="space-y-4">
                {recentNotifications.map((notification) => (
                  <div key={notification.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                      <p className="text-sm text-gray-600">{notification.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No new notifications</p>
            )}
          </div>

          {/* Skill Progress */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Your Skills</h3>
            {state.currentUser?.skills?.length ? (
              <div className="space-y-4">
                {state.currentUser.skills.slice(0, 4).map((skill, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{skill.name}</h4>
                      <p className="text-xs text-gray-600">{skill.category}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      skill.level === 'Expert' 
                        ? 'bg-green-100 text-green-700'
                        : skill.level === 'Intermediate'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {skill.level}
                    </span>
                  </div>
                ))}
                <Link
                  to="/profile"
                  className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium mt-4"
                >
                  Manage Skills
                </Link>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm mb-4">Add your skills to get started</p>
                <Link
                  to="/profile"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
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
