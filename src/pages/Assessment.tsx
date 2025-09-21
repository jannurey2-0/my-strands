import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { MaintenancePage } from "@/components/MaintenancePage";
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
  Circle,
  Zap,
  Target,
  Award,
  BookOpen,
  Star
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { assessmentService, AssessmentData } from "@/integrations/supabase/assessmentService";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import ErrorBoundary from "@/components/ErrorBoundary";

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
  "Zamboanga Peninsula (Region IX)",
  "Northern Mindanao (Region X)",
  "Davao Region (Region XI)",
  "SOCCSKSARGEN (Region XII)",
  "Caraga (Region XIII)",
  "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)"
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

// Subject options
const SUBJECT_OPTIONS = [
  "Mathematics", "Science", "English", "Araling Panlipunan", "Computer Science",
  "Business Math", "Economics", "Accounting", "Entrepreneurship", "Literature",
  "History", "Philosophy", "Physics", "Chemistry", "Other"
];

// Aptitude questions will be loaded from the database
interface AptitudeQuestionFromDB {
  id: string;
  question: string;
  options: string | string[] | null; // stored as JSON string or array
  correct_answer?: number | null;
  category?: string | null;
  difficulty_level?: number | null;
  type?: 'multiple_choice' | 'true_false' | 'essay' | 'identification' | null;
}

const Assessment = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aptitudeQuestions, setAptitudeQuestions] = useState<AptitudeQuestionFromDB[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [maintenance, setMaintenance] = useState<{ isUnderMaintenance: boolean; message: string } | null>(null);
  
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
    aptitudeAnswers: {} as Record<string, number | string>
  });

  // Check maintenance status on component mount
  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      try {
        const status = await assessmentService.isPageUnderMaintenance('assessment');
        setMaintenance({
          isUnderMaintenance: status.isUnderMaintenance,
          message: status.maintenanceMessage
        });
      } catch (err) {
        console.error('Error checking maintenance status:', err);
        // Default to not under maintenance if there's an error
        setMaintenance({ isUnderMaintenance: false, message: 'Currently Under Development' });
      }
    };

    checkMaintenanceStatus();
  }, []);

  // Load aptitude questions when user reaches the aptitude test step
  useEffect(() => {
    // Don't load questions if page is under maintenance
    if (maintenance?.isUnderMaintenance) {
      return;
    }

    const fetchAptitudeQuestions = async () => {
      if (currentStep === 4 && aptitudeQuestions.length === 0 && !loadingQuestions) {
        setLoadingQuestions(true);
        try {
          const questions = await assessmentService.getAptitudeQuestions();
          setAptitudeQuestions(questions);
        } catch (error) {
          console.error('Error fetching aptitude questions:', error);
          toast({
            title: "Error Loading Questions",
            description: "Failed to load aptitude questions. Please try again.",
            variant: "destructive"
          });
        } finally {
          setLoadingQuestions(false);
        }
      }
    };

    fetchAptitudeQuestions();
  }, [currentStep, aptitudeQuestions.length, loadingQuestions, toast, maintenance?.isUnderMaintenance]);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('assessmentFormData', JSON.stringify(formData));
    localStorage.setItem('assessmentCurrentStep', currentStep.toString());
  }, [formData, currentStep]);

  // Load saved form data from localStorage on component mount
  useEffect(() => {
    // Don't load saved data if page is under maintenance
    if (maintenance?.isUnderMaintenance) {
      return;
    }

    const savedFormData = localStorage.getItem('assessmentFormData');
    const savedCurrentStep = localStorage.getItem('assessmentCurrentStep');
    
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        // Merge saved data with default structure to ensure all fields exist
        // Process aptitude answers to ensure numeric values are properly handled
        const processedAptitudeAnswers: Record<string, number | string> = {};
        if (parsedData.aptitudeAnswers) {
          Object.keys(parsedData.aptitudeAnswers).forEach(key => {
            const answer = parsedData.aptitudeAnswers[key];
            // Convert string numbers back to numbers for consistency
            processedAptitudeAnswers[key] = typeof answer === 'string' && !isNaN(parseInt(answer)) 
              ? parseInt(answer) 
              : answer;
          });
        }
        
        setFormData(prev => ({
          ...prev,
          ...parsedData,
          interests: Array.isArray(parsedData.interests) ? parsedData.interests : [],
          hobbies: Array.isArray(parsedData.hobbies) ? parsedData.hobbies : [],
          aptitudeAnswers: processedAptitudeAnswers
        }));
      } catch (e) {
        console.error('Failed to parse saved form data:', e);
      }
    }
    
    if (savedCurrentStep) {
      const step = parseInt(savedCurrentStep, 10);
      if (!isNaN(step) && step >= 0 && step <= 5) {
        setCurrentStep(step);
      }
    }
  }, [maintenance?.isUnderMaintenance]);

  // Clear saved data after successful submission
  const clearSavedData = () => {
    localStorage.removeItem('assessmentFormData');
    localStorage.removeItem('assessmentCurrentStep');
  };

  // Initialize form with user profile data
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        fullName: profile.full_name || "",
        email: profile.email || ""
      }));
    }
  }, [profile]);

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle checkbox changes for interests
  const handleInterestChange = (interest: string, checked: boolean) => {
    setFormData(prev => {
      let interests = [...prev.interests];
      
      if (checked) {
        // Add interest only if it's not already in the list and we're under the limit
        if (!interests.includes(interest) && interests.length < 3) {
          interests = [...interests, interest];
        }
      } else {
        // Remove interest from the list
        interests = interests.filter(i => i !== interest);
      }
      
      return { ...prev, interests };
    });
  };

  // Handle checkbox changes for hobbies
  const handleHobbyChange = (hobby: string, checked: boolean) => {
    setFormData(prev => {
      let hobbies = [...prev.hobbies];
      
      if (checked) {
        // Add hobby only if it's not already in the list and we're under the limit
        if (!hobbies.includes(hobby) && hobbies.length < 5) {
          hobbies = [...hobbies, hobby];
        }
      } else {
        // Remove hobby from the list
        hobbies = hobbies.filter(h => h !== hobby);
      }
      
      return { ...prev, hobbies };
    });
  };

  // Handle aptitude test answers (supports numeric choices or free text)
  const handleAptitudeAnswer = (questionId: string, answer: number | string) => {
    // Ensure numeric values are stored as numbers for consistency
    const processedAnswer = typeof answer === 'string' && !isNaN(parseInt(answer)) 
      ? parseInt(answer) 
      : answer;
      
    setFormData(prev => ({
      ...prev,
      aptitudeAnswers: { ...prev.aptitudeAnswers, [questionId]: processedAnswer }
    }));
  };

  // Navigation functions
  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      // Assessment complete, submit the form
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Submit the assessment
  const handleSubmit = async () => {
    if (!user || !profile) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to submit the assessment.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    // Set a timeout to ensure we don't get stuck
    const timeoutId = setTimeout(() => {
      if (isSubmitting) {
        setIsSubmitting(false);
        toast({
          title: "Submission Timeout",
          description: "The submission is taking longer than expected. Please try again.",
          variant: "destructive"
        });
      }
    }, 30000); // 30 second timeout

    try {
      // Prepare data for submission
      const assessmentData: AssessmentData = {
        basicInfo: {
          fullName: formData.fullName,
          age: formData.age,
          gender: formData.gender,
          school: formData.school,
          region: formData.region,
          email: formData.email
        },
        academicProfile: {
          gwa: formData.gwa,
          favoriteSubject: formData.favoriteSubject,
          leastFavoriteSubject: formData.leastFavoriteSubject
        },
        personalInterests: formData.interests,
        hobbies: formData.hobbies,
        aptitudeAnswers: formData.aptitudeAnswers
      };

      // Submit to Supabase
      const result = await assessmentService.submitAssessment(assessmentData, profile.id);
      
      if (result.success) {
        clearTimeout(timeoutId);
        setIsSubmitting(false);
        
        // Clear saved data on successful submission
        clearSavedData();
        
        toast({
          title: "Assessment Submitted!",
          description: "Your assessment has been successfully submitted. You'll be redirected to your results shortly.",
        });
        
        // Redirect to results page after a short delay
        setTimeout(() => {
          navigate("/results");
        }, 2000);
      } else {
        throw new Error("Submission failed");
      }
    } catch (error) {
      clearTimeout(timeoutId);
      setIsSubmitting(false);
      
      console.error("Error submitting assessment:", error);
      
      toast({
        title: "Submission Error",
        description: error instanceof Error ? error.message : "Failed to submit assessment. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Step titles and descriptions
  const stepInfo = [
    {
      title: "Basic Information",
      description: "Tell us about yourself",
      icon: <User className="h-5 w-5" />
    },
    {
      title: "Academic Profile",
      description: "Share your academic background",
      icon: <GraduationCap className="h-5 w-5" />
    },
    {
      title: "Personal Interests",
      description: "Select your areas of interest",
      icon: <Heart className="h-5 w-5" />
    },
    {
      title: "Hobbies & Activities",
      description: "What do you enjoy doing?",
      icon: <Gamepad2 className="h-5 w-5" />
    },
    {
      title: "Aptitude Test",
      description: "Show us your skills",
      icon: <Brain className="h-5 w-5" />
    },
    {
      title: "Review & Confirm",
      description: "Review your answers before submission",
      icon: <CheckCircle className="h-5 w-5" />
    }
  ];

  // Progress percentage
  const progressPercentage = ((currentStep + 1) / 6) * 100;

  // Step validation
  const isStepValid = () => {
    switch (currentStep) {
      case 0: // Basic Information
        // Email is pre-filled and read-only, so we don't require it in validation
        return formData.fullName && formData.age && formData.gender && formData.school && formData.region;
      case 1: // Academic Profile
        return formData.gwa && formData.favoriteSubject && formData.leastFavoriteSubject;
      case 2: // Personal Interests
        return formData.interests.length > 0;
      case 3: // Hobbies
        return formData.hobbies.length > 0;
      case 4: // Aptitude Test
        // Check if all questions have been answered
        return aptitudeQuestions.every(q => 
          formData.aptitudeAnswers[q.id] !== undefined && 
          formData.aptitudeAnswers[q.id] !== ""
        );
      case 5: // Review & Confirm
        // Always valid as this is just a review step
        return true;
      default:
        return false;
    }
  };

  // Show maintenance page if under maintenance
  if (maintenance?.isUnderMaintenance) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <MaintenancePage message={maintenance.message} />
        <Footer />
      </div>
    );
  }

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Information
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  placeholder="Enter your full name"
                  className="py-3"
                  readOnly
                />
                <p className="text-sm text-muted-foreground">This field is pre-filled from your profile</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  placeholder="Enter your age"
                  className="py-3"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Gender *</Label>
              <RadioGroup 
                value={formData.gender} 
                onValueChange={(value) => handleInputChange("gender", value)}
                className="flex space-x-4"
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
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Other</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="school">School *</Label>
              <Input
                id="school"
                value={formData.school}
                onChange={(e) => handleInputChange("school", e.target.value)}
                placeholder="Enter your current school"
                className="py-3"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="region">Region *</Label>
              <Select 
                value={formData.region} 
                onValueChange={(value) => handleInputChange("region", value)}
              >
                <SelectTrigger className="py-3">
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
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter your email address"
                className="py-3"
                readOnly
              />
              <p className="text-sm text-muted-foreground">This field is pre-filled from your profile</p>
            </div>
          </motion.div>
        );
        
      case 1: // Academic Profile
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="gwa">General Weighted Average (GWA) *</Label>
              <Input
                id="gwa"
                type="number"
                min="75"
                max="100"
                step="0.01"
                value={formData.gwa}
                onChange={(e) => handleInputChange("gwa", e.target.value)}
                placeholder="Enter your GWA (75-100)"
                className="py-3"
              />
              <p className="text-sm text-muted-foreground">Enter your most recent GWA (75-100 scale)</p>
            </div>
            
            <div className="space-y-4">
              <Label>Favorite Subject *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SUBJECT_OPTIONS.map((subject) => (
                  <div 
                    key={`favorite-${subject}`} 
                    className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                      formData.favoriteSubject === subject
                        ? "border-primary bg-primary/10"
                        : "border-input hover:border-primary/50"
                    }`}
                    onClick={() => {
                      // Prevent selecting the same subject as least favorite
                      if (formData.leastFavoriteSubject !== subject) {
                        handleInputChange("favoriteSubject", subject);
                      }
                    }}
                  >
                    <RadioGroup 
                      value={formData.favoriteSubject} 
                      onValueChange={(value) => {
                        // Prevent selecting the same subject as least favorite
                        if (formData.leastFavoriteSubject !== value) {
                          handleInputChange("favoriteSubject", value);
                        }
                      }}
                      className="flex items-center space-x-2 w-full"
                    >
                      <RadioGroupItem 
                        value={subject} 
                        id={`favorite-${subject}`} 
                        className="cursor-pointer"
                      />
                      <Label 
                        htmlFor={`favorite-${subject}`} 
                        className="cursor-pointer flex-grow"
                      >
                        {subject}
                      </Label>
                    </RadioGroup>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <Label>Least Favorite Subject *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SUBJECT_OPTIONS.map((subject) => (
                  <div 
                    key={`least-${subject}`} 
                    className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                      formData.leastFavoriteSubject === subject
                        ? "border-primary bg-primary/10"
                        : "border-input hover:border-primary/50"
                    }`}
                    onClick={() => {
                      // Prevent selecting the same subject as favorite
                      if (formData.favoriteSubject !== subject) {
                        handleInputChange("leastFavoriteSubject", subject);
                      }
                    }}
                  >
                    <RadioGroup 
                      value={formData.leastFavoriteSubject} 
                      onValueChange={(value) => {
                        // Prevent selecting the same subject as favorite
                        if (formData.favoriteSubject !== value) {
                          handleInputChange("leastFavoriteSubject", value);
                        }
                      }}
                      className="flex items-center space-x-2 w-full"
                    >
                      <RadioGroupItem 
                        value={subject} 
                        id={`least-${subject}`} 
                        className="cursor-pointer"
                      />
                      <Label 
                        htmlFor={`least-${subject}`} 
                        className="cursor-pointer flex-grow"
                      >
                        {subject}
                      </Label>
                    </RadioGroup>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Visual indicator for mutual exclusivity */}
            {(formData.favoriteSubject && formData.leastFavoriteSubject && formData.favoriteSubject === formData.leastFavoriteSubject) && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                You cannot select the same subject as both your favorite and least favorite.
              </div>
            )}
          </motion.div>
        );
        
      case 2: // Personal Interests
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <Label>Select up to 3 areas of interest *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {INTERESTS.map((interest) => (
                  <div 
                    key={interest} 
                    className={`flex items-center space-x-3 p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                      formData.interests.includes(interest)
                        ? "border-primary bg-primary/5"
                        : "border-input hover:border-primary/50"
                    }`}
                    onClick={() => handleInterestChange(interest, !formData.interests.includes(interest))}
                  >
                    <Checkbox
                      id={interest}
                      checked={formData.interests.includes(interest)}
                      onCheckedChange={(checked) => handleInterestChange(interest, checked as boolean)}
                    />
                    <Label 
                      htmlFor={interest} 
                      className="cursor-pointer flex-grow"
                    >
                      {interest}
                    </Label>
                  </div>
                ))}
              </div>
              {formData.interests.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Selected: {formData.interests.length}/3 interests
                </p>
              )}
            </div>
          </motion.div>
        );
        
      case 3: // Hobbies
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <Label>Select up to 5 hobbies/activities *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {HOBBIES.map((hobby) => (
                  <div 
                    key={hobby} 
                    className={`flex items-center space-x-3 p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                      formData.hobbies.includes(hobby)
                        ? "border-primary bg-primary/5"
                        : "border-input hover:border-primary/50"
                    }`}
                    onClick={() => handleHobbyChange(hobby, !formData.hobbies.includes(hobby))}
                  >
                    <Checkbox
                      id={hobby}
                      checked={formData.hobbies.includes(hobby)}
                      onCheckedChange={(checked) => handleHobbyChange(hobby, checked as boolean)}
                    />
                    <Label 
                      htmlFor={hobby} 
                      className="cursor-pointer flex-grow"
                    >
                      {hobby}
                    </Label>
                  </div>
                ))}
              </div>
              {formData.hobbies.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Selected: {formData.hobbies.length}/5 hobbies
                </p>
              )}
            </div>
          </motion.div>
        );
        
      case 4: // Aptitude Test
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Mini Aptitude Test</h3>
              <p className="text-muted-foreground">
                Answer the following questions to assess your skills and knowledge
              </p>
            </div>
            
            {loadingQuestions ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-muted-foreground">Loading questions...</div>
              </div>
            ) : aptitudeQuestions.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No aptitude questions available at this time.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {aptitudeQuestions.map((question, index) => {
                  const options = Array.isArray(question.options) 
                    ? question.options 
                    : typeof question.options === 'string'
                    ? JSON.parse(question.options)
                    : [];
                  
                  return (
                    <Card key={question.id} className="p-6">
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-semibold">{index + 1}</span>
                        </div>
                        <div>
                          <h4 className="font-medium">{question.question}</h4>
                          {question.category && (
                            <Badge variant="secondary" className="mt-2">
                              {question.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {question.type === 'multiple_choice' ? (
                        <RadioGroup
                          value={formData.aptitudeAnswers[question.id]?.toString() || ""}
                          onValueChange={(value) => handleAptitudeAnswer(question.id, parseInt(value))}
                          className="space-y-3"
                        >
                          {options.map((option: string, optionIndex: number) => (
                            <div key={optionIndex} className="flex items-center space-x-3">
                              <RadioGroupItem 
                                value={optionIndex.toString()} 
                                id={`${question.id}-${optionIndex}`} 
                              />
                              <Label 
                                htmlFor={`${question.id}-${optionIndex}`} 
                                className="cursor-pointer"
                              >
                                {option}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      ) : question.type === 'true_false' ? (
                        <RadioGroup
                          value={formData.aptitudeAnswers[question.id]?.toString() || ""}
                          onValueChange={(value) => handleAptitudeAnswer(question.id, value)}
                          className="space-y-3"
                        >
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="true" id={`${question.id}-true`} />
                            <Label htmlFor={`${question.id}-true`} className="cursor-pointer">
                              True
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="false" id={`${question.id}-false`} />
                            <Label htmlFor={`${question.id}-false`} className="cursor-pointer">
                              False
                            </Label>
                          </div>
                        </RadioGroup>
                      ) : (
                        <Textarea
                          value={formData.aptitudeAnswers[question.id]?.toString() || ""}
                          onChange={(e) => handleAptitudeAnswer(question.id, e.target.value)}
                          placeholder="Type your answer here..."
                          className="min-h-[120px]"
                        />
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </motion.div>
        );
        
      case 5: // Review & Confirm
        const aptitudeScore = calculateAptitudeScore();
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Review Your Answers</h3>
              <p className="text-muted-foreground">
                Please review all your answers before submitting. You can go back to make changes if needed.
              </p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Full Name</Label>
                  <p className="text-foreground">{formData.fullName || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Age</Label>
                  <p className="text-foreground">{formData.age || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Gender</Label>
                  <p className="text-foreground">{formData.gender || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">School</Label>
                  <p className="text-foreground">{formData.school || "Not provided"}</p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium">Region</Label>
                  <p className="text-foreground">{formData.region || "Not provided"}</p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-foreground">{formData.email || "Not provided"}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Academic Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">GWA</Label>
                  <p className="text-foreground">{formData.gwa || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Favorite Subject</Label>
                  <p className="text-foreground">{formData.favoriteSubject || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Least Favorite Subject</Label>
                  <p className="text-foreground">{formData.leastFavoriteSubject || "Not provided"}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="h-5 w-5 mr-2" />
                  Personal Interests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {formData.interests.length > 0 ? (
                    formData.interests.map((interest, index) => (
                      <Badge key={index} variant="secondary">
                        {interest}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No interests selected</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gamepad2 className="h-5 w-5 mr-2" />
                  Hobbies & Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {formData.hobbies.length > 0 ? (
                    formData.hobbies.map((hobby, index) => (
                      <Badge key={index} variant="secondary">
                        {hobby}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No hobbies selected</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  Aptitude Test Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Your Score</h4>
                      <p className="text-sm text-muted-foreground">
                        Based on {aptitudeQuestions.filter(q => q.type === 'multiple_choice' || q.type === 'true_false').length} scored questions
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">{aptitudeScore}%</div>
                      <Badge variant={aptitudeScore >= 80 ? "default" : aptitudeScore >= 70 ? "secondary" : "outline"}>
                        {aptitudeScore >= 80 ? "Excellent" : aptitudeScore >= 70 ? "Good" : "Needs Improvement"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Your Answers</h4>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {aptitudeQuestions.length > 0 ? (
                        aptitudeQuestions.map((question, index) => {
                          const options = Array.isArray(question.options) 
                            ? question.options 
                            : typeof question.options === 'string'
                            ? JSON.parse(question.options)
                            : [];
                          
                          const userAnswer = formData.aptitudeAnswers[question.id];
                          let displayAnswer = "Not answered";
                          let isCorrect = false;
                          
                          if (userAnswer !== undefined && userAnswer !== null && userAnswer !== "") {
                            if (question.type === 'multiple_choice') {
                              // Handle both string and number values
                              const optionIndex = typeof userAnswer === 'number' ? userAnswer : parseInt(userAnswer.toString());
                              if (!isNaN(optionIndex) && options[optionIndex]) {
                                displayAnswer = options[optionIndex];
                                // Ensure correct_answer is properly handled
                                const correctAnswerIndex = question.correct_answer !== null && question.correct_answer !== undefined 
                                  ? question.correct_answer 
                                  : 0; // Default to 0 if not set
                                // Compare as numbers since both are parsed to integers
                                isCorrect = optionIndex === correctAnswerIndex;
                              }
                            } else if (question.type === 'true_false') {
                              displayAnswer = userAnswer.toString();
                              // In the database: 0 = True, 1 = False
                              isCorrect = userAnswer.toString() === (question.correct_answer === 0 ? 'true' : 'false');
                            } else {
                              displayAnswer = userAnswer.toString();
                            }
                          }
                          
                          return (
                            <div key={question.id} className="border-b pb-3 last:border-b-0">
                              <div className="flex justify-between">
                                <span className="font-medium">Q{index + 1}: {question.question}</span>
                                {question.type === 'multiple_choice' || question.type === 'true_false' ? (
                                  <Badge variant={isCorrect ? "default" : "destructive"}>
                                    {isCorrect ? "Correct" : "Incorrect"}
                                  </Badge>
                                ) : null}
                              </div>
                              <div className="mt-1 text-sm">
                                <span className="font-medium">Your answer: </span>
                                <span className={isCorrect ? "text-green-600" : "text-destructive"}>{displayAnswer}</span>
                              </div>
                              {(question.type === 'multiple_choice' || question.type === 'true_false') && (
                                <div className="mt-1 text-sm">
                                  <span className="font-medium">Correct answer: </span>
                                  {question.type === 'multiple_choice' 
                                    ? (options.length > 0 && question.correct_answer !== null && question.correct_answer !== undefined 
                                        ? options[question.correct_answer] 
                                        : "No correct answer defined")
                                    : (question.correct_answer === 0 ? 'true' : 'false')}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-muted-foreground">No questions available</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Star className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-primary">Ready to Submit?</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    By clicking "Submit Assessment", you confirm that all the information provided is accurate 
                    and you agree to the terms and conditions of this assessment.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );
        
      default:
        return null;
    }
  };

  // Calculate aptitude test score
  const calculateAptitudeScore = () => {
    if (aptitudeQuestions.length === 0) return 0;
    
    let correctAnswers = 0;
    let totalQuestions = 0;
    
    aptitudeQuestions.forEach(question => {
      // Only count multiple choice and true/false questions for scoring
      if (question.type === 'multiple_choice' || question.type === 'true_false') {
        totalQuestions++;
        const userAnswer = formData.aptitudeAnswers[question.id];
        if (userAnswer !== undefined && userAnswer !== null && userAnswer !== "") {
          // For multiple choice, compare the selected option index
          // For true/false, compare the string value
          if (question.type === 'multiple_choice') {
            // Handle both string and number values
            const userAnswerIndex = typeof userAnswer === 'number' ? userAnswer : parseInt(userAnswer.toString());
            // Ensure correct_answer is properly handled
            const correctAnswerIndex = question.correct_answer !== null && question.correct_answer !== undefined 
              ? question.correct_answer 
              : 0; // Default to 0 if not set
            if (!isNaN(userAnswerIndex) && userAnswerIndex === correctAnswerIndex) {
              correctAnswers++;
            }
          } else if (question.type === 'true_false') {
            // For true/false, correct_answer = 0 means true, 1 means false (based on database structure)
            if (userAnswer.toString() === (question.correct_answer === 0 ? 'true' : 'false')) {
              correctAnswers++;
            }
          }
        }
      }
    });
    
    if (totalQuestions === 0) return 0;
    
    return Math.round((correctAnswers / totalQuestions) * 100);
  };

  // Test function to verify answer comparison logic
  const testAnswerComparison = () => {
    // This is just for testing - not part of the actual component
    console.log('Testing answer comparison logic...');
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-grow pt-16 pt-header section-padding">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold text-foreground mb-2">
                SHS Strand Assessment
              </h1>
              <p className="text-muted-foreground">
                Discover which Senior High School Strand is best suited for you
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="border-primary/20 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {stepInfo[currentStep].icon}
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          Step {currentStep + 1}: {stepInfo[currentStep].title}
                        </CardTitle>
                        <CardDescription>
                          {stepInfo[currentStep].description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-sm">
                      {currentStep + 1} of 6
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                </CardHeader>
                
                <CardContent className="py-6">
                  {renderStepContent()}
                </CardContent>
                
                <div className="px-6 pb-6">
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentStep === 0}
                      className="flex items-center"
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    
                    <Button
                      onClick={handleNext}
                      disabled={!isStepValid() || isSubmitting}
                      className="flex items-center group"
                    >
                      {currentStep === 5 ? (
                        <>
                          {isSubmitting ? (
                            "Submitting..."
                          ) : (
                            <>
                              Submit Assessment
                              <Award className="h-4 w-4 ml-2 group-hover:rotate-12 transition-transform" />
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {currentStep === 4 ? "Review Answers" : "Next"}
                          <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Progress indicators */}
            <motion.div 
              className="flex justify-center mt-8 space-x-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {stepInfo.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? "bg-primary scale-125"
                      : index < currentStep
                      ? "bg-primary/50"
                      : "bg-muted"
                  }`}
                />
              ))}
            </motion.div>
          </div>
        </main>

        <Footer />
        <ScrollToTop />
      </div>
    </ErrorBoundary>
  );
};

export default Assessment;
