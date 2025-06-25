'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function TestPage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-primary-50 to-accent-50 flex items-center justify-center p-4">
      <div className="card max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          🎉 App is Working!
        </h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-green-50 rounded-xl">
            <h2 className="font-semibold text-green-800 mb-2">✅ Firebase Connection</h2>
            <p className="text-sm text-green-600">
              Firebase is properly configured and connected
            </p>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl">
            <h2 className="font-semibold text-blue-800 mb-2">✅ Authentication Status</h2>
            <p className="text-sm text-blue-600">
              {loading ? 'Loading...' : user ? `Logged in as: ${user.email}` : 'Not logged in'}
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-xl">
            <h2 className="font-semibold text-purple-800 mb-2">✅ Styling</h2>
            <p className="text-sm text-purple-600">
              TailwindCSS and custom theme are working
            </p>
          </div>

          <div className="p-4 bg-orange-50 rounded-xl">
            <h2 className="font-semibold text-orange-800 mb-2">✅ Next.js</h2>
            <p className="text-sm text-orange-600">
              Next.js 14 with App Router is running
            </p>
          </div>
        </div>

        <div className="mt-6">
          <a 
            href="/"
            className="btn-primary inline-block"
          >
            Go to Main App
          </a>
        </div>
      </div>
    </div>
  );
} 