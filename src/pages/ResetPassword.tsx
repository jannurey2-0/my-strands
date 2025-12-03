import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isValidating, setIsValidating] = useState(true);
  
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    let mounted = true;
    let validationTimeout: NodeJS.Timeout;

    const validateResetLink = async () => {
      try {
        // Check for code or hash in URL (PKCE uses code, older flows use hash)
        const code = searchParams.get('code');
        const hash = window.location.hash;
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type') || searchParams.get('type');

        // If no code/hash/token, invalid link
        if (!code && !accessToken && !hash) {
          if (mounted) {
            toast({
              title: "Invalid reset link",
              description: "This password reset link is invalid. Please request a new one.",
              variant: "destructive"
            });
            navigate('/student/login');
          }
          return;
        }

        // FIRST: Check if session already exists (Supabase's detectSessionInUrl may have already processed it)
        let { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (session) {
          console.log('✅ Session already exists, validation successful');
          if (mounted) {
            setIsValidating(false);
          }
          return;
        }

        // If we have a code, wait for Supabase's detectSessionInUrl to process it automatically
        // With detectSessionInUrl: true, Supabase will automatically exchange the code
        // We just need to wait for it to complete
        if (code) {
          console.log('Found code parameter, waiting for Supabase auto-detection...');
          
          // Wait for Supabase to process the code (detectSessionInUrl handles this)
          // The onAuthStateChange listener will catch the SIGNED_IN event
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Check session again
          const { data: { session: newSession } } = await supabase.auth.getSession();
          if (newSession) {
            console.log('✅ Session found after waiting for auto-detection');
            if (mounted) {
              setIsValidating(false);
            }
            return;
          }
        }

        // For hash-based flow (older Supabase versions)
        if (accessToken || hash) {
          console.log('Found hash/access token, waiting for Supabase to process...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: { session: hashSession } } = await supabase.auth.getSession();
          
          if (hashSession) {
            if (mounted) {
              setIsValidating(false);
            }
            return;
          }
        }

        // If still no session after waiting, the link might be invalid
        // But give it one more moment since auth state changes are async
        await new Promise(resolve => setTimeout(resolve, 1000));
        const { data: { session: finalSession } } = await supabase.auth.getSession();
        
        if (finalSession) {
          console.log('✅ Session found on final check');
          if (mounted) {
            setIsValidating(false);
          }
          return;
        }

        // Still no session - link might be invalid or expired
        if (mounted) {
          console.error('❌ No session found after waiting:', { 
            code: !!code, 
            accessToken: !!accessToken 
          });
          toast({
            title: "Invalid or expired link",
            description: "This password reset link is invalid or has expired. Please request a new one.",
            variant: "destructive"
          });
          navigate('/student/login');
        }
      } catch (err) {
        console.error('Error validating reset link:', err);
        if (mounted) {
          toast({
            title: "Error",
            description: "An error occurred while validating the reset link.",
            variant: "destructive"
          });
          navigate('/student/login');
        }
      }
    };

    // Listen for auth state changes - Supabase will fire PASSWORD_RECOVERY or SIGNED_IN when code is processed
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted && (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session))) {
        console.log('Password recovery session established:', event);
        setIsValidating(false);
      }
    });

    // Start validation
    validateResetLink();

    return () => {
      mounted = false;
      if (validationTimeout) clearTimeout(validationTimeout);
      subscription.unsubscribe();
    };
  }, [navigate, toast, searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Validation
    if (!newPassword || !newPassword.trim()) {
      setPasswordError('Password cannot be empty');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await updatePassword(newPassword);

      if (updateError) {
        setError(updateError.message || 'Failed to update password. Please try again.');
      } else {
        toast({
          title: "Password reset successful",
          description: "Your password has been updated. You can now sign in with your new password.",
        });
        navigate('/student/login');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-muted-foreground">Validating reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="border-primary/10 shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
              <CardDescription>Enter your new password below</CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError('');
                      setError('');
                    }}
                    required
                    minLength={6}
                    className={`pr-10 ${passwordError ? 'border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-sm text-destructive">{passwordError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setConfirmPasswordError('');
                      setError('');
                    }}
                    required
                    minLength={6}
                    className={`pr-10 ${confirmPasswordError ? 'border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {confirmPasswordError && (
                  <p className="text-sm text-destructive">{confirmPasswordError}</p>
                )}
              </div>

              {error && (
                <div className="text-sm text-destructive text-center">
                  {error}
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Password must be at least 6 characters long.
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Updating Password...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
