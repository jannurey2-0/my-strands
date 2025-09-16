import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { User } from "lucide-react";

export const Header = () => {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleAboutClick = () => {
    if (location.pathname === '/') {
      // If we're on the home page, scroll to the section
      const element = document.getElementById('about');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // If we're on another page, navigate to home and scroll to section
      navigate('/#about');
    }
  };

  const handleContactClick = () => {
    if (location.pathname === '/') {
      // If we're on the home page, scroll to the section
      const element = document.getElementById('contact');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // If we're on another page, navigate to home and scroll to section
      navigate('/#contact');
    }
  };

  // Check if user is a student
  const isStudent = user && profile?.role === 'student';

  return (
    <header className="border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-primary">
              SHSNavigator
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6 ml-10">
              {isStudent ? (
                <>
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
                </>
              ) : (
                <>
                  <Link 
                    to="/" 
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActive('/') ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    Home
                  </Link>
                  <Link 
                    to="/careers" 
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActive('/careers') ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    Career Paths
                  </Link>
                </>
              )}
              <button
                onClick={handleAboutClick}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/') && location.hash === '#about' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                About Us
              </button>
              <button
                onClick={handleContactClick}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/') && location.hash === '#contact' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Contact Us
              </button>
            </nav>
          </div>
          
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