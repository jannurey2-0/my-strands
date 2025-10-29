import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const AuthDebug = () => {
  const { user, profile, loading, signOut } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [manualProfile, setManualProfile] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Only log in development environment
    if (import.meta.env.DEV) {
      console.log("AuthDebug - Auth state:", { 
        user: user ? 'User present' : 'No user', 
        profile: profile ? 'Profile present' : 'No profile', 
        loading 
      });
    }
    setDebugInfo({ user, profile, loading });
  }, [user, profile, loading]);

  const testManualProfileFetch = async () => {
    if (!user) {
      setManualProfile({ error: "No user authenticated" });
      return;
    }

    try {
      // Only log in development environment
      if (import.meta.env.DEV) {
        console.log("Manually fetching profile for user:", user.id);
      }
      
      // Test different query approaches
      const result1 = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      // Only log in development environment
      if (import.meta.env.DEV) {
        console.log("Manual profile fetch result 1:", result1);
      }
      
      // Test with limit(1)
      const result2 = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);
      
      // Only log in development environment
      if (import.meta.env.DEV) {
        console.log("Manual profile fetch result 2:", result2);
      }
      
      setManualProfile({
        maybeSingle: result1,
        limit: result2
      });
    } catch (error) {
      console.error("Manual profile fetch error:", error);
      setManualProfile({ error });
    }
  };

  const testAuthFunctions = async () => {
    try {
      const sessionResult = await supabase.auth.getSession();
      const userResult = await supabase.auth.getUser();
      
      // Only log in development environment
      if (import.meta.env.DEV) {
        console.log("Session result:", sessionResult);
        console.log("User result:", userResult);
      }
      
      setDebugInfo(prev => ({
        ...prev,
        session: sessionResult,
        authUser: userResult
      }));
    } catch (error) {
      console.error("Auth functions error:", error);
    }
  };

  const clearSessionAndReload = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Force a page reload to reset all state
      window.location.href = '/student/login';
    } catch (error) {
      console.error("Error clearing session:", error);
    }
  };

  const refreshSession = async () => {
    try {
      // Force refresh the session
      const { data, error } = await supabase.auth.refreshSession();
      
      // Only log in development environment
      if (import.meta.env.DEV) {
        console.log("Session refresh result:", { 
          data: data ? 'Data present' : 'No data', 
          error: error ? 'Error present' : 'No error' 
        });
      }
      
      if (error) {
        console.error("Session refresh error:", error);
      }
      
      // Update debug info
      const sessionResult = await supabase.auth.getSession();
      const userResult = await supabase.auth.getUser();
      
      setDebugInfo(prev => ({
        ...prev,
        sessionRefresh: { data, error },
        session: sessionResult,
        authUser: userResult
      }));
    } catch (error) {
      console.error("Session refresh error:", error);
    }
  };

  const checkLocalStorage = () => {
    try {
      const supabaseAuthTokens = localStorage.getItem('supabase.auth.token');
      const allLocalStorage = { ...localStorage };
      
      setDebugInfo(prev => ({
        ...prev,
        localStorage: {
          supabaseAuthTokens: supabaseAuthTokens ? 'Tokens present' : 'No tokens',
          allItems: Object.keys(allLocalStorage).length
        }
      }));
      
      // Only log in development environment
      if (import.meta.env.DEV) {
        console.log("LocalStorage contents:", {
          supabaseAuthTokens: supabaseAuthTokens ? 'Tokens present' : 'No tokens',
          allItems: Object.keys(allLocalStorage)
        });
      }
    } catch (error) {
      console.error("Error checking localStorage:", error);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Debug</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Current Auth State:</h3>
              <pre className="text-sm bg-muted p-2 rounded">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>

            <div className="flex gap-4 flex-wrap">
              <Button onClick={testManualProfileFetch}>
                Test Manual Profile Fetch
              </Button>
              <Button onClick={testAuthFunctions}>
                Test Auth Functions
              </Button>
              <Button onClick={checkLocalStorage}>
                Check LocalStorage
              </Button>
              <Button onClick={refreshSession}>
                Refresh Session
              </Button>
              <Button onClick={clearSessionAndReload} variant="destructive">
                Clear Session & Reload
              </Button>
            </div>

            {manualProfile && (
              <div className="p-4 rounded bg-muted">
                <h3 className="font-medium mb-2">Manual Profile Fetch Results:</h3>
                <pre className="text-sm overflow-auto max-h-96">
                  {JSON.stringify(manualProfile, null, 2)}
                </pre>
              </div>
            )}
            
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h3 className="font-medium text-yellow-800 mb-2">Troubleshooting Steps:</h3>
              <ol className="list-decimal list-inside text-yellow-700 space-y-1">
                <li>Click "Check LocalStorage" to see if auth tokens exist</li>
                <li>Click "Test Auth Functions" to check current session state</li>
                <li>If session appears corrupted, click "Clear Session & Reload"</li>
                <li>If you want to try refreshing the session, click "Refresh Session"</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthDebug;