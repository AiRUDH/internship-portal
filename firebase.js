// Firebase Configuration — MySock Portal
const firebaseConfig = {
  apiKey: "AIzaSyAh9o8METVWB67-sHXFFXFwDpFI6O5BEmw",
  authDomain: "mysock-portal.firebaseapp.com",
  projectId: "mysock-portal",
  storageBucket: "mysock-portal.appspot.com",
  messagingSenderId: "313284569809",
  appId: "1:313284569809:web:cd12daf2c89dbc077f33f0"
};

// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, serverTimestamp, signInWithEmailAndPassword, signOut, onAuthStateChanged };
