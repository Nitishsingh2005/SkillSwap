# MongoDB Integration Guide for SkillSwap

## 🗄️ Overview

MongoDB is already integrated into your SkillSwap backend! This guide explains how to set it up, use it, and understand the data structure.

## 🚀 MongoDB Setup Options

### Option 1: Local MongoDB Installation (Recommended for Development)

#### Windows Installation:
1. **Download MongoDB Community Server**
   - Go to https://www.mongodb.com/try/download/community
   - Select Windows and download MSI installer
   - Run the installer with default settings

2. **Start MongoDB Service**
   ```bash
   # MongoDB should start automatically as a Windows service
   # You can also start it manually:
   net start MongoDB
   ```

3. **Verify Installation**
   ```bash
   # Open Command Prompt and run:
   mongod --version
   mongo --version
   ```

#### Alternative: MongoDB Compass (GUI)
- Download MongoDB Compass for a visual interface
- Connect to `mongodb://localhost:27017`

### Option 2: MongoDB Atlas (Cloud - Recommended for Production)

1. **Create Free Account**
   - Go to https://www.mongodb.com/atlas
   - Sign up for free account
   - Create a new cluster (free tier available)

2. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string

3. **Update Environment Variables**
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/skillswap?retryWrites=true&w=majority
   ```

## 🔧 Project Configuration

### 1. Environment Setup

Your `.env` file should contain:
```env
# For Local MongoDB
MONGO_URI=mongodb://localhost:27017/skillswap

# For MongoDB Atlas (replace with your connection string)
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/skillswap?retryWrites=true&w=majority

JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
NODE_ENV=development
```

### 2. Database Connection

The connection is already set up in `Backend/server.js`:
```javascript
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.error(err));
```

## 📊 Database Schema Overview

Your SkillSwap project uses 6 main collections:

### 1. Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  bio: String,
  avatar: String,
  skills: [
    {
      name: String,
      category: String,
      level: String, // 'Beginner', 'Intermediate', 'Expert'
      offering: Boolean // true = teaching, false = learning
    }
  ],
  availability: [
    {
      day: String,
      timeSlots: [String]
    }
  ],
  videoCallReady: Boolean,
  rating: Number,
  reviewCount: Number,
  location: String,
  portfolioLinks: [
    {
      platform: String,
      url: String
    }
  ],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Sessions Collection
```javascript
{
  _id: ObjectId,
  hostId: ObjectId (ref: User),
  partnerId: ObjectId (ref: User),
  scheduledAt: Date,
  status: String, // 'pending', 'confirmed', 'completed', 'cancelled'
  type: String, // 'video', 'chat'
  skillExchange: {
    hostSkill: String,
    partnerSkill: String
  },
  notes: String,
  meetingLink: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Messages Collection
```javascript
{
  _id: ObjectId,
  senderId: ObjectId (ref: User),
  receiverId: ObjectId (ref: User),
  content: String,
  isRead: Boolean,
  messageType: String, // 'text', 'image', 'file'
  sessionId: ObjectId (ref: Session, optional),
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Reviews Collection
```javascript
{
  _id: ObjectId,
  fromUserId: ObjectId (ref: User),
  toUserId: ObjectId (ref: User),
  sessionId: ObjectId (ref: Session),
  rating: Number (1-5),
  comment: String,
  criteria: {
    communication: Number (1-5),
    skillLevel: Number (1-5),
    punctuality: Number (1-5)
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 5. Matches Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  partnerId: ObjectId (ref: User),
  reason: String,
  score: Number (0-100),
  status: String, // 'pending', 'liked', 'passed', 'matched'
  likedBy: [ObjectId],
  passedBy: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

### 6. Notifications Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  type: String, // 'message', 'booking', 'review', 'match', 'system'
  title: String,
  content: String,
  read: Boolean,
  relatedId: ObjectId,
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}
```

## 🛠️ How to Use MongoDB in Your Project

### 1. Starting the Backend with MongoDB

```bash
cd Backend

# Install dependencies (if not already done)
npm install

# Create .env file
cp env.example .env
# Edit .env with your MongoDB URI

# Start the server
npm run dev
```

### 2. Database Operations Examples

#### Creating a User
```javascript
// POST /api/auth/register
const user = new User({
  name: "John Doe",
  email: "john@example.com",
  password: "hashedPassword",
  skills: [
    {
      name: "React",
      category: "Frontend",
      level: "Expert",
      offering: true
    }
  ]
});
await user.save();
```

#### Finding Users with Skills
```javascript
// GET /api/skills/users
const users = await User.find({
  'skills.name': { $regex: 'React', $options: 'i' },
  'skills.offering': true
}).select('-password');
```

#### Creating a Session
```javascript
// POST /api/requests/sessions
const session = new Session({
  hostId: req.user._id,
  partnerId: partnerId,
  scheduledAt: new Date('2025-01-20T14:00:00Z'),
  type: 'video',
  skillExchange: {
    hostSkill: 'React',
    partnerSkill: 'Python'
  }
});
await session.save();
```

#### Sending a Message
```javascript
// POST /api/messages/conversations/:id/messages
const message = new Message({
  senderId: req.user._id,
  receiverId: receiverId,
  content: "Hello! I'd like to schedule a session.",
  messageType: 'text'
});
await message.save();
```

### 3. Advanced Queries

#### Finding Skill Matches
```javascript
// Complex aggregation for matching algorithm
const matches = await User.aggregate([
  {
    $match: {
      _id: { $ne: currentUserId },
      'skills.offering': true
    }
  },
  {
    $lookup: {
      from: 'users',
      localField: '_id',
      foreignField: '_id',
      as: 'currentUser'
    }
  },
  {
    $addFields: {
      compatibilityScore: {
        $sum: [
          // Calculate score based on skill compatibility
          { $multiply: ['$skills.level', 10] }
        ]
      }
    }
  },
  {
    $sort: { compatibilityScore: -1 }
  }
]);
```

#### Getting User Conversations
```javascript
// Complex aggregation for chat conversations
const conversations = await Message.aggregate([
  {
    $match: {
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }
  },
  {
    $group: {
      _id: {
        $cond: [
          { $eq: ['$senderId', userId] },
          '$receiverId',
          '$senderId'
        ]
      },
      lastMessage: { $last: '$$ROOT' },
      unreadCount: {
        $sum: {
          $cond: [
            {
              $and: [
                { $eq: ['$receiverId', userId] },
                { $eq: ['$isRead', false] }
              ]
            },
            1,
            0
          ]
        }
      }
    }
  }
]);
```

## 🔍 MongoDB Tools and Management

### 1. MongoDB Compass (GUI)
- Download from https://www.mongodb.com/products/compass
- Visual interface for database management
- Query builder and data visualization

### 2. MongoDB Shell (mongosh)
```bash
# Connect to local MongoDB
mongosh

# Connect to specific database
mongosh skillswap

# Basic commands
show dbs                    # Show all databases
use skillswap              # Switch to skillswap database
show collections           # Show all collections
db.users.find()            # Find all users
db.users.findOne()         # Find one user
```

### 3. Useful MongoDB Queries for Development

```javascript
// Find all users offering React skills
db.users.find({ "skills.name": "React", "skills.offering": true })

// Find sessions for a specific user
db.sessions.find({ 
  $or: [
    { hostId: ObjectId("user_id") },
    { partnerId: ObjectId("user_id") }
  ]
})

// Find unread messages for a user
db.messages.find({ 
  receiverId: ObjectId("user_id"), 
  isRead: false 
})

// Find users with high ratings
db.users.find({ rating: { $gte: 4.5 } })

// Count total sessions
db.sessions.countDocuments()

// Find recent messages
db.messages.find().sort({ createdAt: -1 }).limit(10)
```

## 🚀 Production Considerations

### 1. Indexing for Performance
Your models already include some indexes, but you might want to add more:

```javascript
// In your models, add indexes for frequently queried fields
userSchema.index({ email: 1 });
userSchema.index({ 'skills.name': 1 });
userSchema.index({ location: 1 });
userSchema.index({ rating: -1 });

sessionSchema.index({ hostId: 1, scheduledAt: 1 });
sessionSchema.index({ partnerId: 1, scheduledAt: 1 });

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
```

### 2. Data Validation
MongoDB schemas include validation, but you can add more:

```javascript
// Example: Add custom validation
userSchema.path('email').validate(function(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}, 'Invalid email format');
```

### 3. Backup Strategy
```bash
# Backup database
mongodump --db skillswap --out backup/

# Restore database
mongorestore --db skillswap backup/skillswap/
```

## 🧪 Testing with MongoDB

### 1. Test Database Setup
```javascript
// In your test files
beforeAll(async () => {
  await mongoose.connect('mongodb://localhost:27017/skillswap_test');
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});
```

### 2. Sample Data for Testing
```javascript
// Create test users
const testUser = new User({
  name: 'Test User',
  email: 'test@example.com',
  password: 'hashedPassword',
  skills: [
    {
      name: 'JavaScript',
      category: 'Frontend',
      level: 'Expert',
      offering: true
    }
  ]
});
```

## 📊 Monitoring and Analytics

### 1. Database Statistics
```javascript
// Get database stats
const stats = await mongoose.connection.db.stats();
console.log('Database size:', stats.dataSize);
console.log('Collections:', stats.collections);
```

### 2. Performance Monitoring
```javascript
// Monitor slow queries
mongoose.set('debug', true); // Logs all queries
```

## 🎯 Next Steps

1. **Set up MongoDB** (local or Atlas)
2. **Update your .env file** with the correct MONGO_URI
3. **Start your backend server** and verify connection
4. **Test the API endpoints** to ensure data is being saved
5. **Use MongoDB Compass** to visualize your data
6. **Set up proper indexing** for production performance

## 🔗 Useful Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB Atlas](https://www.mongodb.com/atlas)
- [MongoDB Compass](https://www.mongodb.com/products/compass)

---

**Your SkillSwap project is already configured to use MongoDB! Just set up the database and update your environment variables.**
