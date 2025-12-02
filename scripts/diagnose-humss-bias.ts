/**
 * Diagnostic script to check for HUMSS bias in the model
 * 
 * Usage:
 *   npx tsx scripts/diagnose-humss-bias.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

// Load environment variables
const envLocalPath = join(process.cwd(), '.env.local');
const envPath = join(process.cwd(), '.env');

if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function diagnoseBias() {
  console.log('🔍 Diagnosing HUMSS bias in model predictions...\n');
  
  try {
    // 1. Check data distribution
    console.log('📊 Step 1: Checking training data distribution...');
    const { data: assessments, error } = await supabase
      .from('assessment_responses')
      .select('actual_strand')
      .not('actual_strand', 'is', null);
    
    if (error) {
      throw new Error(`Failed to fetch assessments: ${error.message}`);
    }
    
    if (!assessments || assessments.length === 0) {
      console.log('⚠️  No assessments with actual_strand found');
      return;
    }
    
    const strandCounts: Record<string, number> = {};
    assessments.forEach(a => {
      const strand = a.actual_strand as string;
      strandCounts[strand] = (strandCounts[strand] || 0) + 1;
    });
    
    const total = assessments.length;
    console.log(`\nTotal assessments with actual_strand: ${total}`);
    console.log('\nStrand distribution:');
    Object.entries(strandCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([strand, count]) => {
        const percentage = ((count / total) * 100).toFixed(2);
        console.log(`  ${strand.padEnd(8)}: ${count.toString().padStart(4)} (${percentage}%)`);
      });
    
    // Check if HUMSS is overrepresented
    const humssCount = strandCounts['HUMSS'] || 0;
    const humssPercentage = (humssCount / total) * 100;
    const expectedPercentage = 100 / 6; // ~16.67% for balanced data
    
    console.log(`\n📈 Analysis:`);
    console.log(`  Expected percentage per strand: ~16.67%`);
    console.log(`  HUMSS percentage: ${humssPercentage.toFixed(2)}%`);
    
    if (humssPercentage > expectedPercentage * 1.5) {
      console.log(`  ⚠️  HUMSS is overrepresented by ${(humssPercentage - expectedPercentage).toFixed(2)}%`);
      console.log(`  This could cause the model to bias toward HUMSS predictions.`);
    } else {
      console.log(`  ✓ HUMSS distribution looks balanced`);
    }
    
    // 2. Check recent predictions (if stored)
    console.log('\n📊 Step 2: Checking recent predictions...');
    const { data: recentAssessments } = await supabase
      .from('assessment_responses')
      .select('recommendations, actual_strand')
      .not('recommendations', 'is', null)
      .order('submitted_at', { ascending: false })
      .limit(50);
    
    if (recentAssessments && recentAssessments.length > 0) {
      console.log(`\nAnalyzing ${recentAssessments.length} recent assessments with predictions...`);
      
      const predictionCounts: Record<string, number> = {};
      let totalPredictions = 0;
      
      recentAssessments.forEach(assessment => {
        const recommendations = assessment.recommendations as Record<string, number>;
        if (recommendations) {
          // Find the strand with highest score
          const topStrand = Object.entries(recommendations)
            .sort((a, b) => b[1] - a[1])[0][0];
          predictionCounts[topStrand] = (predictionCounts[topStrand] || 0) + 1;
          totalPredictions++;
        }
      });
      
      console.log('\nTop predicted strands:');
      Object.entries(predictionCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([strand, count]) => {
          const percentage = ((count / totalPredictions) * 100).toFixed(2);
          console.log(`  ${strand.padEnd(8)}: ${count.toString().padStart(4)} (${percentage}%)`);
        });
      
      const humssPredictions = predictionCounts['HUMSS'] || 0;
      const humssPredPercentage = (humssPredictions / totalPredictions) * 100;
      
      console.log(`\n📈 Prediction Analysis:`);
      console.log(`  HUMSS predictions: ${humssPredPercentage.toFixed(2)}%`);
      
      if (humssPredPercentage > 40) {
        console.log(`  ⚠️  HUMSS is being predicted too frequently (>40%)`);
        console.log(`  This confirms a bias toward HUMSS in the model.`);
      }
    } else {
      console.log('  No recent predictions found in database');
    }
    
    // 3. Recommendations
    console.log('\n💡 Recommendations:');
    console.log('  1. If HUMSS is overrepresented in training data:');
    console.log('     - Balance the training data by:');
    console.log('       * Generating more assessments for underrepresented strands');
    console.log('       * Using class weights during training (already enabled)');
    console.log('       * Undersampling HUMSS or oversampling other strands');
    console.log('');
    console.log('  2. If predictions are biased despite balanced data:');
    console.log('     - The model may need more training epochs');
    console.log('     - Consider adjusting the learning rate');
    console.log('     - Try increasing dropout rate for better generalization');
    console.log('     - Consider using temperature scaling to adjust predictions');
    console.log('');
    console.log('  3. Quick fix options:');
    console.log('     - Use a hybrid approach: combine ML + rule-based scoring');
    console.log('     - Apply post-processing to normalize predictions');
    console.log('     - Retrain with balanced data distribution');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

diagnoseBias();

