import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Import the baseline Firebase configuration
// @ts-ignore
import baselineConfig from '../firebase-applet-config.json';

// Allow environment variables to override the config
const firebaseConfig = {
  ...baselineConfig,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || baselineConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || baselineConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || baselineConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || baselineConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || baselineConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || baselineConfig.appId,
};

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
