// Example usage of the ML system
import { ModelService } from '../services/modelService';
import { IAssessment } from '../interfaces/IAssessment';
import { mlAssessmentService, MLAssessmentData } from '../services/mlAssessmentService';

/**
 * Example demonstrating how to use the ML system with real data
 */
export class MLExample {
  private modelService: ModelService;
  
  constructor() {
    this.modelService = new ModelService();
  }
  
  /**
   * Example of training the model with real assessment data
   */
  async trainWithRealData(): Promise<void> {
    console.log('Starting model training with real assessment data...');
    
    try {
      // Initialize the model service
      await this.modelService.initialize();
      
      // Fetch real assessment data from the database
      console.log('Fetching assessment data from database...');
      const assessments = await mlAssessmentService.getAllAssessments();
      
      if (!assessments || assessments.length === 0) {
        console.warn('No assessment data found in database. Please complete some assessments first.');
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
        // Note: In a real scenario, you would need actual strand outcomes for supervised learning
        actualStrand: undefined // This would need to be manually added or inferred
      }));
      
      // Prepare training data
      const trainingData = this.modelService.prepareTrainingData(formattedAssessments);
      
      console.log(`Prepared ${trainingData.length} training samples.`);
      
      // Train the model
      console.log('Training model...');
      const history = await this.modelService.trainModel(trainingData);
      
      // Skip saving for now since we're having issues with file system operations
      // await this.modelService.saveModel('strand-recommender-v1');
      
      console.log('Model training completed successfully!');
    } catch (error) {
      console.error('Error during training with real data:', error);
    }
  }
  
  /**
   * Example of making a prediction with real data
   */
  async predictWithRealData(): Promise<void> {
    console.log('Starting prediction example with real data...');
    
    try {
      // Skip loading since we just trained the model
      // await this.modelService.loadModel('strand-recommender-v1');
      
      // Check if model is ready for predictions
      if (!this.modelService.isModelReady()) {
        console.warn('Model is not ready for predictions. It may not have been trained yet.');
        return;
      }
      
      // Fetch the most recent assessment for prediction
      const assessments = await mlAssessmentService.getAllAssessments();
      
      if (!assessments || assessments.length === 0) {
        console.warn('No assessment data found in database.');
        return;
      }
      
      // Use the most recent assessment for prediction
      const latestAssessment = assessments[0];
      
      // Convert to IAssessment format
      const sampleAssessment: IAssessment = {
        basicInfo: latestAssessment.basic_info as IAssessment['basicInfo'],
        academicProfile: latestAssessment.academic_profile as IAssessment['academicProfile'],
        personalInterests: latestAssessment.personal_interests as string[],
        hobbies: latestAssessment.hobbies as string[],
        aptitudeAnswers: latestAssessment.aptitude_answers as Record<string, number | string>
      };
      
      // Make prediction
      const prediction = await this.modelService.predict(sampleAssessment);
      
      console.log('Prediction results:');
      console.log(`STEM: ${prediction.STEM.toFixed(2)}%`);
      console.log(`ABM: ${prediction.ABM.toFixed(2)}%`);
      console.log(`HUMSS: ${prediction.HUMSS.toFixed(2)}%`);
      console.log(`GAS: ${prediction.GAS.toFixed(2)}%`);
      console.log(`TVL: ${prediction.TVL.toFixed(2)}%`);
      console.log(`Arts: ${prediction.Arts.toFixed(2)}%`);
      
    } catch (error) {
      console.error('Error during prediction example:', error);
    }
  }
  
  /**
   * Complete workflow: Train and predict
   */
  async runCompleteWorkflow(): Promise<void> {
    console.log('Running complete ML workflow...');
    
    // Train the model
    await this.trainWithRealData();
    
    // Make a prediction
    await this.predictWithRealData();
    
    console.log('Complete workflow finished.');
  }
}

// Example usage
// const example = new MLExample();
// example.runCompleteWorkflow();