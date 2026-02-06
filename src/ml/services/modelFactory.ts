import { BaseModel } from '../interfaces/BaseModel';
import { StrandModel } from '../models/strandModel';
import { DecisionTreeModel } from '../models/decisionTreeModel';
import { RandomForestModel } from '../models/randomForestModel';
import logger from '@/lib/logger';

/**
 * Model types supported in the system
 */
export type ModelType = 'neural-network' | 'decision-tree' | 'random-forest';

/**
 * Model factory for creating different types of ML models
 */
export class ModelFactory {
  /**
   * Create a model instance based on the specified type
   * @param modelType Type of model to create
   * @returns Instance of the requested model
   */
  static createModel(modelType: ModelType): BaseModel {
    switch (modelType) {
      case 'neural-network':
        return new StrandModel();
      case 'decision-tree':
        return new DecisionTreeModel();
      case 'random-forest':
        return new RandomForestModel();
      default:
        throw new Error(`Unsupported model type: ${modelType}`);
    }
  }
  
  /**
   * Get available model types
   * @returns Array of supported model types
   */
  static getAvailableModelTypes(): ModelType[] {
    return ['neural-network', 'decision-tree', 'random-forest'];
  }
  
  /**
   * Get model type display names
   * @returns Object mapping model types to display names
   */
  static getModelTypeNames(): Record<ModelType, string> {
    return {
      'neural-network': 'Feedforward Neural Network',
      'decision-tree': 'Decision Tree',
      'random-forest': 'Random Forest'
    };
  }
  
  /**
   * Get model type descriptions
   * @returns Object mapping model types to descriptions
   */
  static getModelTypeDescriptions(): Record<ModelType, string> {
    return {
      'neural-network': 'Deep learning model with multiple hidden layers, good for complex pattern recognition',
      'decision-tree': 'Tree-based model that makes decisions based on feature thresholds, interpretable and fast',
      'random-forest': 'Ensemble of decision trees, reduces overfitting and improves accuracy'
    };
  }
  
  /**
   * Validate if a model type is supported
   * @param modelType Model type to validate
   * @returns Boolean indicating if the model type is supported
   */
  static isSupportedModelType(modelType: string): modelType is ModelType {
    return this.getAvailableModelTypes().includes(modelType as ModelType);
  }
}

/**
 * Model manager for handling multiple models
 */
export class ModelManager {
  private models: Map<ModelType, BaseModel> = new Map();
  private activeModelType: ModelType | null = null;
  
  constructor() {
    // Initialize all supported models
    ModelFactory.getAvailableModelTypes().forEach(modelType => {
      try {
        const model = ModelFactory.createModel(modelType);
        this.models.set(modelType, model);
        logger.info(`Initialized ${modelType} model`);
      } catch (error) {
        logger.error(`Failed to initialize ${modelType} model:`, error);
      }
    });
  }
  
  /**
   * Get a specific model by type
   * @param modelType Type of model to retrieve
   * @returns The requested model or null if not found
   */
  getModel(modelType: ModelType): BaseModel | null {
    return this.models.get(modelType) || null;
  }
  
  /**
   * Get all available models
   * @returns Map of all models
   */
  getAllModels(): Map<ModelType, BaseModel> {
    return this.models;
  }
  
  /**
   * Set the active model type for predictions
   * @param modelType Model type to set as active
   */
  setActiveModel(modelType: ModelType): void {
    if (!this.models.has(modelType)) {
      throw new Error(`Model type ${modelType} not available`);
    }
    this.activeModelType = modelType;
    logger.info(`Set active model to ${modelType}`);
  }
  
  /**
   * Get the currently active model
   * @returns The active model or null if none set
   */
  getActiveModel(): BaseModel | null {
    if (!this.activeModelType) {
      return null;
    }
    return this.models.get(this.activeModelType) || null;
  }
  
  /**
   * Get the active model type
   * @returns Currently active model type or null
   */
  getActiveModelType(): ModelType | null {
    return this.activeModelType;
  }
  
  /**
   * Initialize all models
   */
  async initializeAllModels(): Promise<void> {
    const initializationPromises = Array.from(this.models.entries()).map(
      async ([modelType, model]) => {
        try {
          await model.initialize();
          logger.info(`Successfully initialized ${modelType} model`);
        } catch (error) {
          logger.error(`Failed to initialize ${modelType} model:`, error);
        }
      }
    );
    
    await Promise.all(initializationPromises);
  }
  
  /**
   * Dispose of all model resources
   */
  disposeAllModels(): void {
    this.models.forEach((model, modelType) => {
      try {
        model.dispose();
        logger.info(`Disposed ${modelType} model resources`);
      } catch (error) {
        logger.error(`Error disposing ${modelType} model:`, error);
      }
    });
    this.models.clear();
    this.activeModelType = null;
  }
}