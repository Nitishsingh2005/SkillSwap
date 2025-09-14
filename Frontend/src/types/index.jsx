// data.js
export const users = [
  {
    id: 'user1',
    name: 'Atul',
    email: 'atul@example.com',
    bio: 'React developer and Python enthusiast',
    avatar: '', // optional
    skills: [
      { id: 'skill1', name: 'React', category: 'Web', level: 'Expert', offering: true },
      { id: 'skill2', name: 'Python', category: 'Programming', level: 'Intermediate', offering: false },
    ],
    availability: [
      { day: 'Monday', timeSlots: ['10:00-12:00', '14:00-16:00'] },
      { day: 'Wednesday', timeSlots: ['09:00-11:00'] },
    ],
    videoCallReady: true,
    rating: 4.5,
    reviewCount: 10,
    location: 'Mumbai, India',
    portfolioLinks: [
      { platform: 'GitHub', url: 'https://github.com/atul' },
      { platform: 'LinkedIn', url: 'https://linkedin.com/in/atul' },
    ],
    createdAt: new Date(),
  },
];

export const sessions = [
  {
    id: 'session1',
    hostId: 'user1',
    partnerId: 'user2',
    scheduledAt: new Date(),
    status: 'completed',
    type: 'video',
    skillExchange: { hostSkill: 'React', partnerSkill: 'Python' },
    createdAt: new Date(),
  },
];

export const messages = [
  {
    id: 'msg1',
    senderId: 'user1',
    receiverId: 'user2',
    content: 'Hello!',
    timestamp: new Date(),
    sessionId: 'session1',
  },
];

export const reviews = [
  {
    id: 'review1',
    fromUserId: 'user2',
    toUserId: 'user1',
    sessionId: 'session1',
    rating: 5,
    comment: 'Great session!',
    criteria: { communication: 5, skillLevel: 5, punctuality: 5 },
    createdAt: new Date(),
  },
];

export const notifications = [
  {
    id: 'notif1',
    userId: 'user1',
    type: 'message',
    title: 'New Message',
    content: 'You have a new message from Rahul.',
    read: false,
    createdAt: new Date(),
  },
];

export const matches = [
  {
    id: 'match1',
    userId: 'user1',
    partnerId: 'user2',
    reason: 'Similar skill interests',
    score: 90,
    matchedAt: new Date(),
  },
];

// Example search filter (for reference)
export const searchFilters = {
  skill: 'React',
  category: 'Web',
  level: 'Expert',
  location: 'Mumbai',
  availability: 'Monday 10:00-12:00',
  videoCallReady: true,
};
