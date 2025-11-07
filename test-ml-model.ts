#!/usr/bin/env tsx
// Test script to verify ML model functionality
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ModelService } from './src/ml/services/modelService';
import { IAssessment } from './src/ml/interfaces/IAssessment';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the project root
const envPath = path.join(__dirname, '.', '.env');
dotenv.config({ path: envPath });

// Sample assessment data for testing
const sampleAssessment: IAssessment = {
  basicInfo: {
    fullName: "John Doe",
    age: "16",
    gender: "male",
    school: "Sample High School",
    region: "Region 1",
    email: "john.doe@example.com"
  },
  academicProfile: {
    gwa: "85",
    favoriteSubject: "Mathematics",
    leastFavoriteSubject: "English"
  },
  personalInterests: [
    "Science and Technology",
    "Mathematics",
    "Problem Solving"
  ],
  hobbies: [
    "Coding",
    "Video Games",
    "Reading"
  ],
  aptitudeAnswers: {
    "1": 1,
    "2": 0,
    "3": 1,
    "4": 1,
    "5": 0
  }
};

async function testModel() {
  console.log('Testing ML model functionality...');
  
  try {
    // Initialize the model service
    const modelService = new ModelService();
    await modelService.initialize();
    
    console.log('Model initialized successfully');
    
    // Check if model is ready
    const isReady = modelService.isModelReady();
    console.log('Model ready status:', isReady);
    
    // Test prediction
    console.log('Testing prediction...');
    const prediction = await modelService.predict(sampleAssessment);
    console.log('Prediction result:', prediction);
    
    console.log('Model test completed successfully!');
    
  } catch (error) {
    console.error('Error during model testing:', error);
    process.exit(1);
  }
}

// Run the test script
if (import.meta.url === `file://${process.argv[1]}`) {
  testModel();
}

export default testModel;