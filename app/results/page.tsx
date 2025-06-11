"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { ResultsSummary } from "@/components/results-summary"
import { useAuth } from "@/components/auth-provider"

export default function ResultsPage() {
  const [results, setResults] = useState(null)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    const savedResults = localStorage.getItem("quiz-results")
    if (!savedResults) {
      router.push("/dashboard")
      return
    }

    setResults(JSON.parse(savedResults))
  }, [user, router])

  if (!user || !results) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      <ResultsSummary results={results} />
    </div>
  )
}
