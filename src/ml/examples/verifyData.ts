#!/usr/bin/env tsx
// Script to verify the ML training data and model preparation
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ModelService } from '../services/modelService';
import { mlAssessmentService } from '../services/mlAssessmentService';
import { IAssessment } from '../interfaces/IAssessment';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the project root
const envPath = path.join(__dirname, '../../..', '.env');
dotenv.config({ path: envPath });

async function verifyData() {
  console.log('Verifying ML training data...');
  
  try {
    // Initialize the model service
    const modelService = new ModelService();
    await modelService.initialize();
    
    // Fetch assessment data from the database
    console.log('Fetching assessment data from database...');
    const assessments: any = await mlAssessmentService.getAllAssessments();
    
    if (!assessments || assessments.length === 0) {
      console.warn('No assessment data found in database.');
      return;
    }
    
    console.log(`Found ${assessments.length} assessment records.`);
    
    // Show data statistics
    const recordsWithStrand = assessments.filter((a: any) => a.actual_strand);
    console.log(`${recordsWithStrand.length} records have actual strand data.`);
    
    // Convert database records to IAssessment format
    const formattedAssessments: IAssessment[] = assessments.map((assessment: any) => ({
      basicInfo: assessment.basic_info as IAssessment['basicInfo'],
      academicProfile: assessment.academic_profile as IAssessment['academicProfile'],
      personalInterests: assessment.personal_interests as string[],
      hobbies: assessment.hobbies as string[],
      aptitudeAnswers: assessment.aptitude_answers as Record<string, number | string>,
      actualStrand: assessment.actual_strand as string | undefined
    }));
    
    // Prepare training data
    const trainingData = modelService.prepareTrainingData(formattedAssessments);
    
    console.log(`Prepared ${trainingData.length} training samples.`);
    
    // Show detailed statistics
    const strandCounts: Record<string, number> = {};
    trainingData.forEach(data => {
      const strand = data.actualStrand || 'unknown';
      strandCounts[strand] = (strandCounts[strand] || 0) + 1;
    });
    
    console.log('Strand distribution:');
    Object.entries(strandCounts).forEach(([strand, count]) => {
      console.log(`  ${strand}: ${count}`);
    });
    
    // Show sample of prepared data
    if (trainingData.length > 0) {
      console.log('\nSample training data:');
      console.log('Features:', trainingData[0].features);
      console.log('Labels:', trainingData[0].labels);
      console.log('Actual Strand:', trainingData[0].actualStrand);
      
      // Validate label sum (should be approximately 1.0 after normalization)
      const labelSum = Object.values(trainingData[0].labels).reduce((sum, val) => sum + val, 0);
      console.log(`Label sum (should be ~100 before normalization): ${labelSum}`);
    }
    
    console.log('\nVerification completed successfully!');
    
  } catch (error) {
    console.error('Error during data verification:', error);
  }
}

// Run the verification script
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyData();
}

export default verifyData;