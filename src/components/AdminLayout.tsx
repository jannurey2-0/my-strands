import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { 
  LayoutDashboard, 
  Users, 
  School, 
  BookOpen, 
  LogOut,
  Menu,
  X,
  User,
  ChevronDown,
  Settings,
  Shield
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: 'dashboard' | 'students' | 'schools' | 'questions' | 'settings';
  setActiveSection: (section: 'dashboard' | 'students' | 'schools' | 'questions' | 'settings') => void;
}

export const AdminLayout = ({ children, activeSection, setActiveSection }: AdminLayoutProps) => {
  const { profile, signOut, user, session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Validate that the user is an admin
  useEffect(() => {
    if (user && profile && profile.role !== 'admin') {
      // User is authenticated but not an admin
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive"
      });
      // Sign out the user and redirect to home page
      signOut().then(() => {
        navigate('/', { replace: true });
      });
    }
  }, [user, profile, navigate, toast, signOut]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // If user is authenticated but not admin, don't render the layout
  if (user && profile && profile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <Card className="border-destructive/50 shadow-xl">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-destructive">Access Denied</CardTitle>
                <CardDescription>You don't have permission to access the admin panel.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                Your account is not authorized to access the admin panel. 
                You are being redirected to the home page.
              </p>
              <div className="flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'schools', label: 'Schools', icon: School },
    { id: 'questions', label: 'Questions', icon: BookOpen },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  const handleNavigation = (itemId: string) => {
    // If we're on a different route (like /admin/profile), navigate to dashboard first
    if (window.location.pathname !== '/admin/dashboard') {
      navigate('/admin/dashboard');
    }
    setActiveSection(itemId as 'dashboard' | 'students' | 'schools' | 'questions' | 'settings');
    setSidebarOpen(false);
  };

  const handleSignOut = async () => {
    console.log("Sign out button clicked");
    try {
      await signOut();
      console.log("Sign out successful, navigating to admin login");
      // Use client-side navigation to avoid server 404s on static hosts
      navigate('/admin/login', { replace: true });
    } catch (error) {
      console.error("Sign out failed:", error);
      // Even if sign out fails, navigate to login to reset UI state
      navigate('/admin/login', { replace: true });
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
                    onClick={() => handleNavigation(item.id)}
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
        
        {/* User profile moved to bottom of sidebar */}
        <div className="p-4 border-t bg-muted/50 mt-auto">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="text-sm">
              <div className="font-medium text-foreground">{profile?.full_name || 'Administrator'}</div>
              <div className="text-muted-foreground text-xs">Administrator</div>
            </div>
          </div>
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
            
            {/* User profile dropdown in header */}
            <div className="relative" ref={userMenuRef}>
              <Button 
                variant="ghost" 
                className="flex items-center space-x-2"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-foreground">{profile?.full_name || 'Administrator'}</span>
                  <span className="text-xs text-muted-foreground">Administrator</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
              
              {/* Dropdown menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-background border rounded-md shadow-lg py-1 z-50">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start px-4 py-2"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/admin/profile');
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start px-4 py-2"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              )}
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