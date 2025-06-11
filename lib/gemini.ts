import { generateText } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"

interface QuizSettings {
  content: string
  apiKey: string
  questionCount: number
  timePerQuestion: number
  showExplanations: boolean
}

interface Question {
  id: number
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

export async function testApiKey(apiKey: string): Promise<boolean> {
  // Validate API key format first
  if (!apiKey || !apiKey.trim()) {
    throw new Error("API key is required. Please enter your Gemini API key.")
  }

  // Basic format validation - Gemini API keys are typically long strings
  if (apiKey.trim().length < 10) {
    throw new Error("Invalid API key format. Gemini API keys are typically longer.")
  }

  try {
    console.log("Testing Gemini API key...")
    console.log("API Key format:", apiKey.substring(0, 5) + "..." + apiKey.substring(apiKey.length - 5))

    // Create the Google AI provider with the API key
    const google = createGoogleGenerativeAI({
      apiKey: apiKey.trim(),
    })

    // Create the model
    const model = google("gemini-1.5-flash")

    console.log("Sending test request to Gemini...")

    const { text } = await generateText({
      model,
      prompt: "Respond with exactly: 'API key is working correctly'",
      temperature: 0,
      maxTokens: 20,
    })

    console.log("Test response:", text)

    if (text && text.includes("API key is working")) {
      return true
    } else {
      throw new Error("Unexpected response from API")
    }
  } catch (error) {
    console.error("API key test error:", error)

    // Handle specific error types
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()

      // Check for common API key errors
      if (errorMessage.includes("api key") && (errorMessage.includes("missing") || errorMessage.includes("invalid"))) {
        throw new Error("Invalid or missing API key. Please check your Gemini API key.")
      }

      if (errorMessage.includes("authentication") || errorMessage.includes("unauthorized")) {
        throw new Error("Authentication failed. Please verify your API key is correct.")
      }

      if (errorMessage.includes("quota") || errorMessage.includes("limit")) {
        throw new Error("API quota exceeded. Please check your Google AI Studio usage.")
      }

      if (errorMessage.includes("billing")) {
        throw new Error("Billing issue. Please check your Google Cloud billing account.")
      }

      if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        throw new Error("Network error. Please check your internet connection.")
      }

      if (errorMessage.includes("model") || errorMessage.includes("not found")) {
        throw new Error("Model not available. Please check if Gemini 1.5 Flash is accessible with your API key.")
      }

      if (errorMessage.includes("400")) {
        throw new Error("Bad request. Please check your API key format and try again.")
      }

      if (errorMessage.includes("403")) {
        throw new Error("Access forbidden. Please check your API key permissions.")
      }

      if (errorMessage.includes("429")) {
        throw new Error("Rate limit exceeded. Please wait a moment and try again.")
      }

      // Return a more user-friendly version of the original error
      throw new Error(`API Error: ${error.message}`)
    }

    // If it's not an Error instance, wrap it
    throw new Error("Unknown error occurred while testing API key")
  }
}

export async function generateQuizQuestions(settings: QuizSettings): Promise<Question[]> {
  const { content, apiKey, questionCount, showExplanations } = settings

  // Validate inputs
  if (!content.trim()) {
    throw new Error("Content is required to generate questions")
  }

  if (!apiKey.trim()) {
    throw new Error("Gemini API key is required")
  }

  if (questionCount < 1 || questionCount > 60) {
    throw new Error("Question count must be between 1 and 60")
  }

  console.log("Starting quiz generation...")
  console.log("Content length:", content.length)
  console.log("Question count:", questionCount)

  // Test API key first
  try {
    await testApiKey(apiKey)
    console.log("API key test passed, proceeding with question generation...")
  } catch (error) {
    console.error("API key test failed:", error)
    throw error
  }

  // Enhanced prompt for better question generation
  const prompt = `You are an expert quiz generator. Create exactly ${questionCount} high-quality multiple-choice questions based on the provided content.

CONTENT TO ANALYZE:
"""
${content}
"""

REQUIREMENTS:
1. Generate exactly ${questionCount} questions
2. Each question must have exactly 4 options (A, B, C, D)
3. Only ONE option should be correct
4. Questions should test comprehension, analysis, and application of the content
5. Vary difficulty levels (easy, medium, hard)
6. Make distractors (wrong answers) plausible but clearly incorrect
7. Questions should be clear, concise, and unambiguous
8. Cover different aspects of the content
${showExplanations ? "9. Provide a clear, educational explanation for each correct answer" : ""}

OUTPUT FORMAT:
Return ONLY a valid JSON array with this exact structure:

[
  {
    "question": "Clear, specific question text ending with a question mark?",
    "options": [
      "Option A text",
      "Option B text", 
      "Option C text",
      "Option D text"
    ],
    "correctAnswer": 0${showExplanations ? ',\n    "explanation": "Clear explanation of why this answer is correct"' : ""}
  }
]

IMPORTANT:
- correctAnswer must be 0, 1, 2, or 3 (corresponding to array index)
- Do not include any text before or after the JSON array
- Ensure all JSON is properly formatted and escaped
- Questions must be directly related to the provided content
- Avoid questions that require external knowledge not in the content`

  try {
    console.log("Generating questions with Gemini API...")

    // Create the Google AI provider with the API key
    const google = createGoogleGenerativeAI({
      apiKey: apiKey.trim(),
    })

    // Create the model
    const model = google("gemini-1.5-flash")

    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.3,
      maxTokens: 4000,
    })

    console.log("Raw Gemini response length:", text.length)
    console.log("Raw Gemini response preview:", text.substring(0, 200) + "...")

    // Clean the response - remove any markdown formatting or extra text
    let cleanedText = text.trim()

    // Remove markdown code blocks if present
    cleanedText = cleanedText.replace(/```json\s*/g, "").replace(/```\s*/g, "")

    // Find the JSON array in the response
    const jsonStart = cleanedText.indexOf("[")
    const jsonEnd = cleanedText.lastIndexOf("]") + 1

    if (jsonStart === -1 || jsonEnd === 0) {
      console.error("No JSON array found in response:", cleanedText)
      throw new Error("No valid JSON array found in response")
    }

    const jsonText = cleanedText.substring(jsonStart, jsonEnd)
    console.log("Extracted JSON length:", jsonText.length)

    // Parse the JSON response
    let questionsData: any[]
    try {
      questionsData = JSON.parse(jsonText)
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError)
      console.error("JSON text that failed to parse:", jsonText)
      throw new Error("Invalid JSON format in API response")
    }

    // Validate the response structure
    if (!Array.isArray(questionsData)) {
      throw new Error("Response is not an array")
    }

    if (questionsData.length === 0) {
      throw new Error("No questions generated")
    }

    // Validate and format each question
    const validatedQuestions: Question[] = []

    for (let i = 0; i < questionsData.length; i++) {
      const q = questionsData[i]

      // Validate question structure
      if (!q.question || typeof q.question !== "string") {
        console.warn(`Question ${i + 1}: Invalid question text`)
        continue
      }

      if (!Array.isArray(q.options) || q.options.length !== 4) {
        console.warn(`Question ${i + 1}: Invalid options array`)
        continue
      }

      if (typeof q.correctAnswer !== "number" || q.correctAnswer < 0 || q.correctAnswer > 3) {
        console.warn(`Question ${i + 1}: Invalid correct answer index`)
        continue
      }

      // Validate all options are strings
      const validOptions = q.options.every((opt: any) => typeof opt === "string" && opt.trim().length > 0)
      if (!validOptions) {
        console.warn(`Question ${i + 1}: Invalid option format`)
        continue
      }

      // Create validated question object
      const validatedQuestion: Question = {
        id: validatedQuestions.length + 1,
        question: q.question.trim(),
        options: q.options.map((opt: string) => opt.trim()),
        correctAnswer: q.correctAnswer,
      }

      // Add explanation if required and present
      if (showExplanations && q.explanation && typeof q.explanation === "string") {
        validatedQuestion.explanation = q.explanation.trim()
      }

      validatedQuestions.push(validatedQuestion)
    }

    // Check if we have enough valid questions
    if (validatedQuestions.length === 0) {
      throw new Error("No valid questions could be generated from the API response")
    }

    // If we have fewer questions than requested, log a warning
    if (validatedQuestions.length < questionCount) {
      console.warn(`Only ${validatedQuestions.length} valid questions generated out of ${questionCount} requested`)
    }

    // Return the requested number of questions (or all if fewer)
    const finalQuestions = validatedQuestions.slice(0, questionCount)

    console.log(`Successfully generated ${finalQuestions.length} questions`)
    return finalQuestions
  } catch (error) {
    console.error("Error generating questions with Gemini:", error)

    // Provide more specific error messages
    if (error instanceof Error) {
      if (
        error.message.includes("API key") ||
        error.message.includes("authentication") ||
        error.message.includes("unauthorized")
      ) {
        throw new Error("Invalid Gemini API key. Please verify your API key in Google AI Studio.")
      }
      if (error.message.includes("quota") || error.message.includes("limit") || error.message.includes("billing")) {
        throw new Error("API quota exceeded. Please check your Gemini API usage in Google AI Studio.")
      }
      if (
        error.message.includes("network") ||
        error.message.includes("fetch") ||
        error.message.includes("connection")
      ) {
        throw new Error("Network error. Please check your internet connection and try again.")
      }
      if (error.message.includes("model") || error.message.includes("not found")) {
        throw new Error("Gemini model not accessible. Please check your API key permissions.")
      }
    }

    // Re-throw the original error for debugging
    throw error
  }
}
