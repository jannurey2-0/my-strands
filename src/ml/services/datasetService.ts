import { IAssessment } from '../interfaces/IAssessment';
import logger from '@/lib/logger';

export interface CSVData {
  headers: string[];
  rows: any[][];
  rowCount: number;
  columnCount: number;
}

export interface ProcessedDataset {
  features: number[][];
  labels: number[][];
  sampleCount: number;
  featureNames: string[];
  classNames: string[];
  rawData: any[][];
}

/**
 * Service for handling CSV dataset upload and processing
 */
export class DatasetService {
  /**
   * Parse CSV file content
   * @param file The CSV file to parse
   * @returns Parsed CSV data
   */
  static async parseCSV(file: File): Promise<CSVData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const lines = content.split('\n').filter(line => line.trim() !== '');
          
          if (lines.length === 0) {
            throw new Error('CSV file is empty');
          }
          
          // Parse headers (first line)
          const headers = this.parseCSVLine(lines[0]);
          
          // Parse data rows
          const rows = lines.slice(1).map(line => this.parseCSVLine(line));
          
          const csvData: CSVData = {
            headers,
            rows,
            rowCount: rows.length,
            columnCount: headers.length
          };
          
          logger.info(`Parsed CSV: ${csvData.rowCount} rows, ${csvData.columnCount} columns`);
          logger.info(`Headers: ${csvData.headers.join(', ')}`);
          logger.info(`Expected structure: Columns 0-13=Student Info (skip), Column 14=Label, Columns 15-${csvData.columnCount - 1}=Features`);
          resolve(csvData);
        } catch (error) {
          logger.error('Error parsing CSV:', error);
          reject(new Error(`Failed to parse CSV file: ${(error as Error).message}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }
  
  /**
   * Parse a single CSV line, handling quoted fields
   * @param line The CSV line to parse
   * @returns Array of parsed values
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field delimiter
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    
    return result;
  }
  
  /**
   * Process CSV data for ML training
   * @param csvData The parsed CSV data
   * @returns Processed dataset ready for training
   */
  static processDataset(csvData: CSVData): ProcessedDataset {
    try {
      // Validate minimum requirements
      if (csvData.columnCount < 2) {
        throw new Error('Dataset must have at least 2 columns (features and labels)');
      }
      
      if (csvData.rowCount === 0) {
        throw new Error('Dataset has no data rows');
      }
      
      // Identify feature columns and label column
      // For assessment data, we expect specific structure:
      // Columns 0-13: Student info (non-numeric, skip for features)
      // Column 14: Actual Strand (label - string)
      // Columns 15-20: Percentage values (numeric features)
          
      const labelColumnIndex = 14; // Actual Strand column
      const featureStartIndex = 15; // Start of numeric percentage features
      const featureEndIndex = csvData.columnCount - 1; // End of features (before label)
          
      if (csvData.columnCount < featureStartIndex + 1) {
        throw new Error(`CSV must have at least ${featureStartIndex + 1} columns for assessment data`);
      }
          
      // Extract features and labels
      const features: number[][] = [];
      const labels: number[][] = [];
      const rawData: any[][] = [];
          
      // Track unique labels for class mapping
      const uniqueLabels = new Set<string>();
          
      csvData.rows.forEach((row, rowIndex) => {
        // Skip rows with missing data
        if (row.length !== csvData.columnCount) {
          logger.warn(`Skipping row ${rowIndex + 2} due to incorrect column count`);
          return;
        }
            
        try {
          // Extract feature values (only numeric percentage columns)
          const featureRow: number[] = [];
          for (let i = featureStartIndex; i <= featureEndIndex; i++) {
            if (i === labelColumnIndex) continue; // Skip the label column
                
            const value = row[i];
            const numericValue = this.parseNumericValue(value);
            
            // Handle empty/missing values
            if (isNaN(numericValue)) {
              if (value === '' || value === null || value === undefined) {
                // For missing percentage values, use 0 as a reasonable default
                featureRow.push(0);
              } else {
                throw new Error(`Non-numeric value in feature column ${i + 1}: ${value}`);
              }
            } else {
              featureRow.push(numericValue);
            }
          }
              
          // Extract label value first (Actual Strand column)
          const labelValue = String(row[labelColumnIndex] || '').trim();
          if (labelValue === '') {
            logger.debug(`Skipping row ${rowIndex + 2}: empty label value`);
            return;
          }
          
          // Only add row if we have valid features AND valid label
          if (featureRow.length > 0) {
            features.push(featureRow);
            uniqueLabels.add(labelValue);
                        
            // Store raw data for reference
            rawData.push([...row]);
                        
            // Log some sample data for debugging
            if (features.length <= 5) {
              logger.debug(`Sample row ${features.length}: Features=[${featureRow.join(', ')}], Label=${labelValue}`);
            }
          }
              
        } catch (error) {
          // Only warn for actual errors, not for handled empty values
          if (!(error as Error).message.includes('treating as 0')) {
            logger.warn(`Skipping row ${rowIndex + 2}: ${(error as Error).message}`);
          }
        }
      });
      
      // Create label encoding (one-hot encoding)
      const labelArray = Array.from(uniqueLabels);
      const labelMap = new Map<string, number>();
      labelArray.forEach((label, index) => {
        labelMap.set(label, index);
      });
      
      // Convert string labels to one-hot encoded vectors
      // Only process labels for rows that were included in features
      rawData.forEach((row, index) => {
        if (row.length === csvData.columnCount) {
          const labelValue = String(row[labelColumnIndex] || '').trim();
          
          // Debug logging for first few samples
          if (index < 3) {
            logger.debug(`Row ${index}: labelValue='${labelValue}', labelColumnIndex=${labelColumnIndex}`);
            logger.debug(`Row data: ${row.join(' | ')}`);
          }
          
          if (labelValue && labelMap.has(labelValue)) {
            const labelIndex = labelMap.get(labelValue) || 0;
            const oneHotLabel = new Array(labelArray.length).fill(0);
            oneHotLabel[labelIndex] = 1;
            labels.push(oneHotLabel);
          } else {
            logger.warn(`Skipping label conversion for row ${index}: invalid label '${labelValue}'`);
            // Add a default label (first class) for consistency
            const oneHotLabel = new Array(labelArray.length).fill(0);
            oneHotLabel[0] = 1;
            labels.push(oneHotLabel);
          }
        }
      });
      
      // Ensure features and labels arrays have the same length
      let synchronizedFeatures = features;
      let synchronizedLabels = labels;
      const minLength = Math.min(features.length, labels.length);
      if (features.length !== labels.length) {
        logger.warn(`Feature/Label mismatch: ${features.length} features vs ${labels.length} labels. Truncating to ${minLength}`);
        synchronizedFeatures = features.slice(0, minLength);
        synchronizedLabels = labels.slice(0, minLength);
      }
      
      // Validate label structure
      if (labels.length > 0) {
        logger.debug(`Label structure check: first label = [${labels[0].join(', ')}], type = ${typeof labels[0]}, isArray = ${Array.isArray(labels[0])}`);
        logger.debug(`All labels are arrays: ${labels.every(label => Array.isArray(label))}`);
      }
      
      // Validate feature-label consistency
      logger.debug(`Feature count: ${synchronizedFeatures.length}, Label count: ${synchronizedLabels.length}`);
      logger.debug(`Feature vector length: ${synchronizedFeatures[0]?.length || 0}`);
      
      // For neural network compatibility, we need to either:
      // 1. Update model config to expect 6 features, or
      // 2. Implement feature engineering to create 18 features
      
      const finalFeatures = synchronizedFeatures;
      const finalLabels = synchronizedLabels;
      
      const processedDataset: ProcessedDataset = {
        features: finalFeatures,
        labels: finalLabels,
        sampleCount: finalFeatures.length,
        featureNames: csvData.headers.slice(featureStartIndex, featureEndIndex + 1).filter((_, i) => featureStartIndex + i !== labelColumnIndex),
        classNames: labelArray,
        rawData
      };
      
      logger.info(`Processed dataset: ${processedDataset.sampleCount} samples, ${processedDataset.features[0]?.length || 0} features, ${labelArray.length} classes`);
      
      return processedDataset;
      
    } catch (error) {
      logger.error('Error processing dataset:', error);
      throw new Error(`Failed to process dataset: ${(error as Error).message}`);
    }
  }
  
  /**
   * Parse a value as a number, handling various formats
   * @param value The value to parse
   * @returns Numeric value or NaN if parsing fails
   */
  private static parseNumericValue(value: any): number {
    if (value === null || value === undefined || value === '') {
      return NaN;
    }
    
    // Handle string values
    if (typeof value === 'string') {
      // Remove whitespace and common formatting
      const cleanValue = value.trim().replace(/[$,%]/g, '');
      
      // Handle percentage values
      if (cleanValue.endsWith('%')) {
        const numericPart = cleanValue.slice(0, -1);
        const parsed = parseFloat(numericPart);
        return isNaN(parsed) ? NaN : parsed / 100;
      }
      
      // Handle regular numeric values
      const parsed = parseFloat(cleanValue);
      return isNaN(parsed) ? NaN : parsed;
    }
    
    // Handle numeric values directly
    if (typeof value === 'number') {
      return value;
    }
    
    // Convert boolean to numeric
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    
    // Try to convert to string and parse
    return parseFloat(String(value));
  }
  
  /**
   * Validate that the dataset is suitable for ML training
   * @param dataset The processed dataset
   * @returns Validation result with any issues found
   */
  static validateDataset(dataset: ProcessedDataset): { 
    isValid: boolean; 
    issues: string[]; 
    recommendations: string[] 
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check minimum sample size
    if (dataset.sampleCount < 10) {
      issues.push(`Dataset has only ${dataset.sampleCount} samples. Minimum recommended is 10 samples.`);
    } else if (dataset.sampleCount < 50) {
      recommendations.push(`Dataset has ${dataset.sampleCount} samples. Consider collecting more data for better model performance.`);
    }
    
    // Check feature count
    if (!dataset.features || dataset.features.length === 0 || !dataset.features[0]) {
      issues.push('Dataset has no features or invalid feature structure.');
    } else if (dataset.features[0].length < 2) {
      issues.push('Dataset has very few features. Consider adding more relevant features.');
    }
    
    // Check class balance
    if (dataset.labels && dataset.labels.length > 0 && dataset.classNames) {
      const classCounts: Record<string, number> = {};
      dataset.labels.forEach(label => {
        const classIndex = label.indexOf(1);
        if (classIndex >= 0) {
          const className = dataset.classNames[classIndex] || 'unknown';
          classCounts[className] = (classCounts[className] || 0) + 1;
        }
      });
      
      const classCountValues = Object.values(classCounts);
      if (classCountValues.length > 0) {
        const minClassCount = Math.min(...classCountValues);
        const maxClassCount = Math.max(...classCountValues);
        
        if (maxClassCount / minClassCount > 10) {
          issues.push('Dataset has highly imbalanced classes. This may affect model performance.');
          recommendations.push('Consider using techniques like SMOTE or class weights to handle class imbalance.');
        }
      }
    }
    
    // Check for missing values
    let missingValues = 0;
    dataset.features.forEach(row => {
      row.forEach(value => {
        if (isNaN(value)) {
          missingValues++;
        }
      });
    });
    
    if (missingValues > 0) {
      issues.push(`Dataset contains ${missingValues} missing or invalid values.`);
      recommendations.push('Consider imputing missing values or removing rows with missing data.');
    }
    
    // Check feature scaling
    const featureRanges: number[] = [];
    if (dataset.features && dataset.features.length > 0 && dataset.features[0]) {
      for (let i = 0; i < dataset.features[0].length; i++) {
        const columnValues = dataset.features.map(row => row[i]);
        const min = Math.min(...columnValues);
        const max = Math.max(...columnValues);
        featureRanges.push(max - min);
      }
      
      const maxRange = Math.max(...featureRanges);
      const minRange = Math.min(...featureRanges);
      
      if (maxRange / minRange > 1000) {
        recommendations.push('Features have very different scales. Consider normalizing or standardizing the features.');
      }
    }
    

    
    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }
  
  /**
   * Split dataset into training and validation sets
   * @param dataset The dataset to split
   * @param validationSplit Proportion of data to use for validation (0-1)
   * @returns Object containing training and validation datasets
   */
  static splitDataset(
    dataset: ProcessedDataset, 
    validationSplit: number = 0.2
  ): { 
    training: ProcessedDataset; 
    validation: ProcessedDataset 
  } {
    if (validationSplit <= 0 || validationSplit >= 1) {
      throw new Error('Validation split must be between 0 and 1');
    }
    
    // Shuffle indices
    const indices = Array.from({ length: dataset.sampleCount }, (_, i) => i);
    this.shuffleArray(indices);
    
    // Calculate split point
    const validationSize = Math.floor(dataset.sampleCount * validationSplit);
    const trainingSize = dataset.sampleCount - validationSize;
    
    // Split indices
    const trainingIndices = indices.slice(0, trainingSize);
    const validationIndices = indices.slice(trainingSize);
    
    // Create training dataset
    const trainingDataset: ProcessedDataset = {
      features: trainingIndices.map(i => dataset.features[i]),
      labels: trainingIndices.map(i => dataset.labels[i]),
      sampleCount: trainingSize,
      featureNames: dataset.featureNames,
      classNames: dataset.classNames,
      rawData: trainingIndices.map(i => dataset.rawData[i])
    };
    
    // Create validation dataset
    const validationDataset: ProcessedDataset = {
      features: validationIndices.map(i => dataset.features[i]),
      labels: validationIndices.map(i => dataset.labels[i]),
      sampleCount: validationSize,
      featureNames: dataset.featureNames,
      classNames: dataset.classNames,
      rawData: validationIndices.map(i => dataset.rawData[i])
    };
    
    logger.info(`Dataset split: ${trainingSize} training samples, ${validationSize} validation samples`);
    
    return { training: trainingDataset, validation: validationDataset };
  }
  
  /**
   * Shuffle an array in place using Fisher-Yates algorithm
   * @param array The array to shuffle
   */
  private static shuffleArray(array: any[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}