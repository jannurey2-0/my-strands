#!/usr/bin/env tsx
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { mlAssessmentService } from '../services/mlAssessmentService';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the project root
const envPath = path.join(__dirname, '../../..', '.env');
dotenv.config({ path: envPath });

async function checkData() {
  console.log('Checking assessment data for ML training...');
  
  try {
    const assessments: any = await mlAssessmentService.getAllAssessments();
    
    if (!assessments || assessments.length === 0) {
      console.log('No assessment data found.');
      return;
    }
    
    console.log(`Found ${assessments.length} assessment records.`);
    
    // Check for records with actualStrand
    const recordsWithStrand = assessments.filter((a: any) => a.actual_strand);
    console.log(`${recordsWithStrand.length} records have actual strand data.`);
    
    // Show sample records
    console.log('\nSample records:');
    assessments.slice(0, 3).forEach((record: any, index: number) => {
      console.log(`Record ${index + 1}:`, {
        id: record.id,
        actualStrand: record.actual_strand,
        favoriteSubject: record.academic_profile?.favoriteSubject,
        interestsCount: Array.isArray(record.personal_interests) ? record.personal_interests.length : 0,
        hobbiesCount: Array.isArray(record.hobbies) ? record.hobbies.length : 0
      });
    });
    
  } catch (error) {
    console.error('Error checking data:', error);
  }
}

// Run the check
checkData();