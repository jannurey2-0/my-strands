import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, School, BookOpen, LogOut, Plus, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import QuestionManagement from '@/components/QuestionManagement';

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
  const { profile, signOut } = useAuth();
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
  const [activeSection, setActiveSection] = useState<'dashboard' | 'students' | 'schools' | 'questions'>('dashboard');

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      const [studentsRes, assessmentsRes, schoolsRes, questionsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'student'),
        supabase.from('assessments').select('id', { count: 'exact' }),
        supabase.from('schools').select('id', { count: 'exact' }),
        supabase.from('aptitude_questions').select('id', { count: 'exact' })
      ]);

      setStats({
        totalStudents: studentsRes.count || 0,
        totalAssessments: assessmentsRes.count || 0,
        totalSchools: schoolsRes.count || 0,
        totalQuestions: questionsRes.count || 0
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <header className="bg-background/80 backdrop-blur-sm border-b border-primary/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {activeSection !== 'dashboard' && (
              <Button variant="ghost" onClick={() => setActiveSection('dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-primary">SHS Navigator Admin</h1>
              <p className="text-sm text-muted-foreground">Welcome, {profile?.full_name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {activeSection === 'dashboard' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
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

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary/50 rounded-lg flex items-center justify-center">
                      <School className="w-5 h-5 text-secondary-foreground" />
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

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/50 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-accent-foreground" />
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
            </div>

            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                  <CardDescription>Overview of system usage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{loading ? '...' : stats.totalStudents}</div>
                      <div className="text-sm text-muted-foreground">Total Students</div>
                    </div>
                    <div className="text-center p-4 bg-secondary/20 rounded-lg">
                      <div className="text-2xl font-bold text-secondary-foreground">{loading ? '...' : stats.totalAssessments}</div>
                      <div className="text-sm text-muted-foreground">Assessments Taken</div>
                    </div>
                    <div className="text-center p-4 bg-accent/20 rounded-lg">
                      <div className="text-2xl font-bold text-accent-foreground">{loading ? '...' : stats.totalSchools}</div>
                      <div className="text-sm text-muted-foreground">Schools Registered</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{loading ? '...' : stats.totalQuestions}</div>
                      <div className="text-sm text-muted-foreground">Questions Created</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {activeSection === 'questions' && (
          <QuestionManagement questions={questions} onRefresh={fetchQuestions} />
        )}

        {activeSection === 'students' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Student Management</h2>
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Student management functionality coming soon.
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'schools' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Schools Management</h2>
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Schools management functionality coming soon.
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}