# Women's Health Companion

A comprehensive full-stack web application designed to support women with hormonal health conditions like PCOS, PCOD, Endometriosis, and Thyroid. The app provides personalized health coaching, AI-powered meal planning, and cycle tracking features.

## 🌟 Features

### 🔐 Authentication
- **Firebase Authentication** with email/password
- **Forgot Password** functionality with email reset
- **User Registration** with profile creation
- **Secure Session Management**

### 📝 Onboarding Experience
- **Multi-step Form** with progress tracking
- **Personalized Questions** about:
  - Age group selection
  - Health conditions (PCOS, PCOD, Endometriosis, Thyroid)
  - Symptoms and concerns
  - Menstrual cycle information
  - Stress levels and sleep quality
- **Animated Success Message** with profile saving confirmation

### 🤖 AI Health Coach
- **Personalized Chatbot** with deep knowledge of women's health
- **Condition-Specific Advice** for PCOS, Thyroid, Endometriosis
- **Diet Recommendations** with dos and don'ts
- **Stress Management** techniques
- **Sleep Improvement** tips
- **Exercise Guidance** tailored to hormonal conditions
- **Cycle Syncing** advice for irregular periods

### 🍽️ AI Meal Planner
- **Cycle-Phase Based** meal suggestions
- **4 Cuisine Options**: Indian, Mediterranean, Asian, Continental
- **Nutritional Information** for each meal
- **Preparation Time** and difficulty indicators
- **Dietary Tags** for easy filtering
- **Personalized Recommendations** based on user profile

### 🎨 Design & UX
- **Pinkish Violet Theme** - soft, feminine, and calming
- **Responsive Design** - mobile-friendly interface
- **Smooth Animations** using Framer Motion
- **Modern UI** inspired by wellness apps like Flo and Clue
- **Accessible Design** with proper contrast and navigation

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Beautiful icon library

### Backend & Services
- **Firebase Authentication** - User management
- **Firestore Database** - User profiles and data storage
- **React Hook Form** - Form handling and validation
- **React DatePicker** - Date selection components

### Styling & Design
- **Custom Tailwind Theme** with women's health color palette
- **Google Fonts** (Poppins, Inter) - Typography
- **Responsive Grid Layout** - Adaptive design
- **Gradient Backgrounds** - Visual appeal

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project setup

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd womens-health-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a new Firebase project
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Get your Firebase configuration

4. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 App Structure

```
├── app/
│   ├── globals.css          # Global styles and Tailwind imports
│   ├── layout.tsx           # Root layout with providers
│   └── page.tsx             # Main page with routing logic
├── components/
│   ├── AuthPage.tsx         # Authentication forms
│   ├── Onboarding.tsx       # Multi-step onboarding
│   ├── Dashboard.tsx        # Main dashboard layout
│   ├── ChatbotCoach.tsx     # AI health coach
│   └── MealPlanner.tsx      # AI meal planner
├── contexts/
│   └── AuthContext.tsx      # Firebase auth context
├── lib/
│   └── firebase.ts          # Firebase configuration
└── public/                  # Static assets
```

## 🎯 Key Features Explained

### Authentication Flow
1. **Sign Up**: Users create accounts with email/password
2. **Onboarding**: Multi-step form to collect health information
3. **Dashboard**: Personalized experience based on profile data

### Health Coach AI
- **Context-Aware**: Remembers user's health conditions
- **Personalized Responses**: Tailored advice based on diagnosis
- **Comprehensive Knowledge**: Covers diet, exercise, stress, sleep
- **Emotional Support**: Warm, sisterly tone

### Meal Planning
- **Cycle-Aware**: Suggests meals based on menstrual phase
- **Condition-Specific**: Adapts to PCOS, Thyroid, etc.
- **Cuisine Variety**: 4 different cuisine options
- **Nutritional Info**: Detailed macros and preparation time

## 🎨 Design System

### Color Palette
- **Primary**: `#C084FC` (Violet)
- **Accent**: `#F9A8D4` (Pink)
- **Background**: Light lavender gradients
- **Text**: Gray scale for readability

### Typography
- **Primary Font**: Poppins (Headings)
- **Secondary Font**: Inter (Body text)
- **Weights**: 300, 400, 500, 600, 700

### Components
- **Cards**: Rounded corners with subtle shadows
- **Buttons**: Gradient backgrounds with hover effects
- **Forms**: Clean inputs with focus states
- **Animations**: Smooth transitions and micro-interactions

## 🔧 Customization

### Adding New Health Conditions
1. Update the `diagnoses` array in `Onboarding.tsx`
2. Add condition-specific logic in `ChatbotCoach.tsx`
3. Include relevant meal suggestions in `MealPlanner.tsx`

### Styling Changes
1. Modify `tailwind.config.js` for theme changes
2. Update `globals.css` for custom component styles
3. Adjust color variables in the config file

### Adding New Features
1. Create new components in the `components/` directory
2. Update routing logic in `app/page.tsx`
3. Add necessary TypeScript interfaces

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Netlify**: Similar to Vercel setup
- **Firebase Hosting**: Direct integration with Firebase
- **AWS Amplify**: Full-stack deployment option

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Firebase** for backend services
- **TailwindCSS** for styling framework
- **Framer Motion** for animations
- **Lucide** for beautiful icons
- **Women's Health Community** for inspiration and feedback

## 📞 Support

For support, email support@womenshealthcompanion.com or create an issue in the repository.

---

**Built with ❤️ for women's health and wellness** 