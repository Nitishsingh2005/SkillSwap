import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
//import { sampleUsers } from '../utils/sampleData';
import { skillsAPI, friendRequestAPI } from '../services/api';
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
  UserPlus
} from 'lucide-react';

const Search = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [skillMatches, setSkillMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState('search'); // 'matches' or 'search'

  // Fetch skill matches from API
  const fetchSkillMatches = async () => {
    console.log('fetchSkillMatches called - currentUser:', state.currentUser);
    console.log('fetchSkillMatches called - isAuthenticated:', state.isAuthenticated);
    
    if (!state.currentUser) {
      console.log('No current user found, cannot fetch skill matches');
      setSkillMatches([]);
      return;
    }
    
    setLoading(true);
    try {
      console.log('Fetching skill matches for user:', state.currentUser.name);
      const response = await skillsAPI.findSkillMatches();
      console.log('Skill matches response:', response);
      setSkillMatches(response.matches || []);
    } catch (error) {
      console.error('Error fetching skill matches:', error);
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
    if (state.currentUser && searchMode === 'search') {
      setSearchMode('matches');
    }
  }, [state.currentUser]);

  // Fetch skill matches when component mounts or user changes
  useEffect(() => {
    if (state.currentUser && searchMode === 'matches') {
      fetchSkillMatches();
    }
  }, [state.currentUser, searchMode]);

  // Listen for skill updates to refresh matches
  useEffect(() => {
    const handleSkillUpdate = () => {
      if (searchMode === 'matches') {
        fetchSkillMatches();
      }
    };

    window.addEventListener('skillUpdated', handleSkillUpdate);
    return () => window.removeEventListener('skillUpdated', handleSkillUpdate);
  }, [searchMode]);

  // Handle search mode changes
  useEffect(() => {
    if (searchMode === 'search') {
      // Use existing search logic
      let results = state.users.filter(user => user.id !== state.currentUser?.id);

      if (searchTerm) {
        results = results.filter(user =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.skills.some(skill => skill.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      if (filters.skill) {
        results = results.filter(user =>
          user.skills.some(skill => skill.name.toLowerCase().includes(filters.skill.toLowerCase()))
        );
      }

      if (filters.category) {
        results = results.filter(user =>
          user.skills.some(skill => skill.category === filters.category)
        );
      }

      if (filters.level) {
        results = results.filter(user =>
          user.skills.some(skill => skill.level === filters.level)
        );
      }

      if (filters.location) {
        results = results.filter(user =>
          user.location.toLowerCase().includes(filters.location.toLowerCase())
        );
      }

      if (filters.videoCallReady !== undefined) {
        results = results.filter(user => user.videoCallReady === filters.videoCallReady);
      }

      setFilteredUsers(results);
    }
  }, [searchTerm, filters, state.users, state.currentUser, searchMode]);

  const skillCategories = [
    'Frontend', 'Backend', 'Design', 'Data Science', 'Mobile', 'DevOps', 'Marketing', 'Other'
  ];

  const skillLevels = ['Beginner', 'Intermediate', 'Expert'];

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const getUserSkillsOffered = (user) => user.skills.filter(skill => skill.offering);
  const getUserSkillsSeeking = (user) => user.skills.filter(skill => !skill.offering);

  const handleMessageUser = (userId) => {
    // Navigate to chat with the selected user
    navigate(`/chat?user=${userId}`);
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      await friendRequestAPI.sendFriendRequest(userId);
      alert('Friend request sent successfully!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2 tracking-tight">Find Your Skill Partner</h1>
        <p className="text-slate-300 text-lg mb-6">
          Discover people who can teach you new skills or learn from your expertise.
        </p>
        
        {/* Search Mode Toggle - Only show when logged in */}
        {state.currentUser && (
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setSearchMode('matches')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-300 ${
                searchMode === 'matches'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Skill Matches</span>
            </button>
            <button
              onClick={() => setSearchMode('search')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-300 ${
                searchMode === 'search'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <SearchIcon className="w-5 h-5" />
              <span>Search All Users</span>
            </button>
          </div>
        )}
      </div>

      {/* Search and Filters - Only show in search mode */}
      {searchMode === 'search' && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, skills, or bio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-6 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 hover:bg-slate-600 transition-colors"
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-600">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Skill</label>
              <input
                type="text"
                placeholder="e.g., React, Python"
                value={filters.skill || ''}
                onChange={(e) => setFilters({ ...filters, skill: e.target.value || undefined })}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
              <select
                value={filters.category || ''}
                onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100"
              >
                <option value="">All Categories</option>
                {skillCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Level</label>
              <select
                value={filters.level || ''}
                onChange={(e) => setFilters({ ...filters, level: e.target.value || undefined })}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100"
              >
                <option value="">All Levels</option>
                {skillLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
              <input
                type="text"
                placeholder="City, State"
                value={filters.location || ''}
                onChange={(e) => setFilters({ ...filters, location: e.target.value || undefined })}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-400"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.videoCallReady || false}
                  onChange={(e) => setFilters({ ...filters, videoCallReady: e.target.checked ? true : undefined })}
                  className="rounded"
                />
                <span className="text-sm font-medium text-slate-300">Video calls available</span>
              </label>
            </div>

            <div className="md:col-span-2 lg:col-span-4 flex justify-end">
              <button onClick={clearFilters} className="text-cyan-400 hover:text-cyan-300 font-medium">
                Clear all filters
              </button>
            </div>
          </div>
        )}
        </div>
      )}

      {/* Results */}
      <div className="mb-6">
        {searchMode === 'matches' ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-100 tracking-tight">
                {loading ? 'Finding matches...' : `${skillMatches.length} skill match${skillMatches.length === 1 ? '' : 'es'} found`}
              </h2>
              <button
                onClick={fetchSkillMatches}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                <SearchIcon className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
            
            {!state.currentUser ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-100 mb-2">Please log in to find skill matches</h3>
                <p className="text-slate-300 mb-4">You need to be logged in to see personalized skill matches.</p>
                <button 
                  onClick={() => window.location.href = '/login'}
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-6 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
                >
                  Go to Login
                </button>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-300">Finding your perfect skill matches...</p>
              </div>
            ) : skillMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {skillMatches.map(user => (
                  <div key={user._id} className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50 p-6 hover:border-cyan-500/30 hover:shadow-cyan-500/10 transition-all duration-300">
                    <div className="flex items-center space-x-4 mb-4">
                      {user.avatar ? (
                        <img 
                          src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`}
                          alt={user.name} 
                          className="w-16 h-16 rounded-full object-cover"
                          onError={(e) => {
                            console.log('Skill match avatar load error:', e.target.src);
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center ${user.avatar ? 'hidden' : ''}`}>
                        <UserIcon className="w-8 h-8 text-slate-400" />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-100">{user.name}</h3>
                        <div className="flex items-center space-x-2 text-sm text-slate-300 mt-1">
                          {user.rating > 0 && (
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span>{user.rating.toFixed(1)}</span>
                            </div>
                          )}
                          {user.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{user.location}</span>
                            </div>
                          )}
                          {user.videoCallReady && (
                            <div className="flex items-center space-x-1 text-green-400">
                              <Video className="w-4 h-4" />
                              <span>Video</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300">
                            {user.matchScore} match{user.matchScore !== 1 ? 'es' : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-300 text-sm mb-4 line-clamp-3">{user.bio}</p>

                    {/* Matching Skills */}
                    <div className="mb-4">
                      {user.matchingSkills && user.matchingSkills.length > 0 && (
                        <div className="space-y-2">
                          {user.matchingSkills.map((skill, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              {skill.type === 'can_teach_me' ? (
                                <GraduationCap className="w-4 h-4 text-blue-400" />
                              ) : (
                                <BookOpen className="w-4 h-4 text-green-400" />
                              )}
                              <span className={`text-sm font-medium ${
                                skill.type === 'can_teach_me' ? 'text-blue-300' : 'text-green-300'
                              }`}>
                                {skill.type === 'can_teach_me' ? 'Can teach me' : 'Wants to learn'} {skill.name}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                skill.level === "Expert"
                                  ? "bg-green-500/20 text-green-400"
                                  : skill.level === "Intermediate"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-blue-500/20 text-blue-400"
                              }`}>
                                {skill.level}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleSendFriendRequest(user._id)}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-green-500/25 flex items-center justify-center space-x-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Send Friend Request</span>
                      </button>
                      <button className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/50 transition-colors">
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-100 mb-2">No skill matches found</h3>
                <p className="text-slate-300 mb-4">
                  {state.currentUser?.skills?.length === 0 
                    ? "Add skills to your profile to find people who can teach you or learn from you."
                    : "No users found with complementary skills. Try adding more skills to your profile or browse all users."
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button 
                    onClick={() => window.location.href = '/profile'}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
                  >
                    Update Profile
                  </button>
                  <button 
                    onClick={() => setSearchMode('search')}
                    className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-6 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
                  >
                    Browse All Users
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-slate-100 mb-4 tracking-tight">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'person' : 'people'} found
            </h2>
            
            {filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map(user => {
              const skillsOffered = getUserSkillsOffered(user);
              const skillsSeeking = getUserSkillsSeeking(user);

              return (
                <div key={user.id} className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50 p-6 hover:border-cyan-500/30 hover:shadow-cyan-500/10 transition-all duration-300">
                  <div className="flex items-center space-x-4 mb-4">
                    {user.avatar ? (
                      <img 
                        src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`}
                        alt={user.name} 
                        className="w-16 h-16 rounded-full object-cover"
                        onError={(e) => {
                          console.log('Search result avatar load error:', e.target.src);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center ${user.avatar ? 'hidden' : ''}`}>
                      <UserIcon className="w-8 h-8 text-gray-600" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-100">{user.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-slate-300 mt-1">
                        {user.rating > 0 && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span>{user.rating.toFixed(1)}</span>
                          </div>
                        )}
                        {user.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{user.location}</span>
                          </div>
                        )}
                        {user.videoCallReady && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <Video className="w-4 h-4" />
                            <span>Video</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-300 text-sm mb-4 line-clamp-3">{user.bio}</p>

                  <div className="mb-4">
                    {skillsOffered.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-slate-100 mb-2">Offers to teach:</h4>
                        <div className="flex flex-wrap gap-1">
                          {skillsOffered.slice(0, 3).map(skill => (
                            <span key={skill.id} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">{skill.name}</span>
                          ))}
                          {skillsOffered.length > 3 && <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">+{skillsOffered.length - 3} more</span>}
                        </div>
                      </div>
                    )}
                    
                    {skillsSeeking.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-100 mb-2">Wants to learn:</h4>
                        <div className="flex flex-wrap gap-1">
                          {skillsSeeking.slice(0, 3).map(skill => (
                            <span key={skill.id} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{skill.name}</span>
                          ))}
                          {skillsSeeking.length > 3 && <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">+{skillsSeeking.length - 3} more</span>}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleMessageUser(user.id)}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 flex items-center justify-center space-x-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Message</span>
                    </button>
                    <button className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/50 transition-colors">
                      View Profile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
            ) : (
              <div className="text-center py-12">
                <SearchIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-100 mb-2">No results found</h3>
                <p className="text-slate-300 mb-4">Try adjusting your search terms or filters to find more people.</p>
                <button onClick={clearFilters} className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-6 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-cyan-500/25">
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
