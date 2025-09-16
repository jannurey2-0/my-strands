import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DatabaseTest = () => {
  const { user, profile } = useAuth();
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testDatabaseConnection = async () => {
    setLoading(true);
    try {
      // Test 1: Check if we can access the profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      console.log("Profiles table test:", { profilesData, profilesError });

      // Test 2: Check if assessment_responses table exists
      const { data: assessmentTableData, error: assessmentTableError } = await supabase
        .from('assessment_responses')
        .select('*')
        .limit(1);

      console.log("Assessment responses table test:", { assessmentTableData, assessmentTableError });

      // Test 3: Check table structure
      const { data: tableInfo, error: tableInfoError } = await supabase
        .from('assessment_responses')
        .select('id, student_id, basic_info, academic_profile, personal_interests, hobbies, aptitude_answers, submitted_at, updated_at')
        .limit(1);

      console.log("Table structure test:", { tableInfo, tableInfoError });

      // Test 4: Check RLS policies
      const { data: rlsTest, error: rlsError } = await supabase
        .from('assessment_responses')
        .select('student_id')
        .limit(1);

      console.log("RLS test:", { rlsTest, rlsError });

      setTestResults({
        profiles: { data: profilesData, error: profilesError },
        assessmentTable: { data: assessmentTableData, error: assessmentTableError },
        tableStructure: { data: tableInfo, error: tableInfoError },
        rlsTest: { data: rlsTest, error: rlsError }
      });
    } catch (error) {
      console.error("Database test error:", error);
      setTestResults({ error });
    } finally {
      setLoading(false);
    }
  };

  const testInsert = async () => {
    if (!user || !profile) {
      setTestResults({ error: "User not authenticated" });
      return;
    }

    setLoading(true);
    try {
      console.log("Testing insert with profile:", profile);

      // Test insert with minimal data
      const testData = {
        student_id: profile.id,
        basic_info: { fullName: "Test User", age: "25", gender: "male", school: "Test School", region: "Test Region", email: "test@example.com" },
        academic_profile: { gwa: "1.5", favoriteSubject: "Math", leastFavoriteSubject: "Science" },
        personal_interests: ["Science", "Technology"],
        hobbies: ["Reading", "Sports"],
        aptitude_answers: { 1: 0, 2: 1 }
      };

      console.log("Insert test data:", testData);

      // First, check if the profile exists
      const { data: profileCheck, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id, user_id')
        .eq('id', profile.id)
        .single();

      console.log("Profile check:", { profileCheck, profileCheckError });

      const { data, error } = await supabase
        .from('assessment_responses')
        .insert(testData)
        .select();

      console.log("Insert result:", { data, error });

      setTestResults({
        profileCheck: { data: profileCheck, error: profileCheckError },
        insert: { data, error }
      });
    } catch (error: any) {
      console.error("Insert test error:", error);
      setTestResults({ insert: { error: error.message } });
    } finally {
      setLoading(false);
    }
  };

  const testAuthInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: session } = await supabase.auth.getSession();
      
      console.log("Auth info:", { user, session });
      
      setTestResults({
        authInfo: { user, session }
      });
    } catch (error) {
      console.error("Auth info error:", error);
      setTestResults({ authInfo: { error } });
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Database Connection Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Authentication Status:</h3>
              <p>User: {user ? user.email : "Not logged in"}</p>
              <p>Profile: {profile ? `${profile.full_name} (${profile.id})` : "No profile"}</p>
              <p>User ID: {user ? user.id : "N/A"}</p>
            </div>

            <div className="flex gap-4 flex-wrap">
              <Button onClick={testDatabaseConnection} disabled={loading}>
                {loading ? "Testing..." : "Test Database Connection"}
              </Button>
              <Button onClick={testInsert} disabled={loading || !user}>
                {loading ? "Testing Insert..." : "Test Insert"}
              </Button>
              <Button onClick={testAuthInfo} disabled={loading}>
                {loading ? "Getting Auth Info..." : "Get Auth Info"}
              </Button>
            </div>

            {testResults && (
              <div className="p-4 rounded bg-muted">
                <h3 className="font-medium mb-2">Test Results:</h3>
                <pre className="text-sm overflow-auto max-h-96">
                  {JSON.stringify(testResults, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DatabaseTest;