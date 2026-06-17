import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCzH-ezTBLLveQ74yMjQ08o3cxSH0kMK8Q",
  authDomain: "kntl-66c8b.firebaseapp.com",
  projectId: "kntl-66c8b",
  storageBucket: "kntl-66c8b.firebasestorage.app",
  messagingSenderId: "743340298541",
  appId: "1:743340298541:web:f028783ef7965c0a31c3a4",
  measurementId: "G-43NMW32L11"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore
export const db = getFirestore(app);
