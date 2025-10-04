# Profile Image Upload Backend Implementation

## Overview
This document outlines the complete backend implementation for profile image upload functionality in the SkillSwap application.

## Architecture

### 1. File Structure
```
Backend/
├── middleware/
│   └── upload.js          # Multer configuration for file uploads
├── models/
│   └── User.js           # User model with avatar field
├── routes/
│   └── authRoutes.js     # Authentication routes including upload
├── uploads/
│   └── avatars/          # Directory for storing profile images
├── server.js             # Main server configuration
└── .env                  # Environment variables
```

### 2. Database Schema
The User model includes an `avatar` field to store the image URL:
```javascript
const userSchema = new mongoose.Schema({
  // ... other fields
  avatar: { type: String, default: "" },
  // ... other fields
});
```

### 3. Upload Middleware (`middleware/upload.js`)
- **Storage**: Local file system using multer diskStorage
- **File Naming**: `{userId}_{timestamp}.{extension}`
- **File Filtering**: Only image files allowed
- **Size Limit**: 5MB maximum
- **Directory**: `uploads/avatars/`

### 4. Upload Endpoint (`POST /api/auth/upload-avatar`)

#### Request
- **Method**: POST
- **URL**: `/api/auth/upload-avatar`
- **Headers**: 
  - `Authorization: Bearer {jwt_token}`
  - `Content-Type: multipart/form-data`
- **Body**: FormData with `avatar` field containing image file

#### Response
```javascript
{
  "message": "Profile picture updated successfully",
  "user": {
    "_id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "avatar": "/uploads/avatars/userId_timestamp.jpg",
    // ... other user fields
  }
}
```

#### Error Responses
- `400`: No file uploaded / Invalid file type / File too large
- `401`: Unauthorized (invalid/missing token)
- `404`: User not found
- `500`: Server error

## Implementation Details

### 1. File Upload Process
1. **Authentication**: Verify JWT token
2. **File Validation**: Check file type and size
3. **Old File Cleanup**: Remove previous avatar if exists
4. **File Storage**: Save new file with unique name
5. **Database Update**: Update user's avatar field
6. **Response**: Return updated user data

### 2. Security Features
- **Authentication Required**: JWT token validation
- **File Type Validation**: Only image files accepted
- **File Size Limit**: 5MB maximum
- **Unique Filenames**: Prevent conflicts and overwrites
- **Error Handling**: Comprehensive error responses

### 3. File Management
- **Directory Creation**: Automatic creation of upload directories
- **Old File Cleanup**: Automatic deletion of previous avatars
- **Static Serving**: Express static middleware for image access
- **URL Generation**: Consistent URL pattern for frontend access

## API Testing

### Using cURL
```bash
# Upload profile picture
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "avatar=@/path/to/image.jpg" \
  http://localhost:5000/api/auth/upload-avatar
```

### Using JavaScript/Axios
```javascript
const formData = new FormData();
formData.append('avatar', fileInput.files[0]);

const response = await axios.post('/api/auth/upload-avatar', formData, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  }
});
```

## Frontend Integration

### 1. File Input
```html
<input 
  type="file" 
  accept="image/*" 
  onChange={handleFileChange}
  style={{ display: 'none' }}
  ref={fileInputRef}
/>
```

### 2. Upload Handler
```javascript
const handleUpload = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  try {
    const response = await api.post('/auth/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    // Update user state with new avatar
    setUser(response.data.user);
  } catch (error) {
    console.error('Upload failed:', error.response.data.message);
  }
};
```

### 3. Image Display
```javascript
const avatarUrl = user.avatar 
  ? `http://localhost:5000${user.avatar}` 
  : '/default-avatar.png';

<img src={avatarUrl} alt="Profile" />
```

## Environment Configuration

### Required Environment Variables
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/skillswap
JWT_SECRET=your-jwt-secret-key
NODE_ENV=development
```

## Dependencies

### Required npm packages
```json
{
  "multer": "^2.0.2",
  "express": "^5.1.0",
  "mongoose": "^8.18.1",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^3.0.2",
  "cors": "^2.8.5",
  "dotenv": "^17.2.2"
}
```

## Directory Permissions
Ensure the uploads directory has proper write permissions:
```bash
# Linux/Mac
chmod 755 uploads/
chmod 755 uploads/avatars/

# Windows
# Ensure the application has write access to the uploads folder
```

## Error Handling

### Common Issues and Solutions

1. **"Route not found"**
   - Ensure server is running
   - Check route registration in server.js
   - Verify middleware import paths

2. **"No file uploaded"**
   - Check FormData field name is 'avatar'
   - Verify Content-Type is multipart/form-data
   - Ensure file input has a selected file

3. **"File too large"**
   - Check file size (max 5MB)
   - Verify multer limits configuration

4. **"Only image files allowed"**
   - Check file MIME type
   - Ensure file has proper image extension

## Production Considerations

1. **File Storage**: Consider cloud storage (AWS S3, Cloudinary)
2. **CDN**: Implement CDN for better performance
3. **Image Processing**: Add image resizing/compression
4. **Backup**: Implement file backup strategy
5. **Security**: Add rate limiting and additional validation

## Testing

Run the test suite:
```bash
node test-upload-complete.js
```

This will test:
- Server health
- User registration/login
- File upload functionality
- Data persistence
- File storage verification

## Monitoring

### Log Messages
- File upload attempts
- Error conditions
- File cleanup operations
- Directory creation

### Metrics to Track
- Upload success rate
- File sizes
- Storage usage
- Response times