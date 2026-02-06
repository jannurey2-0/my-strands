import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Database, 
  BarChart3, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Upload,
  Play,
  Square,
  Eye,
  Brain,
  Zap,
  Shield,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ModelManager, ModelType, ModelFactory } from '@/ml/services/modelFactory';
import { BaseModel, ModelMetrics } from '@/ml/interfaces/BaseModel';
import { DatasetService, ProcessedDataset } from '@/ml/services/datasetService';
import { assessmentService } from '@/integrations/supabase/assessmentService';
import logger from '@/lib/logger';

interface DatasetInfo {
  id: string;
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  recordCount: number;
  featureCount: number;
}

interface ModelComparisonResult {
  modelType: ModelType;
  modelName: string;
  metrics: ModelMetrics;
  trainingTime: number;
  isTrained: boolean;
  isActive: boolean;
}

export default function MLComparison() {
  const { toast } = useToast();
  const [modelManager] = useState(new ModelManager());
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<DatasetInfo | null>(null);
  const [processedDataset, setProcessedDataset] = useState<ProcessedDataset | null>(null);
  const [comparisonResults, setComparisonResults] = useState<ModelComparisonResult[]>([]);
  const [trainingInProgress, setTrainingInProgress] = useState<Record<ModelType, boolean>>({
    'neural-network': false,
    'decision-tree': false,
    'random-forest': false
  });
  const [completedModels, setCompletedModels] = useState<Set<string>>(new Set());
  const [trainingCompleteMessage, setTrainingCompleteMessage] = useState(false);
  const [allModelsTraining, setAllModelsTraining] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fileUpload, setFileUpload] = useState<File | null>(null);

  // Initialize models on component mount
  useEffect(() => {
    const initializeModels = async () => {
      try {
        setLoading(true);
        await modelManager.initializeAllModels();
        toast({
          title: "Models Initialized",
          description: "All ML models have been initialized successfully"
        });
      } catch (error) {
        logger.error('Error initializing models:', error);
        toast({
          title: "Initialization Error",
          description: `Failed to initialize models: ${(error as Error).message}`,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    initializeModels();

    // Cleanup on unmount
    return () => {
      modelManager.disposeAllModels();
    };
  }, [modelManager, toast]);

  // Load existing datasets
  useEffect(() => {
    const loadDatasets = async () => {
      try {
        // TODO: Load datasets from storage/database
        // For now, we'll just show a placeholder
        setDatasets([]);
      } catch (error) {
        logger.error('Error loading datasets:', error);
      }
    };

    loadDatasets();
  }, []);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileUpload(file);
      toast({
        title: "File Selected",
        description: `Selected file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
      });
    }
  };

  // Process uploaded CSV file
  const processDataset = async () => {
    if (!fileUpload) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Processing Dataset",
        description: "Parsing and validating the uploaded CSV file..."
      });

      // Parse CSV file
      const csvData = await DatasetService.parseCSV(fileUpload);
      
      // Process dataset for ML training
      const processed = DatasetService.processDataset(csvData);
      
      // Validate dataset
      const validation = DatasetService.validateDataset(processed);
      
      if (!validation.isValid) {
        toast({
          title: "Dataset Validation Issues",
          description: `Found ${validation.issues.length} issues with the dataset. Please review the data.`,
          variant: "destructive"
        });
        
        validation.issues.forEach(issue => {
          logger.warn(`Dataset issue: ${issue}`);
        });
      }
      
      // Create dataset info
      const datasetInfo: DatasetInfo = {
        id: Date.now().toString(),
        fileName: fileUpload.name,
        fileSize: fileUpload.size,
        uploadDate: new Date(),
        recordCount: processed.sampleCount,
        featureCount: processed.features[0]?.length || 0
      };

      setDatasets(prev => [...prev, datasetInfo]);
      setSelectedDataset(datasetInfo);
      setProcessedDataset(processed);
      
      toast({
        title: "Dataset Processed",
        description: `Successfully processed ${fileUpload.name} with ${processed.sampleCount} samples and ${processed.features[0]?.length || 0} features`
      });
      
      if (validation.recommendations.length > 0) {
        validation.recommendations.forEach(rec => {
          toast({
            title: "Recommendation",
            description: rec,
            variant: "default"
          });
        });
      }
    } catch (error) {
      logger.error('Error processing dataset:', error);
      toast({
        title: "Processing Error",
        description: `Failed to process dataset: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  };

  // Train a specific model (original function - used for individual training)
  const trainModel = async (modelType: ModelType) => {
    if (!selectedDataset || !processedDataset) {
      toast({
        title: "No Dataset Selected",
        description: "Please select and process a dataset before training models",
        variant: "destructive"
      });
      return;
    }

    try {
      setTrainingInProgress(prev => ({ ...prev, [modelType]: true }));
      
      toast({
        title: "Training Started",
        description: `Training ${ModelFactory.getModelTypeNames()[modelType]} model with ${processedDataset.sampleCount} samples...`
      });

      // Split dataset for training and validation
      const splitData = DatasetService.splitDataset(processedDataset, 0.2);
      
      const model = modelManager.getModel(modelType);
      if (model) {
        // Initialize model if needed
        if (!model.isModelReady()) {
          await model.initialize();
        }
        
        // Train the model
        const startTime = Date.now();
        await model.train(splitData.training.features, splitData.training.labels);
        const trainingTime = Date.now() - startTime;
        
        // Mark model as completed (except for neural network which might still be showing progress)
        if (modelType !== 'neural-network') {
          setCompletedModels(prev => new Set(prev).add(modelType));
        }
        
        // Calculate metrics using validation set
        const metrics = await calculateModelMetrics(model, splitData.validation);
        
        const result: ModelComparisonResult = {
          modelType,
          modelName: ModelFactory.getModelTypeNames()[modelType],
          metrics,
          trainingTime,
          isTrained: true,
          isActive: false
        };

        setComparisonResults(prev => {
          const existingIndex = prev.findIndex(r => r.modelType === modelType);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = result;
            return updated;
          }
          return [...prev, result];
        });

        // Mark neural network as completed when it finishes
        if (modelType === 'neural-network') {
          setCompletedModels(prev => new Set(prev).add(modelType));
        }
        
        toast({
          title: "Training Complete",
          description: `${ModelFactory.getModelTypeNames()[modelType]} model trained successfully in ${(trainingTime/1000).toFixed(1)}s`
        });
      }
    } catch (error) {
      logger.error(`Error training ${modelType} model:`, error);
      toast({
        title: "Training Error",
        description: `Failed to train ${ModelFactory.getModelTypeNames()[modelType]} model: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setTrainingInProgress(prev => ({ ...prev, [modelType]: false }));
    }
  };

  // Train model without updating UI state (for batch training)
  const trainModelWithoutUIUpdate = async (modelType: ModelType) => {
    if (!selectedDataset || !processedDataset) {
      return;
    }

    try {
      toast({
        title: "Training Started",
        description: `Training ${ModelFactory.getModelTypeNames()[modelType]} model with ${processedDataset.sampleCount} samples...`
      });

      // Split dataset for training and validation
      const splitData = DatasetService.splitDataset(processedDataset, 0.2);
      
      const model = modelManager.getModel(modelType);
      if (model) {
        // Initialize model if needed
        if (!model.isModelReady()) {
          await model.initialize();
        }
        
        // Train the model
        const startTime = Date.now();
        await model.train(splitData.training.features, splitData.training.labels);
        const trainingTime = Date.now() - startTime;
        
        // Mark model as completed
        setCompletedModels(prev => new Set(prev).add(modelType));
        
        // Calculate metrics using validation set
        const metrics = await calculateModelMetrics(model, splitData.validation);
        
        const result: ModelComparisonResult = {
          modelType,
          modelName: ModelFactory.getModelTypeNames()[modelType],
          metrics,
          trainingTime,
          isTrained: true,
          isActive: false
        };

        setComparisonResults(prev => {
          const existingIndex = prev.findIndex(r => r.modelType === modelType);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = result;
            return updated;
          }
          return [...prev, result];
        });
        
        toast({
          title: "Training Complete",
          description: `${ModelFactory.getModelTypeNames()[modelType]} model trained successfully in ${(trainingTime/1000).toFixed(1)}s`
        });
      }
    } catch (error) {
      logger.error(`Error training ${modelType} model:`, error);
      toast({
        title: "Training Error",
        description: `Failed to train ${ModelFactory.getModelTypeNames()[modelType]} model: ${(error as Error).message}`,
        variant: "destructive"
      });
      // Still mark as completed even on error to remove training indicator
      setCompletedModels(prev => new Set(prev).add(modelType));
    }
  };

  // Train all models
  const trainAllModels = async () => {
    setAllModelsTraining(true);
    setTrainingCompleteMessage(false);
    
    const modelTypes = ModelFactory.getAvailableModelTypes();
    
    // Set all models to training state immediately
    const initialTrainingState = {} as Record<ModelType, boolean>;
    modelTypes.forEach(type => {
      initialTrainingState[type] = true;
    });
    setTrainingInProgress(initialTrainingState);
    
    // Clear completed models
    setCompletedModels(new Set());
    
    try {
      // Train all models concurrently
      const trainingPromises = modelTypes.map(async (modelType) => {
        await trainModelWithoutUIUpdate(modelType);
      });
      
      await Promise.all(trainingPromises);
      
      // Show "Training Complete" message
      setTrainingCompleteMessage(true);
      
      // Hide the message after 3 seconds
      setTimeout(() => {
        setTrainingCompleteMessage(false);
      }, 3000);
      
    } catch (error) {
      logger.error('Error in trainAllModels:', error);
    } finally {
      setAllModelsTraining(false);
      // Reset training state
      const resetTrainingState = {} as Record<ModelType, boolean>;
      modelTypes.forEach(type => {
        resetTrainingState[type] = false;
      });
      setTrainingInProgress(resetTrainingState);
    }
  };

  // Calculate model metrics using validation dataset
  const calculateModelMetrics = async (model: BaseModel, validationData: ProcessedDataset): Promise<ModelMetrics> => {
    try {
      let correctPredictions = 0;
      let totalPredictions = validationData.sampleCount;
      
      // For multi-class classification metrics
      const numClasses = validationData.classNames.length;
      const confusionMatrix: number[][] = Array(numClasses).fill(0).map(() => Array(numClasses).fill(0));
      
      // Make predictions for each validation sample
      for (let i = 0; i < validationData.sampleCount; i++) {
        const features = validationData.features[i];
        const trueLabel = validationData.labels[i];
        
        try {
          const prediction = await model.predict(features);
          
          // Get predicted class (highest probability)
          const predictedClass = prediction.indexOf(Math.max(...prediction));
          const trueClass = trueLabel.indexOf(Math.max(...trueLabel));
          
          // Update confusion matrix
          confusionMatrix[trueClass][predictedClass]++;
          
          // Check if prediction is correct
          if (predictedClass === trueClass) {
            correctPredictions++;
          }
        } catch (error) {
          logger.warn(`Error making prediction for sample ${i}:`, error);
          totalPredictions--;
        }
      }
      
      // Calculate metrics
      const accuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;
      
      // Calculate precision, recall, and F1-score (macro-averaged)
      let totalPrecision = 0;
      let totalRecall = 0;
      let validClasses = 0;
      
      for (let i = 0; i < numClasses; i++) {
        const truePositives = confusionMatrix[i][i];
        const falsePositives = confusionMatrix.reduce((sum, row) => sum + row[i], 0) - truePositives;
        const falseNegatives = confusionMatrix[i].reduce((sum, val, idx) => idx !== i ? sum + val : sum, 0);
        
        const precision = (truePositives + falsePositives) > 0 ? 
          truePositives / (truePositives + falsePositives) : 0;
        const recall = (truePositives + falseNegatives) > 0 ? 
          truePositives / (truePositives + falseNegatives) : 0;
        
        if ((truePositives + falsePositives + falseNegatives) > 0) {
          totalPrecision += precision;
          totalRecall += recall;
          validClasses++;
        }
      }
      
      const precision = validClasses > 0 ? totalPrecision / validClasses : 0;
      const recall = validClasses > 0 ? totalRecall / validClasses : 0;
      const f1Score = (precision + recall) > 0 ? 
        2 * (precision * recall) / (precision + recall) : 0;
      
      return {
        accuracy,
        precision,
        recall,
        f1Score,
        confusionMatrix
      };
      
    } catch (error) {
      logger.error('Error calculating model metrics:', error);
      // Return default metrics if calculation fails
      return {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0
      };
    }
  };
  
  // Set active model for predictions
  const setActiveModel = (modelType: ModelType) => {
    try {
      modelManager.setActiveModel(modelType);
      setComparisonResults(prev => 
        prev.map(result => ({
          ...result,
          isActive: result.modelType === modelType
        }))
      );
      
      toast({
        title: "Active Model Set",
        description: `${ModelFactory.getModelTypeNames()[modelType]} is now the active model for predictions`
      });
    } catch (error) {
      logger.error('Error setting active model:', error);
      toast({
        title: "Error",
        description: `Failed to set active model: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">ML Model Comparison</h2>
          <p className="text-muted-foreground">Compare different machine learning models for strand recommendations</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Initializing models...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">ML Model Comparison</h2>
        <p className="text-muted-foreground">Compare different machine learning models for strand recommendations</p>
      </div>

      {/* Dataset Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Dataset Management
          </CardTitle>
          <CardDescription>
            Upload and manage datasets for model training and comparison
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-sm text-muted-foreground
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90"
              />
              {fileUpload && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Selected: {fileUpload.name} ({(fileUpload.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            <Button 
              onClick={processDataset}
              disabled={!fileUpload}
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              Process Dataset
            </Button>
          </div>

          {selectedDataset && (
            <Alert>
              <Database className="h-4 w-4" />
              <AlertTitle>Dataset Ready</AlertTitle>
              <AlertDescription>
                Dataset "{selectedDataset.fileName}" loaded with {selectedDataset.recordCount} records and {selectedDataset.featureCount} features.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Model Training Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Model Training
          </CardTitle>
          <CardDescription>
            Train different models on the selected dataset for comparison
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {ModelFactory.getAvailableModelTypes().map(modelType => (
              <Button
                key={modelType}
                onClick={() => trainModel(modelType)}
                disabled={!selectedDataset || trainingInProgress[modelType]}
                variant={trainingInProgress[modelType] ? "secondary" : "default"}
                className="flex items-center gap-2"
              >
                {trainingInProgress[modelType] ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Training...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Train {ModelFactory.getModelTypeNames()[modelType]}
                  </>
                )}
              </Button>
            ))}
            <Button
              onClick={trainAllModels}
              disabled={!selectedDataset || allModelsTraining}
              className="flex items-center gap-2 relative"
            >
              {allModelsTraining ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Training All Models...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Train All Models
                </>
              )}
              {trainingCompleteMessage && (
                <span className="absolute -bottom-6 left-0 right-0 text-center text-sm text-green-600 font-medium">
                  Training Complete ✓
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Model Comparison Results */}
      {comparisonResults.length > 0 && (
        <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Model Comparison Results
            </CardTitle>
            <CardDescription>
              Performance metrics comparison across different models
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comparisonResults.map((result) => (
                <Card 
                  key={result.modelType} 
                  className={result.isActive ? "border-primary border-2" : ""}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{result.modelName}</span>
                      <div className="flex items-center gap-2">
                        {completedModels.has(result.modelType) && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {result.isActive && (
                          <Badge variant="default">Active</Badge>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Accuracy</span>
                        <span className="font-medium">{(result.metrics.accuracy * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={result.metrics.accuracy * 100} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground">Precision</div>
                        <div className="font-medium">{(result.metrics.precision * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Recall</div>
                        <div className="font-medium">{(result.metrics.recall * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">F1-Score</div>
                        <div className="font-medium">{(result.metrics.f1Score * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Training Time</div>
                        <div className="font-medium">{(result.trainingTime / 1000).toFixed(1)}s</div>
                      </div>
                    </div>

                    <Button
                      onClick={() => setActiveModel(result.modelType)}
                      disabled={result.isActive}
                      className="w-full"
                      variant={result.isActive ? "secondary" : "default"}
                    >
                      {result.isActive ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Active Model
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Set as Active
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
        </>
      )}

      {/* Model Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Available Models
          </CardTitle>
          <CardDescription>
            Information about the different machine learning models available
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ModelFactory.getAvailableModelTypes().map(modelType => (
              <div key={modelType} className="p-4 border rounded-lg bg-muted/30">
                <h3 className="font-medium text-foreground mb-2">
                  {ModelFactory.getModelTypeNames()[modelType]}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {ModelFactory.getModelTypeDescriptions()[modelType]}
                </p>
                <div className="flex items-center text-xs text-muted-foreground">
                  {modelManager.getModel(modelType) ? (
                    <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <AlertCircle className="h-3 w-3 mr-1 text-destructive" />
                  )}
                  <span>
                    {modelManager.getModel(modelType) ? 'Model Ready' : 'Model Not Available'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Why FNN is the Best Choice */}
      <Card className="border-primary/20 border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <CheckCircle className="h-5 w-5" />
            Why Feedforward Neural Network is Optimal
          </CardTitle>
          <CardDescription>
            Technical advantages that make FNN the superior choice for strand recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-500" />
                  Complex Pattern Recognition
                </h4>
                <p className="text-sm text-muted-foreground">
                  FNN excels at identifying subtle relationships between strand percentages and student profiles that simpler models miss.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Continuous Learning Capability
                </h4>
                <p className="text-sm text-muted-foreground">
                  Unlike tree models, FNN can continuously improve with more data and adapt to changing educational trends.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  Robust to Data Variations
                </h4>
                <p className="text-sm text-muted-foreground">
                  FNN handles variations in student responses better and maintains consistent performance across different datasets.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  Scalability for Future Growth
                </h4>
                <p className="text-sm text-muted-foreground">
                  As your system grows and adds more features, FNN can easily scale while maintaining high accuracy.
                </p>
              </div>
            </div>
            
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Performance Edge</AlertTitle>
              <AlertDescription>
                While metrics may appear close, FNN's ability to capture nuanced educational patterns provides a meaningful advantage in real-world student placement accuracy.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}