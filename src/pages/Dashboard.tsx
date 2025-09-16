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
  Calendar
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

// Define types for our data
interface AssessmentResult {
  strand: string;
  match: number;
  date: string;
  status: string;
}

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [assessmentProgress, setAssessmentProgress] = useState<number>(0);
  const [completedAssessments, setCompletedAssessments] = useState<number>(0);
  const [totalAssessments, setTotalAssessments] = useState<number>(0);
  const [recentResults, setRecentResults] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // In a real implementation, this would fetch data from your backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // These would be replaced with actual API calls
        // For now, we're setting empty/default values
        setAssessmentProgress(0);
        setCompletedAssessments(0);
        setTotalAssessments(0);
        setRecentResults([]);
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

  // In a real implementation, these would be calculated based on actual data
  const topMatchStrand = recentResults.length > 0 
    ? recentResults.reduce((prev, current) => 
        (prev.match > current.match) ? prev : current
      ).strand 
    : "Not Available";
  
  const topMatchPercentage = recentResults.length > 0 
    ? recentResults.reduce((prev, current) => 
        (prev.match > current.match) ? prev : current
      ).match 
    : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {profile?.full_name || user?.email || "Student"}!
            </h1>
            <p className="text-muted-foreground">
              Continue your journey to discover the perfect SHS strand for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Progress Overview */}
            <Card className="col-span-1 md:col-span-2 lg:col-span-1">
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
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/assessment">
                  <Button variant="hero" className="w-full">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Continue Assessment
                  </Button>
                </Link>
                <Button variant="outline" className="w-full" disabled={recentResults.length === 0}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Results
                </Button>
                <Button variant="outline" className="w-full" disabled={recentResults.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </CardContent>
            </Card>

            {/* Achievement Stats */}
            <Card>
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
                    <Badge variant="secondary">{completedAssessments}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Top Match</span>
                    <Badge variant={topMatchPercentage > 0 ? "default" : "secondary"}>
                      {topMatchPercentage > 0 ? `${topMatchStrand} - ${topMatchPercentage}%` : "No data"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Profile Strength</span>
                    <Badge variant={completedAssessments > 0 ? "default" : "secondary"}>
                      {completedAssessments > 0 ? "In Progress" : "Not Started"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Results */}
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
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-semibold">{result.strand}</span>
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
                        <Badge variant={result.match >= 80 ? "default" : result.match >= 70 ? "secondary" : "outline"}>
                          {result.match >= 80 ? "High Match" : result.match >= 70 ? "Good Match" : "Low Match"}
                        </Badge>
                      </div>
                    </div>
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
                    <Button variant="hero">
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Start Assessment
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Call to Action */}
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="py-8 text-center">
              <h3 className="text-xl font-semibold mb-2">
                {completedAssessments > 0 
                  ? "Ready to complete your profile?" 
                  : "Ready to discover your ideal SHS strand?"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {completedAssessments > 0
                  ? "Take the remaining assessments to get more accurate strand recommendations."
                  : "Start your assessment journey to get personalized strand recommendations."}
              </p>
              <Link to="/assessment">
                <Button variant="hero" size="lg">
                  <ClipboardList className="h-5 w-5 mr-2" />
                  {completedAssessments > 0 ? "Continue Assessment" : "Start Assessment"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Dashboard;
