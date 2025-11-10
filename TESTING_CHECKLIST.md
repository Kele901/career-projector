# 🧪 CV Career Recommender - Testing Checklist

## Pre-Testing Setup

- [ ] Backend server running on http://localhost:8000
- [ ] Frontend server running on http://localhost:5173
- [ ] Browser console open (F12) for debugging
- [ ] Have a sample CV file ready (PDF or DOCX)

## 1. Backend API Tests

### Health Check
- [ ] Visit http://localhost:8000
- [ ] Should see: `{"message": "CV Career Recommender API", "version": "1.0.0", "docs": "/docs"}`
- [ ] Visit http://localhost:8000/health
- [ ] Should see: `{"status": "healthy"}`
- [ ] Visit http://localhost:8000/docs
- [ ] Should see interactive API documentation

### Database
- [ ] Check that `career_projector.db` file is created in backend directory
- [ ] Backend console shows "Database initialized" message

## 2. Frontend UI Tests

### Landing Page
- [ ] Open http://localhost:5173
- [ ] Page loads without errors
- [ ] "CV Career Recommender" header visible
- [ ] "Login" and "Sign Up" buttons visible
- [ ] Features section displays 4 feature cards
- [ ] Footer displays correctly

### Registration
- [ ] Click "Sign Up" button
- [ ] Registration form appears
- [ ] Enter:
  - Full Name: "Test User"
  - Email: "test@example.com"
  - Password: "test123"
  - Confirm Password: "test123"
- [ ] Click "Sign Up"
- [ ] Should redirect to Dashboard
- [ ] Welcome message shows: "Welcome, Test User"

### Login (After Logout)
- [ ] Logout from dashboard
- [ ] Click "Login"
- [ ] Enter:
  - Email: "test@example.com"
  - Password: "test123"
- [ ] Click "Sign In"
- [ ] Should redirect to Dashboard

## 3. CV Upload Tests

### Upload Interface
- [ ] From Dashboard, click "Upload CV"
- [ ] Upload page loads
- [ ] Drag-and-drop area visible
- [ ] "Click to upload or drag and drop" text visible
- [ ] "PDF or DOCX (max 10MB)" text visible

### File Validation
- [ ] Try uploading a .txt file
- [ ] Should show error: "File type not allowed"
- [ ] Try uploading a file > 10MB (if available)
- [ ] Should show error: "File size exceeds maximum"

### Successful Upload
- [ ] Upload a valid PDF or DOCX CV
- [ ] Progress indicator appears
- [ ] Upload completes
- [ ] Success screen shows:
  - ✅ Green checkmark
  - "CV Uploaded Successfully!"
  - "View Details" button
  - "Get Recommendations" button
  - "Upload Another" button

## 4. CV Analysis Tests

### CV Details View
- [ ] Click "View Details" after upload
- [ ] CV details page loads
- [ ] Shows CV filename
- [ ] Shows upload date
- [ ] Shows years of experience (if detected)
- [ ] Shows education level (if detected)
- [ ] Skills section displays
- [ ] Skills are grouped by category:
  - Frontend
  - Backend
  - DevOps
  - Data
  - Mobile
  - General
- [ ] Each skill shows name and level
- [ ] Skills have color-coded badges

### Dashboard CV List
- [ ] Go back to Dashboard
- [ ] Uploaded CV appears in list
- [ ] Shows filename
- [ ] Shows upload date
- [ ] Shows experience/education if available
- [ ] "View Recommendations" button visible

## 5. Recommendation Tests

### Generate Recommendations
- [ ] Click "Get Recommendations" on a CV
- [ ] Recommendations page loads
- [ ] "Generate Recommendations" button visible
- [ ] AI Enhancement checkbox visible
- [ ] Click "Generate Recommendations"
- [ ] Loading indicator appears
- [ ] Recommendations appear (up to 5)

### Recommendation Display
For each recommendation:
- [ ] Pathway name displayed
- [ ] Match score percentage shown
- [ ] Score has colored indicator:
  - Green (70%+)
  - Yellow (50-69%)
  - Orange (<50%)
- [ ] "Why this path?" reasoning section
- [ ] "Skills to learn" section with skill tags
- [ ] "View Learning Roadmap" link
- [ ] Link goes to correct roadmap.sh URL

### Recommendation Verification
- [ ] Top recommendation should match CV content
- [ ] Skills to learn are relevant
- [ ] Match scores are reasonable (0-100%)
- [ ] Can "Regenerate" recommendations

## 6. Navigation Tests

### Menu Navigation
- [ ] Back button works from all pages
- [ ] Dashboard link returns to dashboard
- [ ] Logout button works
- [ ] After logout, redirects to login page

### Protected Routes
- [ ] Logout completely
- [ ] Try accessing http://localhost:5173/dashboard
- [ ] Should redirect to login page
- [ ] Try accessing http://localhost:5173/upload
- [ ] Should redirect to login page

### Multiple CVs
- [ ] Upload 2-3 different CVs
- [ ] All CVs appear in dashboard list
- [ ] Can view details of each CV
- [ ] Can get recommendations for each CV
- [ ] Recommendations are different for different CVs

## 7. Error Handling Tests

### Network Errors
- [ ] Stop backend server
- [ ] Try to upload a CV
- [ ] Should show appropriate error message
- [ ] Try to generate recommendations
- [ ] Should show appropriate error message
- [ ] Restart backend server

### Invalid Data
- [ ] Try registering with existing email
- [ ] Should show "Email already registered"
- [ ] Try login with wrong password
- [ ] Should show "Incorrect email or password"
- [ ] Try accessing non-existent CV ID
- [ ] Should show "CV not found"

### Session Management
- [ ] Login successfully
- [ ] Wait for token expiration (30 minutes)
- [ ] Try an authenticated action
- [ ] Should show authentication error
- [ ] Should redirect to login

## 8. Responsive Design Tests

### Desktop (1920x1080)
- [ ] All pages render correctly
- [ ] No horizontal scrolling
- [ ] Content is centered and readable

### Tablet (768x1024)
- [ ] Pages adjust to narrower width
- [ ] Navigation remains functional
- [ ] Forms are usable
- [ ] Cards stack appropriately

### Mobile (375x667)
- [ ] Pages work on small screens
- [ ] Text is readable
- [ ] Buttons are tappable
- [ ] Upload interface works

## 9. Career Pathways Tests

### Pathway Coverage
- [ ] View "All Pathways" (via API or recommendations)
- [ ] Should include 13 pathways:
  - [ ] Frontend Developer
  - [ ] Backend Developer
  - [ ] Full Stack Developer
  - [ ] DevOps Engineer
  - [ ] Data Scientist
  - [ ] Android Developer
  - [ ] iOS Developer
  - [ ] React Native Developer
  - [ ] Software Architect
  - [ ] QA Engineer
  - [ ] Blockchain Developer
  - [ ] Game Developer
  - [ ] Cyber Security Specialist

### Pathway Matching
Upload CVs with different skill sets and verify correct matching:

- [ ] Frontend CV → Frontend Developer top match
- [ ] Backend CV → Backend Developer top match
- [ ] DevOps CV → DevOps Engineer top match
- [ ] Data Science CV → Data Scientist top match

## 10. Performance Tests

### Load Times
- [ ] Login page loads < 1 second
- [ ] Dashboard loads < 2 seconds
- [ ] CV upload completes < 5 seconds (for typical CV)
- [ ] Recommendations generate < 3 seconds

### Concurrent Operations
- [ ] Upload multiple CVs in quick succession
- [ ] All uploads process correctly
- [ ] Generate recommendations for multiple CVs
- [ ] All recommendations accurate

## 11. Data Persistence Tests

### Database Persistence
- [ ] Upload a CV
- [ ] Stop and restart backend server
- [ ] Login again
- [ ] CV should still be in dashboard
- [ ] Skills should still be displayed
- [ ] Recommendations should still be available

### File Storage
- [ ] Check `backend/uploads/` directory
- [ ] Uploaded CV files should exist
- [ ] Files named with timestamp pattern

## 12. Optional: AI Enhancement Tests

*Only if OpenAI API key is configured*

### AI-Enhanced Recommendations
- [ ] Generate recommendations with AI toggle ON
- [ ] Recommendations should have "AI Enhanced" badge
- [ ] Should include "AI Insights" section
- [ ] Insights should be relevant to CV content

### Learning Path Generation
- [ ] Select a career pathway
- [ ] Request AI learning path
- [ ] Should receive structured learning plan
- [ ] Plan should include resources and timeline

## Success Criteria

✅ **All critical tests passing**: Registration, Login, Upload, Analysis, Recommendations

✅ **No console errors** during normal operation

✅ **Responsive design** works on different screen sizes

✅ **Data persists** after server restart

✅ **Error handling** shows user-friendly messages

## Common Issues & Solutions

### Issue: "Cannot read properties of undefined"
- **Solution**: Check that backend is running and API responses are correct

### Issue: Skills not extracted
- **Solution**: Ensure CV has readable text (not scanned images)

### Issue: Recommendations seem random
- **Solution**: Verify career_pathways.json loaded correctly

### Issue: Upload fails silently
- **Solution**: Check backend console for errors, verify file permissions on uploads directory

## Test Results Template

```
Date: __________
Tester: __________

✅ Passed Tests: ___/100
❌ Failed Tests: ___/100
⚠️  Warnings: ___

Critical Issues Found:
1. 
2. 
3. 

Notes:



Overall Status: [ ] PASS [ ] FAIL [ ] NEEDS WORK
```

---

**Note**: This is a comprehensive testing checklist. For quick validation, focus on sections 1-5, which cover core functionality.

