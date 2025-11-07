import { useAuth } from '@/hooks/useAuth';
import ErrorBoundary from "@/components/ErrorBoundary";
import ChartErrorBoundary from "@/components/ChartErrorBoundary";
import { AdminLayout } from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logger from "@/lib/logger";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import { 
  Users, 
  School, 
  BookOpen, 
  BarChart3, 
  Settings,
  Cpu,
  AlertCircle
} from "lucide-react";
import { useState, useEffect } from 'react';
import { SchoolsManagement } from "@/components/SchoolsManagement";
import QuestionManagement from "@/components/QuestionManagement";
import SystemSettings from "@/pages/SystemSettings";
import { MLModelManagement } from "@/components/MLModelManagement";

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
  const [activeSection, setActiveSection] = useState<'dashboard' | 'students' | 'schools' | 'questions' | 'settings' | 'ml-model'>('dashboard');

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      // Fetch students count
      const { count: studentsCount, error: studentsError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');

      if (studentsError) throw studentsError;

      // Fetch assessment responses count (changed from 'assessments' table)
      const { count: assessmentsCount, error: assessmentsError } = await supabase
        .from('assessment_responses')
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
      logger.error('Error fetching stats:', error);
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
      logger.error('Error fetching questions:', error);
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
          <ErrorBoundary>
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-muted-foreground">Overview of system statistics and activities</p>
              </div>
              
              {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalStudents}</div>
                      <p className="text-xs text-muted-foreground">Registered students</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Assessments</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalAssessments}</div>
                      <p className="text-xs text-muted-foreground">Completed assessments</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Schools</CardTitle>
                      <School className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalSchools}</div>
                      <p className="text-xs text-muted-foreground">Partner schools</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Questions</CardTitle>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalQuestions}</div>
                      <p className="text-xs text-muted-foreground">Aptitude questions</p>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              <div className="grid gap-4 md:grid-cols-2">
                <ChartErrorBoundary chartTitle="Student Activity">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Latest student assessments</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80 flex items-center justify-center">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-foreground mb-2">Activity Chart</h3>
                          <p className="text-sm text-muted-foreground">Chart implementation pending</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </ChartErrorBoundary>
                
                <Card>
                  <CardHeader>
                    <CardTitle>System Status</CardTitle>
                    <CardDescription>Current system health</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Database</span>
                        <Badge variant="secondary">Operational</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Authentication</span>
                        <Badge variant="secondary">Operational</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">API</span>
                        <Badge variant="secondary">Operational</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </ErrorBoundary>
        );
        
      case 'students':
        return (
          <ErrorBoundary>
            <StudentsManagement />
          </ErrorBoundary>
        );
        
      case 'schools':
        return (
          <ErrorBoundary>
            <SchoolsManagement />
          </ErrorBoundary>
        );
        
      case 'questions':
        return (
          <ErrorBoundary>
            <QuestionManagement 
              questions={questions} 
              onRefresh={fetchQuestions}
            />
          </ErrorBoundary>
        );
        
      case 'settings':
        return (
          <ErrorBoundary>
            <SystemSettings />
          </ErrorBoundary>
        );
      
      case 'ml-model':
        return (
          <ErrorBoundary 
            fallback={
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    ML Model Error
                  </CardTitle>
                  <CardDescription>
                    There was an error loading the ML Model Management component.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    The ML Model Management section is currently unavailable. Please try again later.
                  </p>
                  <Button onClick={() => window.location.reload()}>
                    Refresh Page
                  </Button>
                </CardContent>
              </Card>
            }
          >
            <MLModelManagement />
          </ErrorBoundary>
        );
        
      default:
        return (
          <ErrorBoundary>
            <div>Section not implemented</div>
          </ErrorBoundary>
        );
    }
  };

  return (
    <AdminLayout activeSection={activeSection} setActiveSection={setActiveSection}>
      {renderContent()}
    </AdminLayout>
  );
}