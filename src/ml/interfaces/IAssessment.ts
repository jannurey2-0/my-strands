// Interface for assessment data that will be used for ML model training and prediction
export interface IAssessment {
  // Basic information
  basicInfo: {
    fullName: string;
    age: string;
    gender: string;
    school: string;
    region: string;
    email: string;
  };
  
  // Academic profile
  academicProfile: {
    gwa: string; // General Weighted Average
    favoriteSubjects: string[]; // Up to 3 favorite subjects
    leastFavoriteSubjects: string[]; // Up to 3 least favorite subjects
  };
  
  // Personal interests and hobbies
  personalInterests: string[];
  hobbies: string[];
  
  // Aptitude test answers
  aptitudeAnswers: Record<string, number | string>;
  
  // Actual strand (for training data)
  actualStrand?: string;
  
  // Timestamp
  submittedAt?: string;
}

// Interface for ML model input features
export interface IAssessmentFeatures {
  // Academic features
  gwa: number;
  favoriteSubjectScore: number;
  leastFavoriteSubjectScore: number;
  
  // Interest alignment scores (0-1)
  stemInterest: number;
  abmInterest: number;
  humssInterest: number;
  gasInterest: number;
  tvlInterest: number;
  artsInterest: number;
  
  // Hobby alignment scores (0-1)
  stemHobby: number;
  abmHobby: number;
  humssHobby: number;
  gasHobby: number;
  tvlHobby: number;
  artsHobby: number;
  
  // Aptitude test score
  aptitudeScore: number;
  
  // Demographic features
  age: number;
  gender: number; // 0 for male, 1 for female, 2 for other
}

// Interface for model prediction output
export interface IStrandPrediction {
  STEM: number;
  ABM: number;
  HUMSS: number;
  GAS: number;
  TVL: number;
  Arts: number;
}

// Interface for training data
export interface ITrainingData {
  features: IAssessmentFeatures;
  labels: IStrandPrediction;
  actualStrand: string;
}