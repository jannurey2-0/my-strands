import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TestAssessment = () => {
  const { user, profile } = useAuth();
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testTableAccess = async () => {
    setLoading(true);
    try {
      console.log("Testing table access...");
      
      // Test 1: Check if table exists by querying it
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('id')
        .limit(1);

      console.log("Table query result:", { data, error });
      
      if (error) {
        setTestResult({
          success: false,
          message: "Failed to access assessment_responses table",
          error: error.message,
          code: error.code
        });
      } else {
        setTestResult({
          success: true,
          message: "Successfully accessed assessment_responses table",
          rowCount: data?.length || 0
        });
      }
    } catch (error: any) {
      console.error("Test error:", error);
      setTestResult({
        success: false,
        message: "Unexpected error occurred",
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const testInsert = async () => {
    if (!user || !profile) {
      setTestResult({
        success: false,
        message: "User not authenticated"
      });
      return;
    }

    setLoading(true);
    try {
      console.log("Testing insert operation...");
      
      // Test insert with minimal data
      const { data, error } = await supabase
        .from('assessment_responses')
        .insert({
          student_id: profile.id,
          basic_info: { test: "test" },
          academic_profile: { test: "test" },
          personal_interests: [],
          hobbies: [],
          aptitude_answers: {}
        })
        .select();

      console.log("Insert result:", { data, error });
      
      if (error) {
        setTestResult({
          success: false,
          message: "Failed to insert into assessment_responses table",
          error: error.message,
          code: error.code
        });
      } else {
        setTestResult({
          success: true,
          message: "Successfully inserted into assessment_responses table",
          data
        });
      }
    } catch (error: any) {
      console.error("Insert error:", error);
      setTestResult({
        success: false,
        message: "Unexpected error occurred during insert",
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Assessment Table Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Authentication Status:</h3>
              <p>User: {user ? user.email : "Not logged in"}</p>
              <p>Profile: {profile ? profile.full_name : "No profile"}</p>
            </div>

            <div className="flex gap-4">
              <Button onClick={testTableAccess} disabled={loading}>
                {loading ? "Testing..." : "Test Table Access"}
              </Button>
              <Button onClick={testInsert} disabled={loading || !user}>
                {loading ? "Inserting..." : "Test Insert"}
              </Button>
            </div>

            {testResult && (
              <div className={`p-4 rounded ${testResult.success ? "bg-green-100" : "bg-red-100"}`}>
                <h3 className="font-medium mb-2">Test Result:</h3>
                <p>{testResult.message}</p>
                {testResult.error && <p className="text-sm">Error: {testResult.error}</p>}
                {testResult.code && <p className="text-sm">Code: {testResult.code}</p>}
                {testResult.data && <p className="text-sm">Data: {JSON.stringify(testResult.data)}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestAssessment;