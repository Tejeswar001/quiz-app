import { isConfigured } from "@/lib/firebase"

export interface QuizResult {
  id?: string
  userId: string
  title: string
  content: string
  questions: any[]
  answers: (number | null)[]
  score: number
  totalQuestions: number
  percentage: number
  timePerQuestion: number
  showExplanations: boolean
  createdAt: any
  completedAt: any
}

export interface QuizHistory {
  id?: string
  userId: string
  title: string
  score: number
  totalQuestions: number
  percentage: number
  createdAt: any
}

export const saveQuizResult = async (result: Omit<QuizResult, "id">): Promise<string> => {
  if (isConfigured) {
    try {
      const { collection, addDoc } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase")

      if (!db) {
        throw new Error("Firestore not available")
      }

      const docRef = await addDoc(collection(db, "quizResults"), result)
      return docRef.id
    } catch (error) {
      console.warn("Could not save to Firestore, using localStorage:", error)
      // Fallback to localStorage
      return saveToLocalStorage(result)
    }
  } else {
    // Mock save to localStorage
    return saveToLocalStorage(result)
  }
}

const saveToLocalStorage = (result: Omit<QuizResult, "id">): string => {
  const mockId = Date.now().toString()
  const savedResults = JSON.parse(localStorage.getItem("mock-quiz-results") || "[]")
  savedResults.push({ ...result, id: mockId })
  localStorage.setItem("mock-quiz-results", JSON.stringify(savedResults))
  return mockId
}

export const getUserQuizHistory = async (userId: string, limitCount = 10): Promise<QuizHistory[]> => {
  if (isConfigured) {
    try {
      const { collection, getDocs, query, where, orderBy, limit } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase")

      if (!db) {
        throw new Error("Firestore not available")
      }

      const q = query(
        collection(db, "quizResults"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(limitCount),
      )

      const querySnapshot = await getDocs(q)
      const history: QuizHistory[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        history.push({
          id: doc.id,
          userId: data.userId,
          title: data.title,
          score: data.score,
          totalQuestions: data.totalQuestions,
          percentage: data.percentage,
          createdAt: data.createdAt,
        })
      })

      return history
    } catch (error) {
      console.warn("Could not fetch from Firestore, using localStorage:", error)
      // Fallback to localStorage
      return getFromLocalStorage(userId, limitCount)
    }
  } else {
    // Mock fetch from localStorage
    return getFromLocalStorage(userId, limitCount)
  }
}

const getFromLocalStorage = (userId: string, limitCount: number): QuizHistory[] => {
  const savedResults = JSON.parse(localStorage.getItem("mock-quiz-results") || "[]")
  return savedResults
    .filter((result: any) => result.userId === userId)
    .slice(0, limitCount)
    .map((result: any) => ({
      id: result.id,
      userId: result.userId,
      title: result.title,
      score: result.score,
      totalQuestions: result.totalQuestions,
      percentage: result.percentage,
      createdAt: result.createdAt,
    }))
}

export const getQuizResult = async (quizId: string): Promise<QuizResult | null> => {
  if (isConfigured) {
    try {
      const { doc, getDoc } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase")

      if (!db) {
        throw new Error("Firestore not available")
      }

      const docRef = doc(db, "quizResults", quizId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as QuizResult
      } else {
        return null
      }
    } catch (error) {
      console.warn("Could not fetch from Firestore, using localStorage:", error)
      // Fallback to localStorage
      const savedResults = JSON.parse(localStorage.getItem("mock-quiz-results") || "[]")
      return savedResults.find((result: any) => result.id === quizId) || null
    }
  } else {
    // Mock fetch from localStorage
    const savedResults = JSON.parse(localStorage.getItem("mock-quiz-results") || "[]")
    return savedResults.find((result: any) => result.id === quizId) || null
  }
}

export const deleteQuizResult = async (quizId: string): Promise<void> => {
  if (isConfigured) {
    try {
      const { deleteDoc, doc } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase")

      if (!db) {
        throw new Error("Firestore not available")
      }

      await deleteDoc(doc(db, "quizResults", quizId))
    } catch (error) {
      console.warn("Could not delete from Firestore, using localStorage:", error)
      // Fallback to localStorage
      const savedResults = JSON.parse(localStorage.getItem("mock-quiz-results") || "[]")
      const filteredResults = savedResults.filter((result: any) => result.id !== quizId)
      localStorage.setItem("mock-quiz-results", JSON.stringify(filteredResults))
    }
  } else {
    // Mock delete from localStorage
    const savedResults = JSON.parse(localStorage.getItem("mock-quiz-results") || "[]")
    const filteredResults = savedResults.filter((result: any) => result.id !== quizId)
    localStorage.setItem("mock-quiz-results", JSON.stringify(filteredResults))
  }
}

export const updateUserStats = async (userId: string, score: number): Promise<void> => {
  if (isConfigured) {
    try {
      const { updateDoc, doc, increment, serverTimestamp } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase")

      if (!db) {
        throw new Error("Firestore not available")
      }

      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, {
        quizCount: increment(1),
        totalScore: increment(score),
        lastQuizAt: serverTimestamp(),
      })
    } catch (error) {
      console.warn("Could not update user stats in Firestore:", error)
      // Continue without failing - this is not critical
    }
  } else {
    // Mock update - no action needed for localStorage
    console.log("Mock user stats update for:", userId, "score:", score)
  }
}
