// Load environment variables at the very top
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root BEFORE any other imports
dotenv.config({ path: join(__dirname, '../../../.env') });

// Verify env vars are loaded
if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Environment variables not loaded!');
  console.error('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'Found' : 'Missing');
  console.error('VITE_SUPABASE_SERVICE_ROLE_KEY:', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? 'Found' : 'Missing');
  process.exit(1);
}

import * as tf from '@tensorflow/tfjs';
import { mlAssessmentService } from '../services/mlAssessmentService';
import { FeatureExtractor } from '../features/featureExtractor';
import { DataUtils } from '../utils/dataUtils';
import { MODEL_CONFIG } from '../config/modelConfig';
import logger from '@/lib/logger';

// Interface for training data
interface TrainingData {
  features: number[];
  label: number[];
  strand: string;
}

// Interface for model evaluation results
interface ModelEvaluation {
  modelName: string;
  accuracy: number;
  precision: { [strand: string]: number };
  recall: { [strand: string]: number };
  f1Score: { [strand: string]: number };
  confusionMatrix: number[][];
  trainingTime: number;
  avgPredictionTime: number;
}

// Strand names for reference
const STRAND_NAMES = ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL', 'Arts'];

/**
 * Build a Feedforward Neural Network model
 */
function buildFeedforwardNN(): tf.LayersModel {
  const model = tf.sequential();
  
  // Input layer
  model.add(tf.layers.dense({
    units: MODEL_CONFIG.architecture.hiddenLayers[0],
    activation: 'relu',
    inputShape: [MODEL_CONFIG.architecture.inputSize],
  }));
  
  // Hidden layers
  for (let i = 1; i < MODEL_CONFIG.architecture.hiddenLayers.length; i++) {
    model.add(tf.layers.dense({
      units: MODEL_CONFIG.architecture.hiddenLayers[i],
      activation: 'relu',
    }));
  }
  
  // Output layer
  model.add(tf.layers.dense({
    units: MODEL_CONFIG.architecture.outputSize,
    activation: 'softmax',
  }));
  
  model.compile({
    optimizer: tf.train.adam(MODEL_CONFIG.training.learningRate),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });
  
  console.log('✓ Feedforward Neural Network built');
  return model;
}

/**
 * Build a Logistic Regression model (single layer)
 */
function buildLogisticRegression(): tf.LayersModel {
  const model = tf.sequential();
  
  // Single dense layer with softmax activation
  model.add(tf.layers.dense({
    units: MODEL_CONFIG.architecture.outputSize,
    activation: 'softmax',
    inputShape: [MODEL_CONFIG.architecture.inputSize],
  }));
  
  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });
  
  console.log('✓ Logistic Regression model built');
  return model;
}

/**
 * Build a Random Forest-like model using decision trees approximation
 * (Simulated with multiple small neural networks)
 */
function buildRandomForest(): tf.LayersModel {
  const model = tf.sequential();
  
  // Simulate random forest with deeper, narrower network
  model.add(tf.layers.dense({
    units: 24,
    activation: 'relu',
    inputShape: [MODEL_CONFIG.architecture.inputSize],
  }));
  
  model.add(tf.layers.dropout({ rate: 0.3 }));
  
  model.add(tf.layers.dense({
    units: 12,
    activation: 'relu',
  }));
  
  model.add(tf.layers.dropout({ rate: 0.2 }));
  
  model.add(tf.layers.dense({
    units: MODEL_CONFIG.architecture.outputSize,
    activation: 'softmax',
  }));
  
  model.compile({
    optimizer: tf.train.adam(0.005),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });
  
  console.log('✓ Random Forest-like model built');
  return model;
}

/**
 * Fetch and prepare training data
 */
async function prepareTrainingData(): Promise<{
  trainData: TrainingData[];
  testData: TrainingData[];
}> {
  console.log('\n📊 Fetching assessment data from database...');
  
  const assessments = await mlAssessmentService.getAllAssessments();
  
  // Filter assessments with actual_strand
  const validAssessments = assessments.filter(
    (assessment: any) => assessment.actual_strand && assessment.actual_strand.trim() !== ''
  );
  
  console.log(`✓ Found ${validAssessments.length} valid assessments with actual_strand`);
  
  if (validAssessments.length < 10) {
    throw new Error('Not enough training data. Need at least 10 assessments with actual_strand.');
  }
  
  // Convert to training data format
  const trainingData: TrainingData[] = [];
  
  for (const assessment of validAssessments) {
    try {
      // Convert database format to IAssessment format
      const assessmentData = {
        basicInfo: assessment.basic_info as any,
        academicProfile: assessment.academic_profile as any,
        personalInterests: assessment.personal_interests as any,
        hobbies: assessment.hobbies as any,
        aptitudeAnswers: assessment.aptitude_answers as any,
      };
      
      const features = FeatureExtractor.extractFeatures(assessmentData);
      const featureArray = FeatureExtractor.featuresToArray(features);
      const label = DataUtils.strandToOneHot((assessment as any).actual_strand);
      
      trainingData.push({
        features: featureArray,
        label: label,
        strand: (assessment as any).actual_strand,
      });
    } catch (error) {
      console.warn(`Skipping assessment due to error: ${error}`);
    }
  }
  
  console.log(`✓ Prepared ${trainingData.length} training samples`);
  
  // Shuffle and split data (80/20)
  const shuffled = trainingData.sort(() => Math.random() - 0.5);
  const splitIndex = Math.floor(shuffled.length * 0.8);
  
  const trainData = shuffled.slice(0, splitIndex);
  const testData = shuffled.slice(splitIndex);
  
  console.log(`✓ Split: ${trainData.length} training, ${testData.length} testing`);
  
  return { trainData, testData };
}

/**
 * Train a model and measure training time
 */
async function trainModel(
  model: tf.LayersModel,
  trainData: TrainingData[]
): Promise<number> {
  const features = trainData.map(d => d.features);
  const labels = trainData.map(d => d.label);
  
  const xs = tf.tensor2d(features);
  const ys = tf.tensor2d(labels);
  
  const startTime = Date.now();
  
  await model.fit(xs, ys, {
    epochs: MODEL_CONFIG.training.epochs,
    batchSize: MODEL_CONFIG.training.batchSize,
    validationSplit: 0.2,
    verbose: 0, // Silent training
  });
  
  const trainingTime = (Date.now() - startTime) / 1000;
  
  xs.dispose();
  ys.dispose();
  
  return trainingTime;
}

/**
 * Evaluate model performance
 */
async function evaluateModel(
  model: tf.LayersModel,
  testData: TrainingData[],
  modelName: string,
  trainingTime: number
): Promise<ModelEvaluation> {
  console.log(`\n🔍 Evaluating ${modelName}...`);
  
  const features = testData.map(d => d.features);
  const xs = tf.tensor2d(features);
  
  // Measure prediction time
  const predStartTime = Date.now();
  const predictions = model.predict(xs) as tf.Tensor;
  const predValues = await predictions.array() as number[][];
  const avgPredictionTime = (Date.now() - predStartTime) / testData.length;
  
  xs.dispose();
  predictions.dispose();
  
  // Calculate metrics
  const confusionMatrix = Array(6).fill(0).map(() => Array(6).fill(0));
  let correctPredictions = 0;
  
  const strandCounts = { STEM: 0, ABM: 0, HUMSS: 0, GAS: 0, TVL: 0, Arts: 0 };
  const truePositives = { STEM: 0, ABM: 0, HUMSS: 0, GAS: 0, TVL: 0, Arts: 0 };
  const falsePositives = { STEM: 0, ABM: 0, HUMSS: 0, GAS: 0, TVL: 0, Arts: 0 };
  const falseNegatives = { STEM: 0, ABM: 0, HUMSS: 0, GAS: 0, TVL: 0, Arts: 0 };
  
  for (let i = 0; i < testData.length; i++) {
    const actualStrand = testData[i].strand;
    const predictedIndex = predValues[i].indexOf(Math.max(...predValues[i]));
    const predictedStrand = STRAND_NAMES[predictedIndex];
    
    const actualIndex = STRAND_NAMES.indexOf(actualStrand);
    
    // Update confusion matrix
    confusionMatrix[actualIndex][predictedIndex]++;
    
    // Track counts
    strandCounts[actualStrand as keyof typeof strandCounts]++;
    
    if (actualStrand === predictedStrand) {
      correctPredictions++;
      truePositives[actualStrand as keyof typeof truePositives]++;
    } else {
      falsePositives[predictedStrand as keyof typeof falsePositives]++;
      falseNegatives[actualStrand as keyof typeof falseNegatives]++;
    }
  }
  
  // Calculate metrics for each strand
  const precision: { [strand: string]: number } = {};
  const recall: { [strand: string]: number } = {};
  const f1Score: { [strand: string]: number } = {};
  
  for (const strand of STRAND_NAMES) {
    const tp = truePositives[strand as keyof typeof truePositives];
    const fp = falsePositives[strand as keyof typeof falsePositives];
    const fn = falseNegatives[strand as keyof typeof falseNegatives];
    
    precision[strand] = tp + fp > 0 ? tp / (tp + fp) : 0;
    recall[strand] = tp + fn > 0 ? tp / (tp + fn) : 0;
    f1Score[strand] = precision[strand] + recall[strand] > 0
      ? 2 * (precision[strand] * recall[strand]) / (precision[strand] + recall[strand])
      : 0;
  }
  
  const accuracy = correctPredictions / testData.length;
  
  return {
    modelName,
    accuracy,
    precision,
    recall,
    f1Score,
    confusionMatrix,
    trainingTime,
    avgPredictionTime,
  };
}

/**
 * Print comparison results in a formatted table
 */
function printResults(results: ModelEvaluation[]): void {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    MODEL COMPARISON RESULTS                    ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\n');
  
  // Overall metrics table
  console.log('📊 OVERALL PERFORMANCE:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('Model                          Accuracy   Train Time   Pred Time');
  console.log('─────────────────────────────────────────────────────────────');
  
  results.forEach(result => {
    const name = result.modelName.padEnd(28);
    const acc = (result.accuracy * 100).toFixed(2).padStart(6) + '%';
    const trainTime = result.trainingTime.toFixed(2).padStart(8) + 's';
    const predTime = (result.avgPredictionTime * 1000).toFixed(2).padStart(8) + 'ms';
    console.log(`${name} ${acc}   ${trainTime}   ${predTime}`);
  });
  
  console.log('─────────────────────────────────────────────────────────────');
  console.log('\n');
  
  // Per-strand metrics for best model
  const bestModel = results.reduce((best, current) => 
    current.accuracy > best.accuracy ? current : best
  );
  
  console.log(`🏆 BEST MODEL: ${bestModel.modelName}`);
  console.log('─────────────────────────────────────────────────────────────');
  console.log('Strand     Precision   Recall   F1-Score');
  console.log('─────────────────────────────────────────────────────────────');
  
  STRAND_NAMES.forEach(strand => {
    const name = strand.padEnd(8);
    const prec = (bestModel.precision[strand] * 100).toFixed(1).padStart(7) + '%';
    const rec = (bestModel.recall[strand] * 100).toFixed(1).padStart(6) + '%';
    const f1 = (bestModel.f1Score[strand] * 100).toFixed(1).padStart(6) + '%';
    console.log(`${name}   ${prec}   ${rec}   ${f1}`);
  });
  
  console.log('─────────────────────────────────────────────────────────────');
  console.log('\n');
  
  // Recommendations
  console.log('💡 RECOMMENDATIONS:');
  console.log('─────────────────────────────────────────────────────────────');
  
  if (bestModel.modelName === 'Feedforward Neural Network') {
    console.log('✓ Feedforward NN provides the best balance of accuracy');
    console.log('  and generalization for strand prediction.');
  } else if (bestModel.modelName === 'Logistic Regression') {
    console.log('✓ Logistic Regression is fastest and simplest.');
    console.log('  Consider if training data is limited.');
  } else {
    console.log('✓ Random Forest-like model shows best performance.');
    console.log('  Good for handling complex patterns.');
  }
  
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
}

/**
 * Main comparison function
 */
async function compareModels(): Promise<void> {
  try {
    console.log('🚀 Starting Model Comparison...');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // Prepare data
    const { trainData, testData } = await prepareTrainingData();
    
    // Build models
    console.log('\n🏗️  Building models...');
    const models = [
      { name: 'Feedforward Neural Network', builder: buildFeedforwardNN },
      { name: 'Logistic Regression', builder: buildLogisticRegression },
      { name: 'Random Forest-like', builder: buildRandomForest },
    ];
    
    const results: ModelEvaluation[] = [];
    
    // Train and evaluate each model
    for (const { name, builder } of models) {
      console.log(`\n${'='.repeat(63)}`);
      console.log(`Training: ${name}`);
      console.log('='.repeat(63));
      
      const model = builder();
      const trainingTime = await trainModel(model, trainData);
      
      console.log(`✓ Training completed in ${trainingTime.toFixed(2)}s`);
      
      const evaluation = await evaluateModel(model, testData, name, trainingTime);
      results.push(evaluation);
      
      // Clean up
      model.dispose();
    }
    
    // Print comparison results
    printResults(results);
    
    // Save results to JSON
    const resultsJson = {
      timestamp: new Date().toISOString(),
      datasetSize: {
        training: trainData.length,
        testing: testData.length,
      },
      models: results.map(r => ({
        name: r.modelName,
        accuracy: r.accuracy,
        trainingTime: r.trainingTime,
        avgPredictionTime: r.avgPredictionTime,
        metrics: {
          precision: r.precision,
          recall: r.recall,
          f1Score: r.f1Score,
        },
      })),
    };
    
    console.log('\n📄 Results saved to comparison output');
    console.log(JSON.stringify(resultsJson, null, 2));
    
    console.log('\n✅ Comparison complete!\n');
    
  } catch (error) {
    console.error('❌ Error during model comparison:', error);
    throw error;
  }
}

// Run comparison
compareModels()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
