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
        // Get URL parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        // Log everything for debugging
        console.log("Full URL:", window.location.href);
        console.log("Hash:", window.location.hash);
        console.log("Search:", window.location.search);
        console.log("Hash params:", Object.fromEntries(hashParams.entries()));
        console.log("Query params:", Object.fromEntries(queryParams.entries()));

        // Check for error parameters first
        const error = hashParams.get("error") || queryParams.get("error") || hashParams.get("error_code");
        const errorDescription = hashParams.get("error_description") || queryParams.get("error_description");

        if (error) {
          console.error("Confirmation error:", error, errorDescription);
          setStatus("error");
          setMessage(errorDescription || "Email confirmation failed.");
          return;
        }

        // Let Supabase handle the OAuth flow automatically
        // Supabase will automatically detect and handle the code parameter with PKCE
        console.log("Letting Supabase handle OAuth flow automatically...");
        
        // Get the current session - Supabase should have automatically processed the code
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
        }
        
        console.log("Session after auto-processing:", session);

        // Check if we have a session with a confirmed user
        if (session?.user?.email_confirmed_at) {
          console.log("Email confirmed via auto-processed session!");
          // Sign out immediately to prevent auto-login, but show success message
          await supabase.auth.signOut();
          
          setStatus("success");
          setMessage("Email successfully confirmed! You can now sign in with your credentials.");
          return;
        }

        // If no session but we have a code, try to get user data directly
        const code = queryParams.get("code");
        if (code) {
          console.log("Code found, trying to get user data directly...");
          // Try to get user data directly - the email might already be confirmed
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.error("Error getting user:", userError);
          }
          
          console.log("User data:", user);
          
          if (user?.email_confirmed_at) {
            console.log("Email confirmed via direct user check!");
            // Sign out immediately to prevent auto-login
            await supabase.auth.signOut();
            
            setStatus("success");
            setMessage("Email successfully confirmed! You can now sign in with your credentials.");
            return;
          } else if (user) {
            console.log("User exists but email not yet confirmed");
            setStatus("error");
            setMessage("Email confirmation is still processing. Please wait a moment and try signing in.");
            return;
          }
        }

        // If we get here, it might be an invalid or expired link
        console.warn("No valid session or user found - possibly invalid/expired link");
        setStatus("error");
        setMessage("Invalid confirmation link or link has expired. Please try signing up again.");
      } catch (error) {
        console.error("Error during email confirmation:", error);
        setStatus("error");
        setMessage("An error occurred during email confirmation. Please try again.");
      }
    };

    handleEmailConfirmation();
  }, []);

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