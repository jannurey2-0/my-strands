import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { User, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export const Header = () => {
  const { user, profile, signOut, session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleAboutClick = () => {
    setMobileMenuOpen(false);
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
    setMobileMenuOpen(false);
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

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Handle sign out with better error handling
  const handleSignOut = async () => {
    try {
      await signOut();
      // Force a page refresh to ensure clean state
      window.location.href = '/';
    } catch (error) {
      console.error("Sign out error:", error);
      // Even if sign out fails, redirect to home to reset UI state
      window.location.href = '/';
    }
  };

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
            {session && !user ? (
              // Session exists but no user - corrupted state
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Session error</span>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  Refresh
                </Button>
              </div>
            ) : user ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  Welcome, {profile?.full_name || user.email}
                </span>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
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
            
            {/* Mobile menu button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col space-y-4 mt-8">
                  {isStudent ? (
                    <>
                      <Link 
                        to="/dashboard" 
                        className={`text-lg font-medium transition-colors hover:text-primary ${
                          isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground'
                        }`}
                        onClick={closeMobileMenu}
                      >
                        Dashboard
                      </Link>
                      <Link 
                        to="/assessment" 
                        className={`text-lg font-medium transition-colors hover:text-primary ${
                          isActive('/assessment') ? 'text-primary' : 'text-muted-foreground'
                        }`}
                        onClick={closeMobileMenu}
                      >
                        Assessment
                      </Link>
                      <Link 
                        to="/careers" 
                        className={`text-lg font-medium transition-colors hover:text-primary ${
                          isActive('/careers') ? 'text-primary' : 'text-muted-foreground'
                        }`}
                        onClick={closeMobileMenu}
                      >
                        Career Paths
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link 
                        to="/" 
                        className={`text-lg font-medium transition-colors hover:text-primary ${
                          isActive('/') ? 'text-primary' : 'text-muted-foreground'
                        }`}
                        onClick={closeMobileMenu}
                      >
                        Home
                      </Link>
                      <Link 
                        to="/careers" 
                        className={`text-lg font-medium transition-colors hover:text-primary ${
                          isActive('/careers') ? 'text-primary' : 'text-muted-foreground'
                        }`}
                        onClick={closeMobileMenu}
                      >
                        Career Paths
                      </Link>
                    </>
                  )}
                  <button
                    onClick={handleAboutClick}
                    className={`text-lg font-medium transition-colors hover:text-primary text-left ${
                      isActive('/') && location.hash === '#about' ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    About Us
                  </button>
                  <button
                    onClick={handleContactClick}
                    className={`text-lg font-medium transition-colors hover:text-primary text-left ${
                      isActive('/') && location.hash === '#contact' ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    Contact Us
                  </button>
                  
                  {session && !user ? (
                    // Session exists but no user - corrupted state
                    <div className="pt-4 mt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">
                        Session error - please refresh
                      </p>
                      <Button variant="ghost" className="w-full justify-start" onClick={() => { handleSignOut(); closeMobileMenu(); }}>
                        Refresh Session
                      </Button>
                    </div>
                  ) : user ? (
                    <div className="pt-4 mt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">
                        Welcome, {profile?.full_name || user.email}
                      </p>
                      <Button variant="ghost" className="w-full justify-start" onClick={() => { handleSignOut(); closeMobileMenu(); }}>
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <div className="pt-4 mt-4 border-t space-y-2">
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link to="/student/login" onClick={closeMobileMenu}>
                          <User className="h-4 w-4 mr-2" />
                          Student Login
                        </Link>
                      </Button>
                      <Button variant="hero" className="w-full" asChild>
                        <Link to="/admin/login" onClick={closeMobileMenu}>
                          Admin Login
                        </Link>
                      </Button>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};