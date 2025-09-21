import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, School, BookOpen, Plus, TrendingUp, FileText, Building, HelpCircle, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import QuestionManagement from '@/components/QuestionManagement';
import { AdminLayout } from '@/components/AdminLayout';
import SystemSettings from './SystemSettings';

interface Stats {
  totalStudents: number;
  totalAssessments: number;
  totalSchools: number;
  totalQuestions: number;
}

interface AptitudeQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  category: string;
  difficulty_level: number;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalAssessments: 0,
    totalSchools: 0,
    totalQuestions: 0
  });
  const [questions, setQuestions] = useState<AptitudeQuestion[]>([]);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'students' | 'schools' | 'questions' | 'settings'>('dashboard');

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      // Fetch students count
      const { count: studentsCount, error: studentsError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');

      if (studentsError) throw studentsError;

      // Fetch assessments count
      const { count: assessmentsCount, error: assessmentsError } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true });

      if (assessmentsError) throw assessmentsError;

      // Fetch schools count
      const { count: schoolsCount, error: schoolsError } = await supabase
        .from('schools')
        .select('*', { count: 'exact', head: true });

      if (schoolsError) throw schoolsError;

      // Fetch questions count
      const { count: questionsCount, error: questionsError } = await supabase
        .from('aptitude_questions')
        .select('*', { count: 'exact', head: true });

      if (questionsError) throw questionsError;

      setStats({
        totalStudents: studentsCount || 0,
        totalAssessments: assessmentsCount || 0,
        totalSchools: schoolsCount || 0,
        totalQuestions: questionsCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch questions for management
  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('aptitude_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type cast the data to match our interface
      const typedQuestions: AptitudeQuestion[] = (data || []).map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options as string[] : []
      }));
      
      setQuestions(typedQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch questions",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchStats();
    fetchQuestions();
  }, []);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
              <p className="text-muted-foreground">Welcome back, {profile?.full_name}. Here's what's happening today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="hover:shadow-lg transition-all duration-300 border-primary/20 border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">{loading ? '...' : stats.totalStudents}</div>
                      <div className="text-xs text-muted-foreground">Students</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 mr-1 text-success" />
                    <span>+12% from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300 border-secondary/20 border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-secondary-foreground" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">{loading ? '...' : stats.totalAssessments}</div>
                      <div className="text-xs text-muted-foreground">Assessments</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 mr-1 text-success" />
                    <span>+8% from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300 border-accent/20 border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">{loading ? '...' : stats.totalSchools}</div>
                      <div className="text-xs text-muted-foreground">Schools</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 mr-1 text-success" />
                    <span>+3% from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300 border-muted/20 border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">{loading ? '...' : stats.totalQuestions}</div>
                      <div className="text-xs text-muted-foreground">Questions</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 mr-1 text-success" />
                    <span>+5% from last month</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    Student Management
                  </CardTitle>
                  <CardDescription>
                    View and manage student profiles and assessment results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={() => setActiveSection('students')}>
                    Manage Students
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-secondary-foreground" />
                    </div>
                    Schools & Strands
                  </CardTitle>
                  <CardDescription>
                    Add and manage schools and their available strands
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="secondary" className="w-full" onClick={() => setActiveSection('schools')}>
                    Manage Schools
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                      <HelpCircle className="w-5 h-5 text-accent-foreground" />
                    </div>
                    Assessment Questions
                  </CardTitle>
                  <CardDescription>
                    Create and manage aptitude test questions for students
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => setActiveSection('questions')}>
                    Manage Questions
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5" />
                    </div>
                    System Settings
                  </CardTitle>
                  <CardDescription>
                    Configure system-wide settings and maintenance modes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="w-full" onClick={() => setActiveSection('settings')}>
                    Configure Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        );
      
      case 'questions':
        return <QuestionManagement questions={questions} onRefresh={fetchQuestions} />;
      
      case 'students':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Student Management</h1>
                <p className="text-muted-foreground">Manage student profiles and assessment results</p>
              </div>
            </div>
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Student management functionality coming soon.
              </CardContent>
            </Card>
          </div>
        );
      
      case 'schools':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Schools Management</h1>
                <p className="text-muted-foreground">Manage schools and their available strands</p>
              </div>
            </div>
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Schools management functionality coming soon.
              </CardContent>
            </Card>
          </div>
        );
      
      case 'settings':
        return <SystemSettings />;
      
      default:
        return null;
    }
  };

  return (
    <AdminLayout activeSection={activeSection} setActiveSection={setActiveSection}>
      {renderContent()}
    </AdminLayout>
  );
}