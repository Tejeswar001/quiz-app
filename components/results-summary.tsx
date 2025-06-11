"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { generatePDF } from "@/lib/pdf-generator"
import { saveQuizResult, updateUserStats } from "@/lib/quiz-storage"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Trophy, RotateCcw, Plus, Download, CheckCircle, XCircle, Save, Loader2 } from "lucide-react"
import { serverTimestamp } from "firebase/firestore"

interface ResultsSummaryProps {
  results: {
    questions: any[]
    answers: (number | null)[]
    score: number
    totalQuestions: number
    settings: any
  }
}

export function ResultsSummary({ results }: ResultsSummaryProps) {
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const percentage = Math.round((results.score / results.totalQuestions) * 100)

  useEffect(() => {
    // Auto-save quiz result when component mounts
    if (user && !saved) {
      handleSaveResult()
    }
  }, [user, saved])

  const getScoreColor = () => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreMessage = () => {
    if (percentage >= 90) return "Excellent! 🎉"
    if (percentage >= 80) return "Great job! 👏"
    if (percentage >= 70) return "Good work! 👍"
    if (percentage >= 60) return "Not bad! 📚"
    return "Keep studying! 💪"
  }

  const handleSaveResult = async () => {
    if (!user || saved) return

    setSaving(true)
    try {
      const quizResult = {
        userId: user.uid,
        title: `Quiz - ${new Date().toLocaleDateString()}`,
        content: results.settings.content.substring(0, 500) + "...",
        questions: results.questions,
        answers: results.answers,
        score: results.score,
        totalQuestions: results.totalQuestions,
        percentage,
        timePerQuestion: results.settings.timePerQuestion,
        showExplanations: results.settings.showExplanations,
        createdAt: serverTimestamp(),
        completedAt: serverTimestamp(),
      }

      await saveQuizResult(quizResult)
      await updateUserStats(user.uid, results.score)
      setSaved(true)

      toast({
        title: "Quiz saved!",
        description: "Your quiz result has been saved to your history.",
      })
    } catch (error) {
      console.error("Error saving quiz result:", error)
      toast({
        title: "Save failed",
        description: "Failed to save quiz result. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadPDF = async () => {
    setGenerating(true)
    try {
      await generatePDF(results)
    } catch (error) {
      console.error("PDF generation failed:", error)
      toast({
        title: "PDF generation failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleRetryQuiz = () => {
    router.push("/quiz")
  }

  const handleNewQuiz = () => {
    router.push("/dashboard")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Score Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Quiz Complete!</h1>
          <p className="text-xl text-muted-foreground">{getScoreMessage()}</p>
        </div>

        {/* Score Card */}
        <Card className="quiz-card mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Your Score</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className={`text-6xl font-bold mb-4 ${getScoreColor()}`}>{percentage}%</div>
            <p className="text-xl text-muted-foreground">
              {results.score} out of {results.totalQuestions} correct
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          {!saved && user && (
            <Button onClick={handleSaveResult} disabled={saving} variant="outline" className="flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Result
            </Button>
          )}
          <Button onClick={handleRetryQuiz} variant="outline" className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Retry Quiz
          </Button>
          <Button onClick={handleNewQuiz} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Generate New Quiz
          </Button>
          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            disabled={generating}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {generating ? "Generating PDF..." : "Download PDF"}
          </Button>
        </div>

        {/* Question Breakdown */}
        <Card className="quiz-card">
          <CardHeader>
            <CardTitle>Question Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.questions.map((question, index) => {
                const userAnswer = results.answers[index]
                const isCorrect = userAnswer === question.correctAnswer

                return (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-sm text-muted-foreground">Question {index + 1}</h3>
                      <Badge variant={isCorrect ? "default" : "destructive"} className="flex items-center gap-1">
                        {isCorrect ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {isCorrect ? "Correct" : "Incorrect"}
                      </Badge>
                    </div>

                    <p className="font-medium mb-3">{question.question}</p>

                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => {
                        let optionClass = "p-2 rounded border text-sm"

                        if (optionIndex === question.correctAnswer) {
                          optionClass +=
                            " bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200"
                        } else if (optionIndex === userAnswer && !isCorrect) {
                          optionClass +=
                            " bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200"
                        } else {
                          optionClass += " bg-muted"
                        }

                        return (
                          <div key={optionIndex} className={optionClass}>
                            <div className="flex items-center justify-between">
                              <span>{option}</span>
                              {optionIndex === question.correctAnswer && (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                              {optionIndex === userAnswer && !isCorrect && <XCircle className="w-4 h-4 text-red-600" />}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {results.settings.showExplanations && question.explanation && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Explanation:</strong> {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
