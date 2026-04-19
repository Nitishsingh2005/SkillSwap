import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Star, User as UserIcon, Calendar, Loader2 } from 'lucide-react';

const Reviews = () => {
  const { state, api } = useApp();
  const [activeTab, setActiveTab] = useState('received');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const [reviewForm, setReviewForm] = useState({
    sessionId: '',
    toUserId: '',
    rating: 5,
    comment: '',
    criteria: {
      communication: 5,
      skillLevel: 5,
      punctuality: 5,
    },
  });

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        if (state.currentUser) {
          await Promise.all([
            api.getSessions(),
            api.getMyReviews()
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch reviews data:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [state.currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper references
  const currentUserId = state.currentUser?._id || state.currentUser?.id;

  // Safely filter completed sessions
  const completedSessions = (state.sessions || []).filter((session) => {
    const hostId = session?.hostId?._id || session?.hostId;
    const partnerId = session?.partnerId?._id || session?.partnerId;
    return session?.status === 'completed' && (hostId === currentUserId || partnerId === currentUserId);
  });

  const unreviewed = completedSessions.filter((session) => {
    const sessionId = session._id || session.id;
    return !(state.reviews || []).find((review) => {
      const reviewSessionId = review?.sessionId?._id || review?.sessionId?.id || review?.sessionId;
      const reviewFromId = review?.fromUserId?._id || review?.fromUserId?.id || review?.fromUserId;
      return reviewSessionId?.toString() === sessionId?.toString() && 
             reviewFromId?.toString() === currentUserId?.toString();
    });
  });

  const receivedReviews = (state.reviews || []).filter((review) => {
    const toUserId = review?.toUserId?._id || review?.toUserId?.id || review?.toUserId;
    return toUserId?.toString() === currentUserId?.toString();
  });
  
  const givenReviews = (state.reviews || []).filter((review) => {
    const fromUserId = review?.fromUserId?._id || review?.fromUserId?.id || review?.fromUserId;
    return fromUserId?.toString() === currentUserId?.toString();
  });

  const getUserById = (id) => {
    if (!id) return null;
    return (state.users || []).find((u) => (u.id || u._id)?.toString() === id.toString());
  };

  const handleSubmitReview = async () => {
    if (!currentUserId || !reviewForm.sessionId || !reviewForm.toUserId) return;
    
    setIsSubmitting(true);
    setApiError(null);

    try {
      await api.createReview({
        sessionId: reviewForm.sessionId,
        toUserId: reviewForm.toUserId,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        criteria: reviewForm.criteria,
      });

      setReviewForm({
        sessionId: '',
        toUserId: '',
        rating: 5,
        comment: '',
        criteria: { communication: 5, skillLevel: 5, punctuality: 5 },
      });
      setShowReviewForm(false);
      
      // Refresh the reviews list
      await api.getMyReviews();
      
    } catch (err) {
      console.error('Review submission failed:', err);
      setApiError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const averageRating = receivedReviews.length > 0
    ? receivedReviews.reduce((sum, review) => sum + review.rating, 0) / receivedReviews.length
    : 0;

  if (isLoading && !state.sessions.length) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 min-h-screen relative">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl lg:text-4xl font-display font-semibold text-ink mb-3 tracking-tight">Reviews</h1>
        <p className="text-ink-muted text-lg max-w-2xl">
          View feedback from your skill exchange sessions and leave reviews for others.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-surface rounded-3xl shadow-sm border border-border p-6 md:p-8 text-center">
          <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-yellow-100 shadow-sm">
            <Star className="w-7 h-7 text-yellow-500 fill-current" />
          </div>
          <h3 className="text-3xl font-display font-semibold text-ink mb-1.5">
            {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
          </h3>
          <p className="text-ink-muted font-medium">Average Rating</p>
        </div>

        <div className="bg-surface rounded-3xl shadow-sm border border-border p-6 md:p-8 text-center">
          <div className="w-14 h-14 bg-surface-2 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-border shadow-sm">
            <Calendar className="w-7 h-7 text-ink" />
          </div>
          <h3 className="text-3xl font-display font-semibold text-ink mb-1.5">{receivedReviews.length}</h3>
          <p className="text-ink-muted font-medium">Reviews Received</p>
        </div>

        <div className="bg-surface rounded-3xl shadow-sm border border-border p-6 md:p-8 text-center">
          <div className="w-14 h-14 bg-surface-2 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-border shadow-sm">
            <UserIcon className="w-7 h-7 text-ink" />
          </div>
          <h3 className="text-3xl font-display font-semibold text-ink mb-1.5">{givenReviews.length}</h3>
          <p className="text-ink-muted font-medium">Reviews Given</p>
        </div>
      </div>

      {/* Pending Reviews */}
      {unreviewed.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-3xl shadow-sm p-6 md:p-8 mb-10">
          <h2 className="text-xl font-display font-medium text-yellow-800 mb-3 tracking-tight">Pending Reviews</h2>
          <p className="text-yellow-700 mb-6 font-medium">
            You have {unreviewed.length} completed session{unreviewed.length !== 1 ? 's' : ''} waiting for your review.
          </p>

          <div className="space-y-4">
            {unreviewed.slice(0, 3).map((session) => {
              const hostId = session?.hostId?._id || session?.hostId;
              const partnerId = session?.partnerId?._id || session?.partnerId;
              
              const targetUserId = partnerId === currentUserId ? hostId : partnerId;
              
              // We'll populate partner using state.users if populated, fallback to session populated object
              const partnerUser = getUserById(targetUserId) || (typeof session.partnerId === 'object' && session.partnerId._id === targetUserId ? session.partnerId : typeof session.hostId === 'object' && session.hostId._id === targetUserId ? session.hostId : null);
              
              const sessionId = session._id || session.id;
              const hostSkill = session?.skillExchange?.hostSkill || '';
              const partnerSkill = session?.skillExchange?.partnerSkill || '';

              return (
                <div key={sessionId} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/60 backdrop-blur-sm p-4 md:p-5 rounded-2xl border border-yellow-200/50 shadow-sm">
                  <div className="flex items-center space-x-4">
                    {partnerUser?.avatar ? (
                      <img src={partnerUser?.avatar?.startsWith('http') ? partnerUser.avatar : `${import.meta.env.VITE_API_URL}${partnerUser.avatar}`} alt={partnerUser?.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        <UserIcon className="w-6 h-6 text-ink-muted" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-ink">{partnerUser?.name || 'Session Partner'}</h3>
                      <p className="text-sm text-yellow-700 font-medium">{hostSkill} ↔ {partnerSkill}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setReviewForm({ ...reviewForm, sessionId: sessionId, toUserId: targetUserId });
                      setShowReviewForm(true);
                      setApiError(null);
                    }}
                    className="w-full sm:w-auto bg-accent text-white px-6 py-2.5 rounded-full hover:bg-opacity-90 font-medium transition-transform hover:scale-105 shadow-sm whitespace-nowrap"
                  >
                    Leave Review
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review Tabs */}
      <div className="mb-6 border-b border-border">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('received')}
            className={`pb-3 px-1 font-semibold transition-colors ${
              activeTab === 'received'
                ? 'text-ink border-b-2 border-ink'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Received Reviews ({receivedReviews.length})
          </button>
          <button
            onClick={() => setActiveTab('given')}
            className={`pb-3 px-1 font-semibold transition-colors ${
              activeTab === 'given'
                ? 'text-ink border-b-2 border-ink'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Given Reviews ({givenReviews.length})
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6 mb-12">
        {activeTab === 'received' && receivedReviews.length === 0 && (
          <div className="text-center py-16 bg-surface rounded-3xl border border-border shadow-sm">
            <Star className="w-12 h-12 text-ink-muted mx-auto mb-4" />
            <p className="text-ink-muted font-medium text-lg">You haven't received any reviews yet.</p>
          </div>
        )}
        
        {activeTab === 'given' && givenReviews.length === 0 && (
          <div className="text-center py-16 bg-surface rounded-3xl border border-border shadow-sm">
            <Star className="w-12 h-12 text-ink-muted mx-auto mb-4" />
            <p className="text-ink-muted font-medium text-lg">You haven't given any reviews yet.</p>
          </div>
        )}
        
        {(activeTab === 'received' ? receivedReviews : givenReviews).map((review) => {
          const isReceived = activeTab === 'received';
          const partnerObj = isReceived ? review.fromUserId : review.toUserId;
          const partnerId = partnerObj?._id || partnerObj?.id || partnerObj;
          const partnerUser = getUserById(partnerId) || (typeof partnerObj === 'object' ? partnerObj : null);
          const reviewDate = new Date(review.createdAt || Date.now()).toLocaleDateString();

          return (
            <div key={review._id || review.id} className="bg-surface rounded-3xl border border-border p-6 md:p-8 shadow-sm transition-transform hover:shadow-md duration-300">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-4">
                  {partnerUser?.avatar ? (
                    <img src={partnerUser?.avatar?.startsWith('http') ? partnerUser.avatar : `${import.meta.env.VITE_API_URL}${partnerUser.avatar}`} alt={partnerUser?.name} className="w-14 h-14 rounded-full object-cover border-2 border-surface shadow-sm" />
                  ) : (
                    <div className="w-14 h-14 bg-surface-2 rounded-full flex items-center justify-center border-2 border-surface shadow-sm">
                      <UserIcon className="w-6 h-6 text-ink-muted" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-display font-medium text-ink text-xl">
                      {partnerUser?.name || 'Unknown User'}
                    </h3>
                    <p className="text-sm text-ink-muted font-medium mt-0.5">
                      {isReceived ? 'Received on' : 'Given on'} {reviewDate}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center bg-surface-2 px-3 py-1.5 rounded-full border border-border shadow-sm mt-2 sm:mt-0">
                  <Star className="w-4 h-4 text-accent fill-current mr-1.5" />
                  <span className="font-bold text-ink">{review.rating}</span>
                </div>
              </div>

              {review.comment && (
                <div className="bg-surface-2 rounded-2xl p-5 mb-5 border border-border">
                  <p className="text-ink leading-relaxed whitespace-pre-wrap italic">"{review.comment}"</p>
                </div>
              )}

              {review.criteria && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="bg-surface-2 rounded-xl p-4 text-center border border-border">
                    <p className="text-sm text-ink-muted mb-1 font-medium">Communication</p>
                    <div className="flex items-center justify-center text-ink font-bold text-lg">
                      {review.criteria.communication} <span className="text-ink-muted ml-1 text-sm font-medium">/ 5</span>
                    </div>
                  </div>
                  <div className="bg-surface-2 rounded-xl p-4 text-center border border-border">
                    <p className="text-sm text-ink-muted mb-1 font-medium">Skill Level</p>
                    <div className="flex items-center justify-center text-ink font-bold text-lg">
                      {review.criteria.skillLevel} <span className="text-ink-muted ml-1 text-sm font-medium">/ 5</span>
                    </div>
                  </div>
                  <div className="bg-surface-2 rounded-xl p-4 text-center border border-border">
                    <p className="text-sm text-ink-muted mb-1 font-medium">Punctuality</p>
                    <div className="flex items-center justify-center text-ink font-bold text-lg">
                      {review.criteria.punctuality} <span className="text-ink-muted ml-1 text-sm font-medium">/ 5</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Review Modal Form */}
      {showReviewForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink/20 backdrop-blur-sm">
          <div className="bg-surface rounded-3xl shadow-xl border border-border p-6 md:p-8 w-full max-w-md my-auto">
            <h2 className="text-2xl font-display font-medium text-ink mb-6 tracking-tight">Leave a Review</h2>
            
            {apiError && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                {apiError}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">Overall Rating</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="focus:outline-none transition-transform hover:scale-110"
                      disabled={isSubmitting}
                    >
                      <Star className={`w-9 h-9 ${star <= reviewForm.rating ? 'text-accent fill-current' : 'text-surface-2 stroke-border'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-2 flex justify-between">
                  <span>Communication</span>
                  <span className="text-ink-muted">{reviewForm.criteria.communication}/5</span>
                </label>
                <input type="range" min="1" max="5" disabled={isSubmitting} value={reviewForm.criteria.communication} onChange={e => setReviewForm({...reviewForm, criteria: {...reviewForm.criteria, communication: parseInt(e.target.value)}})} className="w-full accent-accent block" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-2 flex justify-between">
                  <span>Skill Level</span>
                  <span className="text-ink-muted">{reviewForm.criteria.skillLevel}/5</span>
                </label>
                <input type="range" min="1" max="5" disabled={isSubmitting} value={reviewForm.criteria.skillLevel} onChange={e => setReviewForm({...reviewForm, criteria: {...reviewForm.criteria, skillLevel: parseInt(e.target.value)}})} className="w-full accent-accent block" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-2 flex justify-between">
                  <span>Punctuality</span>
                  <span className="text-ink-muted">{reviewForm.criteria.punctuality}/5</span>
                </label>
                <input type="range" min="1" max="5" disabled={isSubmitting} value={reviewForm.criteria.punctuality} onChange={e => setReviewForm({...reviewForm, criteria: {...reviewForm.criteria, punctuality: parseInt(e.target.value)}})} className="w-full accent-accent block" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-2 mt-4">Comment</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  disabled={isSubmitting}
                  className="w-full bg-surface-2 border border-border rounded-xl p-4 text-ink focus:outline-none focus:ring-2 focus:ring-accent/20 placeholder-ink-muted/50 transition-all resize-y min-h-[100px]"
                  placeholder="How was the session?"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8 border-t border-border pt-6">
              <button
                onClick={() => setShowReviewForm(false)}
                className="px-5 py-2.5 text-ink-muted border border-border font-medium hover:bg-surface-2 rounded-full transition-colors bg-surface"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={isSubmitting || !reviewForm.comment.trim()}
                className="bg-ink hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-surface px-6 py-2.5 rounded-full transition-transform hover:scale-105 font-medium flex items-center justify-center min-w-[140px] shadow-sm"
              >
                {isSubmitting ? (
                   <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Submitting</span>
                ) : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Reviews;
