import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, GraduationCap, Eye, EyeOff } from 'lucide-react';
import logger from '@/lib/logger';

export default function StudentAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const { signUp, signIn, signOut, resetPassword, profile, user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Navigate to student dashboard when profile loads and user is student
  useEffect(() => {
    // Wait for auth loading to complete before checking
    if (!loading) {
      setAuthChecked(true);
      
      if (user && profile && profile.role === 'student') {
        navigate('/dashboard');
      }
      // If user is authenticated but not student, show error and redirect
      else if (user && profile && profile.role !== 'student') {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the student portal.",
          variant: "destructive"
        });
        // Sign out the user immediately to prevent unauthorized access
        signOut().then(() => {
          navigate('/', { replace: true });
        });
      }
    }
  }, [user, profile, navigate, loading, toast, signOut]);

  const [formError, setFormError] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');
    setEmailError('');
    setNameError('');
    setPasswordError('');
    
    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Validate full name is not empty or just whitespace
    if (!fullName || !fullName.trim()) {
      setNameError('Please enter a valid name');
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(email, password, fullName);
    
    if (!error) {
      logger.safe('Student sign up successful');
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      });
    } else {
      // Provide user-friendly error messages
      if (error.message.includes('Invalid Email') || error.message.includes('email')) {
        setEmailError('Please enter a valid email address');
      } else if (error.message.includes('Password should be at least')) {
        setPasswordError('Password must be at least 6 characters long');
      } else if (error.message.includes('User already registered')) {
        setEmailError('This email is already registered. Please sign in instead.');
      } else if (error.message.includes('Invalid Password') || error.message.includes('Password')) {
        setPasswordError('Please enter a valid password (at least 6 characters)');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        setFormError('Network error. Please check your internet connection and try again.');
      } else {
        setFormError('Unable to create account. Please try again or contact support if the issue persists.');
      }
    }
    
    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');
    setPasswordError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);
    
    if (!error) {
      logger.safe('Student sign in successful, waiting for profile to load...');
      toast({
        title: "Welcome Back!",
        description: "Redirecting to your dashboard...",
      });
    } else {
      // Provide user-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        setFormError('Incorrect email or password. Please try again.');
      } else if (error.message.includes('Email not confirmed')) {
        setFormError('Please verify your email address before signing in.');
      } else if (error.message.includes('Invalid Password') || error.message.includes('password')) {
        setPasswordError('Incorrect password. Please try again.');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        setFormError('Network error. Please check your internet connection and try again.');
      } else if (error.message.includes('too many')) {
        setFormError('Too many login attempts. Please wait a few minutes and try again.');
      } else {
        setFormError('Unable to sign in. Please check your credentials and try again.');
      }
    }
    
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');
    setEmailError('');

    if (!forgotPasswordEmail || !forgotPasswordEmail.trim()) {
      setEmailError('Please enter your email address');
      return;
    }

    setForgotPasswordLoading(true);
    const { error } = await resetPassword(forgotPasswordEmail);
    
    if (!error) {
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
    } else {
      if (error.message.includes('Invalid Email') || error.message.includes('email')) {
        setEmailError('Please enter a valid email address');
      } else {
        setFormError(error.message || 'Unable to send password reset email. Please try again.');
      }
    }
    
    setForgotPasswordLoading(false);
  };

  // Show loading state while checking auth status
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 flex items-center justify-center p-4 pt-header">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary animate-pulse" />
              </div>
            </div>
            <p className="text-muted-foreground">Loading authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  // If already authenticated but not student, show error
  if (user && profile && profile.role !== 'student') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 flex items-center justify-center p-4 pt-header">
        <div className="w-full max-w-md space-y-6">
          <Card className="border-destructive/50 shadow-xl">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-destructive">Access Denied</CardTitle>
                <CardDescription>You don't have permission to access the student portal.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                Your account is not authorized to access the student portal. 
                You are being redirected to the home page.
              </p>
              <Button 
                onClick={async () => {
                  await signOut();
                  navigate('/');
                }} 
                className="w-full"
              >
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If already authenticated as student, redirect to dashboard
  if (user && profile && profile.role === 'student') {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 flex items-center justify-center p-4 pt-header section-padding">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        <Card className="border-primary/10 shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Student Portal</CardTitle>
              <CardDescription>Sign in to your account or create a new one</CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="signin" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input 
                      id="signin-email" 
                      name="email" 
                      type="email" 
                      placeholder="your-email@example.com" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input 
                        id="signin-password" 
                        name="password" 
                        placeholder="Enter your password"
                        type={showSignInPassword ? "text" : "password"} 
                        required 
                        className={`pr-10 ${passwordError ? 'border-destructive' : ''}`}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                      >
                        {showSignInPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="text-sm text-destructive mt-1">{passwordError}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  {formError && (
                    <div className="text-sm text-destructive text-center">
                      {formError}
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
                
                {showForgotPassword && (
                  <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                    <h3 className="text-sm font-semibold mb-2">Reset Password</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Enter your email address and we'll send you a link to reset your password.
                    </p>
                    <form onSubmit={handleForgotPassword} className="space-y-3">
                      <div className="space-y-2">
                        <Input
                          type="email"
                          placeholder="your-email@example.com"
                          value={forgotPasswordEmail}
                          onChange={(e) => {
                            setForgotPasswordEmail(e.target.value);
                            setEmailError('');
                            setFormError('');
                          }}
                          required
                          className={emailError ? 'border-destructive' : ''}
                        />
                        {emailError && (
                          <p className="text-xs text-destructive">{emailError}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowForgotPassword(false);
                            setForgotPasswordEmail('');
                            setEmailError('');
                            setFormError('');
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={forgotPasswordLoading}
                          className="flex-1"
                        >
                          {forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-fullname">Full Name</Label>
                    <Input 
                      id="signup-fullname" 
                      name="fullName" 
                      type="text" 
                      placeholder="Juan Dela Cruz" 
                      required 
                      onChange={() => setNameError('')}
                      className={nameError ? 'border-destructive' : ''}
                    />
                    {nameError && (
                      <p className="text-sm text-destructive mt-1">{nameError}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input 
                      id="signup-email" 
                      name="email" 
                      type="email" 
                      placeholder="your-email@example.com" 
                      required 
                      onChange={() => setEmailError('')}
                      className={emailError ? 'border-destructive' : ''}
                    />
                    {emailError && (
                      <p className="text-sm text-destructive mt-1">{emailError}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input 
                        id="signup-password" 
                        name="password" 
                        placeholder="Enter your password"
                        type={showSignUpPassword ? "text" : "password"} 
                        minLength={6}
                        required 
                        className={`pr-10 ${passwordError ? 'border-destructive' : ''}`}
                        onChange={() => setPasswordError('')}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      >
                        {showSignUpPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="text-sm text-destructive mt-1">{passwordError}</p>
                    )}
                  </div>
                  {formError && (
                    <div className="text-sm text-destructive text-center">
                      {formError}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-2">
                    Note: Please use a valid email address. Disposable or fake emails will be rejected.
                    Password must be at least 6 characters and cannot contain only spaces.
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}