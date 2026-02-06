/**
 * Base interface for all ML models in the system
 * This ensures consistent API across different model types
 */
export interface BaseModel {
  /**
   * Initialize the model architecture
   * @returns Promise that resolves when initialization is complete
   */
  initialize(): Promise<void>;
  
  /**
   * Train the model with provided data
   * @param features Array of feature arrays (samples x features)
   * @param labels Array of label arrays (samples x classes)
   * @returns Training history or metrics
   */
  train(features: number[][], labels: number[][]): Promise<any>;
  
  /**
   * Make predictions for input features
   * @param features Single sample features array
   * @returns Array of prediction probabilities for each class
   */
  predict(features: number[]): Promise<number[]>;
  
  /**
   * Save the trained model
   * @param modelName Name to save the model under
   * @returns Boolean indicating success
   */
  saveModel(modelName: string): Promise<boolean>;
  
  /**
   * Load a saved model
   * @param modelName Name of the model to load
   * @returns Boolean indicating success
   */
  loadModel(modelName: string): Promise<boolean>;
  
  /**
   * Check if model is ready for predictions
   * @returns Boolean indicating if model is initialized and trained
   */
  isModelReady(): boolean;
  
  /**
   * Get model type for identification
   * @returns String identifying the model type (e.g., 'neural-network', 'decision-tree')
   */
  getModelType(): string;
  
  /**
   * Get model parameters/configuration
   * @returns Object containing model configuration
   */
  getModelParameters(): any;
  
  /**
   * Dispose of model resources to prevent memory leaks
   */
  dispose(): void;
}

/**
 * Training data interface for consistent data handling
 */
export interface TrainingData {
  features: number[][];
  labels: number[][];
  validationSplit?: number;
}

/**
 * Model evaluation metrics
 */
export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix?: number[][];
  trainingTime?: number;
}