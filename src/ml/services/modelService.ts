import { IAssessment, IStrandPrediction, ITrainingData } from '../interfaces/IAssessment';
import { StrandModel } from '../models/strandModel';
import { FeatureExtractor } from '../features/featureExtractor';
import { MODEL_CONFIG } from '../config/modelConfig';

/**
 * Service for managing the strand recommendation model
 */
export class ModelService {
  private model: StrandModel;
  
  constructor() {
    this.model = new StrandModel();
  }
  
  /**
   * Initialize the model
   */
  async initialize(): Promise<void> {
    try {
      await this.model.initialize();
      console.log('Model service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize model service:', error);
      throw error;
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
    
    // Extract features and labels
    const features: number[][] = [];
    const labels: number[][] = [];
    
    trainingData.forEach(data => {
      // Convert features to array
      const featureArray = FeatureExtractor.featuresToArray(data.features);
      features.push(featureArray);
      
      // Convert labels to array
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
      console.log('Model training completed successfully');
      return history;
    } catch (error) {
      console.error('Failed to train model:', error);
      throw error;
    }
  }
  
  /**
   * Make prediction for an assessment
   * @param assessment The assessment data
   * @returns Prediction probabilities for each strand
   */
  async predict(assessment: IAssessment): Promise<IStrandPrediction> {
    try {
      // Extract features from assessment
      const features = FeatureExtractor.extractFeatures(assessment);
      
      // Make prediction
      const prediction = await this.model.predict(features);
      
      return prediction;
    } catch (error) {
      console.error('Failed to make prediction:', error);
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
  async saveModel(modelName: string = 'strand-model'): Promise<void> {
    try {
      await this.model.saveModel(modelName);
      console.log(`Model saved successfully as ${modelName}`);
    } catch (error) {
      console.error('Failed to save model:', error);
      throw error;
    }
  }
  
  /**
   * Load a saved model
   * @param modelName The name of the model to load
   */
  async loadModel(modelName: string = 'strand-model'): Promise<void> {
    try {
      await this.model.loadModel(modelName);
      console.log(`Model loaded successfully from ${modelName}`);
    } catch (error) {
      console.error('Failed to load model:', error);
      throw error;
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
    });
    
    return trainingData;
  }
  
  /**
   * Get rule-based scores as fallback
   * @param assessment The assessment data
   * @returns Rule-based scores
   */
  private getRuleBasedScores(assessment: IAssessment): IStrandPrediction {
    // This would implement the same logic as the current rule-based system
    // For now, returning equal probabilities
    return {
      STEM: 16.67,
      ABM: 16.67,
      HUMSS: 16.67,
      GAS: 16.67,
      TVL: 16.67,
      Arts: 16.67
    };
  }
  
  /**
   * Check if model is ready for predictions
   * @returns Boolean indicating if model is ready
   */
  isModelReady(): boolean {
    return this.model.isInitialized() && this.model.isModelTrained();
  }
}