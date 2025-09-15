import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, User, BarChart3 } from "lucide-react";

export const Header = () => {
  const location = useLocation();
  
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
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Login</span>
            </Button>
            <Button variant="hero" size="sm">
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};