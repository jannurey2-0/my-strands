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
  private isInitializing: boolean = false;
  
  constructor() {
    this.model = new StrandModel();
  }
  
  /**
   * Initialize the model
   */
  async initialize(): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.isInitializing) {
      logger.info('Model initialization already in progress, waiting...');
      // Wait for the current initialization to complete
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      // After waiting, verify the model is actually initialized
      // If initialization failed, the waiting caller should also fail
      if (!this.model.isInitialized()) {
        throw new Error('Model initialization failed (waited for concurrent initialization)');
      }
      // If model is initialized, we're done - no need to reinitialize
      logger.info('Model initialization completed by concurrent call');
      return;
    }
    
    // If model is already initialized and trained, don't reinitialize
    if (this.model.isInitialized() && this.model.isModelTrained()) {
      logger.info('Model already initialized and trained');
      return;
    }
    
    try {
      this.isInitializing = true;
      await this.model.initialize();
      logger.info('Model service initialized successfully');
      
      // Attempt to load a pre-trained model from Supabase Storage first, then local storage
      // Try Supabase Storage first (shared model)
      const modelLoadedFromSupabase = await this.model.loadModel('strand-recommender-v1', true);
      if (modelLoadedFromSupabase) {
        logger.info('Pre-trained model loaded successfully from Supabase Storage');
      } else {
        // Try local storage (IndexedDB or file system)
        const modelLoadedLocal = await this.model.loadModel('strand-recommender-v1', false);
        if (modelLoadedLocal) {
          logger.info('Pre-trained model loaded successfully from local storage');
        } else {
          logger.info('No pre-trained model found. Model will need to be trained manually by admin.');
          // Do NOT start training automatically - admin must click "Train Model" button
        }
      }
    } catch (error) {
      logger.error('Failed to initialize model service:', error);
      throw new Error(`Model service initialization failed: ${error.message || error}`);
    } finally {
      this.isInitializing = false;
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
      // Save the model to Supabase Storage (shared) and local storage
      // (Admin will see training notifications in MLModelManagement component)
      try {
        // Save to Supabase Storage first (shared model for all users)
        const savedToSupabase = await this.model.saveModel('strand-recommender-v1', true);
        if (savedToSupabase) {
          logger.info('Model saved successfully to Supabase Storage');
        } else {
          logger.warn('Model could not be saved to Supabase Storage');
        }
        
        // Also save to local storage for faster loading
        try {
          await this.model.saveModel('strand-recommender-v1', false);
          logger.info('Model saved successfully to local storage');
        } catch (localSaveError) {
          logger.warn('Model could not be saved to local storage:', localSaveError);
        }
      } catch (saveError) {
        logger.warn('Model could not be saved:', saveError);
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
      try {
        await this.trainingPromise;
      } catch (error) {
        // If training fails, log it but don't throw - we'll fallback to rule-based
        logger.warn('Training completed with errors, will use fallback if needed:', error);
      } finally {
        // Only clear the promise if training completed (successfully or not)
        // This prevents multiple training sessions
        this.trainingPromise = null;
      }
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
      let prediction = await this.model.predictAssessment(features);
      
      // Apply debiasing if HUMSS bias is detected
      prediction = this.debiasPredictions(prediction);
      
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
   * @param saveToSupabase Whether to save to Supabase Storage (default: true)
   */
  async saveModel(modelName: string = 'strand-model', saveToSupabase: boolean = true): Promise<boolean> {
    try {
      // Save to Supabase Storage (shared model)
      let savedToSupabase = false;
      if (saveToSupabase) {
        savedToSupabase = await this.model.saveModel(modelName, true);
        if (savedToSupabase) {
          logger.info(`Model saved successfully to Supabase Storage as ${modelName}`);
        } else {
          logger.warn(`Failed to save model to Supabase Storage as ${modelName}`);
        }
      }
      
      // Also save to local storage for faster loading
      let savedLocal = false;
      try {
        savedLocal = await this.model.saveModel(modelName, false);
        if (savedLocal) {
          logger.info(`Model saved successfully to local storage as ${modelName}`);
        }
      } catch (localError) {
        logger.warn('Failed to save model to local storage:', localError);
      }
      
      // Return true if ANY save succeeded (Supabase OR local)
      // This ensures correct status reporting when one succeeds and the other fails
      return savedToSupabase || savedLocal;
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
  /**
   * Calculate aptitude scores for each strand based on assessment answers
   * @param aptitudeAnswers The aptitude test answers
   * @returns Normalized scores for each strand
   */
  private calculateAptitudeScore(aptitudeAnswers: Record<string, number | string>): Record<string, number> {
    // Initialize strand scores
    const strandScores = {
      stem: 0,
      abm: 0,
      humss: 0,
      gas: 0,
      tvl: 0,
      arts: 0
    };

    // If no answers, return equal scores
    if (!aptitudeAnswers || Object.keys(aptitudeAnswers).length === 0) {
      return { stem: 0.17, abm: 0.17, humss: 0.17, gas: 0.17, tvl: 0.17, arts: 0.17 };
    }

    // Define question-to-strand mappings
    // These mappings should be adjusted based on your actual aptitude test questions
    const questionStrandMapping: Record<string, keyof typeof strandScores> = {
      // Example mappings - adjust based on your actual questions
      '1': 'stem',  // Question 1 relates to STEM
      '2': 'abm',   // Question 2 relates to ABM
      '3': 'humss', // Question 3 relates to HUMSS
      '4': 'gas',   // Question 4 relates to GAS
      '5': 'tvl'    // Question 5 relates to TVL
    };

    // Calculate scores based on answers
    let totalPoints = 0;
    Object.entries(aptitudeAnswers).forEach(([questionId, answerValue]) => {
      const strand = questionStrandMapping[questionId];
      if (strand && typeof answerValue === 'number') {
        // Assuming answerValue is on a scale of 1-5, normalize to 0-1
        const normalizedScore = (answerValue - 1) / 4;
        strandScores[strand] += normalizedScore;
        totalPoints += normalizedScore;
      }
    });

    // Normalize scores to sum to 1
    if (totalPoints > 0) {
      Object.keys(strandScores).forEach(key => {
        strandScores[key as keyof typeof strandScores] = strandScores[key as keyof typeof strandScores] / totalPoints;
      });
    } else {
      // If no valid answers, distribute equally
      Object.keys(strandScores).forEach(key => {
        strandScores[key as keyof typeof strandScores] = 1 / Object.keys(strandScores).length;
      });
    }

    return strandScores;
  }

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

    // Score based on favorite subjects (up to 3)
    const favoriteSubjects = Array.isArray(assessment.academicProfile?.favoriteSubjects) 
      ? assessment.academicProfile.favoriteSubjects 
      : [];
    
    // Distribute points across favorite subjects (20 points total, divided by number of subjects)
    const pointsPerSubject = favoriteSubjects.length > 0 ? 20 / favoriteSubjects.length : 0;
    favoriteSubjects.forEach(subject => {
      if (MODEL_CONFIG.subjectMappings.stem.includes(subject)) {
        scores.STEM += pointsPerSubject;
      } else if (MODEL_CONFIG.subjectMappings.abm.includes(subject)) {
        scores.ABM += pointsPerSubject;
      } else if (MODEL_CONFIG.subjectMappings.humss.includes(subject)) {
        scores.HUMSS += pointsPerSubject;
      }
    });

    // Score based on least favorite subjects (penalty system)
    const leastFavoriteSubjects = Array.isArray(assessment.academicProfile?.leastFavoriteSubjects) 
      ? assessment.academicProfile.leastFavoriteSubjects 
      : [];
    
    // Apply penalties for least favorite subjects (reduce scores for strands that require those subjects)
    const penaltyPerSubject = leastFavoriteSubjects.length > 0 ? 8 / leastFavoriteSubjects.length : 0;
    leastFavoriteSubjects.forEach(subject => {
      if (MODEL_CONFIG.subjectMappings.stem.includes(subject)) {
        scores.STEM -= penaltyPerSubject;
      } else if (MODEL_CONFIG.subjectMappings.abm.includes(subject)) {
        scores.ABM -= penaltyPerSubject;
      } else if (MODEL_CONFIG.subjectMappings.humss.includes(subject)) {
        scores.HUMSS -= penaltyPerSubject;
      }
    });

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

    // Score based on aptitude test results
    const aptitudeAnswers = assessment.aptitudeAnswers || {};
    const aptitudeScore = this.calculateAptitudeScore(aptitudeAnswers);
    
    // Distribute aptitude score among strands based on category alignment
    // This gives 15 points maximum from aptitude test
    scores.STEM += aptitudeScore.stem * 15;
    scores.ABM += aptitudeScore.abm * 15;
    scores.HUMSS += aptitudeScore.humss * 15;
    scores.GAS += aptitudeScore.gas * 15;
    scores.TVL += aptitudeScore.tvl * 15;
    scores.Arts += aptitudeScore.arts * 15;

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
   * Apply debiasing to predictions to reduce HUMSS bias
   * @param prediction Raw prediction from model
   * @returns Debiased prediction
   */
  private debiasPredictions(prediction: IStrandPrediction): IStrandPrediction {
    // Check if HUMSS is disproportionately high
    const humssScore = prediction.HUMSS;
    const avgScore = (prediction.STEM + prediction.ABM + prediction.HUMSS + 
                     prediction.GAS + prediction.TVL + prediction.Arts) / 6;
    
    // If HUMSS is more than 1.5x the average, apply debiasing
    if (humssScore > avgScore * 1.5) {
      logger.debug(`Applying debiasing: HUMSS score (${humssScore.toFixed(2)}%) is ${(humssScore / avgScore).toFixed(2)}x the average`);
      
      // Reduce HUMSS by 20% and redistribute to other strands
      const reduction = humssScore * 0.2;
      const debiased: IStrandPrediction = {
        STEM: prediction.STEM + (reduction * 0.2),
        ABM: prediction.ABM + (reduction * 0.2),
        HUMSS: prediction.HUMSS - reduction,
        GAS: prediction.GAS + (reduction * 0.2),
        TVL: prediction.TVL + (reduction * 0.2),
        Arts: prediction.Arts + (reduction * 0.2),
      };
      
      // Renormalize to ensure sum is approximately 100
      const total = debiased.STEM + debiased.ABM + debiased.HUMSS + 
                   debiased.GAS + debiased.TVL + debiased.Arts;
      
      if (total > 0) {
        return {
          STEM: Math.max(0, Math.min(100, (debiased.STEM / total) * 100)),
          ABM: Math.max(0, Math.min(100, (debiased.ABM / total) * 100)),
          HUMSS: Math.max(0, Math.min(100, (debiased.HUMSS / total) * 100)),
          GAS: Math.max(0, Math.min(100, (debiased.GAS / total) * 100)),
          TVL: Math.max(0, Math.min(100, (debiased.TVL / total) * 100)),
          Arts: Math.max(0, Math.min(100, (debiased.Arts / total) * 100)),
        };
      }
    }
    
    return prediction;
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
