import { BaseModel } from '../interfaces/BaseModel';
import logger from '@/lib/logger';

/**
 * Simple Decision Tree Node structure
 */
interface DecisionTreeNode {
  featureIndex?: number;
  threshold?: number;
  left?: DecisionTreeNode;
  right?: DecisionTreeNode;
  isLeaf: boolean;
  prediction?: number[];
  samples?: number;
}

/**
 * Decision Tree Model implementation
 * Simple CART (Classification and Regression Trees) algorithm
 */
export class DecisionTreeModel implements BaseModel {
  private root: DecisionTreeNode | null = null;
  private maxDepth: number = 10;
  private minSamplesSplit: number = 2;
  private minSamplesLeaf: number = 1;
  private isTrained: boolean = false;
  
  constructor(maxDepth: number = 10, minSamplesSplit: number = 2, minSamplesLeaf: number = 1) {
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
    this.minSamplesLeaf = minSamplesLeaf;
  }
  
  /**
   * Initialize the model
   */
  async initialize(): Promise<void> {
    logger.info('Decision Tree model initialized');
    // Decision tree doesn't need complex initialization
    this.isTrained = false;
    this.root = null;
  }
  
  /**
   * Train the decision tree model
   * @param features Training features
   * @param labels Training labels
   */
  async train(features: number[][], labels: number[][]): Promise<any> {
    if (!features || features.length === 0) {
      throw new Error('Training features cannot be empty');
    }
    
    if (!labels || labels.length === 0) {
      throw new Error('Training labels cannot be empty');
    }
    
    if (features.length !== labels.length) {
      throw new Error('Features and labels must have the same length');
    }
    
    logger.info(`Training Decision Tree with ${features.length} samples and ${features[0].length} features`);
    
    // Build the decision tree
    this.root = this.buildTree(features, labels, 0);
    this.isTrained = true;
    
    logger.info('Decision Tree training completed');
    return { treeDepth: this.getTreeDepth(this.root) };
  }
  
  /**
   * Build the decision tree recursively
   * @param features Current features subset
   * @param labels Current labels subset
   * @param depth Current tree depth
   */
  private buildTree(features: number[][], labels: number[][], depth: number): DecisionTreeNode {
    const numSamples = features.length;
    const numFeatures = features[0].length;
    
    // Stopping criteria
    if (depth >= this.maxDepth || 
        numSamples < this.minSamplesSplit || 
        this.isPure(labels) ||
        numSamples <= this.minSamplesLeaf) {
      return this.createLeafNode(labels);
    }
    
    // Find the best split
    const bestSplit = this.findBestSplit(features, labels, numFeatures);
    
    if (!bestSplit) {
      return this.createLeafNode(labels);
    }
    
    // Split the data
    const { leftIndices, rightIndices } = this.splitData(features, bestSplit.featureIndex!, bestSplit.threshold!);
    
    if (leftIndices.length < this.minSamplesLeaf || rightIndices.length < this.minSamplesLeaf) {
      return this.createLeafNode(labels);
    }
    
    // Create node and recursively build subtrees
    const node: DecisionTreeNode = {
      featureIndex: bestSplit.featureIndex,
      threshold: bestSplit.threshold,
      isLeaf: false
    };
    
    // Build left subtree
    if (leftIndices.length > 0) {
      const leftFeatures = leftIndices.map(i => features[i]);
      const leftLabels = leftIndices.map(i => labels[i]);
      node.left = this.buildTree(leftFeatures, leftLabels, depth + 1);
    }
    
    // Build right subtree
    if (rightIndices.length > 0) {
      const rightFeatures = rightIndices.map(i => features[i]);
      const rightLabels = rightIndices.map(i => labels[i]);
      node.right = this.buildTree(rightFeatures, rightLabels, depth + 1);
    }
    
    return node;
  }
  
  /**
   * Find the best feature and threshold to split on
   * @param features Features to consider
   * @param labels Labels for the samples
   * @param numFeatures Number of features to consider
   */
  private findBestSplit(features: number[][], labels: number[][], numFeatures: number) {
    let bestGini = Infinity;
    let bestSplit = null;
    
    // Try each feature
    for (let featureIndex = 0; featureIndex < numFeatures; featureIndex++) {
      // Get unique values for this feature
      const featureValues = features.map(row => row[featureIndex]);
      const uniqueValues = [...new Set(featureValues)].sort((a, b) => a - b);
      
      // Try splitting at different thresholds
      for (let i = 0; i < uniqueValues.length - 1; i++) {
        const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;
        
        const { leftIndices, rightIndices } = this.splitData(features, featureIndex, threshold);
        
        if (leftIndices.length === 0 || rightIndices.length === 0) {
          continue;
        }
        
        // Calculate weighted Gini impurity
        const leftLabels = leftIndices.map(i => labels[i]);
        const rightLabels = rightIndices.map(i => labels[i]);
        
        const leftGini = this.giniImpurity(leftLabels);
        const rightGini = this.giniImpurity(rightLabels);
        
        const weightedGini = (leftIndices.length / features.length) * leftGini + 
                           (rightIndices.length / features.length) * rightGini;
        
        if (weightedGini < bestGini) {
          bestGini = weightedGini;
          bestSplit = { featureIndex, threshold };
        }
      }
    }
    
    return bestSplit;
  }
  
  /**
   * Split data based on feature and threshold
   * @param features Features to split
   * @param featureIndex Index of feature to split on
   * @param threshold Threshold value
   */
  private splitData(features: number[][], featureIndex: number, threshold: number) {
    const leftIndices: number[] = [];
    const rightIndices: number[] = [];
    
    for (let i = 0; i < features.length; i++) {
      if (features[i][featureIndex] <= threshold) {
        leftIndices.push(i);
      } else {
        rightIndices.push(i);
      }
    }
    
    return { leftIndices, rightIndices };
  }
  
  /**
   * Calculate Gini impurity for a set of labels
   * @param labels Labels to calculate impurity for
   */
  private giniImpurity(labels: number[][]): number {
    if (labels.length === 0) return 0;
    
    // Count class frequencies
    const classCounts: Record<string, number> = {};
    labels.forEach(label => {
      const labelKey = label.join(',');
      classCounts[labelKey] = (classCounts[labelKey] || 0) + 1;
    });
    
    // Calculate Gini impurity
    let gini = 1;
    const total = labels.length;
    
    Object.values(classCounts).forEach(count => {
      const probability = count / total;
      gini -= probability * probability;
    });
    
    return gini;
  }
  
  /**
   * Check if all labels are the same (pure node)
   * @param labels Labels to check
   */
  private isPure(labels: number[][]): boolean {
    if (labels.length <= 1) return true;
    
    const firstLabel = labels[0].join(',');
    return labels.every(label => label.join(',') === firstLabel);
  }
  
  /**
   * Create a leaf node with majority class prediction
   * @param labels Labels for this node
   */
  private createLeafNode(labels: number[][]): DecisionTreeNode {
    // Find majority class
    const classCounts: Record<string, { count: number, label: number[] }> = {};
    
    labels.forEach(label => {
      const labelKey = label.join(',');
      if (!classCounts[labelKey]) {
        classCounts[labelKey] = { count: 0, label };
      }
      classCounts[labelKey].count++;
    });
    
    // Find the class with maximum count
    let maxCount = 0;
    let prediction: number[] = [];
    
    Object.values(classCounts).forEach(({ count, label }) => {
      if (count > maxCount) {
        maxCount = count;
        prediction = [...label];
      }
    });
    
    return {
      isLeaf: true,
      prediction,
      samples: labels.length
    };
  }
  
  /**
   * Make prediction for a single sample
   * @param features Features for prediction
   */
  async predict(features: number[]): Promise<number[]> {
    if (!this.isTrained || !this.root) {
      throw new Error('Model is not trained. Call train() first.');
    }
    
    if (!features) {
      throw new Error('Features cannot be null or undefined');
    }
    
    return this.traverseTree(features, this.root);
  }
  
  /**
   * Traverse the tree to make prediction
   * @param features Features to predict
   * @param node Current tree node
   */
  private traverseTree(features: number[], node: DecisionTreeNode): number[] {
    if (node.isLeaf) {
      return node.prediction || [];
    }
    
    if (node.featureIndex === undefined || node.threshold === undefined) {
      throw new Error('Invalid internal node structure');
    }
    
    // Navigate left or right based on feature value
    if (features[node.featureIndex] <= node.threshold) {
      return node.left ? this.traverseTree(features, node.left) : [];
    } else {
      return node.right ? this.traverseTree(features, node.right) : [];
    }
  }
  
  /**
   * Get the depth of the tree
   * @param node Root node to calculate depth from
   */
  private getTreeDepth(node: DecisionTreeNode | null): number {
    if (!node || node.isLeaf) return 0;
    
    const leftDepth = node.left ? this.getTreeDepth(node.left) : 0;
    const rightDepth = node.right ? this.getTreeDepth(node.right) : 0;
    
    return 1 + Math.max(leftDepth, rightDepth);
  }
  
  /**
   * Save the trained model
   * @param modelName Name to save the model under
   */
  async saveModel(modelName: string): Promise<boolean> {
    if (!this.isTrained || !this.root) {
      throw new Error('Cannot save untrained model. Train the model first.');
    }
    
    try {
      // Convert tree to serializable format
      const serializableTree = this.serializeTree(this.root);
      const modelData = {
        type: 'decision-tree',
        root: serializableTree,
        maxDepth: this.maxDepth,
        minSamplesSplit: this.minSamplesSplit,
        minSamplesLeaf: this.minSamplesLeaf,
        isTrained: this.isTrained
      };
      
      // In a real implementation, you would save this to storage
      // For now, we'll just log it
      logger.info(`Decision Tree model saved: ${JSON.stringify(modelData, null, 2)}`);
      return true;
    } catch (error) {
      logger.error('Failed to save Decision Tree model:', error);
      return false;
    }
  }
  
  /**
   * Serialize tree node for storage
   * @param node Node to serialize
   */
  private serializeTree(node: DecisionTreeNode): any {
    if (node.isLeaf) {
      return {
        isLeaf: true,
        prediction: node.prediction,
        samples: node.samples
      };
    }
    
    return {
      isLeaf: false,
      featureIndex: node.featureIndex,
      threshold: node.threshold,
      left: node.left ? this.serializeTree(node.left) : null,
      right: node.right ? this.serializeTree(node.right) : null
    };
  }
  
  /**
   * Load a saved model
   * @param modelName Name of the model to load
   */
  async loadModel(modelName: string): Promise<boolean> {
    try {
      // In a real implementation, you would load from storage
      // For now, we'll return false to indicate no saved model
      logger.info(`Attempting to load Decision Tree model: ${modelName}`);
      return false;
    } catch (error) {
      logger.error('Failed to load Decision Tree model:', error);
      return false;
    }
  }
  
  /**
   * Check if model is ready for predictions
   */
  isModelReady(): boolean {
    return this.isTrained && this.root !== null;
  }
  
  /**
   * Get model type for identification
   */
  getModelType(): string {
    return 'decision-tree';
  }
  
  /**
   * Get model parameters/configuration
   */
  getModelParameters(): any {
    return {
      maxDepth: this.maxDepth,
      minSamplesSplit: this.minSamplesSplit,
      minSamplesLeaf: this.minSamplesLeaf
    };
  }
  
  /**
   * Dispose of model resources
   */
  dispose(): void {
    this.root = null;
    this.isTrained = false;
    logger.info('Decision Tree model resources disposed');
  }
}