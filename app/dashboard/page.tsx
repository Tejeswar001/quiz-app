"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { testApiKey } from "@/lib/gemini"
import { Loader2, Sparkles, Clock, HelpCircle, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function DashboardPage() {
  const [content, setContent] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [questionCount, setQuestionCount] = useState("10")
  const [timePerQuestion, setTimePerQuestion] = useState("30")
  const [customTime, setCustomTime] = useState("")
  const [showExplanations, setShowExplanations] = useState(true)
  const [loading, setLoading] = useState(false)
  const [testingApiKey, setTestingApiKey] = useState(false)
  const [apiKeyStatus, setApiKeyStatus] = useState<"untested" | "valid" | "invalid">("untested")
  const [apiKeyError, setApiKeyError] = useState<string | null>(null)

  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
    }
  }, [user, router])

  useEffect(() => {
    // Load saved API key from localStorage
    const savedApiKey = localStorage.getItem("gemini-api-key")
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }
  }, [])

  const handleTestApiKey = async () => {
    // Clear previous error
    setApiKeyError(null)

    if (!apiKey.trim()) {
      setApiKeyStatus("invalid")
      setApiKeyError("API key is required. Please enter your Gemini API key.")
      toast({
        title: "API key required",
        description: "Please enter your Gemini API key first.",
        variant: "destructive",
      })
      return
    }

    setTestingApiKey(true)
    setApiKeyStatus("untested")

    try {
      console.log("Testing API key:", apiKey.substring(0, 5) + "...")
      await testApiKey(apiKey.trim())

      setApiKeyStatus("valid")
      setApiKeyError(null)
      toast({
        title: "API key is valid!",
        description: "Your Gemini API key is working correctly.",
      })

      // Save the valid API key
      localStorage.setItem("gemini-api-key", apiKey.trim())
    } catch (error) {
      console.error("API key test failed:", error)
      setApiKeyStatus("invalid")

      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setApiKeyError(errorMessage)

      toast({
        title: "API key test failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setTestingApiKey(false)
    }
  }

  const handleGenerateQuiz = async () => {
    // Enhanced validation
    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please paste your content to generate questions from.",
        variant: "destructive",
      })
      return
    }

    if (content.trim().length < 100) {
      toast({
        title: "Content too short",
        description: "Please provide at least 100 characters of content for better question generation.",
        variant: "destructive",
      })
      return
    }

    if (!apiKey.trim()) {
      toast({
        title: "API key required",
        description: "Please enter your Gemini API key to generate questions.",
        variant: "destructive",
      })
      return
    }

    if (apiKeyStatus !== "valid") {
      toast({
        title: "Please test your API key first",
        description: "Click 'Test API Key' to verify your key works before generating questions.",
        variant: "destructive",
      })
      return
    }

    if (timePerQuestion === "custom" && (!customTime || Number.parseInt(customTime) < 5)) {
      toast({
        title: "Invalid time setting",
        description: "Custom time must be at least 5 seconds.",
        variant: "destructive",
      })
      return
    }

    const quizSettings = {
      content: content.trim(),
      apiKey: apiKey.trim(),
      questionCount: Number.parseInt(questionCount),
      timePerQuestion: timePerQuestion === "custom" ? Number.parseInt(customTime) : Number.parseInt(timePerQuestion),
      showExplanations,
    }

    // Save quiz settings to localStorage for the quiz page
    localStorage.setItem("quiz-settings", JSON.stringify(quizSettings))

    setLoading(true)

    try {
      toast({
        title: "Generating quiz...",
        description: "Please wait while we create your personalized questions.",
      })

      router.push("/quiz")
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Failed to generate quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Create Your Quiz
            </h1>
            <p className="text-lg text-muted-foreground">
              Transform your content into engaging multiple-choice questions
            </p>
          </div>

          {/* API Key Information Alert */}
          <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>API Key Required:</strong> This app uses the Google Gemini API to generate quiz questions. You
              need to{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                get your own API key from Google AI Studio
              </a>
              . Your key is stored locally in your browser and never sent to our servers.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Content Input */}
            <Card className="quiz-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Your Content
                </CardTitle>
                <CardDescription>
                  Paste your notes, textbook content, or any material you want to create questions from
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Paste your content here... (e.g., lecture notes, textbook chapters, study materials)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[200px] resize-none"
                />
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>{content.length} characters</p>
                  {content.length > 0 && content.length < 100 && (
                    <p className="text-yellow-600">
                      Tip: Add more content (at least 100 characters) for better question generation
                    </p>
                  )}
                  {content.length >= 100 && (
                    <p className="text-green-600">✓ Good amount of content for question generation</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <div className="space-y-6">
              {/* API Key */}
              <Card className="quiz-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Gemini API Key
                  </CardTitle>
                  <CardDescription>Your API key is stored locally and never sent to our servers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="Enter your Gemini API key"
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value)
                        setApiKeyStatus("untested")
                        setApiKeyError(null)
                      }}
                    />
                    {apiKeyStatus === "valid" && (
                      <div className="flex items-center gap-2 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        API key is valid
                      </div>
                    )}
                    {apiKeyStatus === "invalid" && (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                          <XCircle className="w-4 h-4" />
                          API key is invalid
                        </div>
                        {apiKeyError && <p className="text-xs text-red-600 mt-1">{apiKeyError}</p>}
                      </div>
                    )}
                  </div>
                  <Button onClick={handleTestApiKey} disabled={testingApiKey} variant="outline" className="w-full">
                    {testingApiKey && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Test API Key
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Don't have an API key?{" "}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Get one from Google AI Studio
                    </a>
                  </p>
                </CardContent>
              </Card>

              {/* Quiz Settings */}
              <Card className="quiz-card">
                <CardHeader>
                  <CardTitle>Quiz Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Number of Questions</Label>
                    <Select value={questionCount} onValueChange={setQuestionCount}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 Questions</SelectItem>
                        <SelectItem value="10">10 Questions</SelectItem>
                        <SelectItem value="20">20 Questions</SelectItem>
                        <SelectItem value="30">30 Questions</SelectItem>
                        <SelectItem value="60">60 Questions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Time per Question
                    </Label>
                    <Select value={timePerQuestion} onValueChange={setTimePerQuestion}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 seconds</SelectItem>
                        <SelectItem value="15">15 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">60 seconds</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    {timePerQuestion === "custom" && (
                      <Input
                        type="number"
                        placeholder="Enter seconds"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        min="5"
                        max="300"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" />
                      Show Explanations
                    </Label>
                    <Switch checked={showExplanations} onCheckedChange={setShowExplanations} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Button
              onClick={handleGenerateQuiz}
              disabled={loading || apiKeyStatus !== "valid"}
              size="lg"
              className="px-8 py-3 text-lg"
            >
              {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              Generate Quiz
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
