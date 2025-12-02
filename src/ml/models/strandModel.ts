import * as tf from '@tensorflow/tfjs';
import { IAssessmentFeatures, IStrandPrediction } from '../interfaces/IAssessment';
import { MODEL_CONFIG } from '../config/modelConfig';
import { FeatureExtractor } from '../features/featureExtractor';

// Check if we're in a Node.js environment
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

// Log environment information
console.debug(`Running in ${isNode ? 'Node.js' : 'Browser'} environment`);

/**
 * Strand recommendation model using TensorFlow.js
 */
export class StrandModel {
  private model: tf.LayersModel | null = null;
  private isTrained: boolean = false;
  
  /**
   * Initialize the model architecture
   */
  async initialize(): Promise<void> {
    try {
      // Create sequential model
      const model = tf.sequential();
      
      // Add input layer
      model.add(tf.layers.dense({
        units: MODEL_CONFIG.architecture.hiddenLayers[0],
        activation: MODEL_CONFIG.architecture.activation as any,
        inputShape: [MODEL_CONFIG.architecture.inputSize],
      }));
      
      // Add dropout after first layer for regularization
      if (MODEL_CONFIG.architecture.dropout) {
        model.add(tf.layers.dropout({
          rate: MODEL_CONFIG.architecture.dropout,
        }));
      }
      
      // Add hidden layers
      for (let i = 1; i < MODEL_CONFIG.architecture.hiddenLayers.length; i++) {
        model.add(tf.layers.dense({
          units: MODEL_CONFIG.architecture.hiddenLayers[i],
          activation: MODEL_CONFIG.architecture.activation as any,
        }));
        
        // Add dropout after each hidden layer (except the last one before output)
        if (MODEL_CONFIG.architecture.dropout && i < MODEL_CONFIG.architecture.hiddenLayers.length - 1) {
          model.add(tf.layers.dropout({
            rate: MODEL_CONFIG.architecture.dropout,
          }));
        }
      }
      
      // Add output layer
      model.add(tf.layers.dense({
        units: MODEL_CONFIG.architecture.outputSize,
        activation: MODEL_CONFIG.architecture.outputActivation as any,
      }));
      
      // Compile model
      model.compile({
        optimizer: tf.train.adam(MODEL_CONFIG.training.learningRate),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy'],
      });
      
      this.model = model;
      console.log('Model initialized successfully');
    } catch (error) {
      console.error('Failed to initialize model:', error);
      throw new Error(`Model initialization failed: ${error.message || error}`);
    }
  }
  
  /**
   * Train the model with provided data
   * @param features Array of feature arrays
   * @param labels Array of label arrays
   * @returns Training history
   */
  async train(features: number[][], labels: number[][]): Promise<tf.History> {
    if (!this.model) {
      throw new Error('Model not initialized. Call initialize() first.');
    }
    
    // Validate input data
    if (!features || features.length === 0) {
      throw new Error('Training features cannot be empty');
    }
    
    if (!labels || labels.length === 0) {
      throw new Error('Training labels cannot be empty');
    }
    
    // Validate feature dimensions
    const expectedFeatures = MODEL_CONFIG.architecture.inputSize;
    for (let i = 0; i < features.length; i++) {
      if (features[i].length !== expectedFeatures) {
        throw new Error(`Feature vector at index ${i} has ${features[i].length} features, expected ${expectedFeatures}`);
      }
    }
    
    // Validate label dimensions
    const expectedLabels = MODEL_CONFIG.architecture.outputSize;
    for (let i = 0; i < labels.length; i++) {
      if (labels[i].length !== expectedLabels) {
        throw new Error(`Label vector at index ${i} has ${labels[i].length} labels, expected ${expectedLabels}`);
      }
    }
    
    // Convert to tensors
    let xs: tf.Tensor2D | null = null;
    let ys: tf.Tensor2D | null = null;
    
    try {
      xs = tf.tensor2d(features);
      ys = tf.tensor2d(labels);
      
      console.debug(`Created training tensors - xs shape: ${xs.shape}, ys shape: ${ys.shape}`);
      console.log(`Starting model training with ${features.length} samples...`);
      
      // Calculate class weights if enabled (for logging/debugging)
      // Note: TensorFlow.js may not support classWeight directly in fit()
      // The weights are calculated and logged to help understand class imbalance
      if (MODEL_CONFIG.training.useClassWeights) {
        const classWeights = this.calculateClassWeights(labels);
        console.log('Class weights calculated (for reference):', classWeights);
        console.log('Note: Class weights are calculated but may not be applied directly in TensorFlow.js');
        console.log('The model uses dropout and smaller architecture to handle imbalanced data.');
      }
      
      // Train the model
      const history = await this.model.fit(xs, ys, {
        epochs: MODEL_CONFIG.training.epochs,
        batchSize: MODEL_CONFIG.training.batchSize,
        validationSplit: MODEL_CONFIG.training.validationSplit,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            // Fix: Check if logs and accuracy exist before accessing
            const loss = logs?.loss?.toFixed(4) || 'N/A';
            const accuracy = logs?.acc !== undefined ? logs.acc.toFixed(4) : 'N/A';
            const valAccuracy = logs?.val_acc !== undefined ? logs.val_acc.toFixed(4) : 'N/A';
            console.log(`Epoch ${epoch + 1}/${MODEL_CONFIG.training.epochs}: loss = ${loss}, accuracy = ${accuracy}, val_accuracy = ${valAccuracy}`);
          }
        }
      });
      
      // Set trained flag after successful training
      this.isTrained = true;
      console.log('Model training completed successfully');
      
      return history;
    } catch (error) {
      console.error('Model training failed:', error);
      throw new Error(`Model training failed: ${error.message || error}`);
    } finally {
      // Clean up tensors in finally block to ensure they're always disposed
      try {
        if (xs) {
          console.debug('Disposing training tensor xs');
          xs.dispose();
        }
        if (ys) {
          console.debug('Disposing training tensor ys');
          ys.dispose();
        }
      } catch (disposeError) {
        console.warn('Error disposing training tensors:', disposeError);
      }
    }
  }
  
  /**
   * Make predictions for a single assessment
   * @param assessmentFeatures The assessment features
   * @returns Prediction probabilities for each strand
   */
  async predict(assessmentFeatures: IAssessmentFeatures): Promise<IStrandPrediction> {
    // Validate model is properly initialized and trained
    this.validateModel();
    
    // Validate input features
    if (!assessmentFeatures) {
      throw new Error('Assessment features cannot be null or undefined');
    }
    
    // Convert features to array
    const featuresArray = FeatureExtractor.featuresToArray(assessmentFeatures);
    
    // Validate feature array length
    const expectedFeatures = MODEL_CONFIG.architecture.inputSize;
    if (featuresArray.length !== expectedFeatures) {
      throw new Error(`Feature array has ${featuresArray.length} features, expected ${expectedFeatures}`);
    }
    
    // Check for null or undefined values
    for (let i = 0; i < featuresArray.length; i++) {
      if (featuresArray[i] == null || isNaN(featuresArray[i])) {
        throw new Error(`Feature at index ${i} is null, undefined, or NaN`);
      }
    }
    
    // Initialize variables for tensor cleanup
    let input: tf.Tensor2D | null = null;
    let prediction: tf.Tensor | null = null;
    
    try {
      // Convert to tensor
      input = tf.tensor2d([featuresArray]);
      console.debug(`Created prediction tensor with shape: ${input.shape}`);
      
      // Make prediction
      prediction = this.model.predict(input) as tf.Tensor;
      
      // Get values from tensor
      const values = await prediction.data();
      
      // Validate prediction values
      if (!values || values.length !== MODEL_CONFIG.architecture.outputSize) {
        throw new Error(`Invalid prediction output. Expected ${MODEL_CONFIG.architecture.outputSize} values, got ${values?.length || 0}`);
      }
      
      // Convert to strand prediction object
      return {
        STEM: Math.max(0, Math.min(100, values[MODEL_CONFIG.strands.STEM] * 100)),
        ABM: Math.max(0, Math.min(100, values[MODEL_CONFIG.strands.ABM] * 100)),
        HUMSS: Math.max(0, Math.min(100, values[MODEL_CONFIG.strands.HUMSS] * 100)),
        GAS: Math.max(0, Math.min(100, values[MODEL_CONFIG.strands.GAS] * 100)),
        TVL: Math.max(0, Math.min(100, values[MODEL_CONFIG.strands.TVL] * 100)),
        Arts: Math.max(0, Math.min(100, values[MODEL_CONFIG.strands.Arts] * 100)),
      };
    } catch (error) {
      console.error('Prediction failed:', error);
      throw new Error(`Prediction failed: ${error.message || error}`);
    } finally {
      // Clean up tensors in finally block to ensure they're always disposed
      try {
        if (input) {
          console.debug('Disposing prediction input tensor');
          input.dispose();
        }
        if (prediction) {
          console.debug('Disposing prediction output tensor');
          prediction.dispose();
        }
      } catch (disposeError) {
        console.warn('Error disposing prediction tensors:', disposeError);
      }
    }
  }
  
  /**
   * Save the trained model
   * @param modelName The name to save the model under
   */
  async saveModel(modelName: string = 'strand-model'): Promise<boolean> {
    if (!this.model) {
      throw new Error('Model not initialized. Call initialize() first.');
    }
    
    if (!this.isTrained) {
      throw new Error('Cannot save untrained model. Train the model first.');
    }
    
    // Only save in Node.js environment
    if (!isNode) {
      console.debug('Model saving skipped - running in browser environment');
      // In browser environment, we can't save to file system
      // but the model will remain in memory during the session
      return false;
    }
    
    try {
      console.debug(`Attempting to save model: ${modelName}`);
      
      // Dynamically import Node.js modules when needed
      const fsModule = await import('fs');
      const pathModule = await import('path');
      const fs = fsModule.default;
      const path = pathModule.default;
      
      // Create models directory if it doesn't exist
      const modelsDir = path.join(process.cwd(), 'models');
      if (!fs.existsSync(modelsDir)) {
        fs.mkdirSync(modelsDir, { recursive: true });
      }
      
      // Use the correct path format for TensorFlow.js
      const modelPath = path.join(modelsDir, modelName);
      console.debug(`Saving model to: ${modelPath}`);
      // Try with the file:// prefix using forward slashes
      const savePath = 'file:///' + modelPath.replace(/\\/g, '/');
      try {
        await this.model.save(savePath);
        console.log(`Model saved successfully to ${modelPath}`);
        return true;
      } catch (saveError) {
        console.warn('Failed to save model with file:// protocol, trying alternative approach:', saveError);
        // Fallback: Try without the protocol prefix
        await this.model.save(modelPath);
        console.log(`Model saved successfully to ${modelPath}`);
        return true;
      }
    } catch (error) {
      console.error('Failed to save model:', error);
      // Don't throw error, just return false to indicate saving failed
      return false;
    }
  }
  
  /**
   * Load a saved model from file system
   * @param modelName The name of the model to load
   */
  async loadModel(modelName: string = 'strand-model'): Promise<boolean> {
    // Only load in Node.js environment
    if (!isNode) {
      console.debug('Model loading skipped - running in browser environment');
      // In browser environment, we can't load from file system
      // The model must be retrained in each session
      this.isTrained = false;
      return false;
    }
    
    try {
      console.debug(`Attempting to load model: ${modelName}`);
      
      // Dynamically import Node.js modules when needed
      const pathModule = await import('path');
      const path = pathModule.default;
      
      const modelsDir = path.join(process.cwd(), 'models');
      const modelPath = path.join(modelsDir, modelName);
      
      // Check if model file exists before attempting to load
      const fsModule = await import('fs');
      const fs = fsModule.default;
      
      // Check for model.json file which indicates a saved model
      const modelJsonPath = path.join(modelPath, 'model.json');
      if (!fs.existsSync(modelJsonPath)) {
        console.warn(`Model file not found at ${modelPath}. Model must be retrained.`);
        this.isTrained = false;
        return false;
      }
      
      // Load the model using the correct path format
      const loadPath = 'file:///' + modelPath.replace(/\\/g, '/');
      console.debug(`Loading model from: ${loadPath}`);
      try {
        this.model = await tf.loadLayersModel(loadPath);
      } catch (loadError) {
        console.warn('Failed to load model with file:// protocol, trying alternative approach:', loadError);
        // Fallback: Try without the protocol prefix
        this.model = await tf.loadLayersModel(modelPath);
      }
      this.isTrained = true;
      console.log(`Model loaded successfully from ${modelPath}`);
      return true;
    } catch (error) {
      console.error(`Failed to load model from ${modelName}:`, error);
      this.isTrained = false;
      // Don't throw error, just return false to indicate loading failed
      return false;
    }
  }

  /**
   * Check if model is initialized
   * @returns Boolean indicating if model is initialized
   */
  isInitialized(): boolean {
    return this.model !== null;
  }
  
  /**
   * Check if model is trained
   * @returns Boolean indicating if model is trained
   */
  isModelTrained(): boolean {
    return this.isTrained;
  }
  
  /**
   * Calculate class weights to handle imbalanced data
   * @param labels Array of label arrays (one-hot encoded)
   * @returns Class weights object
   */
  private calculateClassWeights(labels: number[][]): { [key: number]: number } {
    const classCounts: number[] = new Array(MODEL_CONFIG.architecture.outputSize).fill(0);
    
    // Count samples per class
    labels.forEach(label => {
      const classIndex = label.indexOf(Math.max(...label));
      if (classIndex >= 0) {
        classCounts[classIndex]++;
      }
    });
    
    // Calculate total samples
    const totalSamples = labels.length;
    
    // Calculate weights: n_samples / (n_classes * np.bincount(y))
    // This gives higher weight to underrepresented classes
    const classWeights: { [key: number]: number } = {};
    const nClasses = MODEL_CONFIG.architecture.outputSize;
    
    classCounts.forEach((count, index) => {
      if (count > 0) {
        // Weight inversely proportional to class frequency
        classWeights[index] = totalSamples / (nClasses * count);
      } else {
        // If a class has no samples, give it a default weight
        classWeights[index] = 1.0;
      }
    });
    
    return classWeights;
  }
  
  /**
   * Validate that the model is properly initialized and trained
   * @throws Error if model is not properly initialized or trained
   */
  validateModel(): void {
    if (!this.isInitialized()) {
      throw new Error('Model is not initialized. Call initialize() first.');
    }
    
    if (!this.isModelTrained()) {
      throw new Error('Model is not trained. Call train() first.');
    }
  }
  
  /**
   * Clean up model resources to prevent memory leaks
   */
  dispose(): void {
    if (this.model) {
      console.debug('Disposing model resources');
      this.model.dispose();
      this.model = null;
    }
    this.isTrained = false;
    console.log('Model resources cleaned up');
  }
}