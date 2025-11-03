# Machine Learning System for Strand Recommendation

This directory contains the machine learning system for recommending SHS strands based on student assessments.

## Overview

The ML system uses TensorFlow.js to create a neural network model that predicts the most suitable strand for students based on their assessment data. It works alongside the existing rule-based system as a hybrid approach.

## Directory Structure

```
src/ml/
├── config/          # Model configuration files
├── examples/        # Example usage of the ML system
├── features/        # Feature extraction utilities
├── interfaces/      # TypeScript interfaces
├── models/          # ML model implementations
├── services/        # Model service layer
└── utils/           # Utility functions
```

## Components

### 1. Interfaces (`interfaces/IAssessment.ts`)
- `IAssessment`: Structure for assessment data
- `IAssessmentFeatures`: Extracted features for ML model input
- `IStrandPrediction`: Model prediction output
- `ITrainingData`: Training data structure

### 2. Configuration (`config/modelConfig.ts`)
- Model architecture settings
- Training parameters
- Strand mappings
- Subject/interest/hobby mappings

### 3. Feature Extraction (`features/featureExtractor.ts`)
- Converts assessment data to numerical features
- Handles data normalization and encoding
- Calculates alignment scores

### 4. Model (`models/strandModel.ts`)
- TensorFlow.js neural network implementation
- Training and prediction functions
- Model saving/loading capabilities

### 5. Service (`services/modelService.ts`)
- High-level interface for model operations
- Training data preparation
- Prediction workflow

### 6. Utilities (`utils/dataUtils.ts`)
- Data preprocessing functions
- Normalization and validation
- Train/validation split

## How to Train the Model

### 1. Prepare Training Data
Collect assessment data with known strand outcomes. The data should include:
- Student assessment responses
- Actual assigned strands (for supervised learning)

### 2. Initialize the Model
```typescript
import { ModelService } from './ml/services/modelService';

const modelService = new ModelService();
await modelService.initialize();
```

### 3. Prepare Training Data
```typescript
// Convert assessment data to training format
const trainingData = modelService.prepareTrainingData(assessments);
```

### 4. Train the Model
```typescript
// Train the model with your data
const history = await modelService.trainModel(trainingData);
```

### 5. Save the Trained Model
```typescript
// Save the model for later use
await modelService.saveModel('strand-recommender-v1');
```

## How to Integrate the Model

### 1. Load the Trained Model
```typescript
import { ModelService } from './ml/services/modelService';

const modelService = new ModelService();
await modelService.loadModel('strand-recommender-v1');
```

### 2. Make Predictions
```typescript
// Get assessment data
const assessment = getAssessmentData();

// Get ML predictions
const predictions = await modelService.predict(assessment);
```

### 3. Hybrid Approach Integration
The system uses a hybrid approach where ML predictions are prioritized, with the rule-based system as a fallback:

```typescript
let finalScores;
if (modelService.isModelReady()) {
  // Use ML predictions (70% weight)
  const mlScores = await modelService.predict(assessment);
  // Combine with rule-based scores (30% weight)
  const ruleScores = calculateRuleBasedScores(assessment);
  finalScores = combineScores(mlScores, ruleScores, 0.7, 0.3);
} else {
  // Fallback to rule-based scoring
  finalScores = calculateRuleBasedScores(assessment);
}
```

### 4. Save Recommendations to Database
After calculating recommendations, save them to the database for future reference:

```typescript
// Save the predictions to the database
const assessmentId = 'some-assessment-id'; // Get the actual assessment ID
await assessmentService.saveRecommendations(assessmentId, predictions);
console.log('Recommendations saved to database');
```

## Model Architecture

The neural network consists of:
- Input layer: 18 features
- Hidden layers: 32 → 16 neurons (ReLU activation)
- Output layer: 6 neurons (Softmax activation for strand probabilities)

## Training Parameters

- Epochs: 100
- Batch Size: 32
- Learning Rate: 0.001
- Validation Split: 20%
- Early Stopping: Patience of 10 epochs

## Feature Engineering

The system extracts the following features from assessment data:
1. Academic performance (GWA)
2. Subject preference alignment scores
3. Interest alignment scores for each strand
4. Hobby alignment scores for each strand
5. Aptitude test performance
6. Demographic information (age, gender)

## Future Improvements

1. **Data Collection**: Gather more training data to improve model accuracy
2. **Feature Engineering**: Add more sophisticated features
3. **Model Architecture**: Experiment with different architectures
4. **Ensemble Methods**: Combine multiple models for better predictions
5. **Continuous Learning**: Implement online learning capabilities

## Troubleshooting

### Model Not Initializing
- Ensure TensorFlow.js dependencies are installed
- Check browser compatibility for TensorFlow.js

### Poor Prediction Accuracy
- Collect more training data
- Adjust model architecture
- Improve feature engineering

### Model Loading Failures
- Verify model file exists in local storage
- Check model name matches saved model