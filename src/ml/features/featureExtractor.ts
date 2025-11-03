import { IAssessment, IAssessmentFeatures } from '../interfaces/IAssessment';
import { MODEL_CONFIG } from '../config/modelConfig';

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
    // Extract academic features
    const gwa = parseFloat(assessment.academicProfile.gwa) || 75;
    const favoriteSubjectScore = this.getSubjectScore(assessment.academicProfile.favoriteSubject);
    const leastFavoriteSubjectScore = this.getSubjectScore(assessment.academicProfile.leastFavoriteSubject);
    
    // Extract interest alignment scores
    const interestScores = this.calculateInterestScores(assessment.personalInterests);
    
    // Extract hobby alignment scores
    const hobbyScores = this.calculateHobbyScores(assessment.hobbies);
    
    // Calculate aptitude score
    const aptitudeScore = this.calculateAptitudeScore(assessment.aptitudeAnswers);
    
    // Extract demographic features
    const age = parseInt(assessment.basicInfo.age) || 15;
    const gender = this.encodeGender(assessment.basicInfo.gender);
    
    return {
      gwa,
      favoriteSubjectScore,
      leastFavoriteSubjectScore,
      ...interestScores,
      ...hobbyScores,
      aptitudeScore,
      age,
      gender,
    };
  }
  
  /**
   * Convert features to array format for TensorFlow
   * @param features The extracted features
   * @returns Numeric array of features
   */
  static featuresToArray(features: IAssessmentFeatures): number[] {
    return [
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
  }
  
  /**
   * Get subject score based on subject category
   * @param subject The subject name
   * @returns Score between 0 and 1
   */
  private static getSubjectScore(subject: string): number {
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
    
    interests.forEach(interest => {
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
    
    // Normalize scores
    const maxPossible = interests.length;
    if (maxPossible > 0) {
      Object.keys(scores).forEach(key => {
        scores[key] = scores[key] / maxPossible;
      });
    }
    
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
    
    hobbies.forEach(hobby => {
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
    
    // Normalize scores
    const maxPossible = hobbies.length;
    if (maxPossible > 0) {
      Object.keys(scores).forEach(key => {
        scores[key] = scores[key] / maxPossible;
      });
    }
    
    return scores;
  }
  
  /**
   * Calculate aptitude score from answers
   * @param aptitudeAnswers The aptitude test answers
   * @returns Normalized score between 0 and 100
   */
  private static calculateAptitudeScore(aptitudeAnswers: Record<string, number | string>): number {
    if (!aptitudeAnswers || Object.keys(aptitudeAnswers).length === 0) {
      return 50; // Default middle score
    }
    
    // Count answered questions
    const totalAnswered = Object.keys(aptitudeAnswers).length;
    
    // For this implementation, we'll calculate a more realistic score
    // Count how many answers were provided
    const maxQuestions = 15; // Based on the assessment randomization to 15 questions
    const answeredRatio = Math.min(1, totalAnswered / maxQuestions);
    
    // For a more realistic score, we'll assume:
    // - If all questions are answered, score is based on assumed correctness (70%)
    // - If fewer questions are answered, we scale accordingly but with a penalty
    // - Minimum score is 0, maximum is 100
    
    // Apply a penalty for unanswered questions (reduces score by 2% per unanswered question)
    const unansweredPenalty = (maxQuestions - totalAnswered) * 0.02;
    
    // Assume base correctness rate
    const baseCorrectness = 0.7; // 70% assumed correctness
    
    // Calculate final score
    let score = (answeredRatio * baseCorrectness * 100) - (unansweredPenalty * 100);
    
    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));
    
    return score;
  }
  
  /**
   * Encode gender as numeric value
   * @param gender The gender string
   * @returns Numeric encoding (0=male, 1=female, 2=other)
   */
  private static encodeGender(gender: string): number {
    switch (gender?.toLowerCase()) {
      case 'male':
        return 0;
      case 'female':
        return 1;
      default:
        return 2; // Other or unspecified
    }
  }
}