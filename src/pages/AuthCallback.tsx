import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Check for error parameters first
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        const error = hashParams.get("error") || queryParams.get("error");
        const errorDescription = hashParams.get("error_description") || queryParams.get("error_description");

        if (error) {
          console.error("Confirmation error:", error, errorDescription);
          setStatus("error");
          setMessage(errorDescription || "Email confirmation failed.");
          return;
        }

        // Wait for Supabase to process the URL and establish session
        // Using onAuthStateChange to wait for the SIGNED_IN event
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log("Auth event during confirmation:", event, session);
            
            if (event === 'SIGNED_IN' && session) {
              // Email confirmed successfully
              console.log("Email confirmed - session established");
              
              // Sign out to prevent auto-login
              await supabase.auth.signOut();
              
              setStatus("success");
              setMessage("Email confirmed! You can now log in with your credentials.");
              
              // Unsubscribe after handling
              subscription.unsubscribe();
            } else if (event === 'USER_UPDATED') {
              // Also handle USER_UPDATED event
              const { data: { session: currentSession } } = await supabase.auth.getSession();
              if (currentSession) {
                console.log("User updated - email confirmed");
                await supabase.auth.signOut();
                setStatus("success");
                setMessage("Email confirmed! You can now log in with your credentials.");
                subscription.unsubscribe();
              }
            }
          }
        );

        // Timeout after 10 seconds if no auth event received
        setTimeout(() => {
          subscription.unsubscribe();
          if (status === "loading") {
            setStatus("error");
            setMessage("Confirmation timeout. The link may have expired. Please try signing up again.");
          }
        }, 10000);

      } catch (error) {
        console.error("Error during email confirmation:", error);
        setStatus("error");
        setMessage("An error occurred during email confirmation.");
      }
    };

    handleEmailConfirmation();
  }, [status]);

  const handleProceedToLogin = () => {
    navigate("/student/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === "loading" && (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            )}
            {status === "success" && (
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            )}
            {status === "error" && (
              <XCircle className="h-16 w-16 text-destructive" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === "loading" && "Confirming Email..."}
            {status === "success" && "Email Confirmed!"}
            {status === "error" && "Confirmation Failed"}
          </CardTitle>
          <CardDescription>
            {status === "loading" && "Please wait while we confirm your email address."}
            {message}
          </CardDescription>
        </CardHeader>
        {status === "success" && (
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
        {status === "error" && (
          <CardContent className="space-y-4">
            <Button
              onClick={() => navigate("/student/login")}
              variant="outline"
              className="w-full"
            >
              Back to Login
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
