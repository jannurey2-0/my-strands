import { IAssessment, IStrandPrediction, ITrainingData } from '../interfaces/IAssessment';
import { StrandModel } from '../models/strandModel';
import { FeatureExtractor } from '../features/featureExtractor';
import { MODEL_CONFIG } from '../config/modelConfig';
import { mlAssessmentService } from './mlAssessmentService';
import logger from '@/lib/logger';

/**
 * Service for managing the strand recommendation model
 */
export class ModelService {
  private model: StrandModel;
  private trainingPromise: Promise<void> | null = null;
  
  constructor() {
    this.model = new StrandModel();
  }
  
  /**
   * Initialize the model
   */
  async initialize(): Promise<void> {
    try {
      await this.model.initialize();
      logger.info('Model service initialized successfully');
      
      // Attempt to load a pre-trained model
      const modelLoaded = await this.model.loadModel('strand-recommender-v1');
      if (modelLoaded) {
        logger.info('Pre-trained model loaded successfully');
      } else {
        logger.info('No pre-trained model found. Model will need to be trained.');
        // Start training the model with available data
        this.trainingPromise = this.trainModelWithAvailableData();
      }
    } catch (error) {
      logger.error('Failed to initialize model service:', error);
      throw new Error(`Model service initialization failed: ${error.message || error}`);
    }
  }
  
  /**
   * Train the model with available assessment data
   */
  private async trainModelWithAvailableData(): Promise<void> {
    try {
      logger.info('Attempting to train model with available assessment data...');
      
      // Fetch assessment data from the database
      const assessments = await mlAssessmentService.getAllAssessments();
      
      if (!assessments || assessments.length === 0) {
        logger.info('No assessment data found for training.');
        return;
      }
      
      logger.info(`Found ${assessments.length} assessment records for training.`);
      
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
      
      // Validate and filter out any assessments with missing data
      const validAssessments = formattedAssessments.filter(assessment => {
        try {
          // Try to extract features to validate the assessment
          FeatureExtractor.extractFeatures(assessment);
          return true;
        } catch (error) {
          logger.warn('Skipping assessment with invalid data:', error.message);
          return false;
        }
      });
      
      logger.info(`Valid assessments after filtering: ${validAssessments.length}`);
      
      if (validAssessments.length === 0) {
        logger.info('No valid assessment data found for training.');
        return;
      }
      
      // Prepare training data
      const trainingData = this.prepareTrainingData(validAssessments);
      
      logger.info(`Prepared ${trainingData.length} training samples.`);
      
      if (trainingData.length === 0) {
        logger.info('No training data prepared.');
        return;
      }
      
      // Train the model
      logger.info('Training model...');
      const history = await this.trainModel(trainingData);
      
      // Log training results
      logger.info('Model training completed successfully!');
      logger.info('Final training loss:', history.history.loss[history.history.loss.length - 1]);
      if (history.history.acc) {
        logger.info('Final training accuracy:', history.history.acc[history.history.acc.length - 1]);
      }
      if (history.history.val_acc) {
        logger.info('Final validation accuracy:', history.history.val_acc[history.history.val_acc.length - 1]);
      }
      
      logger.info('Model is now ready for predictions during this session.');
      // Save the model silently without user notification
      // (Admin will see training notifications in MLModelManagement component)
      try {
        await this.model.saveModel('strand-recommender-v1');
        logger.info('Model saved successfully');
      } catch (saveError) {
        logger.warn('Model could not be saved (browser limitation):', saveError);
      }
    } catch (error) {
      logger.error('Failed to train model with available data:', error);
    }
  }
  
  /**
   * Wait for model training to complete
   */
  async waitForTraining(): Promise<void> {
    if (this.trainingPromise) {
      await this.trainingPromise;
      this.trainingPromise = null;
    }
  }
  
  /**
   * Train the model with provided training data
   * @param trainingData Array of training data
   * @returns Training history
   */
  async trainModel(trainingData: ITrainingData[]): Promise<any> {
    if (!this.model.isInitialized()) {
      await this.initialize();
    }
    
    // Validate training data
    if (!trainingData || trainingData.length === 0) {
      throw new Error('Training data cannot be empty');
    }
    
    // Log training data statistics
    const recordsWithActualStrand = trainingData.filter(data => data.actualStrand && data.actualStrand !== 'unknown');
    logger.info(`Training data statistics: ${trainingData.length} total samples, ${recordsWithActualStrand.length} with actual strand data`);
    
    if (recordsWithActualStrand.length === 0) {
      logger.warn('No training data with actual strand information found. Model accuracy may be low.');
      logger.warn('Please ensure some assessments have actual_strand data populated.');
    }
    
    // Extract features and labels
    const features: number[][] = [];
    const labels: number[][] = [];
    
    trainingData.forEach((data, index) => {
      // Validate training data item
      if (!data.features || !data.labels) {
        throw new Error(`Training data at index ${index} is missing features or labels`);
      }
      
      // Convert features to array
      const featureArray = FeatureExtractor.featuresToArray(data.features);
      features.push(featureArray);
      
      // Convert labels to array (already in 0-100 range, convert to 0-1 for softmax)
      const labelArray = [
        data.labels.STEM / 100,
        data.labels.ABM / 100,
        data.labels.HUMSS / 100,
        data.labels.GAS / 100,
        data.labels.TVL / 100,
        data.labels.Arts / 100,
      ];
      labels.push(labelArray);
    });
    
    try {
      const history = await this.model.train(features, labels);
      logger.info('Model training completed successfully');
      return history;
    } catch (error) {
      logger.error('Failed to train model:', error);
      throw new Error(`Model training failed: ${error.message || error}`);
    }
  }
  
  /**
   * Make prediction for an assessment
   * @param assessment The assessment data
   * @returns Prediction probabilities for each strand
   */
  async predict(assessment: IAssessment): Promise<IStrandPrediction> {
    try {
      // Validate input
      if (!assessment) {
        throw new Error('Assessment data cannot be null or undefined');
      }
      
      // Wait for any ongoing training to complete
      await this.waitForTraining();
      
      // Check if model is ready for predictions
      if (!this.isModelReady()) {
        logger.warn('Model is not ready for predictions. Returning default values.');
        return {
          STEM: 16.67,
          ABM: 16.67,
          HUMSS: 16.67,
          GAS: 16.67,
          TVL: 16.67,
          Arts: 16.67
        };
      }
      
      // Extract features from assessment
      const features = FeatureExtractor.extractFeatures(assessment);
      
      // Validate extracted features
      if (!features) {
        throw new Error('Failed to extract features from assessment');
      }
      
      // Make prediction
      const prediction = await this.model.predict(features);
      
      return prediction;
    } catch (error) {
      logger.error('Failed to make prediction:', error);
      // Return default predictions if ML model fails
      return {
        STEM: 16.67,
        ABM: 16.67,
        HUMSS: 16.67,
        GAS: 16.67,
        TVL: 16.67,
        Arts: 16.67
      };
    }
  }
  
  /**
   * Save the trained model
   * @param modelName The name to save the model under
   */
  async saveModel(modelName: string = 'strand-model'): Promise<boolean> {
    try {
      const saved = await this.model.saveModel(modelName);
      if (saved) {
        logger.info(`Model saved successfully as ${modelName}`);
      } else {
        logger.warn(`Failed to save model as ${modelName}`);
      }
      return saved;
    } catch (error) {
      logger.error('Failed to save model:', error);
      return false;
    }
  }
  
  /**
   * Load a saved model
   * @param modelName The name of the model to load
   */
  async loadModel(modelName: string = 'strand-model'): Promise<boolean> {
    try {
      const loaded = await this.model.loadModel(modelName);
      if (loaded) {
        logger.info(`Model loaded successfully from ${modelName}`);
      } else {
        logger.warn(`Failed to load model from ${modelName}`);
      }
      return loaded;
    } catch (error) {
      logger.error('Failed to load model:', error);
      return false;
    }
  }
  
  /**
   * Prepare training data from assessments
   * @param assessments Array of assessment responses
   * @returns Prepared training data
   */
  prepareTrainingData(assessments: IAssessment[]): ITrainingData[] {
    const trainingData: ITrainingData[] = [];
    
    assessments.forEach(assessment => {
      try {
        // Extract features
        const features = FeatureExtractor.extractFeatures(assessment);
        
        // Create labels based on actual strand or rule-based scoring as fallback
        let labels: IStrandPrediction;
        
        if (assessment.actualStrand) {
          // Use actual strand for supervised learning
          labels = {
            STEM: assessment.actualStrand === 'STEM' ? 100 : 0,
            ABM: assessment.actualStrand === 'ABM' ? 100 : 0,
            HUMSS: assessment.actualStrand === 'HUMSS' ? 100 : 0,
            GAS: assessment.actualStrand === 'GAS' ? 100 : 0,
            TVL: assessment.actualStrand === 'TVL' ? 100 : 0,
            Arts: assessment.actualStrand === 'Arts' ? 100 : 0,
          };
        } else {
          // Use rule-based scoring as fallback
          labels = this.getRuleBasedScores(assessment);
        }
        
        trainingData.push({
          features,
          labels,
          actualStrand: assessment.actualStrand || 'unknown'
        });
      } catch (error) {
        logger.warn('Skipping assessment due to feature extraction error:', error.message);
      }
    });
    
    return trainingData;
  }
  
  /**
   * Get rule-based scores as fallback
   * @param assessment The assessment data
   * @returns Rule-based scores
   */
  private getRuleBasedScores(assessment: IAssessment): IStrandPrediction {
    // Calculate strand scores based on assessment responses
    const scores = {
      STEM: 0,
      ABM: 0,
      HUMSS: 0,
      GAS: 0,
      TVL: 0,
      Arts: 0
    };

    // Score based on favorite subject
    const favoriteSubject = assessment.academicProfile?.favoriteSubject || '';
    if (MODEL_CONFIG.subjectMappings.stem.includes(favoriteSubject)) {
      scores.STEM += 20;
    } else if (MODEL_CONFIG.subjectMappings.abm.includes(favoriteSubject)) {
      scores.ABM += 20;
    } else if (MODEL_CONFIG.subjectMappings.humss.includes(favoriteSubject)) {
      scores.HUMSS += 20;
    }

    // Score based on interests
    const interests = assessment.personalInterests || [];
    interests.forEach(interest => {
      if (MODEL_CONFIG.interestMappings.stem.includes(interest)) {
        scores.STEM += 5;
      }
      if (MODEL_CONFIG.interestMappings.abm.includes(interest)) {
        scores.ABM += 5;
      }
      if (MODEL_CONFIG.interestMappings.humss.includes(interest)) {
        scores.HUMSS += 5;
      }
      if (MODEL_CONFIG.interestMappings.gas.includes(interest)) {
        scores.GAS += 5;
      }
      if (MODEL_CONFIG.interestMappings.tvl.includes(interest)) {
        scores.TVL += 5;
      }
      if (MODEL_CONFIG.interestMappings.arts.includes(interest)) {
        scores.Arts += 5;
      }
    });

    // Score based on hobbies
    const hobbies = assessment.hobbies || [];
    hobbies.forEach(hobby => {
      if (MODEL_CONFIG.hobbyMappings.stem.includes(hobby)) {
        scores.STEM += 3;
      }
      if (MODEL_CONFIG.hobbyMappings.abm.includes(hobby)) {
        scores.ABM += 3;
      }
      if (MODEL_CONFIG.hobbyMappings.humss.includes(hobby)) {
        scores.HUMSS += 3;
      }
      if (MODEL_CONFIG.hobbyMappings.gas.includes(hobby)) {
        scores.GAS += 3;
      }
      if (MODEL_CONFIG.hobbyMappings.tvl.includes(hobby)) {
        scores.TVL += 3;
      }
      if (MODEL_CONFIG.hobbyMappings.arts.includes(hobby)) {
        scores.Arts += 3;
      }
    });

    // Normalize scores to percentages
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    if (totalScore > 0) {
      Object.keys(scores).forEach(key => {
        scores[key] = (scores[key] / totalScore) * 100;
      });
    } else {
      // If no scores, distribute equally
      Object.keys(scores).forEach(key => {
        scores[key] = 16.67;
      });
    }

    return scores;
  }
  
  /**
   * Check if the model is ready for predictions
   * @returns True if model is ready, false otherwise
   */
  isModelReady(): boolean {
    return this.model.isInitialized() && this.model.isModelTrained();
  }
}

export default ModelService;
