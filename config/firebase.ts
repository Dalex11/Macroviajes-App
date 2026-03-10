import Constants from 'expo-constants';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey ?? '',
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain ?? '',
  projectId: Constants.expoConfig?.extra?.firebaseProjectId ?? '',
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket ?? '',
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId ?? '',
  appId: Constants.expoConfig?.extra?.firebaseAppId ?? ''
};

console.log('Firebase Config:', firebaseConfig);
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;