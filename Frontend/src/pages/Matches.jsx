import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
//import { sampleMatches } from '../utils/sampleData';
import { Heart, X, MessageCircle, User as UserIcon, Star } from 'lucide-react';

const Matches = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  // Initialize matches - real data will be loaded from API
  useEffect(() => {
    console.log('Matches page loaded - using real data from API');
  }, []);

  const getMatchedUser = (match) => {
    return state.users.find(u => u.id === match.partnerId);
  };

  const handleLikeMatch = (matchId) => {
    console.log('Liked match:', matchId);
  };

  const handlePassMatch = (matchId) => {
    console.log('Passed on match:', matchId);
  };

  const handleMessageUser = (userId) => {
    // Navigate to chat with the selected user
    navigate(`/chat?user=${userId}`);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2 tracking-tight">Skill Matches</h1>
        <p className="text-slate-300 text-lg">
          We found these potential skill exchange partners based on your profile and preferences.
        </p>
      </div>

      {/* Match Score Legend */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-100 mb-4 tracking-tight">Match Score Explained</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-slate-300">90-100: Perfect Match</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-slate-300">70-89: Great Match</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-slate-300">50-69: Good Match</span>
          </div>
        </div>
      </div>

      {/* Matches Grid */}
      {state.matches.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {state.matches.map((match) => {
            const user = getMatchedUser(match);
            if (!user) return null;

            const getScoreColor = (score) => {
              if (score >= 90) return 'text-green-600 bg-green-100';
              if (score >= 70) return 'text-yellow-600 bg-yellow-100';
              return 'text-orange-600 bg-orange-100';
            };

            const skillsOffered = user.skills.filter(skill => skill.offering);
            const skillsSeeking = user.skills.filter(skill => !skill.offering);

            return (
              <div key={match.id} className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50 overflow-hidden hover:border-cyan-500/30 hover:shadow-cyan-500/10 transition-all duration-300">
                {/* Match Score Badge */}
                <div className="p-6 bg-gradient-to-r from-cyan-500 to-teal-500 text-white relative">
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(match.score)}`}>
                    {match.score}% Match
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-4">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-16 h-16 rounded-full object-cover border-4 border-white"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <UserIcon className="w-8 h-8 text-white" />
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-xl font-bold">{user.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {user.rating > 0 && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-sm">{user.rating.toFixed(1)}</span>
                          </div>
                        )}
                        <span className="text-sm opacity-90">{user.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Match Reason */}
                  <div className="bg-white bg-opacity-10 rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">Why we matched you:</p>
                    <p className="text-sm opacity-90">{match.reason}</p>
                  </div>
                </div>

                {/* User Details */}
                <div className="p-6">
                  {/* Bio */}
                  <p className="text-slate-300 mb-4 line-clamp-3">{user.bio}</p>

                  {/* Skills */}
                  <div className="space-y-4 mb-6">
                    {skillsOffered.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-100 mb-2">Can teach you:</h4>
                        <div className="flex flex-wrap gap-2">
                          {skillsOffered.map((skill) => (
                            <span
                              key={skill.id}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                            >
                              {skill.name} ({skill.level})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {skillsSeeking.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-100 mb-2">Wants to learn:</h4>
                        <div className="flex flex-wrap gap-2">
                          {skillsSeeking.map((skill) => (
                            <span
                              key={skill.id}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                            >
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handlePassMatch(match.id)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-slate-700/50 text-slate-300 px-4 py-3 rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                      <span>Pass</span>
                    </button>
                    
                    <button
                      onClick={() => handleLikeMatch(match.id)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-pink-500/20 text-pink-300 px-4 py-3 rounded-lg hover:bg-pink-500/30 transition-colors"
                    >
                      <Heart className="w-5 h-5" />
                      <span>Like</span>
                    </button>
                    
                    <button 
                      onClick={() => handleMessageUser(user.id)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-4 py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Message</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-4">No matches yet</h2>
          <p className="text-slate-300 mb-8 max-w-md mx-auto">
            Complete your profile and add skills to get better matches. Our algorithm learns from your preferences to suggest better partners.
          </p>
          <div className="flex justify-center space-x-4">
            <button className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-6 py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-cyan-500/25">
              Complete Profile
            </button>
            <button className="border border-slate-600 text-slate-300 px-6 py-3 rounded-lg hover:bg-slate-700/50 transition-colors">
              Browse Skills
            </button>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="mt-12 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50 p-8">
        <h2 className="text-xl font-semibold text-slate-100 mb-4 tracking-tight">Tips for Better Matches</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <UserIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-100 mb-2">Complete Your Profile</h3>
            <p className="text-slate-300 text-sm">Add a detailed bio and showcase your skills to attract better matches.</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-100 mb-2">Be Specific</h3>
            <p className="text-slate-300 text-sm">The more specific your skills, the better we can match you with relevant partners.</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-100 mb-2">Stay Active</h3>
            <p className="text-slate-300 text-sm">Regular activity and engagement helps our algorithm learn your preferences.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Matches;
