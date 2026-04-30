// Firebase Configuration — MySock Portal
const firebaseConfig = {
  apiKey: "AIzaSyCavv6fOrI2g2cZNDMpx3YzB0FeF8D-fYI",
  authDomain: "mysock-portal.firebaseapp.com",
  projectId: "mysock-portal",
  storageBucket: "mysock-portal.appspot.com",
  messagingSenderId: "YOUR_REAL_ID",
  appId: "YOUR_REAL_APP_ID"
};

// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, serverTimestamp, signInWithEmailAndPassword, signOut, onAuthStateChanged };
