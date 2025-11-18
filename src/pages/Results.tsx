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
  Download, 
  Share, 
  RotateCcw, 
  TrendingUp,
  Microscope,
  Calculator,
  Users,
  Palette,
  Trophy,
  BookOpen,
  ChevronRight,
  Star,
  Zap,
  Award,
  Heart,
  School as SchoolIcon
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess"; // Add this import
import { assessmentService } from "@/integrations/supabase/assessmentService";
import { supabase } from '@/integrations/supabase/client';
import { Tables } from "@/integrations/supabase/types";
import { motion } from "framer-motion";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ModelService } from '@/ml/services/modelService';
import { IAssessment } from '@/ml/interfaces/IAssessment';

interface StrandResult {
  name: string;
  fullName: string;
  match: number;
  description: string;
  icon: React.ReactNode;
  color: string;
  careers: string[];
  subjects: string[];
}

const Results = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { user: roleUser, profile: roleProfile } = useRoleAccess(); // Add this line
  const [strandResults, setStrandResults] = useState<StrandResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestAssessment, setLatestAssessment] = useState<Tables<'assessment_responses'> | null>(null);
  const [maintenance, setMaintenance] = useState<{ isUnderMaintenance: boolean; message: string } | null>(null);
  const [showAllStrands, setShowAllStrands] = useState(false);
  const [mlModelEnabled, setMlModelEnabled] = useState(false);
  const [modelService] = useState(new ModelService());

  // Check maintenance status on component mount
  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      try {
        const status = await assessmentService.isPageUnderMaintenance('results');
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

  // Check if ML model is enabled and initialize model service
  useEffect(() => {
    const checkMlModelStatus = async () => {
      try {
        // Use the new function to check if ML model is enabled
        const isEnabled = await assessmentService.isMlModelEnabled();
        setMlModelEnabled(isEnabled);
        
        if (isEnabled) {
          // Initialize the model service if ML is enabled
          try {
            await modelService.initialize();
            console.log('Model service initialized successfully');
          } catch (error) {
            console.error('Error initializing model service:', error);
            // Show a toast notification for better user feedback
            toast({
              title: "ML Model Unavailable",
              description: "Using traditional recommendation method. Your results are still accurate!",
              variant: "default"
            });
          }
        }
      } catch (err) {
        console.error('Error checking ML model status:', err);
        // Only show error if it's a critical issue, otherwise silently fallback
      }
    };

    checkMlModelStatus();
  }, []);

  // Define strand information with detailed scoring criteria
  const strandInfo: Record<string, Omit<StrandResult, 'match'>> = {
    STEM: {
      name: "STEM",
      fullName: "Science, Technology, Engineering, Mathematics",
      description: "You show strong aptitude for logical thinking, problem-solving, and analytical skills. STEM tracks prepare you for careers in technology, healthcare, and engineering.",
      icon: <Microscope className="h-6 w-6" />,
      color: "text-blue-600",
      careers: ["Engineer", "Doctor", "Data Scientist", "Researcher", "IT Specialist"],
      subjects: ["Advanced Mathematics", "Physics", "Chemistry", "Biology", "Computer Science"]
    },
    ABM: {
      name: "ABM", 
      fullName: "Accountancy, Business, Management",
      description: "Your leadership qualities and interest in business concepts make ABM a strong fit. This track prepares you for careers in business and finance.",
      icon: <Calculator className="h-6 w-6" />,
      color: "text-emerald-600",
      careers: ["Business Manager", "Accountant", "Entrepreneur", "Marketing Specialist", "Financial Analyst"],
      subjects: ["Business Mathematics", "Economics", "Accounting", "Business Management", "Statistics"]
    },
    HUMSS: {
      name: "HUMSS",
      fullName: "Humanities and Social Sciences",
      description: "You demonstrate strong analytical and communication skills with interest in human behavior and society. HUMSS prepares you for careers in social sciences.",
      icon: <Users className="h-6 w-6" />,
      color: "text-purple-600", 
      careers: ["Teacher", "Psychologist", "Lawyer", "Social Worker", "Journalist"],
      subjects: ["Philosophy", "Psychology", "Sociology", "Political Science", "Literature"]
    },
    GAS: {
      name: "GAS",
      fullName: "General Academic Strand",
      description: "A flexible, generalist track suitable for students with broad interests across disciplines, providing foundational preparation across academic areas.",
      icon: <BookOpen className="h-6 w-6" />,
      color: "text-sky-600",
      careers: ["Generalist", "Administrative Assistant", "Civil Service Professional", "Project Coordinator", "Educator"],
      subjects: ["General Mathematics", "Earth and Life Science", "Understanding Culture, Society, and Politics", "Oral Communication", "21st Century Literature"]
    },
    TVL: {
      name: "TVL",
      fullName: "Technical-Vocational-Livelihood",
      description: "Best for hands-on, practical learners who enjoy building, fixing, and creating with technology and tools.",
      icon: <Zap className="h-6 w-6" />,
      color: "text-amber-600",
      careers: ["Technician", "Mechanic", "Electrician", "Cook/Culinary Professional", "Multimedia Technician"],
      subjects: ["Technology and Livelihood Education", "Technical Drafting", "Electronics", "Cookery", "Animation/Multimedia"]
    },
    Arts: {
      name: "Arts",
      fullName: "Arts and Design",
      description: "Ideal for creative students passionate about visual, performing, and applied arts, including design and media.",
      icon: <Palette className="h-6 w-6" />,
      color: "text-rose-600",
      careers: ["Graphic Designer", "Animator", "Illustrator", "Performer", "Fashion Designer"],
      subjects: ["Media Arts", "Visual Arts", "Performing Arts", "Design Principles", "Creative Writing"]
    }
  };

  // Enhanced scoring algorithm that includes aptitude test results
  const calculateStrandScores = (assessment: Tables<'assessment_responses'>) => {
    const scores: Record<string, number> = {
      STEM: 0,
      ABM: 0,
      HUMSS: 0,
      GAS: 0,
      TVL: 0,
      Arts: 0
    };

    // Extract assessment data with proper typing
    const basicInfo = assessment.basic_info as { 
      fullName?: string; 
      age?: string; 
      gender?: string; 
      school?: string; 
      region?: string; 
      email?: string 
    };
    
    const academicProfile = assessment.academic_profile as { 
      gwa: string; 
      favoriteSubject: string; 
      leastFavoriteSubject: string 
    };
    
    const personalInterests = assessment.personal_interests as string[];
    const hobbies = assessment.hobbies as string[];
    const aptitudeAnswers = assessment.aptitude_answers as Record<string, number | string>;

    // 1. Academic Performance Scoring (20% weight)
    const gwa = parseFloat(academicProfile.gwa);
    if (!isNaN(gwa)) {
      // Higher score for better GWA (100 is highest, 75 is lowest)
      const gwaScore = Math.max(0, Math.min(100, (gwa - 75) * 4)); // Scale to 0-100
      
      // Subject preference scoring with weighted points
      if (["Mathematics", "Science", "Computer Science", "Physics", "Chemistry"].includes(academicProfile.favoriteSubject)) {
        scores.STEM += 15 + (gwaScore * 0.10);
      } else if (["Business Math", "Economics", "Accounting", "Entrepreneurship"].includes(academicProfile.favoriteSubject)) {
        scores.ABM += 15 + (gwaScore * 0.10);
      } else if (["English", "Araling Panlipunan", "Literature", "History", "Philosophy"].includes(academicProfile.favoriteSubject)) {
        scores.HUMSS += 15 + (gwaScore * 0.10);
      }
    }

    // 2. Interest Alignment Scoring (15% weight)
    const interestWeights = {
      STEM: [
        { interest: "Science and Technology", weight: 8 },
        { interest: "Technical Vocational Work", weight: 6 },
        { interest: "Mathematics", weight: 5 }
      ],
      ABM: [
        { interest: "Business and Finance", weight: 8 },
        { interest: "Entrepreneurship", weight: 6 },
        { interest: "Leadership", weight: 5 }
      ],
      HUMSS: [
        { interest: "Humanities and Social Sciences", weight: 8 },
        { interest: "Arts and Design", weight: 6 },
        { interest: "Communication", weight: 5 }
      ],
      GAS: [
        // Generalist: small weights across many common interests
        { interest: "Science and Technology", weight: 3 },
        { interest: "Business and Finance", weight: 3 },
        { interest: "Humanities and Social Sciences", weight: 3 },
        { interest: "Communication", weight: 2 },
        { interest: "Arts and Design", weight: 2 },
        { interest: "Entrepreneurship", weight: 2 }
      ],
      TVL: [
        { interest: "Technical Vocational Work", weight: 8 },
        { interest: "Science and Technology", weight: 5 },
        { interest: "Engineering", weight: 4 }
      ],
      Arts: [
        { interest: "Arts and Design", weight: 8 },
        { interest: "Communication", weight: 5 },
        { interest: "Humanities and Social Sciences", weight: 4 }
      ]
    } as Record<string, { interest: string; weight: number }[]>;
    
    Object.entries(interestWeights).forEach(([strand, interests]) => {
      interests.forEach(({ interest, weight }) => {
        if (personalInterests.includes(interest)) {
          scores[strand] += weight;
        }
      });
    });

    // 3. Hobby Alignment Scoring (10% weight)
    const hobbyWeights = {
      STEM: [
        { hobby: "Video Games", weight: 4 },
        { hobby: "Coding", weight: 5 },
        { hobby: "Reading", weight: 2 },
        { hobby: "Photography", weight: 3 },
        { hobby: "Building/Construction", weight: 4 }
      ],
      ABM: [
        { hobby: "Reading", weight: 3 },
        { hobby: "Writing", weight: 4 },
        { hobby: "Board Games", weight: 3 },
        { hobby: "Collecting", weight: 2 },
        { hobby: "Entrepreneurial Activities", weight: 4 }
      ],
      HUMSS: [
        { hobby: "Reading", weight: 5 },
        { hobby: "Writing", weight: 5 },
        { hobby: "Music", weight: 3 },
        { hobby: "Dancing", weight: 3 },
        { hobby: "Traveling", weight: 4 },
        { hobby: "Volunteering", weight: 5 }
      ],
      GAS: [
        // Generalist: small weights across many hobbies
        { hobby: "Reading", weight: 1 },
        { hobby: "Writing", weight: 1 },
        { hobby: "Music", weight: 1 },
        { hobby: "Photography", weight: 1 },
        { hobby: "Board Games", weight: 1 },
        { hobby: "Traveling", weight: 1 }
      ],
      TVL: [
        { hobby: "Building/Construction", weight: 5 },
        { hobby: "DIY/Handicrafts", weight: 5 },
        { hobby: "Mechanics", weight: 5 },
        { hobby: "Electronics", weight: 4 },
        { hobby: "Cooking/Baking", weight: 4 },
        { hobby: "Woodworking", weight: 4 }
      ],
      Arts: [
        { hobby: "Drawing", weight: 6 },
        { hobby: "Painting", weight: 6 },
        { hobby: "Music", weight: 4 },
        { hobby: "Dancing", weight: 4 },
        { hobby: "Photography", weight: 3 },
        { hobby: "Theater/Acting", weight: 5 },
        { hobby: "Design", weight: 5 }
      ]
    } as Record<string, { hobby: string; weight: number }[]>;
    
    Object.entries(hobbyWeights).forEach(([strand, hobbiesList]) => {
      hobbiesList.forEach(({ hobby, weight }) => {
        if (hobbies.includes(hobby)) {
          scores[strand] += weight;
        }
      });
    });

    // 4. Aptitude Test Results (30% weight)
    // This is where we incorporate the aptitude test results
    if (aptitudeAnswers) {
      // Calculate aptitude score from stored answers
      const aptitudeScore = calculateAptitudeScoreFromStoredAnswers(aptitudeAnswers);
      
      // Distribute aptitude score to relevant strands based on question categories
      // This is a simplified approach - in a more advanced system, you'd map specific 
      // questions to specific strands based on their content
      scores.STEM += aptitudeScore * 0.12;   // 12% of aptitude score for STEM-related questions
      scores.ABM += aptitudeScore * 0.08;    // 8% of aptitude score for ABM-related questions
      scores.HUMSS += aptitudeScore * 0.06;  // 6% of aptitude score for HUMSS-related questions
      scores.TVL += aptitudeScore * 0.07;    // 7% of aptitude score for TVL-related questions
      scores.Arts += aptitudeScore * 0.05;   // 5% of aptitude score for Arts-related questions
      scores.GAS += aptitudeScore * 0.02;    // 2% of aptitude score for general questions
    }

    // 5. Subject Dislike Penalty (10% weight)
    const dislikePenalties = {
      STEM: ["English", "Araling Panlipunan", "Literature"],
      ABM: ["Science", "Chemistry", "Physics"],
      HUMSS: ["Mathematics", "Business Math", "Computer Science"],
      GAS: ["Mathematics", "English"],
      TVL: ["Science", "Physics", "Computer Science", "Technology and Livelihood Education"],
      Arts: ["Arts", "Literature", "Communication", "English"]
    } as Record<string, string[]>;
    
    Object.entries(dislikePenalties).forEach(([strand, dislikedSubjects]) => {
      if (dislikedSubjects.includes(academicProfile.leastFavoriteSubject)) {
        scores[strand] -= 8; // Penalty for disliking relevant subjects
      }
    });

    // 6. Bonus for balanced interests (5% weight)
    if (personalInterests.length >= 2) {
      scores.STEM += 1;
      scores.ABM += 1;
      scores.HUMSS += 1;
      scores.GAS += 1;
      scores.TVL += 1;
      scores.Arts += 1;
    }

    // 7. Bonus for diverse hobbies (5% weight)
    if (hobbies.length >= 3) {
      scores.STEM += 1;
      scores.ABM += 1;
      scores.HUMSS += 1;
      scores.GAS += 1;
      scores.TVL += 1;
      scores.Arts += 1;
    }

    // 8. Age-based adjustments (5% weight)
    const age = parseInt(basicInfo.age || "0");
    if (age >= 15 && age <= 16) {
      // Slight boost for STEM as it's often popular with this age group
      scores.STEM += 2;
    }

    // Convert raw scores to percentages that add up to 100%
    // First, ensure no negative scores
    Object.keys(scores).forEach(strand => {
      scores[strand] = Math.max(0, scores[strand]);
    });

    // Calculate total score
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    
    // If total is zero, assign equal percentages
    if (totalScore === 0) {
      return {
        STEM: 16.67,
        ABM: 16.67,
        HUMSS: 16.67,
        GAS: 16.67,
        TVL: 16.67,
        Arts: 16.67
      };
    }

    // Convert to percentages
    Object.keys(scores).forEach(strand => {
      scores[strand] = (scores[strand] / totalScore) * 100;
    });

    return scores;
  };

  // Helper function to calculate aptitude score from stored answers
  const calculateAptitudeScoreFromStoredAnswers = (aptitudeAnswers: Record<string, number | string>) => {
    // If no answers provided, return 0
    if (!aptitudeAnswers || Object.keys(aptitudeAnswers).length === 0) return 0;
    
    // For this implementation, we'll calculate a more realistic score
    // Count how many answers were provided
    const totalAnswered = Object.keys(aptitudeAnswers).length;
    
    // For this implementation, we'll use a more sophisticated approach:
    // 1. Assume a maximum of 15 questions (based on assessment randomization)
    // 2. Calculate a weighted score based on answered questions
    // 3. Apply a reasonable correctness assumption
    
    const maxQuestions = 15; // Based on the assessment randomization to 15 questions
    const answeredRatio = Math.min(1, totalAnswered / maxQuestions);
    
    // For a more realistic score, we'll assume:
    // - If all questions are answered, score is based on assumed correctness (70%)
    // - If fewer questions are answered, we scale accordingly but with a penalty
    // - Minimum score is 0, maximum is 100
    
    // Apply a penalty for unanswered questions (reduces score by 2% per unanswered question)
    const unansweredPenalty = (maxQuestions - totalAnswered) * 0.02;
    
    // Assume base correctness rate
    const baseCorrectness = 0.7; // 70% assumed correctness
    
    // Calculate final score
    let score = (answeredRatio * baseCorrectness * 100) - (unansweredPenalty * 100);
    
    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));
    
    return Math.round(score);
  };

  // Format results for display
  const formatResults = (scores: Record<string, number>): StrandResult[] => {
    // Sort by match percentage
    const sortedEntries = Object.entries(scores)
      .map(([strandKey, match]) => ({
        strandKey,
        match
      }))
      .sort((a, b) => b.match - a.match);
    
    // Round percentages while ensuring they still add up to 100%
    let total = 0;
    const roundedResults = sortedEntries.map((entry, index) => {
      if (index === sortedEntries.length - 1) {
        // For the last item, use remaining percentage to ensure total is 100%
        const remaining = 100 - total;
        return {
          ...strandInfo[entry.strandKey],
          match: Math.round(remaining * 100) / 100
        };
      } else {
        const rounded = Math.round(entry.match * 100) / 100;
        total += rounded;
        return {
          ...strandInfo[entry.strandKey],
          match: rounded
        };
      }
    });
    
    return roundedResults;
  };

  // Fetch assessment data
  useEffect(() => {
    // Don't fetch assessment data if page is under maintenance
    if (maintenance?.isUnderMaintenance) {
      setLoading(false);
      return;
    }

    const fetchAssessmentData = async () => {
      if (!user || !profile) {
        setError("You must be logged in to view results");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const assessments = await assessmentService.getStudentAssessments(profile.id);
      
        if (assessments && assessments.length > 0) {
          // Get the most recent assessment
          const latest = assessments[0];
          setLatestAssessment(latest);
        
          let scores: Record<string, number>;
        
          // Use saved recommendations if available, otherwise calculate and save
          if (latest.recommendations) {
            scores = latest.recommendations as Record<string, number>;
          } else {
            // Check if ML model is enabled
            if (mlModelEnabled) {
              try {
                // Use ML model for predictions
                console.log("Using ML model for predictions");
              
                // Convert to IAssessment format
                const assessmentData: IAssessment = {
                  basicInfo: latest.basic_info as IAssessment['basicInfo'],
                  academicProfile: latest.academic_profile as IAssessment['academicProfile'],
                  personalInterests: latest.personal_interests as string[],
                  hobbies: latest.hobbies as string[],
                  aptitudeAnswers: latest.aptitude_answers as Record<string, number | string>
                };
              
                // Wait for model training to complete before making prediction
                await modelService.waitForTraining();
              
                // Make prediction
                const prediction = await modelService.predict(assessmentData);
              
                // Convert prediction to the format we need
                scores = {
                  STEM: prediction.STEM,
                  ABM: prediction.ABM,
                  HUMSS: prediction.HUMSS,
                  GAS: prediction.GAS,
                  TVL: prediction.TVL,
                  Arts: prediction.Arts
                };
              
                console.log("ML prediction results:", scores);
              } catch (mlError) {
                console.error("ML prediction failed, falling back to rule-based scoring:", mlError);
                // Show a toast notification for better user feedback
                toast({
                  title: "Using Alternative Method",
                  description: "Calculating your recommendations using our proven assessment algorithm.",
                  variant: "default"
                });
                // Fall back to rule-based scoring if ML fails
                scores = calculateStrandScores(latest);
              }
            } else {
              // Use rule-based scoring when ML is not enabled
              console.log("Using rule-based scoring (ML model is disabled by admin)");
              scores = calculateStrandScores(latest);
            }
          
            // Save recommendations to database
            try {
              await assessmentService.saveRecommendations(latest.id, scores);
              // Update the local state with the saved recommendations
              latest.recommendations = scores;
            } catch (saveError) {
              console.error("Failed to save recommendations:", saveError);
            }
          }
        
          const results = formatResults(scores);
          setStrandResults(results);
        } else {
          setError("No assessment data found. Please complete the assessment first.");
        }
      } catch (err) {
        console.error("Error fetching assessment data:", err);
        
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        
        // Provide user-friendly error messages
        let userMessage = '';
        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          userMessage = 'Connection error. Please check your internet and refresh the page.';
        } else if (errorMessage.includes('permission') || errorMessage.includes('access')) {
          userMessage = 'Unable to access your results. Please try signing in again.';
        } else {
          userMessage = 'Unable to load your results. Please refresh the page or try again later.';
        }
        
        setError(userMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessmentData();
  }, [user, profile, maintenance?.isUnderMaintenance, mlModelEnabled, modelService]);

  // Get badge variant based on percentage
  const getMatchBadgeVariant = (percentage: number) => {
    if (percentage >= 80) return "default";
    if (percentage >= 70) return "secondary";
    if (percentage >= 50) return "outline";
    return "destructive";
  };

  // Get badge text based on percentage
  const getMatchBadgeText = (percentage: number) => {
    if (percentage >= 80) return "High Match";
    if (percentage >= 70) return "Good Match";
    if (percentage >= 50) return "Moderate Match";
    return "Low Match";
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center pt-header">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Analyzing your responses and calculating recommendations...</p>
          </motion.div>
        </main>
        <Footer />
        <ScrollToTop />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center pt-header">
          <motion.div 
            className="text-center max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-full mb-4">
              <Trophy className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Unable to Load Results</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="flex flex-col gap-3">
              <Link to="/assessment">
                <Button className="w-full">Take Assessment</Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" className="w-full">Back to Dashboard</Button>
              </Link>
            </div>
          </motion.div>
        </main>
        <Footer />
        <ScrollToTop />
      </div>
    );
  }

  if (strandResults.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center pt-header">
          <motion.div 
            className="text-center max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-muted/10 rounded-full mb-4">
              <Trophy className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">No Results Available</h1>
            <p className="text-muted-foreground mb-6">Please complete the assessment to get your strand recommendations.</p>
            <Link to="/assessment">
              <Button>Take Assessment Now</Button>
            </Link>
          </motion.div>
        </main>
        <Footer />
        <ScrollToTop />
      </div>
    );
  }

  const topMatch = strandResults[0];
  const studentName = (latestAssessment?.basic_info as { fullName?: string })?.fullName || "Student";

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-grow pt-16 pt-header section-padding">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Results Header */}
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-4">
                <Trophy className="h-8 w-8 text-success" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Assessment Complete, <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{studentName}</span>!
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Based on your responses, we've analyzed your interests, aptitudes, and goals to recommend the best SHS strands for you.
              </p>
              {mlModelEnabled && modelService.isModelReady() && (
                <Badge variant="secondary" className="mt-2">
                  <Zap className="h-3 w-3 mr-1" />
                  ML-Powered Recommendations
                </Badge>
              )}
            </motion.div>

            {/* Top Recommendation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-primary-glow/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-lg bg-primary/10 ${topMatch.color}`}>
                        {topMatch.icon}
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Your Best Match: {topMatch.name}</CardTitle>
                        <CardDescription className="text-base">{topMatch.fullName}</CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">{topMatch.match}%</div>
                      <Badge variant="default" className="mt-1 flex items-center">
                        <Star className="h-3 w-3 mr-1" />
                        Perfect Match
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground mb-6">{topMatch.description}</p>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Core Subjects
                      </h4>
                      <div className="space-y-2">
                        {topMatch.subjects.map((subject, index) => (
                          <motion.div 
                            key={index} 
                            className="flex items-center space-x-2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <div className="w-2 h-2 bg-primary rounded-full" />
                            <span className="text-sm">{subject}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Career Opportunities
                      </h4>
                      <div className="space-y-2">
                        {topMatch.careers.map((career, index) => (
                          <motion.div 
                            key={index} 
                            className="flex items-center space-x-2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <div className="w-2 h-2 bg-primary rounded-full" />
                            <span className="text-sm">{career}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* All Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <SchoolIcon className="h-5 w-5 mr-2" />
                        All Strand Recommendations
                      </CardTitle>
                      <CardDescription>
                        Detailed breakdown of all SHS strand matches based on your assessment
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowAllStrands(!showAllStrands)}
                    >
                      {showAllStrands ? "Show Less" : "Show All"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {(showAllStrands ? strandResults : strandResults.slice(0, 3)).map((strand, index) => (
                      <motion.div
                        key={strand.name}
                        className="border rounded-lg p-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg bg-primary/10 ${strand.color}`}>
                              {strand.icon}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{strand.name}</h3>
                              <p className="text-sm text-muted-foreground">{strand.fullName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-foreground">{strand.match}%</div>
                            <Badge variant={getMatchBadgeVariant(strand.match)}>
                              {getMatchBadgeText(strand.match)}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-foreground mb-4">{strand.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2 flex items-center">
                              <BookOpen className="h-4 w-4 mr-2" />
                              Key Subjects
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {strand.subjects.slice(0, 3).map((subject, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {subject}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2 flex items-center">
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Career Paths
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {strand.careers.slice(0, 3).map((career, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {career}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Action Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Button className="flex-1" asChild>
                <Link to="/careers">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Explore Career Paths
                </Link>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <Link to="/schools">
                  <SchoolIcon className="h-4 w-4 mr-2" />
                  Find Schools
                </Link>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <Link to="/dashboard">
                  <Award className="h-4 w-4 mr-2" />
                  View Dashboard
                </Link>
              </Button>
            </motion.div>
          </div>
        </main>
        <Footer />
        <ScrollToTop />
      </div>
    </ErrorBoundary>
  );
};

export default Results;