import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import logger from '@/lib/logger';

const TestAssessment = () => {
  const { user, profile } = useAuth();
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testTableAccess = async () => {
    setLoading(true);
    try {
      logger.debug("Testing table access...");
      
      // Test 1: Check if table exists by querying it
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('id')
        .limit(1);

      logger.debug("Table query result:", { data, error });
      
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
      logger.error("Test error:", error);
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
      logger.debug("Testing insert operation...");
      
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

      logger.debug("Insert result:", { data, error });
      
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
      logger.error("Insert error:", error);
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
              <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
                <h4 className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {testResult.success ? 'Success' : 'Error'}
                </h4>
                <p className={testResult.success ? 'text-green-700' : 'text-red-700'}>
                  {testResult.message}
                </p>
                {testResult.error && (
                  <p className="text-red-700 mt-2">
                    <strong>Error:</strong> {testResult.error}
                  </p>
                )}
                {testResult.code && (
                  <p className="text-gray-600 mt-1">
                    <strong>Code:</strong> {testResult.code}
                  </p>
                )}
                {testResult.data && (
                  <p className="text-gray-600 mt-2">
                    <strong>Data:</strong> {JSON.stringify(testResult.data, null, 2)}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestAssessment;