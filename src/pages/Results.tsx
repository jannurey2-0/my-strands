import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
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
import { assessmentService } from "@/integrations/supabase/assessmentService";
import { Tables } from "@/integrations/supabase/types";
import { motion } from "framer-motion";
import ErrorBoundary from "@/components/ErrorBoundary";

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
  const [strandResults, setStrandResults] = useState<StrandResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestAssessment, setLatestAssessment] = useState<Tables<'assessment_responses'> | null>(null);

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
    }
  };

  // Enhanced scoring algorithm
  const calculateStrandScores = (assessment: Tables<'assessment_responses'>) => {
    const scores: Record<string, number> = {
      STEM: 0,
      ABM: 0,
      HUMSS: 0
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

    // 1. Academic Performance Scoring (30% weight)
    const gwa = parseFloat(academicProfile.gwa);
    if (!isNaN(gwa)) {
      // Higher score for better GWA (100 is highest, 75 is lowest)
      const gwaScore = Math.max(0, Math.min(100, (gwa - 75) * 4)); // Scale to 0-100
      
      // Subject preference scoring with weighted points
      if (["Mathematics", "Science", "Computer Science", "Physics", "Chemistry"].includes(academicProfile.favoriteSubject)) {
        scores.STEM += 25 + (gwaScore * 0.15);
      } else if (["Business Math", "Economics", "Accounting", "Entrepreneurship"].includes(academicProfile.favoriteSubject)) {
        scores.ABM += 25 + (gwaScore * 0.15);
      } else if (["English", "Araling Panlipunan", "Literature", "History", "Philosophy"].includes(academicProfile.favoriteSubject)) {
        scores.HUMSS += 25 + (gwaScore * 0.15);
      }
    }

    // 2. Interest Alignment Scoring (25% weight)
    const interestWeights = {
      STEM: [
        { interest: "Science and Technology", weight: 12 },
        { interest: "Technical Vocational Work", weight: 10 },
        { interest: "Mathematics", weight: 8 }
      ],
      ABM: [
        { interest: "Business and Finance", weight: 12 },
        { interest: "Entrepreneurship", weight: 10 },
        { interest: "Leadership", weight: 8 }
      ],
      HUMSS: [
        { interest: "Humanities and Social Sciences", weight: 12 },
        { interest: "Arts and Design", weight: 10 },
        { interest: "Communication", weight: 8 }
      ]
    };
    
    Object.entries(interestWeights).forEach(([strand, interests]) => {
      interests.forEach(({ interest, weight }) => {
        if (personalInterests.includes(interest)) {
          scores[strand] += weight;
        }
      });
    });

    // 3. Hobby Alignment Scoring (20% weight)
    const hobbyWeights = {
      STEM: [
        { hobby: "Video Games", weight: 6 },
        { hobby: "Coding", weight: 8 },
        { hobby: "Reading", weight: 4 },
        { hobby: "Photography", weight: 5 },
        { hobby: "Building/Construction", weight: 7 }
      ],
      ABM: [
        { hobby: "Reading", weight: 5 },
        { hobby: "Writing", weight: 6 },
        { hobby: "Board Games", weight: 5 },
        { hobby: "Collecting", weight: 4 },
        { hobby: "Entrepreneurial Activities", weight: 7 }
      ],
      HUMSS: [
        { hobby: "Reading", weight: 7 },
        { hobby: "Writing", weight: 8 },
        { hobby: "Music", weight: 5 },
        { hobby: "Dancing", weight: 5 },
        { hobby: "Traveling", weight: 6 },
        { hobby: "Volunteering", weight: 7 }
      ]
    };
    
    Object.entries(hobbyWeights).forEach(([strand, hobbiesList]) => {
      hobbiesList.forEach(({ hobby, weight }) => {
        if (hobbies.includes(hobby)) {
          scores[strand] += weight;
        }
      });
    });

    // 4. Subject Dislike Penalty (10% weight)
    const dislikePenalties = {
      STEM: ["English", "Araling Panlipunan", "Literature"],
      ABM: ["Science", "Chemistry", "Physics"],
      HUMSS: ["Mathematics", "Business Math", "Computer Science"]
    };
    
    Object.entries(dislikePenalties).forEach(([strand, dislikedSubjects]) => {
      if (dislikedSubjects.includes(academicProfile.leastFavoriteSubject)) {
        scores[strand] -= 10; // Penalty for disliking relevant subjects
      }
    });

    // 5. Bonus for balanced interests (5% weight)
    if (personalInterests.length >= 2) {
      scores.STEM += 2;
      scores.ABM += 2;
      scores.HUMSS += 2;
    }

    // 6. Bonus for diverse hobbies (5% weight)
    if (hobbies.length >= 3) {
      scores.STEM += 3;
      scores.ABM += 3;
      scores.HUMSS += 3;
    }

    // 7. Age-based adjustments (5% weight)
    const age = parseInt(basicInfo.age || "0");
    if (age >= 15 && age <= 16) {
      // Slight boost for STEM as it's often popular with this age group
      scores.STEM += 3;
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
        STEM: 33.33,
        ABM: 33.33,
        HUMSS: 33.33
      };
    }

    // Convert to percentages
    Object.keys(scores).forEach(strand => {
      scores[strand] = (scores[strand] / totalScore) * 100;
    });

    return scores;
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
          
          // Calculate scores and format results
          const scores = calculateStrandScores(latest);
          const results = formatResults(scores);
          setStrandResults(results);
        } else {
          setError("No assessment data found. Please complete the assessment first.");
        }
      } catch (err) {
        console.error("Error fetching assessment data:", err);
        setError("Failed to load assessment results. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssessmentData();
  }, [user, profile]);

  // Get badge variant based on percentage
  const getMatchBadgeVariant = (percentage: number) => {
    if (percentage >= 80) return "default";
    if (percentage >= 70) return "secondary";
    return "outline";
  };

  // Get badge text based on percentage
  const getMatchBadgeText = (percentage: number) => {
    if (percentage >= 80) return "High Match";
    if (percentage >= 70) return "Good Match";
    return "Low Match";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
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
        <main className="flex-grow flex items-center justify-center">
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
        <main className="flex-grow flex items-center justify-center">
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
        
        <main className="flex-grow pt-16">
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
                  
                  <div className="grid md:grid-cols-2 gap-6">
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
                            <div className="w-2 h-2 bg-success rounded-full" />
                            <span className="text-sm">{career}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* All Results */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold mb-6">Complete Results Breakdown</h2>
              <div className="space-y-4">
                {strandResults.map((strand, index) => (
                  <motion.div
                    key={strand.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-12 h-12 bg-muted/50 rounded-lg">
                              <div className={strand.color}>
                                {strand.icon}
                              </div>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold">{strand.name}</h3>
                              <p className="text-sm text-muted-foreground">{strand.fullName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">{strand.match}%</div>
                            <Badge variant={getMatchBadgeVariant(strand.match)} className="mt-1">
                              {getMatchBadgeText(strand.match)}
                            </Badge>
                          </div>
                        </div>
                        
                        <Progress value={strand.match} className="mb-4" />
                        
                        <p className="text-sm text-muted-foreground mb-4">{strand.description}</p>
                        
                        <div className="flex flex-wrap gap-2">
                          {strand.careers.slice(0, 3).map((career, careerIndex) => (
                            <Badge key={careerIndex} variant="outline" className="text-xs">
                              {career}
                            </Badge>
                          ))}
                          {strand.careers.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{strand.careers.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              className="grid md:grid-cols-3 gap-4 mb-8 mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Button variant="hero" className="h-12 group">
                <Download className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                Download PDF Report
              </Button>
              <Button variant="outline" className="h-12 group">
                <Share className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                Share Results
              </Button>
              <Link to="/assessment">
                <Button variant="outline" className="w-full h-12 group">
                  <RotateCcw className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                  Retake Assessment
                </Button>
              </Link>
            </motion.div>

            {/* Next Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-primary" />
                    What's Next?
                  </CardTitle>
                  <CardDescription>
                    Now that you know your recommended strand, here are your next steps:
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                        <div>
                          <h4 className="font-medium">Explore Career Paths</h4>
                          <p className="text-sm text-muted-foreground">Learn more about specific careers in your recommended strand.</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                        <div>
                          <h4 className="font-medium">Research Schools</h4>
                          <p className="text-sm text-muted-foreground">Find schools that offer strong programs in your chosen strand.</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                        <div>
                          <h4 className="font-medium">Speak with a Counselor</h4>
                          <p className="text-sm text-muted-foreground">Discuss your results with a guidance counselor for personalized advice.</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Link to="/careers">
                          <Button variant="outline" className="w-full group">
                            Explore Career Paths
                            <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                        <Link to="/schools">
                          <Button variant="outline" className="w-full group">
                            View Schools
                            <SchoolIcon className="h-4 w-4 ml-2 group-hover:scale-110 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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