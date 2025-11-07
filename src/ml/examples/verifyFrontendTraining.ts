#!/usr/bin/env tsx
// Script to verify frontend training fixes
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

async function verifyFrontendTraining() {
  console.log('Verifying frontend training fixes...');
  
  try {
    // Initialize the model service
    const modelService = new ModelService();
    await modelService.initialize();
    console.log('Model service initialized');
    
    // Fetch assessment data from the database
    console.log('Fetching assessment data from database...');
    const assessments: any = await mlAssessmentService.getAllAssessments();
    
    if (!assessments || assessments.length === 0) {
      console.log('No assessment data found in database.');
      return;
    }
    
    console.log(`Found ${assessments.length} assessment records.`);
    
    // Show some statistics about the data
    const recordsWithStrand = assessments.filter((a: any) => a.actual_strand);
    console.log(`${recordsWithStrand.length} records have actual strand data.`);
    
    // Convert database records to IAssessment format (this is what the frontend does)
    const formattedAssessments: IAssessment[] = assessments.map((assessment: any) => ({
      basicInfo: assessment.basic_info as IAssessment['basicInfo'],
      academicProfile: assessment.academic_profile as IAssessment['academicProfile'],
      personalInterests: assessment.personal_interests as string[],
      hobbies: assessment.hobbies as string[],
      aptitudeAnswers: assessment.aptitude_answers as Record<string, number | string>,
      // This is the key fix - use actual_strand from the database
      actualStrand: assessment.actual_strand as string | undefined
    }));
    
    // Prepare training data
    const trainingData = modelService.prepareTrainingData(formattedAssessments);
    
    console.log(`Prepared ${trainingData.length} training samples.`);
    
    // Show sample of prepared data
    if (trainingData.length > 0) {
      console.log('Sample training data:');
      console.log('Features:', trainingData[0].features);
      console.log('Labels:', trainingData[0].labels);
      console.log('Actual Strand:', trainingData[0].actualStrand);
    }
    
    // Filter out training data without actual strand information
    const validTrainingData = trainingData.filter(data => data.actualStrand && data.actualStrand !== 'unknown');
    console.log(`Found ${validTrainingData.length} valid training samples with actual strand data.`);
    
    if (validTrainingData.length === 0) {
      console.log('No valid training data with actual strand information found.');
      return;
    }
    
    // Show distribution of actual strands
    const strandCounts: Record<string, number> = {};
    validTrainingData.forEach(data => {
      const strand = data.actualStrand || 'unknown';
      strandCounts[strand] = (strandCounts[strand] || 0) + 1;
    });
    
    console.log('Strand distribution in training data:');
    Object.entries(strandCounts).forEach(([strand, count]) => {
      console.log(`  ${strand}: ${count}`);
    });
    
    console.log('Frontend training fixes verified successfully!');
    
  } catch (error) {
    console.error('Error during verification:', error);
  }
}

// Run the verification
verifyFrontendTraining();