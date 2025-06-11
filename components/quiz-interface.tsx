"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Clock, CheckCircle, XCircle } from "lucide-react"

interface Question {
  id: number
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

interface QuizInterfaceProps {
  questions: Question[]
}

export function QuizInterface({ questions }: QuizInterfaceProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null))
  const [timeLeft, setTimeLeft] = useState(30)
  const [showFeedback, setShowFeedback] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)

  const router = useRouter()

  // Get quiz settings
  const quizSettings = JSON.parse(localStorage.getItem("quiz-settings") || "{}")
  const timePerQuestion = quizSettings.timePerQuestion || 30
  const showExplanations = quizSettings.showExplanations || false

  useEffect(() => {
    setTimeLeft(timePerQuestion)
  }, [currentQuestion, timePerQuestion])

  useEffect(() => {
    if (timeLeft > 0 && !showFeedback) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !showFeedback) {
      handleSubmitAnswer()
    }
  }, [timeLeft, showFeedback])

  const handleAnswerSelect = (answerIndex: number) => {
    if (!showFeedback) {
      setSelectedAnswer(answerIndex)
    }
  }

  const handleSubmitAnswer = () => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = selectedAnswer
    setAnswers(newAnswers)
    setShowFeedback(true)
  }

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowFeedback(false)
    } else {
      // Quiz completed
      const results = {
        questions,
        answers,
        score: answers.reduce((score, answer, index) => {
          return score + (answer === questions[index].correctAnswer ? 1 : 0)
        }, 0),
        totalQuestions: questions.length,
        settings: quizSettings,
      }

      localStorage.setItem("quiz-results", JSON.stringify(results))
      router.push("/results")
    }
  }

  const currentQ = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">
              Question {currentQuestion + 1} of {questions.length}
            </h1>
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Clock className="w-5 h-5" />
              {timeLeft}s
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="quiz-card mb-8">
          <CardHeader>
            <CardTitle className="text-xl leading-relaxed">{currentQ.question}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentQ.options.map((option, index) => {
                let buttonClass = "quiz-option"

                if (showFeedback) {
                  if (index === currentQ.correctAnswer) {
                    buttonClass += " correct"
                  } else if (index === selectedAnswer && index !== currentQ.correctAnswer) {
                    buttonClass += " incorrect"
                  }
                } else if (selectedAnswer === index) {
                  buttonClass += " selected"
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={buttonClass}
                    disabled={showFeedback}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {showFeedback && index === currentQ.correctAnswer && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {showFeedback && index === selectedAnswer && index !== currentQ.correctAnswer && (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Explanation */}
            {showFeedback && showExplanations && currentQ.explanation && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Explanation:</h4>
                <p className="text-blue-800 dark:text-blue-200">{currentQ.explanation}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedAnswer !== null ? "Answer selected" : "Select an answer"}
              </div>

              {showFeedback ? (
                <Button onClick={handleNextQuestion}>
                  {currentQuestion < questions.length - 1 ? "Next Question" : "View Results"}
                </Button>
              ) : (
                <Button onClick={handleSubmitAnswer} disabled={selectedAnswer === null}>
                  Submit Answer
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
