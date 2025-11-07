#!/usr/bin/env tsx
// Test script to verify ML model fixes
import { ModelService } from '../services/modelService';
import { IAssessment, IAssessmentFeatures } from '../interfaces/IAssessment';

async function testModelFixes() {
  console.log('Testing ML Model Fixes...');
  
  try {
    // Initialize the model service
    const modelService = new ModelService();
    await modelService.initialize();
    
    console.log('✓ Model service initialized successfully');
    
    // Test model validation
    const isReady = modelService.isModelReady();
    console.log(`Model ready for predictions: ${isReady}`);
    
    // Create a test assessment
    const testAssessment: IAssessment = {
      basicInfo: {
        fullName: 'Test User',
        age: '16',
        gender: 'male',
        school: 'Test High School',
        region: 'Test Region',
        email: 'test@example.com'
      },
      academicProfile: {
        gwa: '85',
        favoriteSubject: 'Mathematics',
        leastFavoriteSubject: 'English'
      },
      personalInterests: ['Science and Technology', 'Mathematics'],
      hobbies: ['Video Games', 'Reading'],
      aptitudeAnswers: {
        'question1': 1,
        'question2': 2,
        'question3': 3
      }
    };
    
    // Test prediction with untrained model (should return default values)
    console.log('Testing prediction with untrained model...');
    const prediction = await modelService.predict(testAssessment);
    console.log('Prediction result:', prediction);
    
    // Test model disposal
    modelService.dispose();
    console.log('✓ Model disposed successfully');
    
    console.log('All tests completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testModelFixes();