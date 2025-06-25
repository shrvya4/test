# Complete Deployment Guide

## Overview
This guide will help you deploy both the frontend Next.js application and the backend Firebase Functions for the women's health app.

## Prerequisites
1. **Node.js 18+** installed
2. **Firebase CLI** installed: `npm install -g firebase-tools`
3. **Git** for version control
4. **Firebase project** created in the Firebase Console

## Step 1: Firebase Project Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name your project (e.g., "womens-health-app")
4. Enable Google Analytics (optional)
5. Create project

### 1.2 Enable Services
In your Firebase project, enable these services:
- **Authentication** (Email/Password)
- **Firestore Database**
- **Functions** (for the research paper fetching)

### 1.3 Get Firebase Config
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" → Web app
4. Copy the config object

## Step 2: Frontend Setup

### 2.1 Install Dependencies
```bash
npm install
```

### 2.2 Configure Firebase
Update `lib/firebase.ts` with your Firebase config:
```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 2.3 Set Environment Variables
Create `.env.local` file:
```env
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-api-key
```

### 2.4 Run Development Server
```bash
npm run dev
```

## Step 3: Firebase Functions Setup

### 3.1 Install Function Dependencies
```bash
cd functions
npm install
```

### 3.2 Build Functions
```bash
npm run build
```

### 3.3 Deploy Functions
```bash
# Login to Firebase (if not already logged in)
firebase login

# Initialize Firebase Functions (if not already done)
firebase init functions

# Deploy the functions
firebase deploy --only functions
```

### 3.4 Verify Function Deployment
After deployment, you'll see URLs like:
- `https://your-project-id.cloudfunctions.net/manualResearchFetch`

## Step 4: Firestore Security Rules

### 4.1 Deploy Security Rules
```bash
firebase deploy --only firestore:rules
```

### 4.2 Deploy Indexes
```bash
firebase deploy --only firestore:indexes
```

## Step 5: Test the Complete System

### 5.1 Test Authentication
1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Test user registration and login

### 5.2 Test Research Function
1. Call the manual function: `https://your-project-id.cloudfunctions.net/manualResearchFetch`
2. Check Firestore for new research data
3. Verify the "Smart Research" tab shows data

### 5.3 Test Scheduled Function
The scheduled function runs every Monday at 9 AM EST. You can:
1. Wait for Monday, or
2. Manually trigger it using the HTTP function

## Step 6: Production Deployment

### 6.1 Deploy Frontend
```bash
# Build the application
npm run build

# Deploy to Vercel (recommended)
vercel --prod

# Or deploy to Firebase Hosting
firebase deploy --only hosting
```

### 6.2 Deploy Backend
```bash
# Deploy all Firebase services
firebase deploy
```

## Monitoring and Maintenance

### 6.1 Monitor Functions
1. Go to Firebase Console → Functions
2. View execution logs and performance
3. Set up alerts for function failures

### 6.2 Monitor Firestore
1. Go to Firebase Console → Firestore
2. Monitor database usage and costs
3. Check security rules are working

### 6.3 Monitor Authentication
1. Go to Firebase Console → Authentication
2. Monitor user sign-ups and sign-ins
3. Check for any security issues

## Troubleshooting

### Common Issues

#### 1. Function Deployment Fails
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### 2. Firestore Permission Errors
- Ensure security rules are deployed
- Check that functions have proper permissions
- Verify collection names match exactly

#### 3. Research Data Not Loading
- Check if functions are deployed successfully
- Verify Firestore rules allow reading research data
- Test the manual function endpoint

#### 4. Authentication Issues
- Verify Firebase config is correct
- Check if Authentication is enabled in Firebase Console
- Ensure email/password sign-in is enabled

### Debug Commands
```bash
# View function logs
firebase functions:log

# Test functions locally
cd functions
npm run serve

# Check Firebase project
firebase projects:list

# View current project
firebase use
```

## Cost Optimization

### 6.1 Firestore Costs
- Monitor read/write operations
- Consider implementing caching
- Use pagination for large datasets

### 6.2 Function Costs
- Monitor function execution time
- Consider reducing function frequency if needed
- Set up billing alerts

## Security Best Practices

### 6.1 Environment Variables
- Never commit API keys to version control
- Use Firebase environment variables for sensitive data
- Rotate API keys regularly

### 6.2 Firestore Rules
- Always validate data on the server side
- Use proper authentication checks
- Limit user access to their own data

### 6.3 Function Security
- Validate all inputs
- Implement rate limiting
- Use proper error handling

## Next Steps

After successful deployment:

1. **Set up monitoring** for production usage
2. **Configure analytics** to track user engagement
3. **Set up alerts** for system issues
4. **Plan for scaling** as user base grows
5. **Regular backups** of user data
6. **Security audits** on a regular basis

## Support

If you encounter issues:
1. Check Firebase Console for error logs
2. Review function execution logs
3. Verify all configuration is correct
4. Test with a fresh Firebase project if needed

The system is now ready for production use! 🎉 