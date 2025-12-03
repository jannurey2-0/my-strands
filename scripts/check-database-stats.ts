/**
 * Script to check database statistics: user count and assessment response count
 * 
 * Usage:
 *   npx tsx scripts/check-database-stats.ts
 * 
 * Or with ts-node:
 *   npx ts-node scripts/check-database-stats.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

// Load environment variables - try .env.local first, then .env
const envLocalPath = join(process.cwd(), '.env.local');
const envPath = join(process.cwd(), '.env');

if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
  console.log('📝 Loaded environment variables from .env.local');
} else if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('📝 Loaded environment variables from .env');
} else {
  // Try default dotenv behavior (loads .env from current directory)
  dotenv.config();
  console.log('📝 Attempted to load environment variables (default behavior)');
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('   - VITE_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease set these in your .env or .env.local file');
  process.exit(1);
}

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkDatabaseStats() {
  console.log('\n🔍 Checking database statistics...\n');

  try {
    // Count users from profiles table
    console.log('📊 Counting users from profiles table...');
    const { count: userCount, error: userError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (userError) {
      console.error('❌ Error counting users:', userError);
    } else {
      console.log(`✅ Total users (profiles): ${userCount || 0}`);
    }

    // Count assessment responses
    console.log('\n📊 Counting assessment responses...');
    const { count: assessmentCount, error: assessmentError } = await supabase
      .from('assessment_responses')
      .select('*', { count: 'exact', head: true });

    if (assessmentError) {
      console.error('❌ Error counting assessment responses:', assessmentError);
    } else {
      console.log(`✅ Total assessment responses: ${assessmentCount || 0}`);
    }

    // Get breakdown by actual strand (if available)
    console.log('\n📊 Assessment responses breakdown by actual strand...');
    const { data: strandData, error: strandError } = await supabase
      .from('assessment_responses')
      .select('actual_strand');

    if (strandError) {
      console.error('❌ Error getting strand breakdown:', strandError);
    } else if (strandData) {
      const strandCounts: Record<string, number> = {};
      let withStrand = 0;
      let withoutStrand = 0;

      strandData.forEach((response) => {
        if (response.actual_strand) {
          const strand = response.actual_strand as string;
          strandCounts[strand] = (strandCounts[strand] || 0) + 1;
          withStrand++;
        } else {
          withoutStrand++;
        }
      });

      console.log(`   Responses with actual strand: ${withStrand}`);
      console.log(`   Responses without actual strand: ${withoutStrand}`);
      
      if (Object.keys(strandCounts).length > 0) {
        console.log('\n   Strand distribution:');
        Object.entries(strandCounts)
          .sort(([, a], [, b]) => b - a)
          .forEach(([strand, count]) => {
            const percentage = ((count / withStrand) * 100).toFixed(1);
            console.log(`     ${strand}: ${count} (${percentage}%)`);
          });
      }
    }

    // Get users with assessments count
    console.log('\n📊 Users with assessment responses...');
    const { data: userAssessments, error: userAssessmentsError } = await supabase
      .from('assessment_responses')
      .select('student_id')
      .not('student_id', 'is', null);

    if (userAssessmentsError) {
      console.error('❌ Error counting users with assessments:', userAssessmentsError);
    } else if (userAssessments) {
      const uniqueStudentIds = new Set(userAssessments.map(a => a.student_id));
      console.log(`✅ Users with at least one assessment: ${uniqueStudentIds.size}`);
      
      // Calculate average assessments per user
      if (uniqueStudentIds.size > 0) {
        const avgAssessments = (userAssessments.length / uniqueStudentIds.size).toFixed(2);
        console.log(`   Average assessments per user: ${avgAssessments}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📈 SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Users: ${userCount || 0}`);
    console.log(`Total Assessment Responses: ${assessmentCount || 0}`);
    if (userCount && userCount > 0) {
      const avgPerUser = ((assessmentCount || 0) / userCount).toFixed(2);
      console.log(`Average Assessments per User: ${avgPerUser}`);
    }
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
checkDatabaseStats()
  .then(() => {
    console.log('✅ Database statistics check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

