# SkillSwap - Skill Exchange Platform

A modern web application that connects people who want to learn new skills by teaching their own expertise. Built with React and Node.js, SkillSwap facilitates meaningful skill exchanges through an intuitive matching system, real-time messaging, and session management.

![SkillSwap Logo](https://via.placeholder.com/200x100/4F46E5/FFFFFF?text=SkillSwap)

## 🌟 Features

### Core Functionality
- **User Authentication**: Secure JWT-based authentication with profile management
- **Skill Matching**: AI-powered algorithm to match users based on complementary skills
- **Session Booking**: Schedule and manage skill exchange sessions
- **Real-time Messaging**: Chat system for communication between users
- **Review System**: Rate and review completed sessions
- **Search & Discovery**: Advanced filtering to find the perfect skill partners

### User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Modern UI**: Clean, intuitive interface built with Tailwind CSS
- **Real-time Notifications**: Stay updated with instant notifications
- **Video Call Integration**: Support for video and text-based sessions
- **Portfolio Showcase**: Display your work and achievements

## 🚀 Tech Stack

### Frontend
- **React 18** - Modern React with hooks and context
- **Vite** - Fast build tool and development server
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **Context API** - State management

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing

## 📁 Project Structure

```
SkillSwap/
├── Frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React context for state management
│   │   ├── utils/           # Utility functions and sample data
│   │   └── types/           # TypeScript type definitions
│   ├── public/              # Static assets
│   └── package.json         # Frontend dependencies
├── Backend/                 # Node.js backend API
│   ├── models/              # MongoDB models
│   ├── routes/              # API route handlers
│   ├── middleware/          # Custom middleware
│   ├── server.js            # Main server file
│   └── package.json         # Backend dependencies
└── README.md                # Project documentation
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/skillswap.git
cd skillswap
```

### 2. Backend Setup
```bash
cd Backend
npm install
cp env.example .env
```

Update the `.env` file with your configuration:
```env
MONGO_URI=mongodb://localhost:27017/skillswap
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
NODE_ENV=development
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd Frontend
npm install
```

Start the frontend development server:
```bash
npm run dev
```

### 4. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### User & Skills Endpoints
- `GET /api/skills/users` - Search and filter users
- `POST /api/skills/users/:id/skills` - Add skill to user
- `PUT /api/skills/users/:id/skills/:skillId` - Update skill
- `DELETE /api/skills/users/:id/skills/:skillId` - Remove skill

### Session Management
- `GET /api/requests/sessions` - Get user sessions
- `POST /api/requests/sessions` - Book new session
- `PUT /api/requests/sessions/:id` - Update session status
- `DELETE /api/requests/sessions/:id` - Cancel session

### Messaging
- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/conversations/:id/messages` - Get messages
- `POST /api/messages/conversations/:id/messages` - Send message

### Matching System
- `GET /api/matches` - Get skill matches
- `POST /api/matches/:id/like` - Like a match
- `POST /api/matches/:id/pass` - Pass on a match
- `POST /api/matches/generate` - Generate new matches

### Reviews & Notifications
- `GET /api/reviews` - Get user reviews
- `POST /api/reviews` - Create review
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

## 🎯 Key Features Explained

### Smart Matching Algorithm
Our matching system analyzes user skills, preferences, and compatibility to suggest the best skill exchange partners. The algorithm considers:
- Skill complementarity (what you offer vs. what they want to learn)
- Location proximity
- Video call availability
- User ratings and reviews
- Activity levels

### Session Management
- **Booking**: Users can book sessions with matched partners
- **Scheduling**: Flexible scheduling with calendar integration
- **Types**: Support for video calls and text-based sessions
- **Status Tracking**: Pending → Confirmed → Completed workflow
- **Reviews**: Post-session rating and feedback system

### Real-time Communication
- **Chat System**: Instant messaging between users
- **Notifications**: Real-time updates for messages, bookings, and matches
- **Conversation Management**: Organized chat history and unread tracking

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)
```bash
cd Frontend
npm run build
# Deploy the dist/ folder to your hosting platform
```

### Backend Deployment (Heroku/Railway)
```bash
cd Backend
# Set environment variables in your hosting platform
# Deploy the Backend folder
```

### Environment Variables for Production
```env
MONGO_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
PORT=5000
NODE_ENV=production
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Add proper error handling
- Include input validation
- Write meaningful commit messages
- Update documentation for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Atul Gupta** - Project Lead & Full-stack Developer
- **Contributors** - [Add your name here]

## 🙏 Acknowledgments

- React team for the amazing framework
- MongoDB for the flexible database
- Tailwind CSS for the beautiful styling
- All open-source contributors

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Contact us at support@skillswap.com
- Join our community Discord

---

**Made with ❤️ by the SkillSwap Team**
