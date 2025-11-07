import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { User, Menu, X, GraduationCap } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const { user, profile, signOut, session, loading } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [key, setKey] = useState(0);
  const [disableAnimations, setDisableAnimations] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Reset mobile menu state and force re-render when auth state changes
  useEffect(() => {
    if (!user) {
      // Force close the mobile menu
      setMobileMenuOpen(false);
      setShowSignOutDialog(false);
      
      // Temporarily disable animations to prevent interaction issues
      setDisableAnimations(true);
      const timer = setTimeout(() => {
        setDisableAnimations(false);
      }, 300);
      
      // Force re-render of the entire header
      setKey(prev => prev + 1);
      
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Additional effect to ensure mobile menu is closed after navigation
  useEffect(() => {
    // Only close the menu if we're not already closing it
    if (mobileMenuOpen) {
      // Close menu on route change
      setMobileMenuOpen(false);
    }
  }, [location.pathname]);

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

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Check if user is a student
  const isStudent = user && profile?.role === 'student';

  // Show sign out confirmation dialog
  const confirmSignOut = () => {
    setShowSignOutDialog(true);
  };

  // Handle sign out with better error handling
  const handleSignOut = async () => {
    try {
      console.log("Initiating sign out process");
      await signOut();
      console.log("Sign out completed, navigating to home");
      
      // Show success toast notification
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      
      // Close mobile menu and dialog if open
      setMobileMenuOpen(false);
      setShowSignOutDialog(false);
      
      // Navigate to homepage after sign out
      navigate('/');
      
      // For students, force a page refresh to clean up Framer Motion animations
      // This prevents UI elements from becoming unclickable after logout
      if (isStudent) {
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    } catch (error) {
      console.error("Sign out error:", error);
      
      // Show error toast notification
      toast({
        title: "Sign Out Error",
        description: "There was an issue signing out. Please try again.",
        variant: "destructive"
      });
      
      // Close mobile menu and dialog if open
      setMobileMenuOpen(false);
      setShowSignOutDialog(false);
      
      // Navigate to homepage even if sign out fails
      navigate('/');
      
      // For students, force a page refresh to clean up Framer Motion animations
      // This prevents UI elements from becoming unclickable after logout
      if (isStudent) {
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
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
      key={key}
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-md shadow-md py-2" : "bg-background/50 py-4"
      }`}
      initial={{ y: disableAnimations ? 0 : -100 }}
      animate={{ y: 0 }}
      transition={disableAnimations ? { duration: 0 } : { duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <motion.div
                whileHover={disableAnimations ? {} : { scale: 1.05, rotate: 5 }}
                whileTap={disableAnimations ? {} : { scale: 0.95 }}
                transition={disableAnimations ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 10 }}
              >
                <GraduationCap className="h-8 w-8 text-primary" />
              </motion.div>
              <motion.span 
                className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                whileHover={disableAnimations ? {} : { scale: 1.02 }}
                transition={disableAnimations ? { duration: 0 } : { duration: 0.2 }}
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
                    whileHover={disableAnimations ? {} : { y: -2 }}
                    transition={disableAnimations ? { duration: 0 } : { duration: 0.2 }}
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
                  whileHover={disableAnimations ? {} : { y: -2 }}
                  transition={disableAnimations ? { duration: 0 } : { duration: 0.2 }}
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
                  whileHover={disableAnimations ? {} : { y: -2 }}
                  transition={disableAnimations ? { duration: 0 } : { duration: 0.2 }}
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
                  initial={disableAnimations ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={disableAnimations ? { duration: 0 } : { duration: 0.3 }}
                >
                  Welcome, {profile?.full_name || user.email}
                </motion.span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="hidden md:inline-flex">
                      <User className="h-4 w-4 mr-2" />
                      Account
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={confirmSignOut}>Sign Out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Hide signin buttons on mobile since they're in the hamburger menu */}
                <div className="hidden md:flex md:items-center md:space-x-2">
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
                        whileHover={disableAnimations ? {} : { x: 5, rotate: 10 }}
                        transition={disableAnimations ? { duration: 0 } : { duration: 0.2 }}
                      >
                        <GraduationCap className="h-4 w-4" />
                      </motion.div>
                    </Link>
                  </Button>
                </div>
              </>
            )}
            
            {/* Mobile menu button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <AnimatePresence mode="wait">
                    {mobileMenuOpen ? (
                      <motion.div
                        key="close"
                        initial={disableAnimations ? { rotate: 90, opacity: 1 } : { rotate: 0, opacity: 0 }}
                        animate={disableAnimations ? {} : { rotate: 90, opacity: 1 }}
                        exit={disableAnimations ? { rotate: 0, opacity: 0 } : { rotate: 0, opacity: 0 }}
                        transition={disableAnimations ? { duration: 0 } : { duration: 0.2 }}
                      >
                        <X className="h-6 w-6" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="menu"
                        initial={disableAnimations ? { rotate: 0, opacity: 1 } : { rotate: 90, opacity: 0 }}
                        animate={disableAnimations ? {} : { rotate: 0, opacity: 1 }}
                        exit={disableAnimations ? { rotate: 90, opacity: 0 } : { rotate: 90, opacity: 0 }}
                        transition={disableAnimations ? { duration: 0 } : { duration: 0.2 }}
                      >
                        <Menu className="h-6 w-6" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader className="text-left border-b pb-4">
                  <SheetTitle>Navigation Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-4 mt-4">
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
                        whileHover={disableAnimations ? {} : { x: 10 }}
                        transition={disableAnimations ? { duration: 0 } : { duration: 0.2 }}
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
                      whileHover={disableAnimations ? {} : { x: 10 }}
                      transition={disableAnimations ? { duration: 0 } : { duration: 0.2 }}
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
                      whileHover={disableAnimations ? {} : { x: 10 }}
                      transition={disableAnimations ? { duration: 0 } : { duration: 0.2 }}
                    >
                      Contact Us
                    </motion.div>
                  </button>
                  
                  {user ? (
                    <div className="pt-4 border-t border-border">
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground">Signed in as</p>
                        <p className="font-medium truncate">{profile?.full_name || user.email}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => {
                          closeMobileMenu();
                          navigate('/profile');
                        }}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="w-full justify-start mt-2"
                        onClick={() => {
                          closeMobileMenu();
                          confirmSignOut();
                        }}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-border space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => {
                          closeMobileMenu();
                          navigate('/student/login');
                        }}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Student Login
                      </Button>
                      <Button 
                        variant="default" 
                        className="w-full justify-start"
                        onClick={() => {
                          closeMobileMenu();
                          navigate('/admin/login');
                        }}
                      >
                        <GraduationCap className="h-4 w-4 mr-2" />
                        Admin Login
                      </Button>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      
      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You will be redirected to the homepage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut}>Sign Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.header>
  );
};