'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Utensils, User, TrendingUp, Sparkles, BookOpen } from 'lucide-react';
import ChatbotCoach from './ChatbotCoach';
import MealPlanner from './MealPlanner';
import ProfileEditor from './ProfileEditor';
import SeedCycling from './SeedCycling';
import ResearchSummary from './ResearchSummary';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserProfile {
  diagnosis?: string[];
  symptoms?: string[];
  age?: string;
  lastPeriod?: string;
  cycleLength?: number;
  irregularPeriods?: boolean;
  stressLevel?: string;
  sleepQuality?: string;
  periodDuration?: number;
  otherDiagnosis?: string;
  otherSymptoms?: string;
  name?: string;
  email?: string;
}

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const wellnessTips = [
    "🌙 Practice cycle syncing by aligning activities with your menstrual phases",
    "💧 Stay hydrated with 8-10 glasses of water daily for hormonal balance",
    "🧘 Try 10 minutes of meditation daily to reduce stress hormones",
    "🌱 Include seeds in your diet: chia, flax, pumpkin, sunflower, sesame",
    "🏃 Exercise regularly but listen to your body during different cycle phases",
    "💤 Prioritize 7-9 hours of quality sleep for hormone regulation",
    "🥗 Eat anti-inflammatory foods like turmeric, ginger, and leafy greens",
    "🌞 Get 15-20 minutes of morning sunlight for vitamin D and circadian rhythm",
    "🍵 Try herbal teas like chamomile for stress and peppermint for digestion",
    "📱 Limit screen time before bed to improve sleep quality",
    "🎯 Set realistic health goals and celebrate small wins",
    "🌿 Consider adaptogenic herbs like ashwagandha for stress support",
    "🥜 Include healthy fats from nuts, seeds, and avocados",
    "📊 Track your symptoms to identify patterns and triggers",
    "💝 Practice self-compassion and honor your body's needs"
  ];

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const getDailyTip = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return wellnessTips[dayOfYear % wellnessTips.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your personalized dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome to Auvra! 👋
          </h1>
          <p className="text-gray-600">
            Your personalized health journey continues
          </p>
        </div>

        {/* Daily Wellness Tip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-400 to-accent-400 rounded-2xl p-6 mb-8 text-white shadow-lg"
        >
          <div className="flex items-center space-x-3">
            <Sparkles className="w-6 h-6" />
            <div>
              <h3 className="font-semibold text-lg">Daily Wellness Tip</h3>
              <p className="text-primary-100">{getDailyTip()}</p>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center mb-8 space-x-2">
          {[
            { id: 'chat', label: 'Smart Coach', icon: MessageCircle },
            { id: 'meals', label: 'Smart Meal Prep', icon: Utensils },
            { id: 'profile', label: 'Profile', icon: User }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-primary-400 to-accent-400 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50 shadow-md'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Chatbot (2/3 width) */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-gradient-to-r from-primary-400 to-accent-400 p-2 rounded-full">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">Auvra - Smart Health Coach</h2>
                      <p className="text-sm text-gray-600">Your personalized wellness companion</p>
                    </div>
                  </div>
                  <ChatbotCoach userProfile={userProfile} />
                </div>
              </motion.div>
            </div>

            {/* Right Panel - Seed Cycling (1/3 width) */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <SeedCycling userProfile={userProfile} />
              </motion.div>
            </div>
          </div>
        )}

        {activeTab === 'meals' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="card"
          >
            <div className="flex flex-col items-center justify-center py-16">
              <div className="bg-gradient-to-r from-accent-400 to-primary-400 p-4 rounded-full mb-6">
                <Utensils className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Smart Meal Prep</h2>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                Our advanced AI meal planning system is coming soon! Get ready for personalized meal plans, 
                recipe suggestions, and smart grocery lists tailored to your cycle and health needs.
              </p>
              <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-6 border border-primary-100">
                <h3 className="font-semibold text-gray-800 mb-3">What's Coming:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <span className="text-primary-500 mr-2">✨</span>
                    AI-powered meal recommendations
                  </li>
                  <li className="flex items-center">
                    <span className="text-primary-500 mr-2">✨</span>
                    Cycle-synced recipe suggestions
                  </li>
                  <li className="flex items-center">
                    <span className="text-primary-500 mr-2">✨</span>
                    Smart grocery shopping lists
                  </li>
                  <li className="flex items-center">
                    <span className="text-primary-500 mr-2">✨</span>
                    Nutritional analysis and tracking
                  </li>
                  <li className="flex items-center">
                    <span className="text-primary-500 mr-2">✨</span>
                    Meal prep time optimization
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="card"
          >
            <ProfileEditor />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 