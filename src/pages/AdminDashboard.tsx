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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, User } from "lucide-react";
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

interface RecentActivity {
  id: string;
  type: 'account_created' | 'assessment_completed' | 'question_added' | 'school_added';
  description: string;
  user?: string;
  timestamp: Date;
  icon: React.ReactNode;
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
  const [sortBy, setSortBy] = useState<'created_at' | 'full_name'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
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
        .order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply search filter
      if (search.trim()) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      query = query.range(from, to);

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
  }, [page, search, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const openDetails = (student: StudentProfile) => {
    setSelected(student);
    setDetailsOpen(true);
  };

  const handleSort = (column: 'created_at' | 'full_name') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Student Management</h1>
          <p className="text-muted-foreground">Manage student profiles and account actions</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
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
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('full_name')}>
                    <div className="flex items-center gap-1">
                      Full Name
                      {sortBy === 'full_name' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('created_at')}>
                    <div className="flex items-center gap-1">
                      Created
                      {sortBy === 'created_at' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        Loading students...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="h-12 w-12 text-muted-foreground/50" />
                        <h3 className="font-medium text-foreground">No students found</h3>
                        <p className="text-sm">Try adjusting your search or filter criteria</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((s) => (
                    <TableRow 
                      key={s.id} 
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-medium">{s.full_name || '—'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{s.email}</span>
                          <span className="text-xs text-muted-foreground">ID: {s.id.substring(0, 8)}...</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.role === 'admin' ? 'default' : 'secondary'}>
                          {s.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{new Date(s.created_at).toLocaleDateString()}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => openDetails(s)} 
                          title="View details"
                          className="hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} students
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page <= 1} 
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1"
              >
                <span>←</span>
                <span>Previous</span>
              </Button>
              <div className="flex items-center px-3 py-1 border rounded-md text-sm">
                Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page >= Math.max(1, Math.ceil(total / pageSize))} 
                onClick={() => setPage((p) => Math.min(Math.max(1, Math.ceil(total / pageSize)), p + 1))}
                className="flex items-center gap-1"
              >
                <span>Next</span>
                <span>→</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              Student Details
            </DialogTitle>
            <DialogDescription>Basic information about the selected student</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">{selected?.full_name || 'No name provided'}</h3>
                <p className="text-sm text-muted-foreground">{selected?.email}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">User ID</span>
                <span className="font-mono text-sm">{selected?.id.substring(0, 8)}...</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Role</span>
                <Badge variant={selected?.role === 'admin' ? 'default' : 'secondary'}>
                  {selected?.role}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Created</span>
                <span className="text-sm">{selected ? new Date(selected.created_at).toLocaleString() : '—'}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="text-sm">{selected ? new Date(selected.updated_at).toLocaleString() : '—'}</span>
              </div>
            </div>
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
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
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

  // Fetch recent activities
  const fetchRecentActivities = async () => {
    try {
      const activities: RecentActivity[] = [];
      
      // Fetch recent account creations (last 5)
      const { data: recentProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, created_at, role')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (profilesError) throw profilesError;
      
      // Add account creation activities
      recentProfiles?.forEach(profile => {
        if (profile.role === 'student') {
          activities.push({
            id: profile.id,
            type: 'account_created',
            description: 'New student account created',
            user: profile.full_name || 'Unknown User',
            timestamp: new Date(profile.created_at),
            icon: <User className="h-4 w-4 text-blue-500" />
          });
        }
      });
      
      // Fetch recent assessment completions (last 5)
      const { data: recentAssessments, error: assessmentsError } = await supabase
        .from('assessment_responses')
        .select('id, student_id, submitted_at')
        .order('submitted_at', { ascending: false })
        .limit(5);
      
      if (assessmentsError) throw assessmentsError;
      
      // Get user names for assessments
      const userIds = recentAssessments?.map(a => a.student_id) || [];
      const { data: assessmentUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      
      if (usersError) throw usersError;
      
      // Add assessment completion activities
      recentAssessments?.forEach(assessment => {
        const user = assessmentUsers?.find(u => u.id === assessment.student_id);
        activities.push({
          id: assessment.id,
          type: 'assessment_completed',
          description: 'Assessment completed',
          user: user?.full_name || 'Unknown User',
          timestamp: new Date(assessment.submitted_at),
          icon: <BarChart3 className="h-4 w-4 text-green-500" />
        });
      });
      
      // Fetch recent questions added (last 3)
      const { data: recentQuestions, error: questionsError } = await supabase
        .from('aptitude_questions')
        .select('id, question, created_at')
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (questionsError) throw questionsError;
      
      // Add question added activities
      recentQuestions?.forEach(question => {
        activities.push({
          id: question.id,
          type: 'question_added',
          description: 'New question added',
          timestamp: new Date(question.created_at),
          icon: <BookOpen className="h-4 w-4 text-amber-500" />
        });
      });
      
      // Fetch recent schools added (last 3)
      const { data: recentSchools, error: schoolsError } = await supabase
        .from('schools')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (schoolsError) throw schoolsError;
      
      // Add school added activities
      recentSchools?.forEach(school => {
        activities.push({
          id: school.id,
          type: 'school_added',
          description: `New school added: ${school.name}`,
          timestamp: new Date(school.created_at),
          icon: <School className="h-4 w-4 text-purple-500" />
        });
      });
      
      // Sort all activities by timestamp (newest first) and take top 10
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setRecentActivities(activities.slice(0, 10));
    } catch (error) {
      logger.error('Error fetching recent activities:', error);
      toast({
        title: "Error",
        description: "Failed to fetch recent activities",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchStats();
    fetchQuestions();
    fetchRecentActivities();
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
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-blue-800">Total Students</CardTitle>
                      <div className="p-2 rounded-full bg-blue-500/10">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-900">{stats.totalStudents}</div>
                      <p className="text-xs text-blue-700">Registered students</p>
                      <div className="mt-2 h-1 w-full bg-blue-200 rounded-full">
                        <div 
                          className="h-1 bg-blue-500 rounded-full" 
                          style={{ width: `${Math.min(100, (stats.totalStudents / 100) * 100)}%` }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-green-800">Assessments</CardTitle>
                      <div className="p-2 rounded-full bg-green-500/10">
                        <BarChart3 className="h-4 w-4 text-green-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-900">{stats.totalAssessments}</div>
                      <p className="text-xs text-green-700">Completed assessments</p>
                      <div className="mt-2 h-1 w-full bg-green-200 rounded-full">
                        <div 
                          className="h-1 bg-green-500 rounded-full" 
                          style={{ width: `${Math.min(100, (stats.totalAssessments / 50) * 100)}%` }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-purple-800">Schools</CardTitle>
                      <div className="p-2 rounded-full bg-purple-500/10">
                        <School className="h-4 w-4 text-purple-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-900">{stats.totalSchools}</div>
                      <p className="text-xs text-purple-700">Partner schools</p>
                      <div className="mt-2 h-1 w-full bg-purple-200 rounded-full">
                        <div 
                          className="h-1 bg-purple-500 rounded-full" 
                          style={{ width: `${Math.min(100, (stats.totalSchools / 20) * 100)}%` }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-amber-800">Questions</CardTitle>
                      <div className="p-2 rounded-full bg-amber-500/10">
                        <BookOpen className="h-4 w-4 text-amber-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-900">{stats.totalQuestions}</div>
                      <p className="text-xs text-amber-700">Aptitude questions</p>
                      <div className="mt-2 h-1 w-full bg-amber-200 rounded-full">
                        <div 
                          className="h-1 bg-amber-500 rounded-full" 
                          style={{ width: `${Math.min(100, (stats.totalQuestions / 100) * 100)}%` }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest events in the system</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentActivities.length === 0 ? (
                      <div className="h-80 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-foreground mb-2">No Recent Activity</h3>
                          <p className="text-sm">No recent events to display</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                        {recentActivities.map((activity) => (
                          <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                            <div className="mt-0.5">
                              {activity.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {activity.description}
                              </p>
                              {activity.user && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  by {activity.user}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {activity.timestamp.toLocaleDateString()} at {activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
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