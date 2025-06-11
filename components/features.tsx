import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Zap, BarChart3, Download, Shield, Smartphone } from "lucide-react"

export function Features() {
  const features = [
    {
      icon: FileText,
      title: "Custom Content",
      description: "Paste any text content - notes, textbooks, articles - and generate relevant MCQs instantly.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Generate 5-60 questions in seconds with our optimized AI processing.",
    },
    {
      icon: BarChart3,
      title: "Performance Tracking",
      description: "Real-time analytics, detailed breakdowns, and progress monitoring.",
    },
    {
      icon: Download,
      title: "PDF Export",
      description: "Download your quizzes and answer keys as professional PDFs.",
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your API keys and content stay local - we never store your data.",
    },
    {
      icon: Smartphone,
      title: "Mobile Ready",
      description: "Fully responsive design works perfectly on all devices.",
    },
  ]

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Everything You Need for
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {" "}
              Smart Learning
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to make studying more effective and engaging
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="quiz-card group">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
