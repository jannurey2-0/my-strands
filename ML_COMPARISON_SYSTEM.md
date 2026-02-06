# ML Model Comparison System

## Overview

This document describes the new ML Model Comparison system that allows administrators to compare different machine learning models using the same dataset for consistent evaluation.

## Features

### 1. Multi-Model Support
The system supports three different ML algorithms:
- **Feedforward Neural Network**: Deep learning model with multiple hidden layers
- **Decision Tree**: Tree-based model that makes decisions based on feature thresholds
- **Random Forest**: Ensemble of decision trees for improved accuracy and reduced overfitting

### 2. Dataset Management
- **CSV Upload**: Upload assessment records exported from the ML Model Management page
- **Data Processing**: Automatic parsing and validation of CSV data
- **Feature Extraction**: Conversion of raw assessment data to numerical features
- **Dataset Validation**: Checks for data quality issues and provides recommendations

### 3. Model Training and Comparison
- **Consistent Training**: All models trained on the same dataset for fair comparison
- **Performance Metrics**: Accuracy, precision, recall, and F1-score calculation
- **Training Time Tracking**: Monitor how long each model takes to train
- **Model Selection**: Choose the best performing model for production use

## Architecture

### Component Structure

```
src/
├── ml/
│   ├── interfaces/
│   │   └── BaseModel.ts          # Common interface for all ML models
│   ├── models/
│   │   ├── strandModel.ts        # Feedforward Neural Network (updated)
│   │   ├── decisionTreeModel.ts  # Decision Tree implementation
│   │   └── randomForestModel.ts  # Random Forest implementation
│   ├── services/
│   │   ├── modelFactory.ts       # Model creation and management
│   │   └── datasetService.ts     # CSV processing and data handling
│   └── config/
│       └── modelConfig.ts        # Model configuration settings
├── pages/
│   └── MLComparison.tsx          # Main comparison interface
└── components/
    └── AdminLayout.tsx           # Updated navigation (includes ML Comparison)
```

### Key Interfaces

#### BaseModel Interface
All ML models implement this common interface:

```typescript
interface BaseModel {
  initialize(): Promise<void>;
  train(features: number[][], labels: number[][]): Promise<any>;
  predict(features: number[]): Promise<number[]>;
  saveModel(modelName: string): Promise<boolean>;
  loadModel(modelName: string): Promise<boolean>;
  isModelReady(): boolean;
  getModelType(): string;
  getModelParameters(): any;
  dispose(): void;
}
```

## Usage Flow

### 1. Data Preparation
1. Export assessment records from ML Model Management page as CSV
2. Navigate to ML Comparison page
3. Upload the CSV file using the dataset upload section
4. System processes and validates the data

### 2. Model Training
1. Select which models to train (individual or all at once)
2. System automatically splits data into training/validation sets
3. Each model is trained on the same training data
4. Performance metrics are calculated using the validation set

### 3. Comparison and Selection
1. View side-by-side performance metrics for all trained models
2. Compare accuracy, precision, recall, F1-score, and training time
3. Select the best performing model for production use
4. Set the chosen model as the active model for predictions

## Implementation Details

### Data Processing
The `DatasetService` handles CSV parsing and data preparation:
- Parses CSV files with proper handling of quoted fields
- Converts categorical data to numerical features
- Creates one-hot encoded labels for multi-class classification
- Validates data quality and provides recommendations
- Splits data into training and validation sets

### Model Factory
The `ModelFactory` provides:
- Creation of different model types
- Model type validation
- Access to model descriptions and parameters
- Centralized model management

### Performance Metrics
Calculated metrics include:
- **Accuracy**: Overall correct predictions
- **Precision**: True positives / (True positives + False positives)
- **Recall**: True positives / (True positives + False negatives)
- **F1-Score**: Harmonic mean of precision and recall
- **Training Time**: Time taken to train each model

## Configuration

### Model Parameters
Each model type has configurable parameters:

**Feedforward Neural Network:**
- Hidden layers architecture
- Learning rate
- Epochs
- Batch size
- Dropout rate

**Decision Tree:**
- Maximum depth
- Minimum samples for split
- Minimum samples per leaf

**Random Forest:**
- Number of trees
- Maximum depth per tree
- Feature sampling ratio
- Minimum samples for split

### Feature Engineering
The system uses 18 features derived from assessment data:
- Academic performance (GWA)
- Subject preferences
- Personal interests alignment scores
- Hobby alignment scores
- Aptitude test results
- Demographic information (age, gender)

## Future Enhancements

### Planned Features
1. **Advanced Visualization**: Charts and graphs for model performance comparison
2. **Cross-Validation**: K-fold cross-validation for more robust evaluation
3. **Hyperparameter Tuning**: Automatic optimization of model parameters
4. **Model Persistence**: Save/load trained models to/from storage
5. **Real-time Comparison**: Live updating of metrics during training
6. **Feature Importance**: Visualization of which features are most important for each model

### Integration Points
1. **Assessment System**: Direct integration with student assessment flow
2. **Analytics Dashboard**: Detailed performance reporting
3. **A/B Testing**: Compare model performance with real student outcomes
4. **Model Monitoring**: Track model performance over time

## Testing and Validation

### Data Requirements
- Minimum 50 samples recommended for meaningful comparison
- Balanced class distribution preferred
- Clean data with minimal missing values
- Consistent feature representation across samples

### Quality Checks
The system performs automatic validation:
- Data format verification
- Missing value detection
- Class balance analysis
- Feature scaling recommendations
- Sample size adequacy checks

## Troubleshooting

### Common Issues
1. **Upload Errors**: Ensure CSV format is correct with proper headers
2. **Training Failures**: Check data quality and sample size requirements
3. **Performance Issues**: Large datasets may require longer training times
4. **Memory Constraints**: Very large models may require browser with sufficient memory

### Error Handling
- Graceful degradation for individual model failures
- Detailed error messages for troubleshooting
- Automatic fallback to default models when needed
- Logging for debugging and monitoring

## Security Considerations

### Data Protection
- Student data is processed locally in the browser
- No sensitive data is transmitted to external servers
- CSV files are not stored permanently
- All processing happens in-memory

### Access Control
- ML Comparison page is only accessible to administrators
- Proper authentication and authorization enforced
- Role-based access control through existing admin system

This system provides a comprehensive framework for comparing different ML approaches to find the most effective solution for strand recommendation in your educational application.