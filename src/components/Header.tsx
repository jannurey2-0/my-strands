import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, User, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Header = () => {
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <header className="bg-white shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">SHSNavigator</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive('/') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/dashboard" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              to="/assessment" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive('/assessment') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Assessment
            </Link>
            <Link 
              to="/careers" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive('/careers') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Career Paths
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  Welcome, {profile?.full_name}
                </span>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/student/login">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Student Login</span>
                  </Link>
                </Button>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/admin/login">Admin Login</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};