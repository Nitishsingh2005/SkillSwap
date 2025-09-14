import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Calendar, Clock, Video, MessageCircle, User as UserIcon, Plus } from 'lucide-react';

const Booking = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    partnerId: '',
    skillExchange: { hostSkill: '', partnerSkill: '' },
    type: 'video',
    date: '',
    time: '',
  });

  const sessions = state.sessions.filter(session =>
    session.hostId === state.currentUser?.id || session.partnerId === state.currentUser?.id
  );

  const upcomingSessions = sessions.filter(
    session => new Date(session.scheduledAt) > new Date() && session.status !== 'cancelled'
  );

  const pastSessions = sessions.filter(
    session => new Date(session.scheduledAt) <= new Date() || session.status === 'completed'
  );

  const getPartnerInfo = (session) => {
    const partnerId = session.partnerId === state.currentUser?.id ? session.hostId : session.partnerId;
    return state.users.find(u => u.id === partnerId);
  };

  const handleBookSession = () => {
    if (!state.currentUser || !bookingForm.partnerId || !bookingForm.date || !bookingForm.time) return;

    const scheduledAt = new Date(`${bookingForm.date}T${bookingForm.time}`);

    const newSession = {
      id: Date.now().toString(),
      hostId: state.currentUser.id,
      partnerId: bookingForm.partnerId,
      scheduledAt,
      status: 'pending',
      type: bookingForm.type,
      skillExchange: bookingForm.skillExchange,
      createdAt: new Date(),
    };

    dispatch({ type: 'ADD_SESSION', payload: newSession });

    setBookingForm({ partnerId: '', skillExchange: { hostSkill: '', partnerSkill: '' }, type: 'video', date: '', time: '' });
    setShowBookingForm(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleJoinSession = (session) => {
    if (session.type === 'video') {
      navigate(`/video/${session.id}`);
    } else {
      navigate(`/chat/${session.id}`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule & Sessions</h1>
          <p className="text-gray-600">Manage your skill exchange sessions and bookings.</p>
        </div>
        <button
          onClick={() => setShowBookingForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Book Session</span>
        </button>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Book a Session</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Partner</label>
                <select
                  value={bookingForm.partnerId}
                  onChange={(e) => setBookingForm({ ...bookingForm, partnerId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Choose a partner</option>
                  {state.users.filter(user => user.id !== state.currentUser?.id).map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Skill</label>
                  <input
                    type="text"
                    value={bookingForm.skillExchange.hostSkill}
                    onChange={(e) => setBookingForm({ ...bookingForm, skillExchange: { ...bookingForm.skillExchange, hostSkill: e.target.value } })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="What you'll teach"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Their Skill</label>
                  <input
                    type="text"
                    value={bookingForm.skillExchange.partnerSkill}
                    onChange={(e) => setBookingForm({ ...bookingForm, skillExchange: { ...bookingForm.skillExchange, partnerSkill: e.target.value } })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="What you'll learn"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Session Type</label>
                <select
                  value={bookingForm.type}
                  onChange={(e) => setBookingForm({ ...bookingForm, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="video">Video Call</option>
                  <option value="chat">Text Chat</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <input
                    type="time"
                    value={bookingForm.time}
                    onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-4 mt-8">
              <button onClick={handleBookSession} className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">Book Session</button>
              <button onClick={() => setShowBookingForm(false)} className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upcoming Sessions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Upcoming Sessions</h2>
          {upcomingSessions.length > 0 ? (
            upcomingSessions.map(session => {
              const partner = getPartnerInfo(session);
              return (
                <div key={session.id} className="p-4 border border-gray-200 rounded-lg mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {partner?.avatar ? (
                        <img src={partner.avatar} alt={partner.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-gray-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">{partner?.name || 'Unknown User'}</h3>
                        <p className="text-sm text-gray-600">{session.skillExchange.hostSkill} ↔ {session.skillExchange.partnerSkill}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>{session.status}</span>
                      <div className="flex items-center space-x-1 text-gray-500">{session.type === 'video' ? <Video className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1"><Calendar className="w-4 h-4" /><span>{new Date(session.scheduledAt).toLocaleDateString()}</span></div>
                    <div className="flex items-center space-x-1"><Clock className="w-4 h-4" /><span>{new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                  </div>

                  {session.status === 'pending' && (
                    <div className="flex space-x-2 mt-4">
                      <button onClick={() => dispatch({ type: 'UPDATE_SESSION', payload: { id: session.id, updates: { status: 'confirmed' } } })} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">Accept</button>
                      <button onClick={() => dispatch({ type: 'UPDATE_SESSION', payload: { id: session.id, updates: { status: 'cancelled' } } })} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors">Decline</button>
                    </div>
                  )}

                  {session.status === 'confirmed' && new Date(session.scheduledAt) <= new Date(Date.now() + 30 * 60 * 1000) && (
                    <button onClick={() => handleJoinSession(session)} className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      {session.type === 'video' ? 'Join Video Call' : 'Start Chat'}
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming sessions</h3>
              <p className="text-gray-600 mb-4">Book your first skill exchange session!</p>
              <button onClick={() => setShowBookingForm(true)} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">Book Session</button>
            </div>
          )}
        </div>

        {/* Session History */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Session History</h2>
          {pastSessions.length > 0 ? pastSessions.slice(0, 5).map(session => {
            const partner = getPartnerInfo(session);
            return (
              <div key={session.id} className="p-4 bg-gray-50 rounded-lg mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {partner?.avatar ? (
                      <img src={partner.avatar} alt={partner.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                    <h3 className="font-medium text-gray-900 text-sm">{partner?.name || 'Unknown User'}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>{session.status}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{session.skillExchange.hostSkill} ↔ {session.skillExchange.partnerSkill}</p>
                <p className="text-xs text-gray-500">{new Date(session.scheduledAt).toLocaleDateString()} at {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                {session.status === 'completed' && <button className="w-full mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium">Leave Review</button>}
              </div>
            );
          }) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No past sessions</h3>
              <p className="text-gray-600">Your completed sessions will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;
