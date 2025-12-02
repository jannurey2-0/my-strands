import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  useEffect(() => {
    // Check if this is a password reset callback
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    const queryType = searchParams.get('type');

    if (type === 'recovery' || queryType === 'recovery') {
      // This is a password reset flow, redirect to reset password page
      setIsPasswordReset(true);
      // Preserve the hash/query params for the reset password page
      const hash = window.location.hash;
      const query = window.location.search;
      navigate(`/auth/reset-password${hash || query}`, { replace: true });
      return;
    }

    // Otherwise, it's an email confirmation
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate, searchParams]);

  const handleProceedToLogin = () => {
    navigate("/student/login");
  };

  // If it's a password reset, don't render anything (redirect is happening)
  if (isPasswordReset) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {loading ? (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            ) : (
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {loading ? "Processing..." : "Email Confirmed!"}
          </CardTitle>
          <CardDescription>
            {loading 
              ? "Please wait while we process your email confirmation." 
              : "Your email has been successfully confirmed. You can now sign in with your credentials."}
          </CardDescription>
        </CardHeader>
        {!loading && (
          <CardContent className="space-y-4">
            <Button
              onClick={handleProceedToLogin}
              className="w-full"
              size="lg"
            >
              Proceed to Login
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}