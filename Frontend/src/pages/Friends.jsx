import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { friendRequestAPI } from '../services/api';
import { 
  UserPlus, 
  UserCheck, 
  UserX, 
  Users, 
  Clock,
  Check,
  X,
  User as UserIcon
} from 'lucide-react';

const Friends = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'friends'
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load friend requests
  const loadFriendRequests = async () => {
    setLoading(true);
    try {
      const response = await friendRequestAPI.getFriendRequests('received');
      setFriendRequests(response.friendRequests || []);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load friends list
  const loadFriends = async () => {
    setLoading(true);
    try {
      const response = await friendRequestAPI.getFriends();
      setFriends(response.friends || []);
    } catch (error) {
      console.error('Error loading friends:', error);
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
    try {
      await friendRequestAPI.acceptFriendRequest(requestId);
      await loadFriendRequests();
      await loadFriends();
      alert('Friend request accepted!');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Failed to accept friend request');
    }
  };

  // Handle decline friend request
  const handleDeclineRequest = async (requestId) => {
    try {
      await friendRequestAPI.declineFriendRequest(requestId);
      await loadFriendRequests();
      alert('Friend request declined');
    } catch (error) {
      console.error('Error declining friend request:', error);
      alert('Failed to decline friend request');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2 tracking-tight">Friends</h1>
        <p className="text-slate-300 text-lg">
          Manage your friend requests and connect with your network.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-300 ${
            activeTab === 'requests'
              ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/25'
              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
          }`}
        >
          <UserPlus className="w-5 h-5" />
          <span>Friend Requests</span>
          {friendRequests.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {friendRequests.length}
            </span>
          )}
        </button>
        
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-300 ${
            activeTab === 'friends'
              ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/25'
              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>My Friends</span>
          <span className="bg-slate-600 text-white text-xs px-2 py-1 rounded-full">
            {friends.length}
          </span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'requests' ? (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50 p-6">
          <h2 className="text-xl font-semibold text-slate-100 mb-6">Friend Requests</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-300">Loading friend requests...</p>
            </div>
          ) : friendRequests.length > 0 ? (
            <div className="space-y-4">
              {friendRequests.map((request) => (
                <div key={request._id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-center space-x-4">
                    {request.senderId.avatar ? (
                      <img
                        src={request.senderId.avatar.startsWith('http') ? request.senderId.avatar : `http://localhost:5000${request.senderId.avatar}`}
                        alt={request.senderId.name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          console.log('Friend request avatar load error:', e.target.src);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center ${request.senderId.avatar ? 'hidden' : ''}`}>
                      <UserIcon className="w-6 h-6 text-slate-400" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-100">{request.senderId.name}</h3>
                      <p className="text-sm text-slate-300">
                        {request.message || 'Wants to connect with you'}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAcceptRequest(request._id)}
                        className="flex items-center space-x-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(request._id)}
                        className="flex items-center space-x-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-100 mb-2">No friend requests</h3>
              <p className="text-slate-300">You don't have any pending friend requests.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50 p-6">
          <h2 className="text-xl font-semibold text-slate-100 mb-6">My Friends</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-300">Loading friends...</p>
            </div>
          ) : friends.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map((friend) => (
                <div key={friend._id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-cyan-500/30 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    {friend.avatar ? (
                      <img
                        src={friend.avatar.startsWith('http') ? friend.avatar : `http://localhost:5000${friend.avatar}`}
                        alt={friend.name}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          console.log('Friend avatar load error:', e.target.src);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center ${friend.avatar ? 'hidden' : ''}`}>
                      <UserIcon className="w-5 h-5 text-slate-400" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-100">{friend.name}</h3>
                      <p className="text-sm text-slate-300">{friend.location}</p>
                    </div>
                    
                    <div className="flex items-center text-green-400">
                      <UserCheck className="w-4 h-4" />
                    </div>
                  </div>
                  
                  {friend.bio && (
                    <p className="text-sm text-slate-300 mb-3 line-clamp-2">{friend.bio}</p>
                  )}
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => navigate(`/chat?user=${friend._id}`)}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-3 py-2 rounded-lg transition-all duration-300 text-sm"
                    >
                      Message
                    </button>
                    <button className="px-3 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/50 transition-colors text-sm">
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-100 mb-2">No friends yet</h3>
              <p className="text-slate-300">Start by sending friend requests to people you'd like to connect with.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Friends;
