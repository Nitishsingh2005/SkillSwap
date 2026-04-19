# Local MongoDB Setup for SkillSwap Development

## 🚀 Quick Setup (Windows)

### Step 1: Download and Install MongoDB

1. **Go to MongoDB Download Page**
   - Visit: https://www.mongodb.com/try/download/community
   - Select "Windows" and "MSI" package
   - Click "Download"

2. **Run the Installer**
   - Run the downloaded `.msi` file
   - Choose "Complete" installation
   - Check "Install MongoDB as a Service"
   - Check "Install MongoDB Compass" (GUI tool)
   - Click "Install"

3. **Verify Installation**
   ```bash
   # Open Command Prompt and run:
   mongod --version
   mongo --version
   ```

### Step 2: Start MongoDB Service

MongoDB should start automatically as a Windows service. If not:

```bash
# Start MongoDB service
net start MongoDB

# Or restart if needed
net stop MongoDB
net start MongoDB
```

### Step 3: Configure Your SkillSwap Project

1. **Navigate to Backend Directory**
   ```bash
   cd Backend
   ```

2. **Create Environment File**
   ```bash
   copy env.example .env
   ```

3. **Edit .env File**
   ```env
   MONGO_URI=mongodb://localhost:27017/skillswap
   JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
   PORT=5000
   NODE_ENV=development
   ```

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Start the Server**
   ```bash
   npm run dev
   ```

You should see:
```
MongoDB Connected
Server running on port 5000
```

## 🛠️ Using MongoDB Compass (GUI)

MongoDB Compass provides a visual interface:

1. **Open MongoDB Compass**
   - Should be installed with MongoDB
   - Or download from: https://www.mongodb.com/products/compass

2. **Connect to Local Database**
   - Connection string: `mongodb://localhost:27017`
   - Click "Connect"

3. **View Your Database**
   - You'll see `skillswap` database after running your app
   - Browse collections: users, sessions, messages, etc.

## 🧪 Testing Your Setup

### Test 1: Check Database Connection
```bash
# In your Backend directory
npm run dev
# Should show "MongoDB Connected"
```

### Test 2: Create a Test User
```bash
# POST request to http://localhost:5000/api/auth/register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test 3: View Data in Compass
- Open MongoDB Compass
- Navigate to `skillswap` database
- Check `users` collection for your test user

## 🔧 Common Issues and Solutions

### Issue 1: MongoDB Service Not Starting
```bash
# Check if MongoDB service is running
sc query MongoDB

# Start the service
net start MongoDB

# If still having issues, check Windows Services
# Search "Services" in Windows, find MongoDB, and start it
```

### Issue 2: Port Already in Use
```bash
# Check what's using port 27017
netstat -ano | findstr :27017

# Kill the process if needed
taskkill /PID <process_id> /F
```

### Issue 3: Permission Issues
- Run Command Prompt as Administrator
- Or check MongoDB service permissions in Windows Services

## 📊 Database Operations

### Using MongoDB Shell
```bash
# Connect to MongoDB shell
mongosh

# Switch to your database
use skillswap

# View collections
show collections

# Find all users
db.users.find()

# Find users with React skills
db.users.find({ "skills.name": "React" })

# Count total users
db.users.countDocuments()
```

### Using MongoDB Compass
1. Open Compass
2. Connect to `mongodb://localhost:27017`
3. Select `skillswap` database
4. Browse collections visually
5. Run queries using the query builder

## 🎯 Development Workflow

### Daily Development Process:
1. **Start MongoDB Service** (usually automatic)
2. **Start Backend Server**: `npm run dev`
3. **Start Frontend**: `npm run dev` (in Frontend directory)
4. **Test API Endpoints**
5. **View Data in Compass**

### Data Management:
- **Reset Database**: Drop and recreate collections
- **Seed Data**: Add sample data for testing
- **Backup**: Export collections as JSON
- **Restore**: Import data from JSON files

## 🚀 Benefits of Local Development

1. **Speed**: No network latency
2. **Reliability**: No internet dependency
3. **Cost**: Completely free
4. **Learning**: Better understanding of MongoDB
5. **Control**: Full database access
6. **Privacy**: Data stays local

## 📈 When to Move to Cloud

Consider MongoDB Atlas when:
- Ready for production deployment
- Need team collaboration
- Want automatic backups
- Need scalability
- Require monitoring and analytics

## 🎉 You're Ready!

With local MongoDB set up, you can:
- ✅ Develop your SkillSwap app locally
- ✅ Test all database operations
- ✅ Learn MongoDB concepts
- ✅ Build and iterate quickly
- ✅ Deploy to cloud later when ready

---

**Start with local MongoDB for development, then move to Atlas for production!**
