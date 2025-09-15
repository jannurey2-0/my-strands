import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Link } from "react-router-dom";
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
  ChevronRight
} from "lucide-react";

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
  const studentName = "Maria Santos";

  const strandResults: StrandResult[] = [
    {
      name: "STEM",
      fullName: "Science, Technology, Engineering, Mathematics",
      match: 85,
      description: "You show strong aptitude for logical thinking, problem-solving, and analytical skills. STEM tracks prepare you for careers in technology, healthcare, and engineering.",
      icon: <Microscope className="h-6 w-6" />,
      color: "text-blue-600",
      careers: ["Engineer", "Doctor", "Data Scientist", "Researcher", "IT Specialist"],
      subjects: ["Advanced Mathematics", "Physics", "Chemistry", "Biology", "Computer Science"]
    },
    {
      name: "ABM", 
      fullName: "Accountancy, Business, Management",
      match: 72,
      description: "Your leadership qualities and interest in business concepts make ABM a strong fit. This track prepares you for careers in business and finance.",
      icon: <Calculator className="h-6 w-6" />,
      color: "text-emerald-600",
      careers: ["Business Manager", "Accountant", "Entrepreneur", "Marketing Specialist", "Financial Analyst"],
      subjects: ["Business Mathematics", "Economics", "Accounting", "Business Management", "Statistics"]
    },
    {
      name: "HUMSS",
      fullName: "Humanities and Social Sciences",
      match: 68,
      description: "You demonstrate strong analytical and communication skills with interest in human behavior and society. HUMSS prepares you for careers in social sciences.",
      icon: <Users className="h-6 w-6" />,
      color: "text-purple-600", 
      careers: ["Teacher", "Psychologist", "Lawyer", "Social Worker", "Journalist"],
      subjects: ["Philosophy", "Psychology", "Sociology", "Political Science", "Literature"]
    }
  ];

  const topMatch = strandResults[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-4">
            <Trophy className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Assessment Complete, {studentName}!
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Based on your responses, we've analyzed your interests, aptitudes, and goals to recommend the best SHS strands for you.
          </p>
        </div>

        {/* Top Recommendation */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-primary-glow/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`${topMatch.color}`}>
                  {topMatch.icon}
                </div>
                <div>
                  <CardTitle className="text-2xl">Your Best Match: {topMatch.name}</CardTitle>
                  <CardDescription className="text-base">{topMatch.fullName}</CardDescription>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{topMatch.match}%</div>
                <Badge variant="default" className="mt-1">Perfect Match</Badge>
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
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="text-sm">{subject}</span>
                    </div>
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
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-success rounded-full" />
                      <span className="text-sm">{career}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Results */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Complete Results Breakdown</h2>
          <div className="space-y-4">
            {strandResults.map((strand, index) => (
              <Card key={strand.name} className="hover:shadow-md transition-shadow">
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
                      <Badge variant={index === 0 ? "default" : index === 1 ? "secondary" : "outline"}>
                        {index === 0 ? "Top Match" : index === 1 ? "Good Fit" : "Consider"}
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
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Button variant="hero" className="h-12">
            <Download className="h-4 w-4 mr-2" />
            Download PDF Report
          </Button>
          <Button variant="outline" className="h-12">
            <Share className="h-4 w-4 mr-2" />
            Share Results
          </Button>
          <Link to="/assessment">
            <Button variant="outline" className="w-full h-12">
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake Assessment
            </Button>
          </Link>
        </div>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
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
                <Link to="/careers">
                  <Button variant="outline" className="w-full">
                    Explore Career Paths
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Results;