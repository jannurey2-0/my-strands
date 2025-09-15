import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Link, useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Circle,
  BookOpen,
  Heart,
  Briefcase,
  GraduationCap
} from "lucide-react";

interface Question {
  id: number;
  category: string;
  question: string;
  options: string[];
  selectedAnswer?: number;
}

const Assessment = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const questions: Question[] = [
    {
      id: 1,
      category: "Interests",
      question: "Which subject do you find most engaging?",
      options: [
        "Mathematics and Sciences",
        "Business and Economics", 
        "Literature and Social Studies",
        "Arts and Creative Expression"
      ]
    },
    {
      id: 2,
      category: "Interests", 
      question: "What type of activities do you enjoy most?",
      options: [
        "Conducting experiments and solving complex problems",
        "Managing projects and working with numbers",
        "Reading, writing, and analyzing human behavior",
        "Creating art, music, or performing"
      ]
    },
    {
      id: 3,
      category: "Aptitudes",
      question: "Which skill comes most naturally to you?",
      options: [
        "Logical reasoning and critical thinking",
        "Leadership and communication",
        "Research and analytical writing",
        "Creative problem-solving"
      ]
    },
    {
      id: 4,
      category: "Aptitudes",
      question: "In group projects, you typically:",
      options: [
        "Focus on research and technical aspects",
        "Take charge and organize the team",
        "Analyze information and provide insights",
        "Contribute creative ideas and design"
      ]
    },
    {
      id: 5,
      category: "Career Goals",
      question: "Your ideal future career involves:",
      options: [
        "Technology, healthcare, or engineering",
        "Business management or entrepreneurship",
        "Education, psychology, or social work",
        "Entertainment, design, or creative industries"
      ]
    },
    {
      id: 6,
      category: "Academic Performance",
      question: "Which subjects do you consistently perform best in?",
      options: [
        "Math, Science, and Technology",
        "Economics, Statistics, and Business",
        "English, History, and Social Sciences",
        "Arts, Music, and Creative Writing"
      ]
    }
  ];

  const totalQuestions = questions.length;
  const progress = ((currentStep + 1) / totalQuestions) * 100;
  const currentQuestion = questions[currentStep];

  const handleAnswerSelect = (optionIndex: number) => {
    setAnswers({ ...answers, [currentQuestion.id]: optionIndex });
  };

  const handleNext = () => {
    if (currentStep < totalQuestions - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Assessment complete, navigate to results
      navigate("/results");
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Interests":
        return <Heart className="h-5 w-5" />;
      case "Aptitudes":
        return <BookOpen className="h-5 w-5" />;
      case "Career Goals":
        return <Briefcase className="h-5 w-5" />;
      case "Academic Performance":
        return <GraduationCap className="h-5 w-5" />;
      default:
        return <Circle className="h-5 w-5" />;
    }
  };

  const isAnswered = answers[currentQuestion.id] !== undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link to="/dashboard" className="flex items-center text-primary hover:text-primary/80">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
            <Badge variant="outline">
              Question {currentStep + 1} of {totalQuestions}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Assessment Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Question Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center space-x-2 mb-2">
              <div className="text-primary">
                {getCategoryIcon(currentQuestion.category)}
              </div>
              <Badge variant="secondary">{currentQuestion.category}</Badge>
            </div>
            <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
            <CardDescription>
              Select the option that best describes you or your preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full p-4 text-left rounded-lg border transition-all hover:shadow-md ${
                    answers[currentQuestion.id] === index
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border bg-card hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      answers[currentQuestion.id] === index
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    }`}>
                      {answers[currentQuestion.id] === index && (
                        <CheckCircle className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex space-x-2">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index === currentStep
                    ? 'bg-primary'
                    : index < currentStep
                    ? 'bg-success'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>

          <Button
            variant={isAnswered ? "hero" : "outline"}
            onClick={handleNext}
            disabled={!isAnswered}
          >
            {currentStep === totalQuestions - 1 ? "Get Results" : "Next"}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Take your time to think about each question. You can always go back to change your answers.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Assessment;