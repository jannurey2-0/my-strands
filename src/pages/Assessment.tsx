import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Link, useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  ChevronRight, 
  User, 
  GraduationCap, 
  Heart, 
  Gamepad2, 
  Brain,
  CheckCircle,
  Circle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Philippine regions data
const PHILIPPINE_REGIONS = [
  "National Capital Region (NCR)",
  "Cordillera Administrative Region (CAR)",
  "Ilocos Region (Region I)",
  "Cagayan Valley (Region II)",
  "Central Luzon (Region III)",
  "CALABARZON (Region IV-A)",
  "MIMAROPA (Region IV-B)",
  "Bicol Region (Region V)",
  "Western Visayas (Region VI)",
  "Central Visayas (Region VII)",
  "Eastern Visayas (Region VIII)",
  "Northern Mindanao (Region X)",
  "Davao Region (Region XI)",
  "SOCCSKSARGEN (Region XII)",
  "Caraga (Region XIII)",
  "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)",
  "Eastern Visayas (Region VIII)"
];

// Hobbies data
const HOBBIES = [
  "Reading", "Writing", "Drawing/Painting", "Photography", "Music", 
  "Dancing", "Cooking", "Gardening", "Sports", "Video Games",
  "Traveling", "Crafting", "Collecting", "Fishing", "Camping",
  "Coding", "Volunteering", "Meditation", "Yoga", "Board Games"
];

// Interests data
const INTERESTS = [
  "Science and Technology", 
  "Business and Finance", 
  "Arts and Design", 
  "Humanities and Social Sciences", 
  "Sports", 
  "Technical Vocational Work"
];

// Aptitude test questions
const APTITUDE_QUESTIONS = [
  {
    id: 1,
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
    question: "Which subjects do you consistently perform best in?",
    options: [
      "Math, Science, and Technology",
      "Economics, Statistics, and Business",
      "English, History, and Social Sciences",
      "Arts, Music, and Creative Writing"
    ]
  }
];

const Assessment = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form data state
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    fullName: "",
    age: "",
    gender: "",
    school: "",
    region: "",
    email: "",
    
    // Step 2: Academic Profile
    gwa: "",
    favoriteSubject: "",
    leastFavoriteSubject: "",
    
    // Step 3: Personal Interests
    interests: [] as string[],
    
    // Step 4: Hobbies
    hobbies: [] as string[],
    
    // Step 5: Mini Aptitude Test
    aptitudeAnswers: {} as Record<number, number>
  });

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle checkbox changes for interests
  const handleInterestChange = (interest: string, checked: boolean) => {
    setFormData(prev => {
      const interests = checked 
        ? [...prev.interests, interest] 
        : prev.interests.filter(i => i !== interest);
      
      // Limit to 3 selections
      if (interests.length > 3) return prev;
      
      return { ...prev, interests };
    });
  };

  // Handle checkbox changes for hobbies
  const handleHobbyChange = (hobby: string, checked: boolean) => {
    setFormData(prev => {
      const hobbies = checked 
        ? [...prev.hobbies, hobby] 
        : prev.hobbies.filter(h => h !== hobby);
      
      // Limit to 5 selections
      if (hobbies.length > 5) return prev;
      
      return { ...prev, hobbies };
    });
  };

  // Handle aptitude test answers
  const handleAptitudeAnswer = (questionId: number, optionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      aptitudeAnswers: { ...prev.aptitudeAnswers, [questionId]: optionIndex }
    }));
  };

  // Navigation functions
  const handleNext = () => {
    if (currentStep < 4) {
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

  // Validation functions
  const isStep1Valid = () => {
    return formData.fullName && formData.age && formData.gender && 
           formData.school && formData.region && formData.email;
  };

  const isStep2Valid = () => {
    return formData.gwa && formData.favoriteSubject && formData.leastFavoriteSubject;
  };

  const isStep3Valid = () => {
    return formData.interests.length > 0;
  };

  const isStep4Valid = () => {
    return formData.hobbies.length > 0;
  };

  const isStep5Valid = () => {
    return Object.keys(formData.aptitudeAnswers).length === APTITUDE_QUESTIONS.length;
  };

  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 0: return isStep1Valid();
      case 1: return isStep2Valid();
      case 2: return isStep3Valid();
      case 3: return isStep4Valid();
      case 4: return isStep5Valid();
      default: return false;
    }
  };

  // Get step title and description
  const getStepInfo = (step: number) => {
    switch (step) {
      case 0:
        return { 
          title: "Basic Information", 
          description: "Tell us about yourself",
          icon: <User className="h-5 w-5" />
        };
      case 1:
        return { 
          title: "Academic Profile", 
          description: "Share your academic information",
          icon: <GraduationCap className="h-5 w-5" />
        };
      case 2:
        return { 
          title: "Personal Interests", 
          description: "Select up to 3 areas that interest you",
          icon: <Heart className="h-5 w-5" />
        };
      case 3:
        return { 
          title: "Hobbies", 
          description: "Select up to 5 hobbies you enjoy",
          icon: <Gamepad2 className="h-5 w-5" />
        };
      case 4:
        return { 
          title: "Mini Aptitude Test", 
          description: "Answer the following questions",
          icon: <Brain className="h-5 w-5" />
        };
      default:
        return { title: "", description: "", icon: <Circle className="h-5 w-5" /> };
    }
  };

  // Render current step content
  const renderStepContent = () => {
    const stepInfo = getStepInfo(currentStep);
    
    switch (currentStep) {
      case 0: // Basic Information
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  placeholder="Enter your age"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Gender *</Label>
              <RadioGroup 
                value={formData.gender} 
                onValueChange={(value) => handleInputChange("gender", value)}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="prefer-not-to-say" id="prefer-not-to-say" />
                  <Label htmlFor="prefer-not-to-say">Prefer not to say</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="school">Current School *</Label>
              <Input
                id="school"
                value={formData.school}
                onChange={(e) => handleInputChange("school", e.target.value)}
                placeholder="Enter your current school"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="region">Region *</Label>
              <Select 
                value={formData.region} 
                onValueChange={(value) => handleInputChange("region", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your region" />
                </SelectTrigger>
                <SelectContent>
                  {PHILIPPINE_REGIONS.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter your email"
              />
            </div>
          </div>
        );
        
      case 1: // Academic Profile
        return (
          <div className="space-y-8">
            <div className="space-y-2">
              <Label>General Weighted Average (GWA) *</Label>
              <Input
                type="number"
                step="0.01"
                min="1.00"
                max="5.00"
                value={formData.gwa}
                onChange={(e) => handleInputChange("gwa", e.target.value)}
                placeholder="Enter your GWA (e.g., 1.25)"
              />
              <p className="text-sm text-muted-foreground">
                Please enter your latest GWA (1.00 is the highest, 5.00 is the lowest)
              </p>
            </div>
            
            <div className="space-y-4">
              <Label>Favorite Subject *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "Mathematics",
                  "Science",
                  "English",
                  "Filipino",
                  "Araling Panlipunan",
                  "MAPEH",
                  "TLE",
                  "Computer Science",
                  "Business Math",
                  "Statistics",
                  "Research",
                  "Creative Writing",
                  "Art",
                  "Music"
                ].map((subject) => (
                  <div 
                    key={`favorite-${subject}`}
                    onClick={() => {
                      // If this subject was previously selected as least favorite, clear it
                      if (formData.leastFavoriteSubject === subject) {
                        setFormData(prev => ({ ...prev, favoriteSubject: subject, leastFavoriteSubject: "" }));
                      } else {
                        setFormData(prev => ({ ...prev, favoriteSubject: subject }));
                      }
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      formData.favoriteSubject === subject
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                        : formData.leastFavoriteSubject === subject
                        ? 'opacity-50 cursor-not-allowed'
                        : 'border-border bg-card hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border ${
                        formData.favoriteSubject === subject
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      }`}>
                        {formData.favoriteSubject === subject && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                        )}
                      </div>
                      <span className="text-sm font-medium">{subject}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <Label>Least Favorite Subject *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "Mathematics",
                  "Science",
                  "English",
                  "Filipino",
                  "Araling Panlipunan",
                  "MAPEH",
                  "TLE",
                  "Computer Science",
                  "Business Math",
                  "Statistics",
                  "Research",
                  "Creative Writing",
                  "Art",
                  "Music"
                ].map((subject) => (
                  <div 
                    key={`least-${subject}`}
                    onClick={() => {
                      // If this subject was previously selected as favorite, clear it
                      if (formData.favoriteSubject === subject) {
                        setFormData(prev => ({ ...prev, leastFavoriteSubject: subject, favoriteSubject: "" }));
                      } else {
                        setFormData(prev => ({ ...prev, leastFavoriteSubject: subject }));
                      }
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      formData.leastFavoriteSubject === subject
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                        : formData.favoriteSubject === subject
                        ? 'opacity-50 cursor-not-allowed'
                        : 'border-border bg-card hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border ${
                        formData.leastFavoriteSubject === subject
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      }`}>
                        {formData.leastFavoriteSubject === subject && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                        )}
                      </div>
                      <span className="text-sm font-medium">{subject}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 2: // Personal Interests
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select up to 3 areas that interest you most:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {INTERESTS.map((interest) => (
                <div 
                  key={interest} 
                  className={`flex items-center space-x-3 p-4 rounded-lg border ${
                    formData.interests.includes(interest)
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card'
                  }`}
                >
                  <Checkbox
                    id={interest}
                    checked={formData.interests.includes(interest)}
                    onCheckedChange={(checked) => handleInterestChange(interest, !!checked)}
                  />
                  <Label 
                    htmlFor={interest} 
                    className="font-medium cursor-pointer flex-1"
                  >
                    {interest}
                  </Label>
                </div>
              ))}
            </div>
            {formData.interests.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Selected: {formData.interests.length} of 3
              </p>
            )}
          </div>
        );
        
      case 3: // Hobbies
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select up to 5 hobbies you enjoy:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {HOBBIES.map((hobby) => (
                <div 
                  key={hobby} 
                  className={`flex items-center space-x-3 p-4 rounded-lg border ${
                    formData.hobbies.includes(hobby)
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card'
                  }`}
                >
                  <Checkbox
                    id={hobby}
                    checked={formData.hobbies.includes(hobby)}
                    onCheckedChange={(checked) => handleHobbyChange(hobby, !!checked)}
                  />
                  <Label 
                    htmlFor={hobby} 
                    className="font-medium cursor-pointer flex-1"
                  >
                    {hobby}
                  </Label>
                </div>
              ))}
            </div>
            {formData.hobbies.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Selected: {formData.hobbies.length} of 5
              </p>
            )}
          </div>
        );
        
      case 4: // Mini Aptitude Test
        return (
          <div className="space-y-8">
            {APTITUDE_QUESTIONS.map((question, index) => {
              const isAnswered = formData.aptitudeAnswers[question.id] !== undefined;
              
              return (
                <div key={question.id} className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">Q{index + 1}</Badge>
                    <h3 className="font-medium">{question.question}</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {question.options.map((option, optionIndex) => (
                      <button
                        key={optionIndex}
                        onClick={() => handleAptitudeAnswer(question.id, optionIndex)}
                        className={`w-full p-4 text-left rounded-lg border transition-all hover:shadow-md ${
                          formData.aptitudeAnswers[question.id] === optionIndex
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border bg-card hover:bg-accent/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            formData.aptitudeAnswers[question.id] === optionIndex
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground'
                          }`}>
                            {formData.aptitudeAnswers[question.id] === optionIndex && (
                              <CheckCircle className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <span className="text-sm font-medium">{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
        
      default:
        return null;
    }
  };

  // Get step progress percentage
  const getProgressPercentage = () => {
    return ((currentStep + 1) / 5) * 100;
  };

  const stepInfo = getStepInfo(currentStep);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Link to="/dashboard" className="flex items-center text-primary hover:text-primary/80">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Link>
              <Badge variant="outline">
                Step {currentStep + 1} of 5
              </Badge>
            </div>
            
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Assessment Progress</span>
                <span>{Math.round(getProgressPercentage())}%</span>
              </div>
              <Progress value={getProgressPercentage()} className="h-2" />
            </div>
            
            {/* Step titles */}
            <div className="flex justify-between mt-6">
              {[0, 1, 2, 3, 4].map((step) => {
                const info = getStepInfo(step);
                const isActive = step === currentStep;
                const isCompleted = step < currentStep;
                
                return (
                  <div key={step} className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : isCompleted 
                          ? 'bg-success text-success-foreground'
                          : 'bg-muted text-muted-foreground'
                    }`}>
                      {info.icon}
                    </div>
                    <span className={`text-xs text-center ${
                      isActive ? 'font-medium text-primary' : 'text-muted-foreground'
                    }`}>
                      {info.title.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content Card */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center space-x-2 mb-2">
                <div className="text-primary">
                  {stepInfo.icon}
                </div>
                <div>
                  <CardTitle className="text-xl">{stepInfo.title}</CardTitle>
                  <CardDescription>
                    {stepInfo.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {renderStepContent()}
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
              {[0, 1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full ${
                    step === currentStep
                      ? 'bg-primary'
                      : step < currentStep
                      ? 'bg-success'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            <Button
              variant={isCurrentStepValid() ? "hero" : "outline"}
              onClick={handleNext}
              disabled={!isCurrentStepValid()}
            >
              {currentStep === 4 ? "Get Results" : "Next"}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Help Text */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Take your time to think about each question. You can always go back to change your answers.
            </p>
          </div>
        </div>
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Assessment;