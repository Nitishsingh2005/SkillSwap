// sampleData.js

export const sampleUsers = [
  {
    id: '1',
    name: 'Nitish Singh',
    email: 'nitish@example.com',
    bio: 'Full-stack developer with 0 years of experience. Passionate about React, Node.js, and teaching others.',
    avatar: '#',
    skills: [
      { id: '1', name: 'React', category: 'Frontend', level: 'Expert', offering: true },
      { id: '2', name: 'Node.js', category: 'Backend', level: 'Expert', offering: true },
      { id: '3', name: 'Python', category: 'Backend', level: 'Beginner', offering: false },
    ],
    availability: [
      { day: 'Monday', timeSlots: ['10:00-12:00', '14:00-16:00'] },
      { day: 'Wednesday', timeSlots: ['09:00-11:00', '15:00-17:00'] },
    ],
    videoCallReady: true,
    rating: 4.8,
    reviewCount: 24,
    location: 'Dombivli, Mumbai',
    portfolioLinks: [
      { platform: 'GitHub', url: 'https://github.com/nitish' },
      { platform: 'Portfolio', url: 'https://nitish.dev' },
    ],
    createdAt: new Date('2025-01-15'),
  },
  {
    id: '2',
    name: 'Govind',
    email: 'Govind@example.com',
    bio: 'UX/UI Designer with a passion for creating beautiful and functional designs. Love mentoring new designers.',
    avatar: '#',
    skills: [
      { id: '4', name: 'Figma', category: 'Design', level: 'Expert', offering: true },
      { id: '5', name: 'Adobe XD', category: 'Design', level: 'Expert', offering: true },
      { id: '6', name: 'React', category: 'Frontend', level: 'Intermediate', offering: false },
    ],
    availability: [
      { day: 'Tuesday', timeSlots: ['11:00-13:00', '16:00-18:00'] },
      { day: 'Thursday', timeSlots: ['10:00-12:00', '14:00-16:00'] },
    ],
    videoCallReady: true,
    rating: 4.9,
    reviewCount: 31,
    location: 'Sakinaka, Mumbai',
    portfolioLinks: [
      { platform: 'Behance', url: 'https://behance.net/GovindSahani' },
      { platform: 'Dribbble', url: 'https://dribbble.com/GovindSahani' },
    ],
    createdAt: new Date('2025-02-20'),
  },
  {
    id: '3',
    name: 'Harry',
    email: 'harry@example.com',
    bio: 'Data scientist and Python expert. I enjoy teaching machine learning concepts and learning new technologies.',
    avatar: '#',
    skills: [
      { id: '7', name: 'Python', category: 'Backend', level: 'Expert', offering: true },
      { id: '8', name: 'Machine Learning', category: 'Data Science', level: 'Expert', offering: true },
      { id: '9', name: 'JavaScript', category: 'Frontend', level: 'Beginner', offering: false },
    ],
    availability: [
      { day: 'Monday', timeSlots: ['13:00-15:00', '17:00-19:00'] },
      { day: 'Friday', timeSlots: ['10:00-12:00', '15:00-17:00'] },
    ],
    videoCallReady: false,
    rating: 4.7,
    reviewCount: 18,
    location: 'Austin, TX',
    portfolioLinks: [
      { platform: 'GitHub', url: 'https://github.com/Harry' },
      { platform: 'Kaggle', url: 'https://kaggle.com/Harry' },
    ],
    createdAt: new Date('2025-03-10'),
  },
  {
    id: '4',
    name: 'Atul',
    email: 'atul@example.com',
    bio: 'Digital marketing specialist with expertise in SEO, content marketing, and social media strategy.',
    avatar: '#',
    skills: [
      { id: '10', name: 'Digital Marketing', category: 'Marketing', level: 'Expert', offering: true },
      { id: '11', name: 'SEO', category: 'Marketing', level: 'Expert', offering: true },
      { id: '12', name: 'Web Development', category: 'Frontend', level: 'Beginner', offering: false },
    ],
    availability: [
      { day: 'Wednesday', timeSlots: ['12:00-14:00', '16:00-18:00'] },
      { day: 'Saturday', timeSlots: ['09:00-11:00', '14:00-16:00'] },
    ],
    videoCallReady: true,
    rating: 4.6,
    reviewCount: 22,
    location: 'Seattle, WA',
    portfolioLinks: [
      { platform: 'LinkedIn', url: 'https://linkedin.com/in/atul' },
      { platform: 'Portfolio', url: 'https://atul.com' },
    ],
    createdAt: new Date('2025-01-30'),
  },
];

export const sampleSessions = [
  {
    id: '1',
    hostId: '1',
    partnerId: '2',
    scheduledAt: new Date('2025-01-15T10:00:00Z'),
    status: 'completed',
    type: 'video',
    skillExchange: { hostSkill: 'React', partnerSkill: 'Figma' },
    createdAt: new Date('2025-01-10'),
  },
  {
    id: '2',
    hostId: '2',
    partnerId: '3',
    scheduledAt: new Date('2025-01-20T14:00:00Z'),
    status: 'confirmed',
    type: 'video',
    skillExchange: { hostSkill: 'Adobe XD', partnerSkill: 'Python' },
    createdAt: new Date('2024-01-18'),
  },
];

export const sampleReviews = [
  {
    id: '1',
    fromUserId: '2',
    toUserId: '1',
    sessionId: '1',
    rating: 5,
    comment: 'Nitish was an excellent teacher! Very patient and knowledgeable about React. Highly recommended.',
    criteria: { communication: 5, skillLevel: 5, punctuality: 5 },
    createdAt: new Date('2025-01-15'),
  },
];

export const sampleNotifications = [
  {
    id: '1',
    userId: '1',
    type: 'message',
    title: 'New Message',
    content: 'Govind sent you a message about your upcoming session',
    read: false,
    createdAt: new Date('2025-01-18T09:30:00Z'),
  },
  {
    id: '2',
    userId: '1',
    type: 'booking',
    title: 'Session Confirmed',
    content: 'Your session with Harry has been confirmed for Friday at 2 PM',
    read: false,
    createdAt: new Date('2025-01-17T16:45:00Z'),
  },
];

export const sampleMatches = [
  {
    id: '1',
    userId: '1',
    partnerId: '4',
    reason: 'You both want to learn from each other - Nitish offers React while Kartik seeks Web Development skills',
    score: 85,
    matchedAt: new Date('2025-01-18'),
  },
  {
    id: '2',
    userId: '1',
    partnerId: '3',
    reason: 'Perfect skill complement - Nitish offers Node.js while Harry offers Python expertise',
    score: 92,
    matchedAt: new Date('2024-01-17'),
  },
];
