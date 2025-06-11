"use client"

import { isConfigured } from "@/lib/firebase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Info } from "lucide-react"

export function FirebaseStatus() {
  if (isConfigured) {
    return (
      <Alert className="mb-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <strong>Firebase Mode:</strong> Authentication is working with Firebase. If you see Firestore permission
          errors, the app will continue to work with basic profiles. To enable full data persistence, configure your
          Firestore security rules.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="mb-4 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800 dark:text-yellow-200">
        <strong>Mock Mode:</strong> Using local authentication for demo purposes. Add your Firebase config to{" "}
        <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">lib/firebase.ts</code> to enable real
        authentication and cloud data persistence.
      </AlertDescription>
    </Alert>
  )
}
