// Simple script to train the ML model
import { ModelService } from '../services/modelService';
import { mlAssessmentService } from '../services/mlAssessmentService';
import { IAssessment } from '../interfaces/IAssessment';

async function trainModel() {
  console.log('Starting model training...');
  
  try {
    // Initialize the model service
    const modelService = new ModelService();
    await modelService.initialize();
    console.log('Model initialized');
    
    // Fetch assessment data from the database
    console.log('Fetching assessment data from database...');
    const assessments = await mlAssessmentService.getAllAssessments();
    
    if (!assessments || assessments.length === 0) {
      console.warn('No assessment data found in database.');
      return;
    }
    
    console.log(`Found ${assessments.length} assessment records.`);
    
    // Convert database records to IAssessment format
    const formattedAssessments: IAssessment[] = assessments.map(assessment => ({
      basicInfo: assessment.basic_info as IAssessment['basicInfo'],
      academicProfile: assessment.academic_profile as IAssessment['academicProfile'],
      personalInterests: assessment.personal_interests as string[],
      hobbies: assessment.hobbies as string[],
      aptitudeAnswers: assessment.aptitude_answers as Record<string, number | string>,
      actualStrand: undefined
    }));
    
    // Prepare training data
    const trainingData = modelService.prepareTrainingData(formattedAssessments);
    console.log(`Prepared ${trainingData.length} training samples.`);
    
    // Train the model
    console.log('Training model...');
    const history = await modelService.trainModel(trainingData);
    console.log('Model training completed!');
    
    // Try to save the model
    try {
      console.log('Saving model...');
      await modelService.saveModel('strand-recommender-v1');
      console.log('Model saved successfully!');
    } catch (saveError) {
      console.warn('Could not save model to file system:', (saveError as Error).message);
      console.log('Model will be available in this session only.');
    }
    
    console.log('Training process completed.');
    
  } catch (error) {
    console.error('Error during model training:', error);
  }
}

trainModel();