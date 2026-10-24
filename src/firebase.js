import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase web configuration identifies the public client application; it is
// intentionally not a secret. Environment values take precedence, while the
// defaults keep static hosts such as Vercel functional after deployment.
const hostedDefaults = {
  apiKey: 'AIzaSyBZ6X0VEPeA1cRFqFc6mcRR4qgH6hKuaOo',
  authDomain: 'hcm-lite-cff96.firebaseapp.com',
  projectId: 'hcm-lite-cff96',
  storageBucket: 'hcm-lite-cff96.firebasestorage.app',
  messagingSenderId: '175133697594',
  appId: '1:175133697594:web:8a7bfbf039c08020073703',
};

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || hostedDefaults.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || hostedDefaults.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || hostedDefaults.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || hostedDefaults.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || hostedDefaults.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || hostedDefaults.appId,
};

export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);
const app = firebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const functions = app ? getFunctions(app, 'us-central1') : null;

if (app && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}

// A named Auth instance lets an Admin provision another user's credentials
// without replacing the Admin's own browser session.
export function provisioningAuth() {
  if (!firebaseConfigured) return null;
  const named = getApps().some(item => item.name === 'hcm-provisioner') ? getApp('hcm-provisioner') : initializeApp(firebaseConfig, 'hcm-provisioner');
  const instance = getAuth(named);
  if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') connectAuthEmulator(instance, 'http://127.0.0.1:9099', { disableWarnings: true });
  return instance;
}
