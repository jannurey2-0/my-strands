import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Link } from "react-router-dom";
import { 
  ClipboardList, 
  Download, 
  Eye, 
  TrendingUp, 
  BookOpen, 
  Award,
  Target,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Users,
  Clock,
  Zap,
  Star,
  TrendingDown,
  GraduationCap,
  School
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { assessmentService } from "@/integrations/supabase/assessmentService";
import { Tables } from "@/integrations/supabase/types";
import { motion } from "framer-motion";
import ErrorBoundary from "@/components/ErrorBoundary";
import ChartErrorBoundary from "@/components/ChartErrorBoundary";

// Import chart components
import { Bar, BarChart, Line, LineChart, Pie, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Define types for our data
interface AssessmentResult {
  strand: string;
  match: number;
  date: string;
  status: string;
}

interface StrandData {
  name: string;
  value: number;
  color: string;
}

interface ProgressData {
  name: string;
  progress: number;
}

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [assessmentProgress, setAssessmentProgress] = useState<number>(0);
  const [completedAssessments, setCompletedAssessments] = useState<number>(0);
  const [totalAssessments, setTotalAssessments] = useState<number>(0);
  const [recentResults, setRecentResults] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasAssessmentResults, setHasAssessmentResults] = useState<boolean>(false);
  const [topMatchStrand, setTopMatchStrand] = useState<string>("Not Available");
  const [topMatchPercentage, setTopMatchPercentage] = useState<number>(0);
  
  // Data for charts
  const [strandData, setStrandData] = useState<StrandData[]>([]);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);

  // Calculate strand scores (similar to Results.tsx)
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

    console.log('Calculating scores with data:', {
      basicInfo,
      academicProfile,
      personalInterests,
      hobbies
    });

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

    console.log('Calculated scores:', scores);
    return scores;
  };

  // Format results for display
  const formatResults = (scores: Record<string, number>): AssessmentResult[] => {
    // Sort by match percentage
    const sortedEntries = Object.entries(scores)
      .map(([strandKey, match]) => ({
        strand: strandKey,
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
          strand: entry.strand,
          match: Math.round(remaining * 100) / 100,
          date: new Date().toISOString(),
          status: "Completed"
        };
      } else {
        const rounded = Math.round(entry.match * 100) / 100;
        total += rounded;
        return {
          strand: entry.strand,
          match: rounded,
          date: new Date().toISOString(),
          status: "Completed"
        };
      }
    });
    
    console.log('Formatted results:', roundedResults);
    return roundedResults;
  };

  // Fetch real dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || !profile) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch assessment data
        const assessments = await assessmentService.getStudentAssessments(profile.id);
        console.log('Fetched assessments:', assessments);
        
        // Update assessment counts
        setCompletedAssessments(assessments.length);
        setTotalAssessments(Math.max(1, assessments.length)); // Ensure at least 1 for progress calculation
        setHasAssessmentResults(assessments.length > 0);
        
        // Calculate progress (simplified for now)
        setAssessmentProgress(assessments.length > 0 ? 100 : 0);
        
        // If we have assessments, calculate the actual results
        if (assessments.length > 0) {
          // Get the most recent assessment
          const latestAssessment = assessments[0];
          console.log('Latest assessment:', latestAssessment);
          
          // Log the academic profile to debug
          console.log('Academic profile:', latestAssessment.academic_profile);
          console.log('Personal interests:', latestAssessment.personal_interests);
          console.log('Hobbies:', latestAssessment.hobbies);
          
          // Calculate actual strand scores
          const scores = calculateStrandScores(latestAssessment);
          console.log('Calculated scores:', scores);
          
          const formattedResults = formatResults(scores);
          console.log('Formatted results:', formattedResults);
          
          setRecentResults(formattedResults);
          
          // Prepare strand data for pie chart
          const strandChartData: StrandData[] = formattedResults.map((result, index) => ({
            name: result.strand,
            value: result.match,
            color: [`#3b82f6`, `#10b981`, `#f59e0b`][index % 3]
          }));
          setStrandData(strandChartData);
          
          // Prepare progress data for bar chart
          const progressChartData: ProgressData[] = [
            { name: "Assessments", progress: assessments.length > 0 ? 100 : 0 },
            { name: "Profile", progress: profile ? 75 : 0 },
            { name: "Preferences", progress: 50 },
            { name: "History", progress: assessments.length > 0 ? 25 : 0 }
          ];
          setProgressData(progressChartData);
          
          // Prepare activity data for line chart
          const activityChartData = [
            { date: "Mon", activity: 12 },
            { date: "Tue", activity: 19 },
            { date: "Wed", activity: 3 },
            { date: "Thu", activity: 5 },
            { date: "Fri", activity: 2 },
            { date: "Sat", activity: 3 },
            { date: "Sun", activity: 9 }
          ];
          setActivityData(activityChartData);
        } else {
          // Reset data when no assessments
          setRecentResults([]);
          setStrandData([]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };

    if (user && profile) {
      fetchDashboardData();
    }
  }, [user, profile]);

  // Update top match when recent results change
  useEffect(() => {
    if (recentResults.length > 0) {
      const topResult = recentResults.reduce((prev, current) => 
        (prev.match > current.match) ? prev : current
      );
      setTopMatchStrand(topResult.strand);
      setTopMatchPercentage(topResult.match);
    } else {
      setTopMatchStrand("Not Available");
      setTopMatchPercentage(0);
    }
  }, [recentResults]);

  // Chart colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

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

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-grow pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Welcome back, <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{profile?.full_name || user?.email || "Student"}</span>!
              </h1>
              <p className="text-muted-foreground">
                Continue your journey to discover the perfect SHS strand for you.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Progress Overview */}
              <motion.div
                className="col-span-1 md:col-span-2 lg:col-span-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="col-span-1 md:col-span-2 lg:col-span-2 h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                      Assessment Progress
                    </CardTitle>
                    <CardDescription>Your current completion status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Overall Progress</span>
                          <span>{assessmentProgress}%</span>
                        </div>
                        <Progress value={assessmentProgress} className="h-2" />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {completedAssessments} of {totalAssessments} assessments completed
                      </div>
                      
                      {/* Progress Chart */}
                      <div className="mt-6 h-48">
                        <h4 className="text-sm font-medium mb-2">Profile Completion</h4>
                        <ChartErrorBoundary chartTitle="Profile Completion">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={progressData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" />
                              <YAxis domain={[0, 100]} />
                              <Tooltip />
                              <Bar dataKey="progress" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                                {progressData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartErrorBoundary>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                className="col-span-1 md:col-span-2 lg:col-span-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="col-span-1 md:col-span-2 lg:col-span-1 h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="h-5 w-5 mr-2 text-primary" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <Link to="/assessment">
                      <Button variant="hero" className="w-full group">
                        <ClipboardList className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                        {hasAssessmentResults ? "Retake Assessment" : "Start Assessment"}
                      </Button>
                    </Link>
                    <Link to="/results">
                      <Button 
                        variant="outline" 
                        className="w-full group"
                        disabled={!hasAssessmentResults}
                      >
                        <Eye className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                        View Results
                      </Button>
                    </Link>
                    <Link to="/schools">
                      <Button 
                        variant="outline" 
                        className="w-full group"
                        disabled={!hasAssessmentResults}
                      >
                        <School className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                        View Schools
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full group" disabled={!hasAssessmentResults}>
                      <Download className="h-4 w-4 mr-2 group-hover:bounce transition-transform" />
                      Download Report
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Achievement Stats */}
              <motion.div
                className="col-span-1 md:col-span-2 lg:col-span-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="col-span-1 md:col-span-2 lg:col-span-1 h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="h-5 w-5 mr-2 text-primary" />
                      Your Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Assessments Taken</span>
                        <Badge variant="secondary" className="flex items-center">
                          <Zap className="h-3 w-3 mr-1" />
                          {completedAssessments}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Top Match</span>
                        <Badge variant={topMatchPercentage > 0 ? getMatchBadgeVariant(topMatchPercentage) : "secondary"}>
                          {topMatchPercentage > 0 ? `${topMatchStrand} - ${topMatchPercentage}%` : "No data"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Profile Strength</span>
                        <Badge variant={completedAssessments > 0 ? "default" : "secondary"} className="flex items-center">
                          {completedAssessments > 0 ? (
                            <>
                              <Star className="h-3 w-3 mr-1" />
                              In Progress
                            </>
                          ) : (
                            <>
                              <TrendingDown className="h-3 w-3 mr-1" />
                              Not Started
                            </>
                          )}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Last Activity</span>
                        <Badge variant="outline" className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          2 days ago
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Strand Match Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChart className="h-5 w-5 mr-2 text-primary" />
                      Strand Match Distribution
                    </CardTitle>
                    <CardDescription>Your compatibility across different strands</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {strandData.length > 0 ? (
                      <ChartErrorBoundary chartTitle="Strand Match Distribution">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={strandData}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {strandData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value}%`, 'Match']} />
                            <Legend />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </ChartErrorBoundary>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Activity Trend */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="h-5 w-5 mr-2 text-primary" />
                      Weekly Activity
                    </CardTitle>
                    <CardDescription>Your engagement over the past week</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {activityData.length > 0 ? (
                      <ChartErrorBoundary chartTitle="Weekly Activity">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={activityData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="activity" 
                              stroke="var(--primary)" 
                              activeDot={{ r: 8 }} 
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartErrorBoundary>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Recent Results */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-primary" />
                    Recent Assessment Results
                  </CardTitle>
                  <CardDescription>Your latest strand compatibility scores</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="text-muted-foreground">Loading results...</div>
                    </div>
                  ) : recentResults.length > 0 ? (
                    <div className="space-y-4">
                      {recentResults.map((result, index) => (
                        <motion.div 
                          key={index} 
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-all duration-300"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-semibold">{result.strand.charAt(0)}</span>
                            </div>
                            <div>
                              <h4 className="font-medium">{result.strand} Assessment</h4>
                              <p className="text-sm text-muted-foreground flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(result.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-primary">{result.match}%</div>
                            <Badge variant={getMatchBadgeVariant(result.match)}>
                              {getMatchBadgeText(result.match)}
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Assessment Results Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Complete your first assessment to see your strand recommendations.
                      </p>
                      <Link to="/assessment">
                        <Button variant="hero" className="group">
                          <ClipboardList className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                          Start Assessment
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Call to Action */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                <CardContent className="py-8 text-center">
                  <h3 className="text-xl font-semibold mb-2">
                    {completedAssessments > 0 
                      ? "Ready to see your detailed results?" 
                      : "Ready to discover your ideal SHS strand?"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {completedAssessments > 0
                      ? "View your complete strand recommendations and career pathways."
                      : "Start your assessment journey to get personalized strand recommendations."}
                  </p>
                  {completedAssessments > 0 ? (
                    <Link to="/results">
                      <Button variant="hero" size="lg" className="group">
                        <Eye className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                        View Detailed Results
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/assessment">
                      <Button variant="hero" size="lg" className="group">
                        <ClipboardList className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                        Start Assessment
                      </Button>
                    </Link>
                  )}
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

export default Dashboard;