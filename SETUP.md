# Setup Guide

## Firebase Configuration

To get your Firebase configuration values:

1. **Go to Firebase Console**
   - Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Sign in with your Google account

2. **Create a New Project**
   - Click "Create a project"
   - Enter a project name (e.g., "womens-health-app")
   - Choose whether to enable Google Analytics (optional)
   - Click "Create project"

3. **Enable Authentication**
   - In the left sidebar, click "Authentication"
   - Click "Get started"
   - Go to "Sign-in method" tab
   - Enable "Email/Password" provider
   - Click "Save"

4. **Create Firestore Database**
   - In the left sidebar, click "Firestore Database"
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select a location close to your users
   - Click "Done"

5. **Get Web App Configuration**
   - Go to Project Settings (gear icon in left sidebar)
   - Scroll down to "Your apps" section
   - Click the web app icon (</>)
   - Register app with a nickname (e.g., "womens-health-web")
   - Copy the configuration object

6. **Create Environment File**
   - Create a `.env.local` file in the project root
   - Add the following variables with your Firebase values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Running the Application

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open Browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - You should see the authentication page

## Testing the App

1. **Create an Account**
   - Click "Sign Up"
   - Enter your email and password
   - Click "Create Account"

2. **Complete Onboarding**
   - Fill out the multi-step form
   - Select your age group, conditions, symptoms
   - Enter menstrual cycle information
   - Complete stress and sleep assessment

3. **Explore Features**
   - Chat with the AI health coach
   - Try the meal planner
   - Test different cuisines and cycle phases

## Troubleshooting

### Common Issues

1. **Firebase Connection Error**
   - Check that all environment variables are set correctly
   - Ensure Firebase project is created and configured
   - Verify Authentication is enabled

2. **Build Errors**
   - Run `npm install` to ensure all dependencies are installed
   - Check that Node.js version is 18 or higher
   - Clear `.next` folder and restart: `rm -rf .next && npm run dev`

3. **Authentication Issues**
   - Verify email/password authentication is enabled in Firebase
   - Check browser console for error messages
   - Ensure Firestore rules allow read/write access

### Development Tips

- Use browser developer tools to debug
- Check Firebase console for authentication logs
- Monitor Firestore database for user data
- Test on different screen sizes for responsive design

## Deployment

### Vercel (Recommended)

1. **Connect Repository**
   - Push code to GitHub
   - Connect repository to Vercel

2. **Add Environment Variables**
   - In Vercel dashboard, go to project settings
   - Add all Firebase environment variables
   - Redeploy the application

3. **Custom Domain (Optional)**
   - Add custom domain in Vercel settings
   - Update Firebase authorized domains

### Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Build and Deploy**
   ```bash
   npm run build
   firebase init hosting
   firebase deploy
   ```

## Security Considerations

1. **Firestore Rules**
   - Update Firestore security rules for production
   - Restrict access to user's own data only

2. **Environment Variables**
   - Never commit `.env.local` to version control
   - Use different Firebase projects for dev/prod

3. **Authentication**
   - Consider adding additional authentication providers
   - Implement proper error handling

## Support

If you encounter issues:
1. Check the browser console for errors
2. Review Firebase console logs
3. Create an issue in the repository
4. Contact support with detailed error information 