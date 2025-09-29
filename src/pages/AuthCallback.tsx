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
        // Get all parameters from URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        // Log everything for debugging
        console.log("Full URL:", window.location.href);
        console.log("Hash:", window.location.hash);
        console.log("Search:", window.location.search);
        console.log("Hash params:", Object.fromEntries(hashParams.entries()));
        console.log("Query params:", Object.fromEntries(queryParams.entries()));

        // Try to get the session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log("Current session:", session);
        console.log("Session error:", sessionError);

        // Check for error parameters
        const error = hashParams.get("error") || queryParams.get("error") || hashParams.get("error_code");
        const errorDescription = hashParams.get("error_description") || queryParams.get("error_description");

        if (error) {
          console.error("Confirmation error:", error, errorDescription);
          setStatus("error");
          setMessage(errorDescription || "Email confirmation failed.");
          return;
        }

        // If we have a session, confirmation was successful
        if (session) {
          console.log("Session found - email confirmed!");
          // Sign out immediately to prevent auto-login
          await supabase.auth.signOut();
          
          setStatus("success");
          setMessage("Your email has been confirmed successfully!");
        } else {
          // No session and no error - might be an invalid/expired link
          console.warn("No session and no error - invalid link?");
          setStatus("error");
          setMessage("Invalid confirmation link or link has expired. Please try signing up again.");
        }
      } catch (error) {
        console.error("Error during email confirmation:", error);
        setStatus("error");
        setMessage("An error occurred during email confirmation.");
      }
    };

    // Add a small delay to ensure Supabase has processed the URL
    setTimeout(handleEmailConfirmation, 100);
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
              You can now close this tab and proceed to Login
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
