"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/components/auth-provider"
import { useTheme } from "next-themes"
import { useToast } from "@/hooks/use-toast"
import { getUserQuizHistory, deleteQuizResult } from "@/lib/quiz-storage"
import { User, Key, Palette, History, LogOut, Trash2 } from "lucide-react"

export function SettingsPanel() {
  const [apiKey, setApiKey] = useState("")
  const [quizHistory, setQuizHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const { user, userProfile, signOut, updateUserProfile } = useAuth()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const savedApiKey = localStorage.getItem("gemini-api-key")
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }
  }, [])

  useEffect(() => {
    if (user) {
      loadQuizHistory()
    }
  }, [user])

  const loadQuizHistory = async () => {
    if (!user) return

    try {
      const history = await getUserQuizHistory(user.uid, 20)
      setQuizHistory(history)
    } catch (error) {
      console.error("Error loading quiz history:", error)
    }
  }

  const handleSaveApiKey = () => {
    localStorage.setItem("gemini-api-key", apiKey)
    toast({
      title: "API key saved",
      description: "Your Gemini API key has been saved locally.",
    })
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      await deleteQuizResult(quizId)
      await loadQuizHistory() // Refresh the list
      toast({
        title: "Quiz deleted",
        description: "Quiz result has been removed from your history.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete quiz result.",
        variant: "destructive",
      })
    }
  }

  const clearLocalData = () => {
    localStorage.removeItem("quiz-results")
    localStorage.removeItem("quiz-settings")
    toast({
      title: "Local data cleared",
      description: "Your local quiz data has been cleared.",
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Settings
          </h1>
          <p className="text-lg text-muted-foreground">Manage your account and preferences</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Settings */}
          <Card className="quiz-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile
              </CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input value={userProfile?.displayName || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label>Quiz Count</Label>
                <Input value={userProfile?.quizCount || 0} disabled />
              </div>
              <Button variant="outline" onClick={handleSignOut} className="w-full">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>

          {/* API Key Settings */}
          <Card className="quiz-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Gemini API Key
              </CardTitle>
              <CardDescription>Your API key is stored locally and never sent to our servers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  placeholder="Enter your Gemini API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveApiKey} className="w-full">
                Save API Key
              </Button>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card className="quiz-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize your app appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Dark Mode</Label>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="quiz-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Data Management
              </CardTitle>
              <CardDescription>Manage your local data and quiz history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" onClick={clearLocalData} className="w-full">
                Clear Local Data
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quiz History */}
        <Card className="quiz-card mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Quiz History
            </CardTitle>
            <CardDescription>Your recent quiz results</CardDescription>
          </CardHeader>
          <CardContent>
            {quizHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No quiz history found</p>
            ) : (
              <div className="space-y-3">
                {quizHistory.map((quiz: any) => (
                  <div key={quiz.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{quiz.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Score: {quiz.score}/{quiz.totalQuestions} ({quiz.percentage}%)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {quiz.createdAt?.toDate?.()?.toLocaleDateString() || "Unknown date"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
