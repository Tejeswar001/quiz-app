"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { isConfigured } from "@/lib/firebase"

// Mock user interface for when Firebase is not configured
interface MockUser {
  uid: string
  email: string
  displayName?: string
}

interface UserProfile {
  uid: string
  email: string
  displayName?: string
  createdAt?: any
  lastLoginAt?: any
  quizCount?: number
  totalScore?: number
}

interface AuthContextType {
  user: MockUser | null
  userProfile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName?: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (isConfigured) {
          await initializeFirebaseAuth()
        } else {
          initializeMockAuth()
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
        // Fallback to mock auth if Firebase fails
        initializeMockAuth()
      } finally {
        setInitialized(true)
      }
    }

    initializeAuth()
  }, [])

  const createBasicProfile = (firebaseUser: any): UserProfile => {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || "",
      displayName: firebaseUser.displayName || "",
      quizCount: 0,
      totalScore: 0,
    }
  }

  const initializeFirebaseAuth = async () => {
    try {
      const { onAuthStateChanged } = await import("firebase/auth")
      const { auth } = await import("@/lib/firebase")

      if (!auth) {
        throw new Error("Firebase auth not properly initialized")
      }

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            const mockUser: MockUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "",
            }
            setUser(mockUser)

            // Try to fetch user profile from Firestore, but don't fail if it doesn't work
            try {
              const { doc, getDoc, setDoc, serverTimestamp } = await import("firebase/firestore")
              const { db } = await import("@/lib/firebase")

              if (db) {
                const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
                if (userDoc.exists()) {
                  setUserProfile(userDoc.data() as UserProfile)
                } else {
                  // Try to create user profile, but don't fail if permissions don't allow it
                  try {
                    const newProfile: UserProfile = {
                      uid: firebaseUser.uid,
                      email: firebaseUser.email || "",
                      displayName: firebaseUser.displayName || "",
                      createdAt: serverTimestamp(),
                      lastLoginAt: serverTimestamp(),
                      quizCount: 0,
                      totalScore: 0,
                    }
                    await setDoc(doc(db, "users", firebaseUser.uid), newProfile)
                    setUserProfile(newProfile)
                  } catch (firestoreError) {
                    console.warn("Could not create user profile in Firestore:", firestoreError)
                    // Use basic profile without Firestore
                    setUserProfile(createBasicProfile(firebaseUser))
                  }
                }
              } else {
                // No Firestore connection, use basic profile
                setUserProfile(createBasicProfile(firebaseUser))
              }
            } catch (firestoreError) {
              console.warn("Firestore operation failed, using basic profile:", firestoreError)
              // Create a basic profile if Firestore fails
              setUserProfile(createBasicProfile(firebaseUser))
            }
          } else {
            setUser(null)
            setUserProfile(null)
          }
        } catch (error) {
          console.error("Error in auth state change:", error)
          // If there's an error but we have a Firebase user, create a basic profile
          if (firebaseUser) {
            const mockUser: MockUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "",
            }
            setUser(mockUser)
            setUserProfile(createBasicProfile(firebaseUser))
          }
        } finally {
          setLoading(false)
        }
      })

      return () => unsubscribe()
    } catch (error) {
      console.error("Firebase auth initialization error:", error)
      throw error
    }
  }

  const initializeMockAuth = () => {
    try {
      // Check for existing mock session
      const savedUser = localStorage.getItem("mock-user")
      if (savedUser) {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setUserProfile({
          ...userData,
          quizCount: 0,
          totalScore: 0,
        })
      }
    } catch (error) {
      console.error("Error loading mock user:", error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    if (isConfigured) {
      try {
        const { signInWithEmailAndPassword } = await import("firebase/auth")
        const { auth } = await import("@/lib/firebase")

        if (!auth) {
          throw new Error("Firebase not properly initialized")
        }

        const result = await signInWithEmailAndPassword(auth, email, password)

        // Try to update last login time, but don't fail if it doesn't work
        if (result.user) {
          try {
            const { setDoc, doc, serverTimestamp } = await import("firebase/firestore")
            const { db } = await import("@/lib/firebase")

            if (db) {
              await setDoc(doc(db, "users", result.user.uid), { lastLoginAt: serverTimestamp() }, { merge: true })
            }
          } catch (firestoreError) {
            console.warn("Could not update last login time:", firestoreError)
            // Continue without failing - this is not critical
          }
        }
      } catch (error) {
        console.error("Sign in error:", error)
        throw error
      }
    } else {
      // Mock sign in - simulate validation
      if (!email || !password) {
        throw new Error("Email and password are required")
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters")
      }

      // Check if user exists in mock storage
      const existingUsers = JSON.parse(localStorage.getItem("mock-users") || "[]")
      const existingUser = existingUsers.find((u: any) => u.email === email)

      if (!existingUser) {
        const error = new Error("No account found with this email address")
        ;(error as any).code = "auth/user-not-found"
        throw error
      }

      const mockUser: MockUser = {
        uid: existingUser.uid,
        email: existingUser.email,
        displayName: existingUser.displayName,
      }

      setUser(mockUser)
      setUserProfile({
        ...mockUser,
        quizCount: 0,
        totalScore: 0,
      })
      localStorage.setItem("mock-user", JSON.stringify(mockUser))
    }
  }

  const signUp = async (email: string, password: string, displayName?: string) => {
    if (isConfigured) {
      try {
        const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth")
        const { auth } = await import("@/lib/firebase")

        if (!auth) {
          throw new Error("Firebase not properly initialized")
        }

        const result = await createUserWithEmailAndPassword(auth, email, password)

        // Update user profile with display name
        if (displayName && result.user) {
          try {
            await updateProfile(result.user, { displayName })
          } catch (error) {
            console.warn("Error updating Firebase profile:", error)
          }
        }

        // Try to create user document in Firestore, but don't fail if it doesn't work
        if (result.user) {
          try {
            const { setDoc, doc, serverTimestamp } = await import("firebase/firestore")
            const { db } = await import("@/lib/firebase")

            if (db) {
              const userProfile: UserProfile = {
                uid: result.user.uid,
                email: result.user.email || "",
                displayName: displayName || "",
                createdAt: serverTimestamp(),
                lastLoginAt: serverTimestamp(),
                quizCount: 0,
                totalScore: 0,
              }
              await setDoc(doc(db, "users", result.user.uid), userProfile)
            }
          } catch (firestoreError) {
            console.warn("Could not create user profile in Firestore:", firestoreError)
            // Continue without failing - the auth state change handler will create a basic profile
          }
        }
      } catch (error) {
        console.error("Sign up error:", error)
        throw error
      }
    } else {
      // Mock sign up - simulate validation
      if (!email || !password) {
        throw new Error("Email and password are required")
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters")
      }

      // Check if user already exists in mock storage
      const existingUsers = JSON.parse(localStorage.getItem("mock-users") || "[]")
      if (existingUsers.find((u: any) => u.email === email)) {
        const error = new Error("An account with this email already exists")
        ;(error as any).code = "auth/email-already-in-use"
        throw error
      }

      const mockUser: MockUser = {
        uid: "mock-" + Date.now(),
        email,
        displayName: displayName || email.split("@")[0],
      }

      // Save to mock users list
      existingUsers.push(mockUser)
      localStorage.setItem("mock-users", JSON.stringify(existingUsers))

      setUser(mockUser)
      setUserProfile({
        ...mockUser,
        quizCount: 0,
        totalScore: 0,
      })
      localStorage.setItem("mock-user", JSON.stringify(mockUser))
    }
  }

  const signOut = async () => {
    if (isConfigured) {
      try {
        const { signOut: firebaseSignOut } = await import("firebase/auth")
        const { auth } = await import("@/lib/firebase")

        if (auth) {
          await firebaseSignOut(auth)
        }
      } catch (error) {
        console.error("Sign out error:", error)
        throw error
      }
    } else {
      // Mock sign out
      setUser(null)
      setUserProfile(null)
      localStorage.removeItem("mock-user")
    }
  }

  const resetPassword = async (email: string) => {
    if (isConfigured) {
      try {
        const { sendPasswordResetEmail } = await import("firebase/auth")
        const { auth } = await import("@/lib/firebase")

        if (!auth) {
          throw new Error("Firebase not properly initialized")
        }

        await sendPasswordResetEmail(auth, email)
      } catch (error) {
        console.error("Password reset error:", error)
        throw error
      }
    } else {
      // Mock password reset - just simulate success
      if (!email) {
        throw new Error("Email is required")
      }

      // Check if user exists in mock storage
      const existingUsers = JSON.parse(localStorage.getItem("mock-users") || "[]")
      if (!existingUsers.find((u: any) => u.email === email)) {
        const error = new Error("No account found with this email address")
        ;(error as any).code = "auth/user-not-found"
        throw error
      }

      console.log("Mock password reset for:", email)
    }
  }

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error("No user logged in")

    if (isConfigured) {
      try {
        const { setDoc, doc } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase")

        if (db) {
          await setDoc(doc(db, "users", user.uid), data, { merge: true })
        }

        // Update local state
        setUserProfile((prev) => (prev ? { ...prev, ...data } : null))
      } catch (error) {
        console.warn("Could not update user profile in Firestore:", error)
        // Update local state even if Firestore fails
        setUserProfile((prev) => (prev ? { ...prev, ...data } : null))
      }
    } else {
      // Mock update
      setUserProfile((prev) => (prev ? { ...prev, ...data } : null))

      // Update localStorage
      const updatedUser = { ...user, ...data }
      localStorage.setItem("mock-user", JSON.stringify(updatedUser))
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUserProfile,
  }

  // Don't render children until auth is initialized
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
