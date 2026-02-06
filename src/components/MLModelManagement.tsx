import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Cpu, 
  Play, 
  Square, 
  Database, 
  BarChart3, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Zap,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ModelService } from '@/ml/services/modelService';
import { mlAssessmentService } from '@/ml/services/mlAssessmentService';
import { IAssessment, ITrainingData } from '@/ml/interfaces/IAssessment';
import { MODEL_CONFIG } from '@/ml/config/modelConfig';
import logger from '@/lib/logger';
import { assessmentService } from '@/integrations/supabase/assessmentService';

interface ModelStatus {
  isInitialized: boolean;
  isTrained: boolean;
  trainingInProgress: boolean;
  lastTrained?: Date;
  trainingError?: string;
  dataCount: number;
  modelPath?: string;
}

interface TrainingProgress {
  epoch: number;
  totalEpochs: number;
  loss: number;
  accuracy: number;
  valAccuracy: number;
  currentStep: string;
  stepProgress: number;
}

export const MLModelManagement = () => {
  const { toast } = useToast();
  const [modelStatus, setModelStatus] = useState<ModelStatus>({
    isInitialized: false,
    isTrained: false,
    trainingInProgress: false,
    dataCount: 0,
    lastTrained: undefined,
    trainingError: undefined,
    modelPath: undefined
  });
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>({
    epoch: 0,
    totalEpochs: MODEL_CONFIG.training?.epochs || 100,
    loss: 0,
    accuracy: 0,
    valAccuracy: 0,
    currentStep: 'Initializing',
    stepProgress: 0
  });
  const [mlModelEnabled, setMlModelEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modelService] = useState(new ModelService());
  const [trainingLock, setTrainingLock] = useState(false); // Add lock state

  // Fetch model status and data count
  const fetchModelStatus = async () => {
    try {
      setLoading(true);
      
      toast({
        title: "Loading Model Status",
        description: "Fetching ML model status and data count..."
      });
      
      // Check if ML model is enabled in system settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('system_settings')
        .select('*')
        .eq('page_name', 'ml_model');
      
      if (settingsError) {
        logger.error('Error fetching ML model settings:', settingsError);
        toast({
          title: "Warning",
          description: "Failed to fetch ML model settings. Using default configuration.",
          variant: "destructive"
        });
        // This is not critical, we can continue
      } else if (settingsData && settingsData.length > 0) {
        // For ML model, is_under_maintenance = true means ENABLED
        // This is different from other pages where it means maintenance mode
        setMlModelEnabled(settingsData[0].is_under_maintenance || false);
      }
      
      // Fetch assessment data count
      const { count: dataCount, error: countError } = await supabase
        .from('assessment_responses')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        logger.error('Error fetching assessment count:', countError);
        toast({
          title: "Data Fetch Error",
          description: `Failed to fetch assessment data count: ${countError.message}`,
          variant: "destructive"
        });
        throw new Error(`Failed to fetch assessment data count: ${countError.message}`);
      }
      
      // Check if there's a record of a trained model in the system settings
      // We'll add a custom field to track this
      let isTrained = false;
      if (settingsData && settingsData.length > 0) {
        // Check if we have a record of when the model was last trained
        const lastTrained = (settingsData[0] as any).last_trained;
        if (lastTrained) {
          isTrained = true;
        }
      }
      
      // Also check if model is actually trained by trying to make a prediction
      let isActuallyTrained = false;
      try {
        // Try to make a simple prediction to check if model is trained
        isActuallyTrained = modelService.isModelReady();
      } catch (e) {
        console.log('Model not ready for predictions yet');
      }
      
      setModelStatus(prev => ({
        ...prev,
        dataCount: dataCount || 0,
        isInitialized: modelService.isModelReady() || prev.isInitialized, // Keep initialized state
        isTrained: isTrained || isActuallyTrained || prev.isTrained // Preserve trained state
      }));
      
      toast({
        title: "Model Status Loaded",
        description: `Found ${dataCount || 0} assessment records for training.`
      });
    } catch (error) {
      logger.error('Error fetching model status:', error);
      toast({
        title: "Error",
        description: `Failed to fetch model status: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize model on component mount (without auto-training)
  useEffect(() => {
    const initializeModel = async () => {
      try {
        // Only initialize the model architecture, don't start training
        // Training will only happen when admin clicks "Train Model" button
        await modelService.initialize();
        setModelStatus(prev => ({ ...prev, isInitialized: true }));
        await fetchModelStatus();
        
        // Only show success toast if model was loaded, not if it needs training
        if (modelService.isModelReady()) {
          toast({
            title: "Model Ready",
            description: "ML model loaded successfully!"
          });
        } else {
          toast({
            title: "Model Initialized",
            description: "Model architecture ready. Click 'Train Model' to start training."
          });
        }
      } catch (error) {
        logger.error('Error initializing model:', error);
        setModelStatus(prev => ({ 
          ...prev, 
          isInitialized: false,
          trainingError: `Failed to initialize model: ${(error as Error).message}`
        }));
        toast({
          title: "Model Initialization Error",
          description: `Failed to initialize ML model: ${(error as Error).message}`,
          variant: "destructive"
        });
      }
    };

    initializeModel();
  }, [modelService, toast]);

  // Train the model with locking mechanism
  const handleTrainModel = async () => {
    // Check if training is already in progress
    if (trainingLock) {
      toast({
        title: "Training in Progress",
        description: "Model training is already in progress. Please wait for it to complete.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Ensure model is initialized before training
      if (!modelService.isModelReady() && !modelStatus.isInitialized) {
        toast({
          title: "Initializing Model",
          description: "Initializing model architecture before training..."
        });
        await modelService.initialize();
        setModelStatus(prev => ({ ...prev, isInitialized: true }));
      }
      
      // Set the lock
      setTrainingLock(true);
      setModelStatus(prev => ({ ...prev, trainingInProgress: true, trainingError: undefined }));
      setTrainingProgress({
        epoch: 0,
        totalEpochs: MODEL_CONFIG.training?.epochs || 100,
        loss: 0,
        accuracy: 0,
        valAccuracy: 0,
        currentStep: 'Initializing',
        stepProgress: 0
      });
      
      toast({
        title: "Training Started",
        description: "Fetching assessment data for training..."
      });
      
      // Fetch assessment data for training
      const assessmentsData: any = await mlAssessmentService.getAllAssessments();
      
      if (!assessmentsData || assessmentsData.length === 0) {
        throw new Error('No assessment data found for training. Please ensure there are completed assessments in the system.');
      }
      
      if (assessmentsData.length < 10) {
        toast({
          title: "Warning",
          description: `Only ${assessmentsData.length} assessments found. For better model performance, consider collecting at least 50-100 assessments.`,
          variant: "destructive"
        });
      }
      
      // Convert database records to IAssessment format
      const formattedAssessments: IAssessment[] = assessmentsData.map((assessment: any, index) => {
        try {
          return {
            basicInfo: assessment.basic_info as IAssessment['basicInfo'],
            academicProfile: assessment.academic_profile as IAssessment['academicProfile'],
            personalInterests: assessment.personal_interests as string[],
            hobbies: assessment.hobbies as string[],
            aptitudeAnswers: assessment.aptitude_answers as Record<string, number | string>,
            // Use actual strand data for supervised learning if available
            actualStrand: assessment.actual_strand as string | undefined
          };
        } catch (formatError) {
          logger.error(`Error formatting assessment at index ${index}:`, formatError);
          throw new Error(`Failed to format assessment data at index ${index}: ${(formatError as Error).message}`);
        }
      });
      
      // Log some statistics about the data
      const recordsWithStrand = formattedAssessments.filter(a => a.actualStrand);
      logger.info(`Found ${recordsWithStrand.length} records with actual strand data out of ${formattedAssessments.length} total records`);
      
      if (recordsWithStrand.length > 0) {
        const strandCounts: Record<string, number> = {};
        recordsWithStrand.forEach(assessment => {
          const strand = assessment.actualStrand || 'unknown';
          strandCounts[strand] = (strandCounts[strand] || 0) + 1;
        });
        
        logger.info('Strand distribution in training data:', strandCounts);
        toast({
          title: "Training Data Analysis",
          description: `Found ${recordsWithStrand.length}/${formattedAssessments.length} records with actual strand data. Strand distribution: ${Object.entries(strandCounts).map(([strand, count]) => `${strand}: ${count}`).join(', ')}`
        });
      }
      
      // Prepare training data using the model service method
      const trainingData: ITrainingData[] = modelService.prepareTrainingData(formattedAssessments);
      
      if (trainingData.length === 0) {
        throw new Error('No valid training data found. Please ensure there are completed assessments with valid data.');
      }
      
      toast({
        title: "Training Data Prepared",
        description: `Prepared ${trainingData.length} samples for training. Starting model training...`
      });
      
      // Train the model using the model service method
      const history = await modelService.trainModel(trainingData);
      
      // Log training results
      if (history && history.history) {
        const finalLoss = history.history.loss[history.history.loss.length - 1];
        const finalAccuracy = history.history.acc ? history.history.acc[history.history.acc.length - 1] : 0;
        const finalValAccuracy = history.history.val_acc ? history.history.val_acc[history.history.val_acc.length - 1] : 0;
        
        logger.info('Training completed with results:', {
          finalLoss,
          finalAccuracy,
          finalValAccuracy
        });
        
        toast({
          title: "Training Progress",
          description: `Final Loss: ${finalLoss.toFixed(4)}, Accuracy: ${(finalAccuracy * 100).toFixed(2)}%, Validation Accuracy: ${(finalValAccuracy * 100).toFixed(2)}%`
        });
      }
      
      // Update model status - correctly set both trained flag and keep initialized state
      setModelStatus(prev => ({
        ...prev,
        isTrained: true,
        lastTrained: new Date(),
        trainingError: undefined
      }));
      
      // Update the system settings to record when the model was last trained
      try {
        const { error: updateError } = await supabase
          .from('system_settings')
          .upsert({
            page_name: 'ml_model',
            last_trained: new Date().toISOString()
          }, {
            onConflict: 'page_name'
          });
        
        if (updateError) {
          console.warn('Failed to update last trained timestamp:', updateError);
        }
      } catch (updateError) {
        console.warn('Error updating last trained timestamp:', updateError);
      }
      
      // Save the trained model to Supabase Storage (shared) and local storage
      try {
        const saved = await modelService.saveModel('strand-recommender-v1', true);
        if (saved) {
          toast({
            title: "Training Complete",
            description: "Model training completed successfully! The model has been saved to Supabase Storage and is now available for all users."
          });
        } else {
          toast({
            title: "Training Complete (Local Only)",
            description: "Model training completed successfully! The model is saved locally but could not be uploaded to Supabase Storage. Please check storage permissions."
          });
        }
      } catch (saveError) {
        console.warn('Model saving warning:', saveError);
        toast({
          title: "Training Complete (Session Only)",
          description: "Model training completed successfully! The model will be available during this session but could not be saved."
        });
      }
      
      // Refresh model status
      await fetchModelStatus();
      
    } catch (error) {
      logger.error('Error training model:', error);
      setModelStatus(prev => ({ 
        ...prev, 
        trainingError: `Training failed: ${(error as Error).message}`,
        isTrained: false
      }));
      toast({
        title: "Training Error",
        description: `Failed to train model: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      // Release the lock
      setTrainingLock(false);
      setModelStatus(prev => ({ ...prev, trainingInProgress: false }));
    }
  };

  // Stop training
  const handleStopTraining = () => {
    // In a real implementation, you would stop the training process
    setModelStatus(prev => ({ ...prev, trainingInProgress: false }));
    setTrainingProgress(null);
    toast({
      title: "Training Stopped",
      description: "Model training has been stopped."
    });
  };

  // Toggle ML model usage
  const toggleMlModel = async (enabled: boolean) => {
    try {
      // Check if model is trained before enabling
      if (enabled && !modelStatus.isTrained) {
        toast({
          title: "Model Not Trained",
          description: "Please train the model before enabling it for use.",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Updating Settings",
        description: `Setting ML Model to ${enabled ? 'enabled' : 'disabled'}...`
      });
      
      // Update system settings
      // For ML model, is_under_maintenance = true means ENABLED
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          page_name: 'ml_model',
          is_under_maintenance: enabled,
          maintenance_message: enabled ? 'ML Model Enabled' : 'ML Model Disabled',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'page_name'
        });
      
      if (error) {
        throw new Error(`Failed to update ML model settings: ${error.message}`);
      }
      
      setMlModelEnabled(enabled);
      toast({
        title: "Success",
        description: `ML Model ${enabled ? 'enabled' : 'disabled'} successfully`
      });
    } catch (error) {
      logger.error('Error toggling ML model:', error);
      toast({
        title: "Error",
        description: `Failed to ${enabled ? 'enable' : 'disable'} ML model: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  };

  // Test model prediction
  const handleTestModel = async () => {
    try {
      if (!modelStatus.isTrained) {
        toast({
          title: "Model Not Trained",
          description: "Please train the model before testing.",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Testing Model",
        description: "Running sample prediction... This may take a moment."
      });
      
      // Fetch a sample assessment for testing
      const assessmentsData = await mlAssessmentService.getAllAssessments();
      
      if (!assessmentsData || assessmentsData.length === 0) {
        throw new Error('No assessment data found for testing.');
      }
      
      // Use the most recent assessment for prediction
      const latestAssessment = assessmentsData[0];
      
      // Convert to IAssessment format
      const sampleAssessment: IAssessment = {
        basicInfo: latestAssessment.basic_info as IAssessment['basicInfo'],
        academicProfile: latestAssessment.academic_profile as IAssessment['academicProfile'],
        personalInterests: latestAssessment.personal_interests as string[],
        hobbies: latestAssessment.hobbies as string[],
        aptitudeAnswers: latestAssessment.aptitude_answers as Record<string, number | string>
      };
      
      // Make prediction
      const prediction = await modelService.predict(sampleAssessment);
      
      toast({
        title: "Prediction Complete",
        description: `Sample prediction results - STEM: ${prediction.STEM.toFixed(2)}%, ABM: ${prediction.ABM.toFixed(2)}%, HUMSS: ${prediction.HUMSS.toFixed(2)}%, GAS: ${prediction.GAS.toFixed(2)}%, TVL: ${prediction.TVL.toFixed(2)}%, Arts: ${prediction.Arts.toFixed(2)}%`
      });
    } catch (error) {
      logger.error('Error testing model:', error);
      toast({
        title: "Test Error",
        description: `Failed to test model: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  }
  
  // Export assessment records as CSV
  const exportAssessmentRecordsAsCSV = async () => {
    try {
      toast({
        title: "Exporting Data",
        description: "Fetching assessment records for export..."
      });
        
      // Get all assessment records
      const assessments = await assessmentService.getAllAssessments();
        
      if (!assessments || assessments.length === 0) {
        toast({
          title: "No Data Found",
          description: "There are no assessment records to export.",
          variant: "destructive"
        });
        return;
      }
        
      // Get student profiles to match with assessment records
      const studentIds = [...new Set(assessments.map(assessment => assessment.student_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', studentIds);
        
      if (profilesError) {
        throw new Error(`Failed to fetch student profiles: ${profilesError.message}`);
      }
        
      // Prepare CSV data
      const csvRows = [];
        
      // Add header row
      csvRows.push([
        'ID',
        'Student Name',
        'Email',
        'Full Name',
        'Age',
        'Gender',
        'School',
        'Region',
        'GWA',
        'Favorite Subjects',
        'Least Favorite Subjects',
        'Personal Interests',
        'Hobbies',
        'Submitted At',
        'Actual Strand',
        'STEM %',
        'ABM %',
        'HUMSS %',
        'GAS %',
        'TVL %',
        'Arts %'
      ].join(','));
        
      // Process each assessment record
      assessments.forEach(assessment => {
        const studentProfile = profiles?.find(p => p.id === assessment.student_id);
          
        // Extract recommendations if they exist
        const recommendations = assessment.recommendations as Record<string, number>;
          
        // Create CSV row
        const row = [
          assessment.id,
          studentProfile?.full_name || '',
          studentProfile?.email || '',
          ((assessment.basic_info as any)?.fullName) || '',
          ((assessment.basic_info as any)?.age) || '',
          ((assessment.basic_info as any)?.gender) || '',
          ((assessment.basic_info as any)?.school) || '',
          ((assessment.basic_info as any)?.region) || '',
          ((assessment.academic_profile as any)?.gwa) || '',
          Array.isArray((assessment.academic_profile as any)?.favoriteSubjects) ? 
            (assessment.academic_profile as any).favoriteSubjects.join('; ') : '',
          Array.isArray((assessment.academic_profile as any)?.leastFavoriteSubjects) ? 
            (assessment.academic_profile as any).leastFavoriteSubjects.join('; ') : '',
          Array.isArray(assessment.personal_interests) ? 
            assessment.personal_interests.join('; ') : '',
          Array.isArray(assessment.hobbies) ? 
            assessment.hobbies.join('; ') : '',
          assessment.submitted_at || '',
          assessment.actual_strand || ''
        ];
          
        // Add recommendation percentages
        if (recommendations) {
          row.push(
            recommendations.STEM?.toFixed(2) || '',
            recommendations.ABM?.toFixed(2) || '',
            recommendations.HUMSS?.toFixed(2) || '',
            recommendations.GAS?.toFixed(2) || '',
            recommendations.TVL?.toFixed(2) || '',
            recommendations.Arts?.toFixed(2) || ''
          );
        } else {
          row.push('', '', '', '', '', ''); // Empty cells if no recommendations
        }
          
        // Escape quotes and add the row
        const escapedRow = row.map(cell => {
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('\n') || cell.includes('"'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return String(cell);
        });
          
        csvRows.push(escapedRow.join(','));
      });
        
      // Create CSV content
      const csvContent = csvRows.join('\n');
        
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `assessment_records_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
        
      toast({
        title: "Export Successful",
        description: `Successfully exported ${assessments.length} assessment records to CSV.`
      });
    } catch (error) {
      logger.error('Error exporting assessment records:', error);
      toast({
        title: "Export Failed",
        description: `Failed to export assessment records: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">ML Model Management</h2>
          <p className="text-muted-foreground">Manage machine learning model for strand recommendations</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Loading model status...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">ML Model Management</h2>
        <p className="text-muted-foreground">Manage machine learning model for strand recommendations</p>
      </div>

      {/* Export Assessment Records Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Export Assessment Records
          </CardTitle>
          <CardDescription>
            Export all student assessment records to CSV format for analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg bg-muted/30">
            <div className="flex-1">
              <h3 className="font-medium text-foreground">Export Data</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Download all assessment records as a CSV file. This includes student information, 
                academic profiles, personal interests, and strand recommendations.
              </p>
            </div>
            <Button 
              onClick={exportAssessmentRecordsAsCSV}
              className="flex items-center gap-2"
              disabled={modelStatus.dataCount === 0}
            >
              <Database className="h-4 w-4" />
              Export {modelStatus.dataCount} Records as CSV
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Model Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-primary/20 border-2 hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">{modelStatus.dataCount}</div>
                <div className="text-xs text-muted-foreground">Assessments</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground mt-2">
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${modelStatus.dataCount >= 50 ? 'bg-green-200' : 'bg-red-200'}`}>
                <div 
                  className={`h-full ${modelStatus.dataCount >= 50 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(100, (modelStatus.dataCount / 50) * 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-2">
              <span>{modelStatus.dataCount >= 50 ? (
                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <AlertCircle className="h-3 w-3 mr-1 text-destructive" />
              )}
              {modelStatus.dataCount >= 50 ? 'Sufficient' : 'Insufficient'} for training</span>
            </div>
          </CardContent>
        </Card>

        <Card className={modelStatus.isInitialized ? "border-green-500/20 border-2 hover:shadow-md transition-shadow duration-300" : "border-destructive/20 border-2 hover:shadow-md transition-shadow duration-300"}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${modelStatus.isInitialized ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
                <Cpu className={`w-5 h-5 ${modelStatus.isInitialized ? 'text-green-500' : 'text-destructive'}`} />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">
                  {modelStatus.isInitialized ? 'Ready' : 'Not Ready'}
                </div>
                <div className="text-xs text-muted-foreground">Model Status</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              {modelStatus.isInitialized ? (
                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <AlertCircle className="h-3 w-3 mr-1 text-destructive" />
              )}
              <span>{modelStatus.isInitialized ? 'Initialized' : 'Initialization failed'}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {modelStatus.isInitialized ? 'Model is ready for training' : 'Model needs to be initialized'}
            </div>
          </CardContent>
        </Card>

        <Card className={modelStatus.isTrained ? "border-green-500/20 border-2 hover:shadow-md transition-shadow duration-300" : "border-destructive/20 border-2 hover:shadow-md transition-shadow duration-300"}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${modelStatus.isTrained ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
                <Zap className={`w-5 h-5 ${modelStatus.isTrained ? 'text-green-500' : 'text-destructive'}`} />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">
                  {modelStatus.isTrained ? 'Trained' : 'Not Trained'}
                </div>
                <div className="text-xs text-muted-foreground">Training Status</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              {modelStatus.isTrained ? (
                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <AlertCircle className="h-3 w-3 mr-1 text-destructive" />
              )}
              <span>{modelStatus.isTrained ? 'Model ready for predictions' : 'Model needs training'}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {modelStatus.isTrained ? 'Ready for strand recommendations' : 'Train model to enable predictions'}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-accent-foreground" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">
                  {mlModelEnabled ? 'Enabled' : 'Disabled'}
                </div>
                <div className="text-xs text-muted-foreground">Usage Status</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-muted-foreground">
                {mlModelEnabled ? (
                  <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                ) : (
                  <AlertCircle className="h-3 w-3 mr-1 text-destructive" />
                )}
                <span>{mlModelEnabled ? 'Active in assessments' : 'Not in use'}</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {mlModelEnabled ? 'ML predictions active' : 'Rule-based system in use'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Model Training
          </CardTitle>
          <CardDescription>
            Train the machine learning model using assessment data to improve strand recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {modelStatus.trainingError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Training Error</AlertTitle>
              <AlertDescription>
                {modelStatus.trainingError}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <h3 className="font-medium text-foreground mb-2">Training Data</h3>
              <p className="text-sm text-muted-foreground">
                {modelStatus.dataCount} assessment responses available for training. 
                {modelStatus.dataCount < 50 ? (
                  <span className="text-destructive"> Minimum 50 recommended for good results.</span>
                ) : (
                  <span className="text-green-500"> Sufficient data for training.</span>
                )}
              </p>
            </div>
            
            <div className="flex gap-2">
              {modelStatus.trainingInProgress ? (
                <Button onClick={handleStopTraining} variant="destructive" className="flex items-center gap-2">
                  <Square className="h-4 w-4" />
                  Stop Training
                </Button>
              ) : (
                <Button 
                  onClick={handleTrainModel} 
                  disabled={!modelStatus.isInitialized || modelStatus.dataCount === 0}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Train Model
                </Button>
              )}
              <Button 
                onClick={handleTestModel} 
                variant="outline"
                disabled={!modelStatus.isTrained}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Test Model
              </Button>
            </div>
          </div>

          {modelStatus.trainingInProgress && trainingProgress && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-foreground">Training Progress</h4>
                <Badge variant="secondary">
                  Epoch {trainingProgress.epoch}/{trainingProgress.totalEpochs}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Step</span>
                  <span className="font-medium">{trainingProgress.currentStep}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Loss</span>
                    <span className="font-mono">{trainingProgress.loss.toFixed(4)}</span>
                  </div>
                  <Progress value={trainingProgress.epoch / trainingProgress.totalEpochs * 100} className="h-2" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-sm bg-background p-3 rounded-lg border">
                    <div className="text-muted-foreground">Accuracy</div>
                    <div className="font-mono text-lg">{(trainingProgress.accuracy * 100).toFixed(2)}%</div>
                  </div>
                  <div className="text-sm bg-background p-3 rounded-lg border">
                    <div className="text-muted-foreground">Validation Accuracy</div>
                    <div className="font-mono text-lg">{(trainingProgress.valAccuracy * 100).toFixed(2)}%</div>
                  </div>
                  <div className="text-sm bg-background p-3 rounded-lg border">
                    <div className="text-muted-foreground">Progress</div>
                    <div className="font-mono text-lg">{Math.round(trainingProgress.epoch / trainingProgress.totalEpochs * 100)}%</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center text-xs text-muted-foreground mt-2">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                <span>Training in progress... Do not close this page</span>
              </div>
            </div>
          )}

          {modelStatus.lastTrained && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Last trained: {modelStatus.lastTrained.toLocaleString()}
            </div>
          )}
          
          {/* Training History */}
          <div className="pt-4 border-t">
            <h4 className="font-medium text-foreground mb-2">Training History</h4>
            <div className="text-sm text-muted-foreground">
              {modelStatus.lastTrained ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Model successfully trained on {modelStatus.lastTrained.toLocaleDateString()}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                  <span>No training history available</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Usage Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Model Usage
          </CardTitle>
          <CardDescription>
            Control whether the ML model is used for strand recommendations in the assessment flow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium text-foreground">Enable ML Model</h3>
              <p className="text-sm text-muted-foreground mt-1">
                When enabled, the ML model will be used for strand recommendations. 
                When disabled, only the rule-based system will be used.
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="ml-model-toggle"
                checked={mlModelEnabled}
                onCheckedChange={toggleMlModel}
                disabled={!modelStatus.isTrained}
              />
              <Label htmlFor="ml-model-toggle">
                {mlModelEnabled ? "Enabled" : "Disabled"}
              </Label>
            </div>
          </div>
          
          {!modelStatus.isTrained && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Model Not Trained</AlertTitle>
              <AlertDescription>
                The ML model must be trained before it can be enabled for use in the assessment flow.
                Please train the model first.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Model Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Model Information
          </CardTitle>
          <CardDescription>
            Technical details about the machine learning model
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-foreground">Model Architecture</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Neural Network with multiple hidden layers using TensorFlow.js
              </p>
              <div className="mt-2 text-xs text-muted-foreground">
                <div>Input Size: {MODEL_CONFIG.architecture.inputSize}</div>
                <div>Hidden Layers: {MODEL_CONFIG.architecture.hiddenLayers.join(', ')}</div>
                <div>Output Size: {MODEL_CONFIG.architecture.outputSize}</div>
              </div>
            </div>
            <div className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-foreground">Input Features</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Academic performance, personal interests, hobbies, and aptitude test results
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">Academic</Badge>
                <Badge variant="secondary" className="text-xs">Interests</Badge>
                <Badge variant="secondary" className="text-xs">Hobbies</Badge>
                <Badge variant="secondary" className="text-xs">Aptitude</Badge>
              </div>
            </div>
            <div className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-foreground">Output</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Probability scores for 6 SHS strands
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">STEM</Badge>
                <Badge variant="outline" className="text-xs">ABM</Badge>
                <Badge variant="outline" className="text-xs">HUMSS</Badge>
                <Badge variant="outline" className="text-xs">GAS</Badge>
                <Badge variant="outline" className="text-xs">TVL</Badge>
                <Badge variant="outline" className="text-xs">Arts</Badge>
              </div>
            </div>
            <div className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-foreground">Recommendation Engine</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Hybrid approach combining ML predictions with rule-based fallback
              </p>
              <div className="mt-2 flex gap-2">
                <div className="flex items-center text-xs text-muted-foreground">
                  <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                  <span>ML Predictions</span>
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                  <span>Rule-based Fallback</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};