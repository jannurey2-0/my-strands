import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  School, 
  BookOpen, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: 'dashboard' | 'students' | 'schools' | 'questions';
  setActiveSection: (section: 'dashboard' | 'students' | 'schools' | 'questions') => void;
}

export const AdminLayout = ({ children, activeSection, setActiveSection }: AdminLayoutProps) => {
  const { profile, signOut, user, session } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'schools', label: 'Schools', icon: School },
    { id: 'questions', label: 'Questions', icon: BookOpen },
  ];

  const handleSignOut = async () => {
    console.log("Sign out button clicked");
    try {
      await signOut();
      console.log("Sign out successful, navigating to admin login");
      // Force a full page refresh to ensure clean state
      window.location.href = '/admin/login';
    } catch (error) {
      console.error("Sign out failed:", error);
      // Even if sign out fails, redirect to login to reset UI state
      window.location.href = '/admin/login';
    }
  };

  // If there's a session but no user, we have a corrupted state
  if (session && !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Session Error</h2>
          <p className="text-muted-foreground mb-4">Your session is corrupted. Please refresh the page.</p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-lg font-semibold text-foreground">Admin Panel</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveSection(item.id as 'dashboard' | 'students' | 'schools' | 'questions');
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeSection === item.id
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 border-t bg-muted/50">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="text-sm">
              <div className="font-medium text-foreground">{profile?.full_name || 'Administrator'}</div>
              <div className="text-muted-foreground text-xs">Administrator</div>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-background border-b shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden mr-2"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>
              <h1 className="text-xl font-semibold text-foreground">
                {navigationItems.find(item => item.id === activeSection)?.label || 'Admin Panel'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 bg-muted/50 rounded-lg px-3 py-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-3 w-3 text-primary" />
                </div>
                <div className="text-sm">
                  <div className="font-medium text-foreground">{profile?.full_name || 'Administrator'}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 bg-gradient-to-br from-background to-muted/30">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};