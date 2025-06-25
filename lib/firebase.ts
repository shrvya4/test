import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBqxCjmeZxQhcbIpfsDUbDcm-F4eRuL4kM",
  authDomain: "test-9db5c.firebaseapp.com",
  projectId: "test-9db5c",
  storageBucket: "test-9db5c.firebasestorage.app",
  messagingSenderId: "867386064629",
  appId: "1:867386064629:web:d36346ead8340d2e700fbc",
  measurementId: "G-4ZSW82QH8V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app; 