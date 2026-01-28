import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Khao San Cigarettes Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDBJmFUjvCCJvRU_JYQ5pIbqcF-QoTveEI",
  authDomain: "cigrettes-fe4dc.firebaseapp.com",
  projectId: "cigrettes-fe4dc",
  storageBucket: "cigrettes-fe4dc.firebasestorage.app",
  messagingSenderId: "884971707637",
  appId: "1:884971707637:web:046ac65f345e8f3887b9bc",
  measurementId: "G-61KR29HKNE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);