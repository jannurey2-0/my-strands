// Test script to validate strand assessment templates
const fs = require('fs');

// Load the templates
const templates = JSON.parse(fs.readFileSync('./strand-assessment-templates.json', 'utf8'));

// Simple scoring function based on the rule-based logic
function calculateScores(assessment) {
  const scores = {
    STEM: 0,
    ABM: 0,
    HUMSS: 0,
    GAS: 0,
    TVL: 0,
    Arts: 0
  };

  // Subject mappings (from modelConfig.ts)
  const subjectMappings = {
    stem: ['Mathematics', 'Science', 'Computer Science', 'Physics', 'Chemistry'],
    abm: ['Business Math', 'Economics', 'Accounting', 'Entrepreneurship'],
    humss: ['English', 'Araling Panlipunan', 'Literature', 'History', 'Philosophy']
  };

  // Interest mappings (from modelConfig.ts)
  const interestMappings = {
    stem: ['Science and Technology', 'Technical Vocational Work', 'Mathematics'],
    abm: ['Business and Finance', 'Entrepreneurship', 'Leadership'],
    humss: ['Humanities and Social Sciences', 'Arts and Design', 'Communication'],
    gas: ['Science and Technology', 'Business and Finance', 'Humanities and Social Sciences', 'Communication', 'Arts and Design', 'Entrepreneurship'],
    tvl: ['Technical Vocational Work', 'Science and Technology', 'Engineering'],
    arts: ['Arts and Design', 'Communication', 'Humanities and Social Sciences']
  };

  // Hobby mappings (from modelConfig.ts)
  const hobbyMappings = {
    stem: ['Video Games', 'Coding', 'Reading', 'Photography', 'Building/Construction'],
    abm: ['Reading', 'Writing', 'Board Games', 'Collecting', 'Entrepreneurial Activities'],
    humss: ['Reading', 'Writing', 'Music', 'Dancing', 'Traveling'],
    gas: ['Reading', 'Writing', 'Music', 'Sports', 'Traveling'],
    tvl: ['Building/Construction', 'Repairing', 'Crafting', 'Technical Activities'],
    arts: ['Drawing', 'Painting', 'Music', 'Dancing', 'Photography', 'Theater/Acting', 'Design']
  };

  // Score based on favorite subject
  const favoriteSubject = assessment.academicProfile?.favoriteSubject || '';
  if (subjectMappings.stem.includes(favoriteSubject)) {
    scores.STEM += 20;
  } else if (subjectMappings.abm.includes(favoriteSubject)) {
    scores.ABM += 20;
  } else if (subjectMappings.humss.includes(favoriteSubject)) {
    scores.HUMSS += 20;
  }

  // Score based on interests
  const interests = assessment.personalInterests || [];
  interests.forEach(interest => {
    if (interestMappings.stem.includes(interest)) {
      scores.STEM += 5;
    }
    if (interestMappings.abm.includes(interest)) {
      scores.ABM += 5;
    }
    if (interestMappings.humss.includes(interest)) {
      scores.HUMSS += 5;
    }
    if (interestMappings.gas.includes(interest)) {
      scores.GAS += 5;
    }
    if (interestMappings.tvl.includes(interest)) {
      scores.TVL += 5;
    }
    if (interestMappings.arts.includes(interest)) {
      scores.Arts += 5;
    }
  });

  // Score based on hobbies
  const hobbies = assessment.hobbies || [];
  hobbies.forEach(hobby => {
    if (hobbyMappings.stem.includes(hobby)) {
      scores.STEM += 3;
    }
    if (hobbyMappings.abm.includes(hobby)) {
      scores.ABM += 3;
    }
    if (hobbyMappings.humss.includes(hobby)) {
      scores.HUMSS += 3;
    }
    if (hobbyMappings.gas.includes(hobby)) {
      scores.GAS += 3;
    }
    if (hobbyMappings.tvl.includes(hobby)) {
      scores.TVL += 3;
    }
    if (hobbyMappings.arts.includes(hobby)) {
      scores.Arts += 3;
    }
  });

  // Score based on aptitude test results
  const aptitudeAnswers = assessment.aptitudeAnswers || {};
  const aptitudeScore = calculateAptitudeScore(aptitudeAnswers);
  
  // Distribute aptitude score among strands based on category alignment
  // This gives 15 points maximum from aptitude test
  scores.STEM += aptitudeScore.stem * 15;
  scores.ABM += aptitudeScore.abm * 15;
  scores.HUMSS += aptitudeScore.humss * 15;
  scores.GAS += aptitudeScore.gas * 15;
  scores.TVL += aptitudeScore.tvl * 15;
  scores.Arts += aptitudeScore.arts * 15;

  // Normalize scores to percentages
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  if (totalScore > 0) {
    Object.keys(scores).forEach(key => {
      scores[key] = (scores[key] / totalScore) * 100;
    });
  } else {
    // If no scores, distribute equally
    Object.keys(scores).forEach(key => {
      scores[key] = 16.67;
    });
  }

  return scores;
}

/**
 * Calculate aptitude scores for each strand based on assessment answers
 * @param aptitudeAnswers The aptitude test answers
 * @returns Normalized scores for each strand
 */
function calculateAptitudeScore(aptitudeAnswers) {
  // Initialize strand scores
  const strandScores = {
    stem: 0,
    abm: 0,
    humss: 0,
    gas: 0,
    tvl: 0,
    arts: 0
  };

  // If no answers, return equal scores
  if (!aptitudeAnswers || Object.keys(aptitudeAnswers).length === 0) {
    return { stem: 0.17, abm: 0.17, humss: 0.17, gas: 0.17, tvl: 0.17, arts: 0.17 };
  }

  // Define question-to-strand mappings
  // These mappings should be adjusted based on your actual aptitude test questions
  const questionStrandMapping = {
    // Example mappings - adjust based on your actual questions
    '1': 'stem',  // Question 1 relates to STEM
    '2': 'abm',   // Question 2 relates to ABM
    '3': 'humss', // Question 3 relates to HUMSS
    '4': 'gas',   // Question 4 relates to GAS
    '5': 'tvl'    // Question 5 relates to TVL
  };

  // Calculate scores based on answers
  let totalPoints = 0;
  Object.entries(aptitudeAnswers).forEach(([questionId, answerValue]) => {
    const strand = questionStrandMapping[questionId];
    if (strand && typeof answerValue === 'number') {
      // Assuming answerValue is on a scale of 1-5, normalize to 0-1
      const normalizedScore = (answerValue - 1) / 4;
      strandScores[strand] += normalizedScore;
      totalPoints += normalizedScore;
    }
  });

  // Normalize scores to sum to 1
  if (totalPoints > 0) {
    Object.keys(strandScores).forEach(key => {
      strandScores[key] = strandScores[key] / totalPoints;
    });
  } else {
    // If no valid answers, distribute equally
    Object.keys(strandScores).forEach(key => {
      strandScores[key] = 1 / Object.keys(strandScores).length;
    });
  }

  return strandScores;
}

// Test each template
console.log('Testing Strand Assessment Templates\n');
console.log('==================================\n');

Object.entries(templates).forEach(([strand, template]) => {
  console.log(`${strand} Template:`);
  console.log(`Description: ${template.description}`);
  console.log(`Expected Strand: ${template.expectedStrand}`);
  
  const scores = calculateScores(template);
  console.log('Predicted Scores:');
  
  // Sort scores from highest to lowest
  const sortedScores = Object.entries(scores)
    .sort(([,a], [,b]) => b - a)
    .map(([strand, score]) => `${strand}: ${score.toFixed(2)}%`);
  
  sortedScores.forEach(score => console.log(`  ${score}`));
  
  console.log(`Top Recommendation: ${sortedScores[0].split(':')[0]}`);
  console.log(`Scoring Notes: ${template.scoringNotes}\n`);
  console.log('---\n');
});