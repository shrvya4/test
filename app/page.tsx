'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Dashboard from '@/components/Dashboard';
import Onboarding from '@/components/Onboarding';
import AuthPage from '@/components/AuthPage';
import { motion } from 'framer-motion';
import { LogOut, User, Settings } from 'lucide-react';

export default function Home() {
  const { user, logout } = useAuth();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserProfile();
  }, [user]);

  const checkUserProfile = async () => {
    if (!user) {
      setHasProfile(false);
      setLoading(false);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      setHasProfile(userDoc.exists());
    } catch (error) {
      console.error('Error checking user profile:', error);
      setHasProfile(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lavender-50 to-primary-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your personalized experience...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (!hasProfile) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 to-primary-50">
      {/* Header with Logout */}
      <header className="bg-white shadow-sm border-b border-lavender-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-primary-400 to-accent-400 p-2 rounded-full">
                <User className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">
                Women's Health Companion
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <Dashboard />
    </div>
  );
} 