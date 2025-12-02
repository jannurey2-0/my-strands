import { IAssessment, ITrainingData } from '../interfaces/IAssessment';

/**
 * Utility functions for data preprocessing and handling
 */
export class DataUtils {
  /**
   * Normalize features to a specific range
   * @param data Array of feature arrays
   * @param min Minimum value (default: 0)
   * @param max Maximum value (default: 1)
   * @returns Normalized data
   */
  static normalizeFeatures(data: number[][], min: number = 0, max: number = 1): number[][] {
    if (data.length === 0) return data;
    
    const featureCount = data[0].length;
    const normalizedData = [...data];
    
    // For each feature
    for (let i = 0; i < featureCount; i++) {
      // Find min and max values for this feature
      let featureMin = data[0][i];
      let featureMax = data[0][i];
      
      for (let j = 1; j < data.length; j++) {
        if (data[j][i] < featureMin) featureMin = data[j][i];
        if (data[j][i] > featureMax) featureMax = data[j][i];
      }
      
      // Normalize this feature
      const range = featureMax - featureMin;
      if (range > 0) {
        for (let j = 0; j < data.length; j++) {
          normalizedData[j][i] = min + (data[j][i] - featureMin) * (max - min) / range;
        }
      }
    }
    
    return normalizedData;
  }
  
  /**
   * Split data into training and validation sets
   * @param data Array of data points
   * @param validationSplit Proportion of data to use for validation (0-1)
   * @returns Object containing training and validation data
   */
  static trainTestSplit(data: ITrainingData[], validationSplit: number = 0.2): {
    trainData: ITrainingData[];
    validationData: ITrainingData[];
  } {
    // Shuffle the data
    const shuffledData = [...data].sort(() => Math.random() - 0.5);
    
    // Calculate split index
    const splitIndex = Math.floor(shuffledData.length * (1 - validationSplit));
    
    // Split data
    const trainData = shuffledData.slice(0, splitIndex);
    const validationData = shuffledData.slice(splitIndex);
    
    return { trainData, validationData };
  }
  
  /**
   * Convert strand name to one-hot encoded array
   * @param strand The strand name
   * @returns One-hot encoded array
   */
  static strandToOneHot(strand: string): number[] {
    const strands = ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL', 'Arts'];
    const oneHot = new Array(strands.length).fill(0);
    
    const index = strands.indexOf(strand);
    if (index !== -1) {
      oneHot[index] = 1;
    }
    
    return oneHot;
  }
  
  /**
   * Convert one-hot encoded array to strand name
   * @param oneHot One-hot encoded array
   * @returns Strand name
   */
  static oneHotToStrand(oneHot: number[]): string {
    const strands = ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL', 'Arts'];
    
    const maxIndex = oneHot.indexOf(Math.max(...oneHot));
    return strands[maxIndex] || 'Unknown';
  }
  
  /**
   * Clean and validate assessment data
   * @param assessment The assessment data
   * @returns Validated assessment data
   */
  static validateAssessment(assessment: IAssessment): IAssessment {
    // Ensure all required fields exist
    const validated: IAssessment = {
      basicInfo: {
        fullName: assessment.basicInfo?.fullName || '',
        age: assessment.basicInfo?.age || '15',
        gender: assessment.basicInfo?.gender || 'other',
        school: assessment.basicInfo?.school || '',
        region: assessment.basicInfo?.region || '',
        email: assessment.basicInfo?.email || '',
      },
      academicProfile: {
        gwa: assessment.academicProfile?.gwa || '75',
        favoriteSubjects: Array.isArray(assessment.academicProfile?.favoriteSubjects) 
          ? assessment.academicProfile.favoriteSubjects 
          : (assessment.academicProfile?.favoriteSubject ? [assessment.academicProfile.favoriteSubject] : ['Other']),
        leastFavoriteSubjects: Array.isArray(assessment.academicProfile?.leastFavoriteSubjects) 
          ? assessment.academicProfile.leastFavoriteSubjects 
          : (assessment.academicProfile?.leastFavoriteSubject ? [assessment.academicProfile.leastFavoriteSubject] : ['Other']),
      },
      personalInterests: Array.isArray(assessment.personalInterests) ? assessment.personalInterests : [],
      hobbies: Array.isArray(assessment.hobbies) ? assessment.hobbies : [],
      aptitudeAnswers: assessment.aptitudeAnswers || {},
    };
    
    return validated;
  }
}