/**
 * Script to generate 5 assessment responses for each student profile
 * 
 * Usage:
 *   npx tsx scripts/generate-assessment-responses.ts
 * 
 * Or with ts-node:
 *   npx ts-node scripts/generate-assessment-responses.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

// Load environment variables - try .env.local first, then .env
const envLocalPath = join(process.cwd(), '.env.local');
const envPath = join(process.cwd(), '.env');

if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
  console.log('📝 Loaded environment variables from .env.local');
} else if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('📝 Loaded environment variables from .env');
} else {
  // Try default dotenv behavior (loads .env from current directory)
  dotenv.config();
  console.log('📝 Attempted to load environment variables (default behavior)');
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('   - VITE_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease set these in your .env or .env.local file');
  process.exit(1);
}

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Strand options
const STRANDS = ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL', 'Arts'] as const;
type Strand = typeof STRANDS[number];

// Subject options (from Assessment.tsx)
const SUBJECT_OPTIONS = [
  "Mathematics", "Science", "English", "Araling Panlipunan", "Computer Science",
  "Business Math", "Economics", "Accounting", "Entrepreneurship", "Literature",
  "History", "Philosophy", "Physics", "Chemistry", "Other"
];

// Subject mappings by strand (for realistic data generation)
const STEM_SUBJECTS = ["Mathematics", "Science", "Computer Science", "Physics", "Chemistry"];
const ABM_SUBJECTS = ["Business Math", "Economics", "Accounting", "Entrepreneurship"];
const HUMSS_SUBJECTS = ["English", "Araling Panlipunan", "Literature", "History", "Philosophy"];

// Interest options (from Assessment.tsx)
const INTERESTS = [
  "Science and Technology", 
  "Business and Finance", 
  "Arts and Design", 
  "Humanities and Social Sciences", 
  "Sports", 
  "Technical Vocational Work"
];

// Hobbies options (from Assessment.tsx)
const HOBBIES = [
  "Reading", "Writing", "Drawing/Painting", "Photography", "Music", 
  "Dancing", "Cooking", "Gardening", "Sports", "Video Games",
  "Traveling", "Crafting", "Collecting", "Fishing", "Camping",
  "Coding", "Volunteering", "Meditation", "Yoga", "Board Games"
];

// Philippine regions
const PHILIPPINE_REGIONS = [
  "National Capital Region (NCR)",
  "Cordillera Administrative Region (CAR)",
  "Ilocos Region (Region I)",
  "Cagayan Valley (Region II)",
  "Central Luzon (Region III)",
  "CALABARZON (Region IV-A)",
  "MIMAROPA (Region IV-B)",
  "Bicol Region (Region V)",
  "Western Visayas (Region VI)",
  "Central Visayas (Region VII)",
  "Eastern Visayas (Region VIII)",
  "Zamboanga Peninsula (Region IX)",
  "Northern Mindanao (Region X)",
  "Davao Region (Region XI)",
  "SOCCSKSARGEN (Region XII)",
  "Caraga (Region XIII)",
  "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)"
];

// Gender options
const GENDERS = ["Male", "Female", "Other"];

// Helper functions
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomChoices<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomGWA(strand: Strand): string {
  // Generate GWA based on strand (slightly higher for matching strand)
  const baseGWA = randomInt(75, 100);
  // Add some variation
  return baseGWA.toString();
}

/**
 * Generate favorite subjects based on target strand
 */
function generateFavoriteSubjects(strand: Strand): string[] {
  let preferredSubjects: string[] = [];
  
  switch (strand) {
    case 'STEM':
      preferredSubjects = [...STEM_SUBJECTS];
      break;
    case 'ABM':
      preferredSubjects = [...ABM_SUBJECTS];
      break;
    case 'HUMSS':
      preferredSubjects = [...HUMSS_SUBJECTS];
      break;
    case 'GAS':
      // GAS is general, so mix of subjects
      preferredSubjects = [...STEM_SUBJECTS, ...HUMSS_SUBJECTS];
      break;
    case 'TVL':
      // TVL prefers practical subjects
      preferredSubjects = ["Mathematics", "Science", "Computer Science", ...ABM_SUBJECTS];
      break;
    case 'Arts':
      // Arts prefers creative subjects
      preferredSubjects = ["English", "Literature", "History", "Philosophy"];
      break;
  }
  
  // Select 1-3 subjects (weighted towards preferred subjects)
  const count = randomInt(1, 3);
  const selected: string[] = [];
  
  // 70% chance to pick from preferred subjects
  for (let i = 0; i < count && selected.length < 3; i++) {
    if (Math.random() < 0.7 && preferredSubjects.length > 0) {
      const subject = randomChoice(preferredSubjects);
      if (!selected.includes(subject)) {
        selected.push(subject);
      }
    } else {
      const subject = randomChoice(SUBJECT_OPTIONS);
      if (!selected.includes(subject) && !preferredSubjects.includes(subject)) {
        selected.push(subject);
      }
    }
  }
  
  // Fill remaining slots with any available subjects
  while (selected.length < count && selected.length < 3) {
    const subject = randomChoice(SUBJECT_OPTIONS);
    if (!selected.includes(subject)) {
      selected.push(subject);
    }
  }
  
  return selected;
}

/**
 * Generate least favorite subjects (opposite of favorite subjects)
 */
function generateLeastFavoriteSubjects(favoriteSubjects: string[], strand: Strand): string[] {
  const count = randomInt(1, 3);
  const selected: string[] = [];
  
  // Get subjects that are NOT in favorite subjects
  const availableSubjects = SUBJECT_OPTIONS.filter(s => !favoriteSubjects.includes(s));
  
  // For least favorite, prefer subjects that don't align with the strand
  let oppositeSubjects: string[] = [];
  switch (strand) {
    case 'STEM':
      oppositeSubjects = [...HUMSS_SUBJECTS, "Arts"];
      break;
    case 'ABM':
      oppositeSubjects = [...STEM_SUBJECTS, ...HUMSS_SUBJECTS];
      break;
    case 'HUMSS':
      oppositeSubjects = [...STEM_SUBJECTS, "Mathematics", "Physics", "Chemistry"];
      break;
    default:
      oppositeSubjects = availableSubjects;
  }
  
  // Select from opposite subjects first
  for (let i = 0; i < count && selected.length < 3; i++) {
    const candidates = oppositeSubjects.filter(s => 
      availableSubjects.includes(s) && !selected.includes(s)
    );
    
    if (candidates.length > 0) {
      selected.push(randomChoice(candidates));
    } else {
      // Fallback to any available subject
      const subject = randomChoice(availableSubjects.filter(s => !selected.includes(s)));
      if (subject) selected.push(subject);
    }
  }
  
  return selected;
}

/**
 * Generate interests based on strand
 */
function generateInterests(strand: Strand): string[] {
  const strandInterests: Record<Strand, string[]> = {
    'STEM': ["Science and Technology"],
    'ABM': ["Business and Finance"],
    'HUMSS': ["Humanities and Social Sciences"],
    'GAS': ["Science and Technology", "Humanities and Social Sciences"],
    'TVL': ["Technical Vocational Work"],
    'Arts': ["Arts and Design"]
  };
  
  const primaryInterest = strandInterests[strand];
  const count = randomInt(1, 3);
  const selected = [...primaryInterest];
  
  // Add additional interests
  while (selected.length < count) {
    const interest = randomChoice(INTERESTS);
    if (!selected.includes(interest)) {
      selected.push(interest);
    }
  }
  
  return selected;
}

/**
 * Generate hobbies based on strand
 */
function generateHobbies(strand: Strand): string[] {
  const strandHobbies: Record<Strand, string[]> = {
    'STEM': ["Coding", "Reading", "Video Games", "Board Games"],
    'ABM': ["Reading", "Board Games", "Entrepreneurial Activities", "Collecting"],
    'HUMSS': ["Reading", "Writing", "Traveling", "Volunteering"],
    'GAS': ["Reading", "Sports", "Traveling", "Volunteering"],
    'TVL': ["Crafting", "Cooking", "Gardening", "Fishing"],
    'Arts': ["Drawing/Painting", "Photography", "Music", "Dancing", "Crafting"]
  };
  
  const preferredHobbies = strandHobbies[strand];
  const count = randomInt(2, 5);
  const selected: string[] = [];
  
  // Add preferred hobbies first
  for (const hobby of preferredHobbies) {
    if (selected.length < count) {
      selected.push(hobby);
    }
  }
  
  // Fill remaining with random hobbies
  while (selected.length < count) {
    const hobby = randomChoice(HOBBIES);
    if (!selected.includes(hobby)) {
      selected.push(hobby);
    }
  }
  
  return selected.slice(0, count);
}

/**
 * Generate aptitude answers (all multiple choice, numeric 0-based indices)
 */
function generateAptitudeAnswers(
  questions: Array<{ id: string; options: string[] }>,
  strand: Strand
): Record<string, number> {
  const answers: Record<string, number> = {};
  
  for (const question of questions) {
    const numOptions = question.options.length;
    // Generate random answer (0 to numOptions - 1)
    // Could be enhanced to align answers with strand, but for now just random
    answers[question.id] = randomInt(0, numOptions - 1);
  }
  
  return answers;
}

/**
 * Generate a single assessment response
 */
function generateAssessmentResponse(
  profile: { id: string; full_name: string; email: string },
  questions: Array<{ id: string; options: string[] }>,
  strand: Strand,
  index: number
) {
  const favoriteSubjects = generateFavoriteSubjects(strand);
  const leastFavoriteSubjects = generateLeastFavoriteSubjects(favoriteSubjects, strand);
  const interests = generateInterests(strand);
  const hobbies = generateHobbies(strand);
  const aptitudeAnswers = generateAptitudeAnswers(questions, strand);
  
  // Generate age (15-18 for high school students)
  const age = randomInt(15, 18).toString();
  
  // Generate school name
  const schoolNames = [
    "Manila High School",
    "Quezon City National High School",
    "Makati Science High School",
    "Pasig City High School",
    "Taguig National High School",
    "Caloocan High School",
    "Parañaque High School",
    "Las Piñas High School",
    "Muntinlupa High School",
    "Marikina High School"
  ];
  
  return {
    student_id: profile.id,
    basic_info: {
      fullName: profile.full_name,
      age: age,
      gender: randomChoice(GENDERS),
      school: randomChoice(schoolNames),
      region: randomChoice(PHILIPPINE_REGIONS),
      email: profile.email
    },
    academic_profile: {
      gwa: randomGWA(strand),
      favoriteSubjects: favoriteSubjects,
      leastFavoriteSubjects: leastFavoriteSubjects
    },
    personal_interests: interests,
    hobbies: hobbies,
    aptitude_answers: aptitudeAnswers,
    actual_strand: strand,
    submitted_at: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString() // Stagger submissions
  };
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting assessment response generation...\n');
  
  try {
    // 1. Fetch all student profiles
    console.log('📋 Fetching student profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'student')
      .limit(1000); // Get up to 1000, but we'll use 100
    
    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }
    
    if (!profiles || profiles.length === 0) {
      throw new Error('No student profiles found in database');
    }
    
    const studentProfiles = profiles.slice(0, 100); // Use first 100
    console.log(`✅ Found ${studentProfiles.length} student profiles\n`);
    
    // 2. Fetch all aptitude questions
    console.log('📝 Fetching aptitude questions...');
    const { data: questions, error: questionsError } = await supabase
      .from('aptitude_questions')
      .select('id, options')
      .limit(20); // Get up to 20 questions
    
    if (questionsError) {
      throw new Error(`Failed to fetch questions: ${questionsError.message}`);
    }
    
    if (!questions || questions.length === 0) {
      throw new Error('No aptitude questions found in database');
    }
    
    // Ensure we have exactly 15 questions
    const aptitudeQuestions = questions.slice(0, 15);
    
    if (aptitudeQuestions.length < 15) {
      console.warn(`⚠️  Warning: Only found ${aptitudeQuestions.length} questions, expected 15`);
    }
    
    // Parse options (they might be stored as JSON string or array)
    const parsedQuestions = aptitudeQuestions.map(q => {
      let options: string[] = [];
      if (Array.isArray(q.options)) {
        options = q.options;
      } else if (typeof q.options === 'string') {
        try {
          options = JSON.parse(q.options);
        } catch (e) {
          console.warn(`⚠️  Could not parse options for question ${q.id}, using empty array`);
          options = [];
        }
      }
      return {
        id: q.id,
        options: options
      };
    }).filter(q => q.options.length > 0); // Filter out questions with no options
    
    console.log(`✅ Found ${parsedQuestions.length} aptitude questions\n`);
    
    // 3. Generate assessment responses
    console.log('🔄 Generating assessment responses...');
    const totalAssessments = studentProfiles.length * 5;
    let generated = 0;
    let errors = 0;
    
    // Distribute strands evenly across all assessments
    const strandDistribution: Strand[] = [];
    for (let i = 0; i < totalAssessments; i++) {
      strandDistribution.push(STRANDS[i % STRANDS.length]);
    }
    // Shuffle for randomness
    strandDistribution.sort(() => Math.random() - 0.5);
    
    let strandIndex = 0;
    
    for (const profile of studentProfiles) {
      for (let i = 0; i < 5; i++) {
        try {
          const strand = strandDistribution[strandIndex++];
          const assessment = generateAssessmentResponse(profile, parsedQuestions, strand, i);
          
          const { error: insertError } = await supabase
            .from('assessment_responses')
            .insert(assessment);
          
          if (insertError) {
            console.error(`❌ Error inserting assessment for ${profile.full_name}: ${insertError.message}`);
            errors++;
          } else {
            generated++;
            if (generated % 50 === 0) {
              console.log(`   Progress: ${generated}/${totalAssessments} assessments generated...`);
            }
          }
        } catch (error) {
          console.error(`❌ Error generating assessment for ${profile.full_name}: ${error}`);
          errors++;
        }
      }
    }
    
    console.log(`\n✅ Generation complete!`);
    console.log(`   - Generated: ${generated} assessments`);
    console.log(`   - Errors: ${errors}`);
    console.log(`   - Total students: ${studentProfiles.length}`);
    console.log(`   - Assessments per student: 5`);
    
    // 4. Verify the data
    console.log('\n📊 Verifying data...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('assessment_responses')
      .select('actual_strand')
      .not('actual_strand', 'is', null);
    
    if (!verifyError && verifyData) {
      const strandCounts: Record<string, number> = {};
      verifyData.forEach(a => {
        const strand = a.actual_strand as string;
        strandCounts[strand] = (strandCounts[strand] || 0) + 1;
      });
      
      console.log('   Strand distribution:');
      Object.entries(strandCounts).forEach(([strand, count]) => {
        console.log(`     - ${strand}: ${count}`);
      });
    }
    
    console.log('\n🎉 Script completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main();

