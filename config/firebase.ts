import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA8RGKyZAguOOV_sWT0eCgB9r9imT0Feig",
  authDomain: "macroviajes-app-de304.firebaseapp.com",
  projectId: "macroviajes-app-de304",
  storageBucket: "macroviajes-app-de304.firebasestorage.app",
  messagingSenderId: "355730791651",
  appId: "1:355730791651:web:f0bf6f6f6277a5fca979d6"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;