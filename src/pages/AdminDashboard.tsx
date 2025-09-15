import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, School, BookOpen, LogOut } from 'lucide-react';

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <header className="bg-background/80 backdrop-blur-sm border-b border-primary/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">SHS Navigator Admin</h1>
            <p className="text-sm text-muted-foreground">Welcome, {profile?.full_name}</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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
              <Button className="w-full">
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
              <Button variant="secondary" className="w-full">
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
              <Button variant="outline" className="w-full">
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
                  <div className="text-2xl font-bold text-primary">0</div>
                  <div className="text-sm text-muted-foreground">Total Students</div>
                </div>
                <div className="text-center p-4 bg-secondary/20 rounded-lg">
                  <div className="text-2xl font-bold text-secondary-foreground">0</div>
                  <div className="text-sm text-muted-foreground">Assessments Taken</div>
                </div>
                <div className="text-center p-4 bg-accent/20 rounded-lg">
                  <div className="text-2xl font-bold text-accent-foreground">0</div>
                  <div className="text-sm text-muted-foreground">Schools Registered</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">0</div>
                  <div className="text-sm text-muted-foreground">Questions Created</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}