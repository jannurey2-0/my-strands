import { IAssessment, IAssessmentFeatures } from '../interfaces/IAssessment';
import { MODEL_CONFIG } from '../config/modelConfig';
import logger from '@/lib/logger';

/**
 * Feature extractor for converting assessment data into ML model features
 */
export class FeatureExtractor {
  /**
   * Extract features from assessment data
   * @param assessment The assessment data
   * @returns Extracted features as a numeric array
   */
  static extractFeatures(assessment: IAssessment): IAssessmentFeatures {
    // Validate input
    if (!assessment) {
      throw new Error('Assessment data cannot be null or undefined');
    }
    
    // Validate required fields
    if (!assessment.basicInfo) {
      throw new Error('Basic info is required');
    }
    
    if (!assessment.academicProfile) {
      throw new Error('Academic profile is required');
    }
    
    // Extract academic features with validation
    const gwa = this.validateAndParseGWA(assessment.academicProfile.gwa);
    const favoriteSubjects = Array.isArray(assessment.academicProfile.favoriteSubjects) 
      ? assessment.academicProfile.favoriteSubjects 
      : (assessment.academicProfile.favoriteSubject ? [assessment.academicProfile.favoriteSubject] : []);
    const leastFavoriteSubjects = Array.isArray(assessment.academicProfile.leastFavoriteSubjects) 
      ? assessment.academicProfile.leastFavoriteSubjects 
      : (assessment.academicProfile.leastFavoriteSubject ? [assessment.academicProfile.leastFavoriteSubject] : []);
    const favoriteSubjectScore = this.getSubjectScores(favoriteSubjects);
    const leastFavoriteSubjectScore = this.getSubjectScores(leastFavoriteSubjects);
    
    // Extract interest alignment scores
    const interests = Array.isArray(assessment.personalInterests) ? assessment.personalInterests : [];
    const interestScores = this.calculateInterestScores(interests);
    
    // Extract hobby alignment scores
    const hobbies = Array.isArray(assessment.hobbies) ? assessment.hobbies : [];
    const hobbyScores = this.calculateHobbyScores(hobbies);
    
    // Calculate aptitude score
    const aptitudeAnswers = assessment.aptitudeAnswers || {};
    const aptitudeScore = this.calculateAptitudeScore(aptitudeAnswers);
    
    // Extract demographic features
    const age = this.validateAndParseAge(assessment.basicInfo.age);
    const gender = this.encodeGender(assessment.basicInfo.gender || '');
    
    const features = {
      gwa,
      favoriteSubjectScore,
      leastFavoriteSubjectScore,
      ...interestScores,
      ...hobbyScores,
      aptitudeScore,
      age,
      gender,
    };
    
    return features;
  }
  
  /**
   * Convert features to array format for TensorFlow
   * @param features The extracted features
   * @returns Numeric array of features
   */
  static featuresToArray(features: IAssessmentFeatures): number[] {
    // Validate input
    if (!features) {
      throw new Error('Features cannot be null or undefined');
    }
    
    const featureArray = [
      features.gwa,
      features.favoriteSubjectScore,
      features.leastFavoriteSubjectScore,
      features.stemInterest,
      features.abmInterest,
      features.humssInterest,
      features.gasInterest,
      features.tvlInterest,
      features.artsInterest,
      features.stemHobby,
      features.abmHobby,
      features.humssHobby,
      features.gasHobby,
      features.tvlHobby,
      features.artsHobby,
      features.aptitudeScore,
      features.age,
      features.gender,
    ];
    
    // Validate that all features are numbers
    for (let i = 0; i < featureArray.length; i++) {
      if (typeof featureArray[i] !== 'number' || isNaN(featureArray[i])) {
        throw new Error(`Feature at index ${i} is not a valid number: ${featureArray[i]}`);
      }
    }
    
    return featureArray;
  }
  
  /**
   * Validate and parse GWA (General Weighted Average)
   * @param gwa The GWA string
   * @returns Validated GWA as number
   */
  private static validateAndParseGWA(gwa: string): number {
    if (!gwa) return 75; // Default value
    
    const parsed = parseFloat(gwa);
    if (isNaN(parsed)) return 75; // Default value
    
    // GWA should be between 0 and 100
    return Math.max(0, Math.min(100, parsed));
  }
  
  /**
   * Validate and parse age
   * @param age The age string
   * @returns Validated age as number
   */
  private static validateAndParseAge(age: string): number {
    if (!age) return 15; // Default value
    
    const parsed = parseInt(age, 10);
    if (isNaN(parsed)) return 15; // Default value
    
    // Age should be reasonable (10-30 for high school students)
    return Math.max(10, Math.min(30, parsed));
  }
  
  /**
   * Get subject score based on subject category (for single subject)
   * @param subject The subject name
   * @returns Score between 0 and 1
   */
  private static getSubjectScore(subject: string): number {
    if (!subject) return 0.5; // Neutral score for empty subjects
    
    if (MODEL_CONFIG.subjectMappings.stem.includes(subject)) {
      return 1.0;
    } else if (MODEL_CONFIG.subjectMappings.abm.includes(subject)) {
      return 0.8;
    } else if (MODEL_CONFIG.subjectMappings.humss.includes(subject)) {
      return 0.6;
    }
    return 0.5; // Neutral score for other subjects
  }

  /**
   * Get aggregated subject scores based on multiple subjects
   * @param subjects Array of subject names
   * @returns Score between 0 and 1, calculated as average of all subject scores
   */
  private static getSubjectScores(subjects: string[]): number {
    if (!subjects || subjects.length === 0) return 0.5; // Neutral score for empty subjects
    
    // Calculate average score across all subjects
    const scores = subjects.map(subject => this.getSubjectScore(subject));
    const sum = scores.reduce((acc, score) => acc + score, 0);
    return sum / scores.length;
  }
  
  /**
   * Calculate interest alignment scores for each strand
   * @param interests Array of personal interests
   * @returns Object with interest scores for each strand
   */
  private static calculateInterestScores(interests: string[]): {
    stemInterest: number;
    abmInterest: number;
    humssInterest: number;
    gasInterest: number;
    tvlInterest: number;
    artsInterest: number;
  } {
    const scores = {
      stemInterest: 0,
      abmInterest: 0,
      humssInterest: 0,
      gasInterest: 0,
      tvlInterest: 0,
      artsInterest: 0,
    };
    
    // Handle null or undefined interests
    if (!interests || !Array.isArray(interests)) {
      return scores;
    }
    
    interests.forEach(interest => {
      // Skip null or undefined interests
      if (!interest) return;
      
      if (MODEL_CONFIG.interestMappings.stem.includes(interest)) {
        scores.stemInterest += 1;
      }
      if (MODEL_CONFIG.interestMappings.abm.includes(interest)) {
        scores.abmInterest += 1;
      }
      if (MODEL_CONFIG.interestMappings.humss.includes(interest)) {
        scores.humssInterest += 1;
      }
      if (MODEL_CONFIG.interestMappings.gas.includes(interest)) {
        scores.gasInterest += 1;
      }
      if (MODEL_CONFIG.interestMappings.tvl.includes(interest)) {
        scores.tvlInterest += 1;
      }
      if (MODEL_CONFIG.interestMappings.arts.includes(interest)) {
        scores.artsInterest += 1;
      }
    });
    
    return scores;
  }
  
  /**
   * Calculate hobby alignment scores for each strand
   * @param hobbies Array of hobbies
   * @returns Object with hobby scores for each strand
   */
  private static calculateHobbyScores(hobbies: string[]): {
    stemHobby: number;
    abmHobby: number;
    humssHobby: number;
    gasHobby: number;
    tvlHobby: number;
    artsHobby: number;
  } {
    const scores = {
      stemHobby: 0,
      abmHobby: 0,
      humssHobby: 0,
      gasHobby: 0,
      tvlHobby: 0,
      artsHobby: 0,
    };
    
    // Handle null or undefined hobbies
    if (!hobbies || !Array.isArray(hobbies)) {
      return scores;
    }
    
    hobbies.forEach(hobby => {
      // Skip null or undefined hobbies
      if (!hobby) return;
      
      if (MODEL_CONFIG.hobbyMappings.stem.includes(hobby)) {
        scores.stemHobby += 1;
      }
      if (MODEL_CONFIG.hobbyMappings.abm.includes(hobby)) {
        scores.abmHobby += 1;
      }
      if (MODEL_CONFIG.hobbyMappings.humss.includes(hobby)) {
        scores.humssHobby += 1;
      }
      if (MODEL_CONFIG.hobbyMappings.gas.includes(hobby)) {
        scores.gasHobby += 1;
      }
      if (MODEL_CONFIG.hobbyMappings.tvl.includes(hobby)) {
        scores.tvlHobby += 1;
      }
      if (MODEL_CONFIG.hobbyMappings.arts.includes(hobby)) {
        scores.artsHobby += 1;
      }
    });
    
    return scores;
  }
  
  /**
   * Calculate aptitude score from aptitude answers
   * @param answers Aptitude answers
   * @returns Aptitude score between 0 and 1
   */
  private static calculateAptitudeScore(answers: Record<string, number | string>): number {
    if (!answers || Object.keys(answers).length === 0) {
      return 0.5; // Neutral score for no answers
    }
    
    // Count correct answers
    let correctCount = 0;
    let totalCount = 0;
    
    Object.entries(answers).forEach(([questionId, answer]) => {
      // Skip if answer is not a number
      if (typeof answer !== 'number') return;
      
      // For now, we'll assume any answer is "correct" since we don't have the correct answers
      // In a real implementation, you would compare against the correct answers
      correctCount += answer > 0 ? 1 : 0;
      totalCount++;
    });
    
    // Return score as percentage
    return totalCount > 0 ? correctCount / totalCount : 0.5;
  }
  
  /**
   * Encode gender as numeric value
   * @param gender Gender string
   * @returns Encoded gender (0 for male, 1 for female, 0.5 for other/unknown)
   */
  private static encodeGender(gender: string): number {
    if (!gender) return 0.5; // Neutral value for unknown gender
    
    const lowerGender = gender.toLowerCase();
    if (lowerGender === 'male') {
      return 0;
    } else if (lowerGender === 'female') {
      return 1;
    }
    return 0.5; // Neutral value for other genders
  }
}