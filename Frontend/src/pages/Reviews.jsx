import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Star, User as UserIcon, Calendar } from 'lucide-react';

const Reviews = () => {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState('received');
  const [showReviewForm, setShowReviewForm] = useState(false);
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

  // Safely filter completed sessions
  const completedSessions = (state.sessions || []).filter(
    (session) =>
      session?.status === 'completed' &&
      (session?.hostId === state.currentUser?.id || session?.partnerId === state.currentUser?.id)
  );

  // Sessions that haven't been reviewed by current user
  const unreviewed = completedSessions.filter(
    (session) =>
      !(state.reviews || []).find(
        (review) => review?.sessionId === session.id && review?.fromUserId === state.currentUser?.id
      )
  );

  const receivedReviews = (state.reviews || []).filter(
    (review) => review?.toUserId === state.currentUser?.id
  );
  const givenReviews = (state.reviews || []).filter(
    (review) => review?.fromUserId === state.currentUser?.id
  );

  const getUserById = (id) => (state.users || []).find((u) => u.id === id);
  const getReviewerInfo = (review) => getUserById(review.fromUserId);
  const getRevieweeInfo = (review) => getUserById(review.toUserId);
  const getSessionInfo = (sessionId) => (state.sessions || []).find((s) => s.id === sessionId);

  const handleSubmitReview = () => {
    if (!state.currentUser || !reviewForm.sessionId || !reviewForm.toUserId) return;

    const newReview = {
      id: Date.now().toString(),
      fromUserId: state.currentUser.id,
      toUserId: reviewForm.toUserId,
      sessionId: reviewForm.sessionId,
      rating: reviewForm.rating,
      comment: reviewForm.comment,
      criteria: reviewForm.criteria,
      createdAt: new Date(),
    };

    dispatch({ type: 'ADD_REVIEW', payload: newReview });

    setReviewForm({
      sessionId: '',
      toUserId: '',
      rating: 5,
      comment: '',
      criteria: { communication: 5, skillLevel: 5, punctuality: 5 },
    });
    setShowReviewForm(false);
  };

  const averageRating =
    receivedReviews.length > 0
      ? receivedReviews.reduce((sum, review) => sum + review.rating, 0) / receivedReviews.length
      : 0;

  const renderStars = (rating, size = 'w-5 h-5') => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reviews</h1>
        <p className="text-gray-600">
          View feedback from your skill exchange sessions and leave reviews for others.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Star className="w-6 h-6 text-yellow-600 fill-current" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
          </h3>
          <p className="text-gray-600">Average Rating</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{receivedReviews.length}</h3>
          <p className="text-gray-600">Reviews Received</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <UserIcon className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{givenReviews.length}</h3>
          <p className="text-gray-600">Reviews Given</p>
        </div>
      </div>

      {/* Pending Reviews */}
      {unreviewed.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-yellow-800 mb-4">Pending Reviews</h2>
          <p className="text-yellow-700 mb-4">
            You have {unreviewed.length} completed session{unreviewed.length !== 1 ? 's' : ''} waiting for your review.
          </p>

          <div className="space-y-3">
            {unreviewed.slice(0, 3).map((session) => {
              const partnerId = session.partnerId === state.currentUser?.id ? session.hostId : session.partnerId;
              const partner = getUserById(partnerId);
              const hostSkill = session?.skillExchange?.hostSkill || '';
              const partnerSkill = session?.skillExchange?.partnerSkill || '';

              return (
                <div key={session.id} className="flex items-center justify-between bg-white p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {partner?.avatar ? (
                      <img src={partner.avatar} alt={partner.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-gray-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900">{partner?.name || 'Unknown'}</h3>
                      <p className="text-sm text-gray-600">{hostSkill} ↔ {partnerSkill}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setReviewForm({ ...reviewForm, sessionId: session.id, toUserId: partnerId });
                      setShowReviewForm(true);
                    }}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    Leave Review
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;
