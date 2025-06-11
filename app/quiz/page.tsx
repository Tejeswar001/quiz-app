"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { QuizInterface } from "@/components/quiz-interface"
import { useAuth } from "@/components/auth-provider"
import { generateQuizQuestions } from "@/lib/gemini"
import { Loader2 } from "lucide-react"

export default function QuizPage() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    const loadQuiz = async () => {
      try {
        const settings = localStorage.getItem("quiz-settings")
        if (!settings) {
          router.push("/dashboard")
          return
        }

        const quizSettings = JSON.parse(settings)

        // Validate settings
        if (!quizSettings.content || !quizSettings.apiKey) {
          setError("Missing content or API key. Please return to dashboard and try again.")
          return
        }

        console.log("Starting quiz generation with settings:", {
          contentLength: quizSettings.content.length,
          questionCount: quizSettings.questionCount,
          showExplanations: quizSettings.showExplanations,
        })

        const generatedQuestions = await generateQuizQuestions(quizSettings)

        if (generatedQuestions.length === 0) {
          setError("No questions could be generated. Please try with different content.")
          return
        }

        console.log(`Successfully loaded ${generatedQuestions.length} questions`)
        setQuestions(generatedQuestions)
      } catch (error) {
        console.error("Quiz generation error:", error)

        let errorMessage = "Failed to generate quiz questions"
        if (error instanceof Error) {
          errorMessage = error.message
        }

        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadQuiz()
  }, [user, router])

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">Generating Your Quiz</h2>
            <p className="text-muted-foreground">AI is crafting personalized questions from your content...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2 text-red-600">Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      <QuizInterface questions={questions} />
    </div>
  )
}
