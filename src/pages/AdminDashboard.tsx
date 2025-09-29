import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, School, BookOpen, Plus, TrendingUp, FileText, Building, HelpCircle, Settings, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import QuestionManagement from '@/components/QuestionManagement';
import { AdminLayout } from '@/components/AdminLayout';
import SystemSettings from './SystemSettings';
import { SchoolsManagement } from '@/components/SchoolsManagement';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

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

interface StudentProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: 'student' | 'admin';
  created_at: string;
  updated_at: string;
}

function StudentsManagement() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StudentProfile | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('role', 'student')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (search.trim()) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      setStudents((data as StudentProfile[]) || []);
      setTotal(count || 0);
    } catch (err) {
      console.error('Error fetching students:', err);
      useToast().toast({ title: 'Error', description: 'Failed to load students', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const openDetails = (student: StudentProfile) => {
    setSelected(student);
    setDetailsOpen(true);
  };

  const toggleActive = async (student: StudentProfile, next: boolean) => {
    try {
      // Note: is_active field does not exist in profiles table
      // This feature would require a database migration to add the is_active column
      useToast().toast({ 
        title: 'Feature not available', 
        description: 'Account activation requires adding an is_active column to the profiles table.',
        variant: 'destructive' 
      });
    } catch (err) {
      console.error('Error updating active status:', err);
      useToast().toast({ title: 'Update failed', description: 'Activation toggle requires an `is_active` column on profiles.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Student Management</h1>
          <p className="text-muted-foreground">Manage student profiles and account actions</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            className="w-64"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>{loading ? 'Loading...' : `${total} student${total === 1 ? '' : 's'} found`}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Loading students...</TableCell>
                  </TableRow>
                ) : students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No students found</TableCell>
                  </TableRow>
                ) : (
                  students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.full_name || '—'}</TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell><Badge variant={s.role === 'admin' ? 'secondary' : 'outline'}>{s.role}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={(s as any)?.is_active === false ? 'destructive' : 'secondary'}>
                          {(s as any)?.is_active === false ? 'Inactive' : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="icon" onClick={() => openDetails(s)} title="View details">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <div className="flex items-center gap-2" title="Activate / Deactivate account">
                            <Switch
                              checked={(s as any)?.is_active !== false}
                              onCheckedChange={(checked) => toggleActive(s, checked)}
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">Page {page} of {Math.max(1, Math.ceil(total / pageSize))}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= Math.max(1, Math.ceil(total / pageSize))} onClick={() => setPage((p) => Math.min(Math.max(1, Math.ceil(total / pageSize)), p + 1))}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>Basic information about the selected student</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Full name</span><span className="font-medium">{selected?.full_name || '—'}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{selected?.email}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Role</span><span className="font-medium">{selected?.role}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Created</span><span className="font-medium">{selected ? new Date(selected.created_at).toLocaleString() : '—'}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Updated</span><span className="font-medium">{selected ? new Date(selected.updated_at).toLocaleString() : '—'}</span></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
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
        return <StudentsManagement />;
      
      case 'schools':
        return <SchoolsManagement />;
      
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