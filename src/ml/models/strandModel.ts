import * as tf from '@tensorflow/tfjs';
import * as fs from 'fs';
import * as path from 'path';
import { IAssessmentFeatures, IStrandPrediction } from '../interfaces/IAssessment';
import { MODEL_CONFIG } from '../config/modelConfig';
import { FeatureExtractor } from '../features/featureExtractor';

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
    // Create sequential model
    const model = tf.sequential();
    
    // Add input layer
    model.add(tf.layers.dense({
      units: MODEL_CONFIG.architecture.hiddenLayers[0],
      activation: MODEL_CONFIG.architecture.activation as any,
      inputShape: [MODEL_CONFIG.architecture.inputSize],
    }));
    
    // Add hidden layers
    for (let i = 1; i < MODEL_CONFIG.architecture.hiddenLayers.length; i++) {
      model.add(tf.layers.dense({
        units: MODEL_CONFIG.architecture.hiddenLayers[i],
        activation: MODEL_CONFIG.architecture.activation as any,
      }));
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
    
    // Convert to tensors
    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels);
    
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
          console.log(`Epoch ${epoch}: loss = ${loss}, accuracy = ${accuracy}, val_accuracy = ${valAccuracy}`);
        }
      }
    });
    
    // Clean up tensors
    xs.dispose();
    ys.dispose();
    
    this.isTrained = true;
    console.log('Model training completed');
    
    return history;
  }
  
  /**
   * Make predictions for a single assessment
   * @param assessmentFeatures The assessment features
   * @returns Prediction probabilities for each strand
   */
  async predict(assessmentFeatures: IAssessmentFeatures): Promise<IStrandPrediction> {
    if (!this.model) {
      throw new Error('Model not initialized. Call initialize() first.');
    }
    
    if (!this.isTrained) {
      console.warn('Model not trained yet. Returning default predictions.');
      return {
        STEM: 16.67,
        ABM: 16.67,
        HUMSS: 16.67,
        GAS: 16.67,
        TVL: 16.67,
        Arts: 16.67
      };
    }
    
    // Convert features to array
    const featuresArray = FeatureExtractor.featuresToArray(assessmentFeatures);
    
    // Convert to tensor
    const input = tf.tensor2d([featuresArray]);
    
    // Make prediction
    const prediction = this.model.predict(input) as tf.Tensor;
    
    // Get values from tensor
    const values = await prediction.data();
    
    // Clean up tensors
    input.dispose();
    prediction.dispose();
    
    // Convert to strand prediction object
    return {
      STEM: values[MODEL_CONFIG.strands.STEM] * 100,
      ABM: values[MODEL_CONFIG.strands.ABM] * 100,
      HUMSS: values[MODEL_CONFIG.strands.HUMSS] * 100,
      GAS: values[MODEL_CONFIG.strands.GAS] * 100,
      TVL: values[MODEL_CONFIG.strands.TVL] * 100,
      Arts: values[MODEL_CONFIG.strands.Arts] * 100,
    };
  }
  
  /**
   * Save the model to file system
   * @param modelName The name to save the model under
   */
  async saveModel(modelName: string = 'strand-model'): Promise<void> {
    if (!this.model) {
      throw new Error('Model not initialized. Call initialize() first.');
    }
    
    if (!this.isTrained) {
      throw new Error('Cannot save untrained model. Train the model first.');
    }
    
    // Create models directory if it doesn't exist
    const modelsDir = path.join(process.cwd(), 'models');
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }
    
    const savePath = `file://${path.join(modelsDir, modelName)}`;
    await this.model.save(savePath);
    console.log(`Model saved to ${savePath}`);
  }
  
  /**
   * Load a saved model from file system
   * @param modelName The name of the model to load
   */
  async loadModel(modelName: string = 'strand-model'): Promise<void> {
    const modelsDir = path.join(process.cwd(), 'models');
    const loadPath = `file://${path.join(modelsDir, modelName)}`;
    
    try {
      this.model = await tf.loadLayersModel(loadPath);
      this.isTrained = true;
      console.log(`Model loaded from ${loadPath}`);
    } catch (error) {
      console.error(`Failed to load model from ${loadPath}:`, error);
      throw new Error(`Failed to load model: ${error.message}`);
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
}