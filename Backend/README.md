# SkillSwap Backend API

A comprehensive backend API for the SkillSwap platform - a skill exchange application where users can teach and learn from each other.

## Features

- **User Authentication**: JWT-based authentication with secure password hashing
- **User Management**: Profile management, skills, and portfolio links
- **Skill Matching**: Algorithm-based matching system for finding compatible partners
- **Session Management**: Booking, scheduling, and managing skill exchange sessions
- **Real-time Messaging**: Chat system with conversation management
- **Review System**: Rating and review system for completed sessions
- **Notifications**: Real-time notifications for various activities
- **Search & Filtering**: Advanced search and filtering for finding users

## Tech Stack

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** for cross-origin requests

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /profile` - Get current user profile
- `PUT /profile` - Update user profile

### Skills & Users (`/api/skills`)
- `GET /users` - Get all users with filtering
- `GET /users/:id` - Get specific user profile
- `POST /users/:id/skills` - Add skill to user
- `PUT /users/:id/skills/:skillId` - Update skill
- `DELETE /users/:id/skills/:skillId` - Remove skill

### Sessions (`/api/requests`)
- `GET /sessions` - Get user's sessions
- `POST /sessions` - Book new session
- `PUT /sessions/:id` - Update session status
- `DELETE /sessions/:id` - Cancel session

### Messaging (`/api/messages`)
- `GET /conversations` - Get user conversations
- `GET /conversations/:id/messages` - Get conversation messages
- `POST /conversations/:id/messages` - Send message
- `PUT /:id/read` - Mark message as read

### Matches (`/api/matches`)
- `GET /` - Get skill matches for user
- `POST /:id/like` - Like a match
- `POST /:id/pass` - Pass on a match
- `POST /generate` - Generate new matches

### Reviews (`/api/reviews`)
- `GET /` - Get user reviews
- `POST /` - Create review
- `GET /sessions/:sessionId` - Get reviews for session
- `GET /users/:userId` - Get reviews for user

### Notifications (`/api/notifications`)
- `GET /` - Get user notifications
- `PUT /:id/read` - Mark notification as read
- `PUT /read-all` - Mark all notifications as read
- `DELETE /:id` - Delete notification
- `DELETE /clear-all` - Clear all notifications

## Database Models

### User
- Personal information (name, email, bio, location)
- Skills (name, category, level, offering/learning)
- Availability and preferences
- Portfolio links
- Rating and review count

### Session
- Host and partner information
- Scheduled time and type (video/chat)
- Skill exchange details
- Status (pending/confirmed/completed/cancelled)
- Meeting links and notes

### Message
- Sender and receiver information
- Content and message type
- Read status
- Associated session (optional)

### Review
- Reviewer and reviewee information
- Session reference
- Rating and comment
- Detailed criteria ratings

### Match
- User and partner information
- Match score and reason
- Status (pending/liked/passed/matched)
- Like/pass tracking

### Notification
- User and type information
- Title and content
- Read status
- Related entity reference

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   Update the `.env` file with your configuration:
   - `MONGO_URI`: MongoDB connection string
   - `JWT_SECRET`: Secret key for JWT tokens
   - `PORT`: Server port (default: 5000)

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Start Production Server**
   ```bash
   npm start
   ```

## Environment Variables

```env
MONGO_URI=mongodb://localhost:27017/skillswap
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
NODE_ENV=development
```

## API Usage Examples

### User Registration
```javascript
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### User Login
```javascript
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Add Skill
```javascript
POST /api/skills/users/:userId/skills
Authorization: Bearer <token>
{
  "name": "React",
  "category": "Frontend",
  "level": "Expert",
  "offering": true
}
```

### Book Session
```javascript
POST /api/requests/sessions
Authorization: Bearer <token>
{
  "partnerId": "partner_user_id",
  "scheduledAt": "2025-01-20T14:00:00Z",
  "type": "video",
  "skillExchange": {
    "hostSkill": "React",
    "partnerSkill": "Python"
  }
}
```

### Send Message
```javascript
POST /api/messages/conversations/:userId/messages
Authorization: Bearer <token>
{
  "content": "Hello! I'd like to schedule a session with you.",
  "messageType": "text"
}
```

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Error Handling

The API returns consistent error responses:
```javascript
{
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Development

- Use `npm run dev` for development with auto-restart
- Use `npm start` for production
- All routes are documented with comments
- Database models include proper validation and indexing

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include input validation
4. Update documentation for new endpoints
5. Test all endpoints thoroughly

## License

This project is licensed under the ISC License.
