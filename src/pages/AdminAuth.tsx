import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Shield } from 'lucide-react';

export default function AdminAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const { signIn, signOut, resetPassword, profile, user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Navigate to admin dashboard when profile loads and user is admin
  useEffect(() => {
    // Wait for auth loading to complete before checking
    if (!loading) {
      setAuthChecked(true);
      
      if (user && profile && profile.role === 'admin') {
        // Only log in development environment
        if (import.meta.env.DEV) {
          console.log('Admin authenticated, navigating to admin dashboard');
        }
        navigate('/admin/dashboard');
      }
      // If user is authenticated but not admin, show error and redirect
      else if (user && profile && profile.role !== 'admin') {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin portal.",
          variant: "destructive"
        });
        // Sign out the user immediately to prevent unauthorized access
        signOut().then(() => {
          navigate('/', { replace: true });
        });
      }
    }
  }, [user, profile, navigate, loading, toast, signOut]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);
    
    if (error) {
      setIsLoading(false);
      return;
    }
    
    // Successfully authenticated, now check role
    // Only log in development environment
    if (import.meta.env.DEV) {
      console.log('Admin sign in successful, waiting for profile to load...');
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setForgotPasswordError('');

    if (!forgotPasswordEmail || !forgotPasswordEmail.trim()) {
      setForgotPasswordError('Please enter your email address');
      return;
    }

    setForgotPasswordLoading(true);
    const { error } = await resetPassword(forgotPasswordEmail);
    
    if (!error) {
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
    } else {
      setForgotPasswordError(error.message || 'Unable to send password reset email. Please try again.');
    }
    
    setForgotPasswordLoading(false);
  };

  // Show loading state while checking auth status
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary animate-pulse" />
              </div>
            </div>
            <p className="text-muted-foreground">Loading authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  // If already authenticated but not admin, show error
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
                <CardDescription>You don't have permission to access the admin portal.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                Your account is not authorized to access the admin portal. 
                Please sign in with an administrator account.
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

  // If already authenticated as admin, redirect to dashboard
  if (user && profile && profile.role === 'admin') {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 flex items-center justify-center p-4">
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
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
              <CardDescription>Sign in to access administrative features</CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={(e) => handleSignIn(e)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input 
                  id="admin-email" 
                  name="email" 
                  type="email" 
                  placeholder="Enter your email" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input 
                  id="admin-password" 
                  name="password" 
                  type="password" 
                  placeholder='Enter your password'
                  required 
                />
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
              {forgotPasswordError && (
                <div className="text-sm text-destructive text-center">
                  {forgotPasswordError}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In as Admin'}
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
                      placeholder="admin@example.com"
                      value={forgotPasswordEmail}
                      onChange={(e) => {
                        setForgotPasswordEmail(e.target.value);
                        setForgotPasswordError('');
                      }}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordEmail('');
                        setForgotPasswordError('');
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
            
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Admin accounts are created manually. Contact your system administrator if you need access.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}