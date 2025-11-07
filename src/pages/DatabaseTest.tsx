import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DatabaseTest = () => {
  const { user, profile } = useAuth();
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    try {
      console.log("Testing database access...");
      
      // Test 1: Check user profile and role
      console.log("User profile:", profile);
      
      // Test 2: Check if we can access aptitude questions
      const { data: questions, error: questionsError } = await supabase
        .from('aptitude_questions')
        .select('*')
        .limit(5);
        
      console.log("Questions test:", { questions, questionsError });
      
      // Test 3: Try to call the assessment attempt function
      if (profile?.id) {
        console.log("Attempting to call get_or_create_assessment_attempt with p_student_id:", profile.id);
        const { data: attemptId, error: attemptError } = await (supabase as any)
          .rpc('get_or_create_assessment_attempt', { 
            p_student_id: profile.id  // Changed from student_id to p_student_id to match function definition
          })
          .single();
          
        console.log("Attempt function test:", { attemptId, attemptError });
        
        // If we got an attempt ID, fetch the complete attempt data
        let attemptData = null;
        let attemptQuestions = null;
        let attemptQuestionsError = null;
        
        if (attemptId && !attemptError) {
          // Fetch the complete attempt data using raw SQL
          const { data: fullAttemptData, error: fetchError } = await (supabase as any)
            .from('assessment_attempts')
            .select('*')
            .eq('id', attemptId)
            .single();
            
          if (fetchError) {
            console.error("Error fetching attempt data:", fetchError);
          } else {
            attemptData = fullAttemptData;
            console.log("Full attempt data:", attemptData);
            
            // If we got the attempt data, try to fetch its questions
            if (attemptData.question_ids && attemptData.question_ids.length > 0) {
              const { data: questions, error: questionsError } = await supabase
                .from('aptitude_questions')
                .select('*')
                .in('id', attemptData.question_ids);
                
              attemptQuestions = questions;
              attemptQuestionsError = questionsError;
              
              console.log("Attempt questions test:", { attemptQuestions, attemptQuestionsError });
            }
          }
        }
        
        setTestResults({
          userProfile: profile,
          questionsTest: { questions, questionsError },
          attemptFunctionTest: { attemptId, attemptError },
          attemptData: attemptData,
          attemptQuestions: { attemptQuestions, attemptQuestionsError }
        });
      } else {
        setTestResults({
          userProfile: profile,
          questionsTest: { questions, questionsError },
          error: "No user profile found. Please make sure you're logged in as a student."
        });
      }
    } catch (error) {
      console.error("Test error:", error);
      setTestResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Database Access Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p>User: {user?.email || "Not logged in"}</p>
              <p>Profile Role: {profile?.role || "No profile"}</p>
            </div>
            
            <Button onClick={runTest} disabled={loading || !user}>
              {loading ? "Running Tests..." : "Run Database Tests"}
            </Button>
            
            {testResults && (
              <div className="mt-4 p-4 bg-muted rounded">
                <h3 className="font-bold mb-2">Test Results:</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(testResults, null, 2)}
                </pre>
              </div>
            )}
            
            <div className="mt-4 p-4 bg-info rounded">
              <h3 className="font-bold mb-2">Troubleshooting:</h3>
              <p>If you're still getting errors:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Make sure you're logged in as a student</li>
                <li>Check that the database migrations have been applied</li>
                <li>Verify that there are aptitude questions in the database</li>
                <li>Check the browser console for detailed error messages</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseTest;