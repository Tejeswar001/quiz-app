import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// Firebase configuration - Replace these empty strings with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCa8YwouOR0HXT3SmiraVVPrV4fIagr57U",
  authDomain: "quiz-8958b.firebaseapp.com",
  projectId: "quiz-8958b",
  storageBucket: "quiz-8958b.firebasestorage.app",
  messagingSenderId: "42383928765",
  appId: "1:42383928765:web:328bf9ba0661dbd6ae36d4",
  measurementId: "G-SQYWFYCJEK"
};


// Check if Firebase config is provided
const isConfigured = Object.values(firebaseConfig).every((value) => value !== "")

let app: any = null
let auth: any = null
let db: any = null

if (isConfigured) {
  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig)

    // Initialize Firebase Authentication and get a reference to the service
    auth = getAuth(app)

    // Initialize Cloud Firestore and get a reference to the service
    db = getFirestore(app)

    console.log("Firebase initialized successfully")
  } catch (error) {
    console.error("Firebase initialization error:", error)
  }
} else {
  console.warn("Firebase configuration is incomplete. Please add your Firebase config to lib/firebase.ts")
}

export { auth, db }
export default app
export { isConfigured }
