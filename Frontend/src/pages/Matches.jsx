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
    <div className="max-w-6xl mx-auto p-6 md:p-8 min-h-screen">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl lg:text-4xl font-display font-semibold text-ink mb-3 tracking-tight">Skill Matches</h1>
        <p className="text-ink-muted text-lg max-w-2xl">
          We found these potential skill exchange partners based on your profile and preferences.
        </p>
      </div>

      {/* Match Score Legend */}
      <div className="bg-surface rounded-3xl shadow-sm border border-border p-6 md:p-8 mb-10">
        <h2 className="text-xl font-display font-medium text-ink mb-6 tracking-tight">Match Score Explained</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="flex items-center space-x-3 bg-surface-2 p-3 rounded-xl border border-border">
            <div className="w-3 h-3 bg-green rounded-full shadow-sm"></div>
            <span className="text-ink font-medium">90-100: Perfect Match</span>
          </div>
          <div className="flex items-center space-x-3 bg-surface-2 p-3 rounded-xl border border-border">
            <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
            <span className="text-ink font-medium">70-89: Great Match</span>
          </div>
          <div className="flex items-center space-x-3 bg-surface-2 p-3 rounded-xl border border-border">
            <div className="w-3 h-3 bg-orange-500 rounded-full shadow-sm"></div>
            <span className="text-ink font-medium">50-69: Good Match</span>
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
              if (score >= 90) return 'text-green bg-green/10 border-green/20';
              if (score >= 70) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
              return 'text-orange-600 bg-orange-100 border-orange-200';
            };

            const skillsOffered = user.skills.filter(skill => skill.offering);
            const skillsSeeking = user.skills.filter(skill => !skill.offering);

            return (
              <div key={match.id} className="bg-surface rounded-3xl shadow-sm border border-border overflow-hidden hover:border-accent/30 hover:shadow-md transition-all duration-300 group flex flex-col">
                {/* Match Score Badge & Header */}
                <div className="p-6 md:p-8 bg-surface-2 relative border-b border-border">
                  <div className={`absolute top-6 right-6 px-3.5 py-1.5 rounded-full text-sm font-bold border ${getScoreColor(match.score)}`}>
                    {match.score}% Match
                  </div>
                  
                  <div className="flex items-center space-x-5 mb-6">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-20 h-20 rounded-full object-cover border-4 border-surface shadow-sm"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center border-4 border-surface shadow-sm">
                        <UserIcon className="w-8 h-8 text-ink-muted" />
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-2xl font-display font-medium text-ink tracking-tight">{user.name}</h3>
                      <div className="flex items-center space-x-3 mt-1.5">
                        {user.rating > 0 && (
                          <div className="flex items-center space-x-1.5 bg-surface px-2.5 py-1 rounded-full border border-border">
                            <Star className="w-3.5 h-3.5 fill-current text-accent" />
                            <span className="text-sm font-semibold text-ink">{user.rating.toFixed(1)}</span>
                          </div>
                        )}
                        <span className="text-sm text-ink-muted font-medium">{user.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Match Reason */}
                  <div className="bg-surface rounded-2xl p-4 border border-border">
                    <p className="text-sm font-semibold text-ink mb-1.5">Why we matched you:</p>
                    <p className="text-sm text-ink-muted leading-relaxed">{match.reason}</p>
                  </div>
                </div>

                {/* User Details */}
                <div className="p-6 md:p-8 flex-1 flex flex-col">
                  {/* Bio */}
                  <p className="text-ink-muted mb-6 line-clamp-3 leading-relaxed">{user.bio}</p>

                  {/* Skills */}
                  <div className="space-y-5 mb-8 flex-1">
                    {skillsOffered.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-ink mb-3">Can teach you:</h4>
                        <div className="flex flex-wrap gap-2">
                          {skillsOffered.map((skill) => (
                            <span
                              key={skill.id}
                              className="px-3.5 py-1.5 bg-surface-2 border border-border text-ink rounded-lg text-sm font-medium shadow-sm"
                            >
                              {skill.name} <span className="text-ink-muted ml-1">({skill.level})</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {skillsSeeking.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-ink mb-3">Wants to learn:</h4>
                        <div className="flex flex-wrap gap-2">
                          {skillsSeeking.map((skill) => (
                            <span
                              key={skill.id}
                              className="px-3.5 py-1.5 bg-surface-2 border border-border text-ink rounded-lg text-sm font-medium shadow-sm"
                            >
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 mt-auto border-t border-border pt-6">
                    <button
                      onClick={() => handlePassMatch(match.id)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-surface-2 text-ink border border-border px-4 py-3 rounded-xl hover:bg-surface transition-colors font-medium shadow-sm"
                    >
                      <X className="w-5 h-5" />
                      <span>Pass</span>
                    </button>
                    
                    <button
                      onClick={() => handleLikeMatch(match.id)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-red-50 text-red-600 border border-red-100 px-4 py-3 rounded-xl hover:bg-red-100 transition-colors font-medium shadow-sm"
                    >
                      <Heart className="w-5 h-5" />
                      <span>Like</span>
                    </button>
                    
                    <button 
                      onClick={() => handleMessageUser(user.id)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-ink text-surface px-4 py-3 rounded-xl hover:bg-black transition-transform hover:scale-105 shadow-sm font-medium"
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
        <div className="text-center py-20 bg-surface rounded-3xl border border-border shadow-sm">
          <div className="w-20 h-20 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-6 border border-border shadow-sm">
            <Heart className="w-10 h-10 text-ink-muted" />
          </div>
          <h2 className="text-2xl font-display font-medium text-ink mb-4">No matches yet</h2>
          <p className="text-ink-muted mb-8 max-w-md mx-auto text-lg">
            Complete your profile and add skills to get better matches. Our algorithm learns from your preferences to suggest better partners.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button
               onClick={() => navigate("/profile")}
               className="bg-accent text-white px-8 py-3 rounded-full font-medium hover:bg-opacity-90 transition-transform hover:scale-105 shadow-sm"
            >
              Complete Profile
            </button>
            <button
               onClick={() => navigate("/search")}
               className="border border-border text-ink px-8 py-3 rounded-full font-medium hover:bg-surface-2 transition-colors"
            >
              Browse Skills
            </button>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="mt-12 bg-surface-2 rounded-3xl shadow-sm border border-border p-8 md:p-10">
        <h2 className="text-2xl font-display font-medium text-ink mb-8 tracking-tight text-center">Tips for Better Matches</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="w-16 h-16 bg-surface rounded-2xl border border-border flex items-center justify-center mx-auto mb-6 shadow-sm">
              <UserIcon className="w-8 h-8 text-ink" />
            </div>
            <h3 className="font-semibold text-ink text-lg mb-3">Complete Your Profile</h3>
            <p className="text-ink-muted leading-relaxed">Add a detailed bio and showcase your skills to attract better matches.</p>
          </div>
          
          <div>
            <div className="w-16 h-16 bg-surface rounded-2xl border border-border flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Star className="w-8 h-8 text-ink" />
            </div>
            <h3 className="font-semibold text-ink text-lg mb-3">Be Specific</h3>
            <p className="text-ink-muted leading-relaxed">The more specific your skills, the better we can match you with relevant partners.</p>
          </div>
          
          <div>
            <div className="w-16 h-16 bg-surface rounded-2xl border border-border flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Heart className="w-8 h-8 text-ink" />
            </div>
            <h3 className="font-semibold text-ink text-lg mb-3">Stay Active</h3>
            <p className="text-ink-muted leading-relaxed">Regular activity and engagement helps our algorithm learn your preferences.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Matches;
