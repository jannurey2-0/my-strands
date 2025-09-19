import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { User, Menu, X, GraduationCap } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const Header = () => {
  const { user, profile, signOut, session, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      console.log("Initiating sign out process");
      await signOut();
      console.log("Sign out completed, navigating to home");
      // Navigate to home page with success parameter
      navigate('/?signout=success');
    } catch (error) {
      console.error("Sign out error:", error);
      // Even if sign out fails, navigate to home to reset UI state
      navigate('/?signout=success');
    } finally {
      // Close mobile menu if open
      setMobileMenuOpen(false);
    }
  };

  const navItems = isStudent
    ? [
        { name: "Dashboard", path: "/dashboard" },
        { name: "Assessment", path: "/assessment" },
        { name: "Career Paths", path: "/careers" },
      ]
    : [
        { name: "Home", path: "/" },
        { name: "Career Paths", path: "/careers" },
      ];

  return (
    <motion.header 
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-md shadow-md py-2" : "bg-background/50 py-4"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <GraduationCap className="h-8 w-8 text-primary" />
              </motion.div>
              <motion.span 
                className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                SHSNavigator
              </motion.span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-1 ml-10">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                  }`}
                >
                  <motion.span
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center"
                  >
                    {item.name}
                  </motion.span>
                </Link>
              ))}
              <button
                onClick={handleAboutClick}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive('/') && location.hash === '#about'
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                }`}
              >
                <motion.span
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  About Us
                </motion.span>
              </button>
              <button
                onClick={handleContactClick}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive('/') && location.hash === '#contact'
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                }`}
              >
                <motion.span
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  Contact Us
                </motion.span>
              </button>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {loading ? (
              // While loading, show a simple loading indicator
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : session && !user ? (
              // Session exists but no user - corrupted state
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Session error</span>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  Refresh
                </Button>
              </div>
            ) : user ? (
              <>
                <motion.span 
                  className="text-sm text-muted-foreground hidden sm:inline"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  Welcome, {profile?.full_name || user.email}
                </motion.span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="group"
                >
                  Sign Out
                  <motion.div
                    className="ml-2"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <User className="h-4 w-4" />
                  </motion.div>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="group">
                  <Link to="/student/login">
                    <User className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline ml-2">Student Login</span>
                  </Link>
                </Button>
                <Button variant="hero" size="sm" asChild className="group">
                  <Link to="/admin/login">
                    <span>Admin Login</span>
                    <motion.div
                      className="ml-2"
                      whileHover={{ x: 5, rotate: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <GraduationCap className="h-4 w-4" />
                    </motion.div>
                  </Link>
                </Button>
              </>
            )}
            
            {/* Mobile menu button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <AnimatePresence mode="wait">
                    {mobileMenuOpen ? (
                      <motion.div
                        key="close"
                        initial={{ rotate: 0, opacity: 0 }}
                        animate={{ rotate: 90, opacity: 1 }}
                        exit={{ rotate: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <X className="h-6 w-6" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="menu"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Menu className="h-6 w-6" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col space-y-4 mt-8">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`text-lg font-medium transition-colors hover:text-primary ${
                        isActive(item.path) ? 'text-primary' : 'text-muted-foreground'
                      }`}
                      onClick={closeMobileMenu}
                    >
                      <motion.div
                        whileHover={{ x: 10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {item.name}
                      </motion.div>
                    </Link>
                  ))}
                  <button
                    onClick={handleAboutClick}
                    className={`text-lg font-medium transition-colors hover:text-primary text-left ${
                      isActive('/') && location.hash === '#about' ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <motion.div
                      whileHover={{ x: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      About Us
                    </motion.div>
                  </button>
                  <button
                    onClick={handleContactClick}
                    className={`text-lg font-medium transition-colors hover:text-primary text-left ${
                      isActive('/') && location.hash === '#contact' ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <motion.div
                      whileHover={{ x: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      Contact Us
                    </motion.div>
                  </button>
                  
                  {loading ? (
                    // While loading, show a simple loading indicator
                    <div className="pt-4 mt-4 border-t">
                      <p className="text-sm text-muted-foreground">Loading authentication...</p>
                    </div>
                  ) : session && !user ? (
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
    </motion.header>
  );
};