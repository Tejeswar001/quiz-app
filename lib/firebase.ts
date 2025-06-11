import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// Firebase configuration - Replace these empty strings with your actual Firebase config
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
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
