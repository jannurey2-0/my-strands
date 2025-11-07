#!/usr/bin/env tsx
// Script to test the actual_strand functionality
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { supabase } from '../services/supabaseClient';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the project root
const envPath = path.join(__dirname, '../../..', '.env');
dotenv.config({ path: envPath });

async function testActualStrand() {
  console.log('Testing actual_strand functionality...');
  
  try {
    // Fetch a sample assessment record
    const { data: assessments, error } = await supabase
      .from('assessment_responses')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error fetching assessment:', error);
      return;
    }
    
    if (!assessments || assessments.length === 0) {
      console.log('No assessments found in database.');
      return;
    }
    
    const assessment: any = assessments[0];
    console.log('Sample assessment:', {
      id: assessment.id,
      recommendations: assessment.recommendations,
      actual_strand: assessment.actual_strand
    });
    
    // Test updating with sample recommendations
    if (assessment.recommendations) {
      console.log('Testing saveRecommendations with actual strand...');
      
      // Find the strand with highest percentage
      const recommendations = assessment.recommendations as Record<string, number>;
      let highestStrand = '';
      let highestPercentage = 0;
      
      Object.entries(recommendations).forEach(([strand, percentage]) => {
        if (percentage > highestPercentage) {
          highestPercentage = percentage;
          highestStrand = strand;
        }
      });
      
      console.log(`Highest strand: ${highestStrand} (${highestPercentage}%)`);
      
      // Update the assessment with the actual strand
      const { data: updated, error: updateError } = await supabase
        .from('assessment_responses')
        .update({
          actual_strand: highestStrand
        } as any)
        .eq('id', assessment.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating assessment:', updateError);
      } else {
        console.log('Successfully updated assessment with actual strand:', (updated as any).actual_strand);
      }
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testActualStrand();
}

export default testActualStrand;