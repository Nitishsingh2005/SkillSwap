# SkillSwap Project - 20 Comprehensive Test Cases

## Test Suite for SkillSwap Platform

This document contains 20 comprehensive test cases covering all major functionality of the SkillSwap application including authentication, profile management, skills management, portfolio links, availability scheduling, and profile picture uploads.

### Prerequisites
- Backend server running on `http://localhost:5000`
- Frontend application running on `http://localhost:3000` or `http://localhost:5173`
- MongoDB database connected and running
- All dependencies installed (`npm install` in both Backend and Frontend directories)

---

## **Authentication Test Cases**

### Test Case 1: User Registration
**Objective:** Verify user can successfully register with valid credentials

**Test Steps:**
1. Navigate to registration page
2. Enter valid name: "Test User"
3. Enter valid email: "testuser@example.com"
4. Enter valid password: "password123"
5. Click "Register" button

**Expected Results:**
- User account created successfully
- JWT token generated and stored
- User redirected to dashboard/profile page
- Success message displayed
- User data stored in MongoDB

**API Endpoint:** `POST /api/auth/register`

---

### Test Case 2: User Registration with Duplicate Email
**Objective:** Verify system prevents registration with existing email

**Test Steps:**
1. Register a user with email "duplicate@example.com"
2. Attempt to register another user with same email
3. Observe error response

**Expected Results:**
- Registration fails with error message "User already exists"
- No duplicate user created in database
- HTTP status 400 returned

**API Endpoint:** `POST /api/auth/register`

---

### Test Case 3: User Login with Valid Credentials
**Objective:** Verify user can login with correct email and password

**Test Steps:**
1. Navigate to login page
2. Enter registered email: "testuser@example.com"
3. Enter correct password: "password123"
4. Click "Login" button

**Expected Results:**
- User authenticated successfully
- JWT token generated and stored in localStorage
- User redirected to dashboard
- User profile data loaded

**API Endpoint:** `POST /api/auth/login`

---

### Test Case 4: User Login with Invalid Credentials
**Objective:** Verify system rejects login with incorrect credentials

**Test Steps:**
1. Navigate to login page
2. Enter email: "testuser@example.com"
3. Enter wrong password: "wrongpassword"
4. Click "Login" button

**Expected Results:**
- Login fails with error message "Invalid credentials"
- No token stored
- User remains on login page
- HTTP status 400 returned

**API Endpoint:** `POST /api/auth/login`

---

## **Profile Management Test Cases**

### Test Case 5: View User Profile
**Objective:** Verify authenticated user can view their profile

**Test Steps:**
1. Login as registered user
2. Navigate to profile page
3. Verify all profile fields are displayed

**Expected Results:**
- Profile page loads successfully
- User name, email, bio, location displayed
- Skills list shown (if any)
- Portfolio links shown (if any)
- Availability schedule shown (if any)
- Avatar/profile picture displayed

**API Endpoint:** `GET /api/auth/profile`

---

### Test Case 6: Update Profile Information
**Objective:** Verify user can update basic profile information

**Test Steps:**
1. Login and navigate to profile page
2. Click "Edit" button
3. Update name to "Updated Test User"
4. Update bio to "Software Developer passionate about learning"
5. Update location to "New York, NY"
6. Enable video call ready option
7. Click "Save" button

**Expected Results:**
- Profile updated successfully in database
- Updated information displayed immediately
- Success message shown
- Changes persist after page refresh

**API Endpoint:** `PUT /api/auth/profile`

---

### Test Case 7: Profile Picture Upload
**Objective:** Verify user can upload and update profile picture

**Test Steps:**
1. Login and navigate to profile page
2. Click camera icon on avatar
3. Select valid image file (JPG, PNG, < 5MB)
4. Wait for upload completion

**Expected Results:**
- File upload progress indicator shown
- Image uploaded to server successfully
- Avatar updated with new image
- Image file stored in `/uploads/avatars/` directory
- Database updated with new avatar URL
- Old avatar file deleted (if existed)

**API Endpoint:** `POST /api/auth/upload-avatar`

---

### Test Case 8: Profile Picture Upload Validation
**Objective:** Verify file upload validation works correctly

**Test Steps:**
1. Login and navigate to profile page
2. Attempt to upload non-image file (PDF, TXT)
3. Attempt to upload large image file (> 5MB)
4. Verify error handling

**Expected Results:**
- Non-image files rejected with error message
- Large files rejected with size limit error
- No files uploaded to server
- User prompted to select valid image

**API Endpoint:** `POST /api/auth/upload-avatar`

---

## **Skills Management Test Cases**

### Test Case 9: Add New Skill
**Objective:** Verify user can add skills to their profile

**Test Steps:**
1. Login and navigate to profile page
2. Click "Add Skill" button
3. Enter skill name: "React"
4. Select category: "Frontend"
5. Select level: "Expert"
6. Check "I'm offering to teach this skill"
7. Click "Add Skill" button

**Expected Results:**
- Skill added to user's profile
- Skill appears in skills list
- Skill data stored in MongoDB
- Success message displayed

**API Endpoint:** `POST /api/skills/users/:id/skills`

---

### Test Case 10: Remove Skill
**Objective:** Verify user can remove skills from their profile

**Test Steps:**
1. Login with user who has existing skills
2. Navigate to profile page
3. Click "X" button on a skill to remove it
4. Confirm removal

**Expected Results:**
- Skill removed from profile
- Skill no longer appears in skills list
- Database updated to remove skill
- Success message displayed

**API Endpoint:** `DELETE /api/skills/users/:id/skills/:skillId`

---

### Test Case 11: Skill Form Validation
**Objective:** Verify skill form validates required fields

**Test Steps:**
1. Login and navigate to profile page
2. Click "Add Skill" button
3. Leave skill name empty
4. Attempt to submit form

**Expected Results:**
- Form validation prevents submission
- Error message displayed: "Please fill in all required fields"
- No API call made
- Form remains open for correction

---

## **Portfolio Links Test Cases**

### Test Case 12: Add Portfolio Link
**Objective:** Verify user can add portfolio links to profile

**Test Steps:**
1. Login and navigate to profile page
2. Click "Add Portfolio Link" button
3. Enter platform: "GitHub"
4. Enter URL: "https://github.com/testuser"
5. Click "Add Link" button

**Expected Results:**
- Portfolio link added to profile
- Link appears in portfolio section with GitHub icon
- Clickable link opens in new tab
- Database updated with new portfolio link

**API Endpoint:** `POST /api/auth/portfolio-links`

---

### Test Case 13: Remove Portfolio Link
**Objective:** Verify user can remove portfolio links

**Test Steps:**
1. Login with user who has portfolio links
2. Navigate to profile page
3. Click "X" button on portfolio link
4. Confirm removal

**Expected Results:**
- Portfolio link removed from profile
- Link no longer displayed
- Database updated
- Success message shown

**API Endpoint:** `DELETE /api/auth/portfolio-links/:linkId`

---

### Test Case 14: Portfolio Link Validation
**Objective:** Verify portfolio link form validates URL format

**Test Steps:**
1. Login and navigate to profile page
2. Click "Add Portfolio Link" button
3. Enter platform: "Website"
4. Enter invalid URL: "not-a-valid-url"
5. Attempt to submit

**Expected Results:**
- Form validation catches invalid URL
- Error message displayed
- No API call made until valid URL provided

---

## **Availability Management Test Cases**

### Test Case 15: Add Availability Schedule
**Objective:** Verify user can set availability for skill sharing

**Test Steps:**
1. Login and navigate to profile page
2. Click "Set Availability" button
3. Select day: "Monday"
4. Add time slots: "09:00-12:00", "14:00-17:00"
5. Click "Add Availability"

**Expected Results:**
- Availability added to user profile
- Schedule displayed in availability section
- Time slots shown as badges
- Database updated with availability data

**API Endpoint:** `POST /api/auth/availability`

---

### Test Case 16: Remove Availability Slot
**Objective:** Verify user can remove availability slots

**Test Steps:**
1. Login with user who has availability set
2. Navigate to profile page
3. Click "X" button on availability slot
4. Confirm removal

**Expected Results:**
- Availability slot removed
- No longer displayed in schedule
- Database updated
- Success message shown

**API Endpoint:** `DELETE /api/auth/availability/:slotId`

---

## **API and Integration Test Cases**

### Test Case 17: API Authentication Middleware
**Objective:** Verify protected routes require valid JWT token

**Test Steps:**
1. Make API call to protected endpoint without token
2. Make API call with invalid/expired token
3. Make API call with valid token

**Expected Results:**
- No token: HTTP 401 "No token, authorization denied"
- Invalid token: HTTP 401 "Token is not valid"
- Valid token: Request processed successfully

**API Endpoints:** All protected routes (`/api/auth/profile`, `/api/skills/*`, etc.)

---

### Test Case 18: Database Connection and Data Persistence
**Objective:** Verify data persists correctly in MongoDB

**Test Steps:**
1. Create new user account
2. Add profile information, skills, portfolio links
3. Logout and login again
4. Verify all data persists

**Expected Results:**
- All user data saved to MongoDB
- Data persists across sessions
- No data loss during logout/login cycle
- Database queries execute successfully

---

### Test Case 19: CORS and Frontend-Backend Integration
**Objective:** Verify frontend can communicate with backend APIs

**Test Steps:**
1. Start both frontend and backend servers
2. Perform various operations from frontend UI
3. Check browser network tab for API calls
4. Verify no CORS errors in console

**Expected Results:**
- All API calls successful from frontend
- No CORS errors in browser console
- Proper response headers set
- Cross-origin requests allowed

---

### Test Case 20: Error Handling and User Experience
**Objective:** Verify proper error handling throughout the application

**Test Steps:**
1. Test with network disconnected
2. Test with invalid server responses
3. Test form submissions with validation errors
4. Test file uploads with various error conditions

**Expected Results:**
- Graceful error handling for network issues
- User-friendly error messages displayed
- No application crashes or blank screens
- Loading states shown appropriately
- Errors logged to console for debugging

---

## **Test Execution Guide**

### Manual Testing
1. **Start Services:**
   ```bash
   # Terminal 1 - Backend
   cd Backend
   node server.js
   
   # Terminal 2 - Frontend
   cd Frontend
   npm run dev
   ```

2. **Browser Testing:**
   - Open application in browser
   - Execute each test case step by step
   - Verify expected results
   - Document any failures

### Automated Testing Setup
```javascript
// Example test structure using Jest/Supertest
describe('SkillSwap API Tests', () => {
  test('User Registration', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.token).toBeDefined();
  });
});
```

### Test Data Cleanup
After testing, clean up test data:
```javascript
// Remove test users
await User.deleteMany({ email: { $regex: /test.*@example\.com/ } });

// Remove test files
fs.rmSync('./uploads/avatars/', { recursive: true, force: true });
```

---

## **Expected Test Results Summary**

| Test Case | Component | Expected Status |
|-----------|-----------|-----------------|
| 1-4 | Authentication | ✅ PASS |
| 5-8 | Profile Management | ✅ PASS |
| 9-11 | Skills Management | ✅ PASS |
| 12-14 | Portfolio Links | ✅ PASS |
| 15-16 | Availability | ✅ PASS |
| 17-20 | API Integration | ✅ PASS |

**Success Criteria:** All 20 test cases should pass for a fully functional SkillSwap application.

---

## **Common Issues and Troubleshooting**

1. **Port Conflicts:** Ensure ports 5000 (backend) and 3000/5173 (frontend) are available
2. **MongoDB Connection:** Verify MongoDB is running and connection string is correct
3. **File Permissions:** Ensure uploads directory has write permissions
4. **Token Expiration:** JWT tokens expire after 7 days, re-login if needed
5. **Browser Cache:** Clear browser cache if seeing stale data

This comprehensive test suite ensures all major functionality of the SkillSwap platform works correctly and provides a solid foundation for quality assurance.