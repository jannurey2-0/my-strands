#!/usr/bin/env tsx
// Script to train and save the ML model from command line
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

async function trainModel() {
  console.log('Starting model training...');
  
  try {
    // Initialize the model service
    const modelService = new ModelService();
    await modelService.initialize();
    
    // Fetch assessment data from the database
    console.log('Fetching assessment data from database...');
    const assessments: any = await mlAssessmentService.getAllAssessments();
    
    if (!assessments || assessments.length === 0) {
      console.warn('No assessment data found in database. Please complete some assessments first.');
      process.exit(1);
    }
    
    console.log(`Found ${assessments.length} assessment records.`);
    
    // Show some statistics about the data
    const recordsWithStrand = assessments.filter((a: any) => a.actual_strand);
    console.log(`${recordsWithStrand.length} records have actual strand data.`);
    
    // Convert database records to IAssessment format
    const formattedAssessments: IAssessment[] = assessments.map((assessment: any) => ({
      basicInfo: assessment.basic_info as IAssessment['basicInfo'],
      academicProfile: assessment.academic_profile as IAssessment['academicProfile'],
      personalInterests: assessment.personal_interests as string[],
      hobbies: assessment.hobbies as string[],
      aptitudeAnswers: assessment.aptitude_answers as Record<string, number | string>,
      // Use actual_strand for supervised learning
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
      console.warn('No valid training data with actual strand information found. Model accuracy may be low.');
      console.warn('Please ensure some assessments have actual_strand data populated.');
    }
    
    // Train the model
    console.log('Training model...');
    const history = await modelService.trainModel(validTrainingData);
    
    // Show training results
    if (history && history.history) {
      const finalLoss = history.history.loss[history.history.loss.length - 1];
      const finalAccuracy = history.history.acc ? history.history.acc[history.history.acc.length - 1] : 0;
      const finalValAccuracy = history.history.val_acc ? history.history.val_acc[history.history.val_acc.length - 1] : 0;
      
      console.log('Training completed with results:');
      console.log(`- Final Loss: ${finalLoss.toFixed(4)}`);
      console.log(`- Final Accuracy: ${(finalAccuracy * 100).toFixed(2)}%`);
      console.log(`- Final Validation Accuracy: ${(finalValAccuracy * 100).toFixed(2)}%`);
    }
    
    // Save the trained model
    const modelName = 'strand-recommender-v1';
    const saved = await modelService.saveModel(modelName);
    
    if (saved) {
      console.log(`Model training completed successfully and saved as ${modelName}!`);
      console.log('The model can now be used for predictions in the web application.');
    } else {
      console.warn(`Model training completed but failed to save as ${modelName}`);
      console.log('The model can be used for predictions in the current session only.');
    }
    
  } catch (error) {
    console.error('Error during model training:', error);
    process.exit(1);
  }
}

// Run the training script
if (import.meta.url === `file://${process.argv[1]}`) {
  trainModel();
}

export default trainModel;