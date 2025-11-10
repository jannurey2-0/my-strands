import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simple timeout to simulate processing
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleProceedToLogin = () => {
    navigate("/student/login");
  };

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