#!/usr/bin/env tsx
// Script to insert dummy assessment data for ML training
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { supabase } from '../services/supabaseClient';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the project root
const envPath = path.join(__dirname, '../../..', '.env');
dotenv.config({ path: envPath });

// Dummy assessment data with actual strands for training
const dummyAssessments = [
  {
    basic_info: {
      fullName: "John Doe",
      age: "16",
      gender: "male",
      school: "Sample High School",
      region: "Region 1",
      email: "john.doe@example.com"
    },
    academic_profile: {
      gwa: "85",
      favoriteSubject: "Mathematics",
      leastFavoriteSubject: "English"
    },
    personal_interests: ["Science and Technology", "Mathematics", "Problem Solving"],
    hobbies: ["Video Games", "Coding", "Reading"],
    aptitude_answers: {
      "1": 4,
      "2": 5,
      "3": 4,
      "4": 3,
      "5": 5
    },
    actual_strand: "STEM"
  },
  {
    basic_info: {
      fullName: "Jane Smith",
      age: "15",
      gender: "female",
      school: "Sample High School",
      region: "Region 2",
      email: "jane.smith@example.com"
    },
    academic_profile: {
      gwa: "88",
      favoriteSubject: "Business Math",
      leastFavoriteSubject: "Science"
    },
    personal_interests: ["Business and Finance", "Entrepreneurship", "Leadership"],
    hobbies: ["Reading", "Writing", "Board Games"],
    aptitude_answers: {
      "1": 3,
      "2": 4,
      "3": 5,
      "4": 4,
      "5": 3
    },
    actual_strand: "ABM"
  }
];

async function insertDummyData() {
  console.log('Inserting dummy assessment data...');
  
  try {
    // First, let's check if we have any existing profiles we can use
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }
    
    let profileId = null;
    if (profiles && profiles.length > 0) {
      profileId = profiles[0].id;
      console.log('Using existing profile ID:', profileId);
    } else {
      console.log('No existing profiles found. Inserting data without student_id.');
    }
    
    for (const assessment of dummyAssessments) {
      const insertData: any = {
        basic_info: assessment.basic_info,
        academic_profile: assessment.academic_profile,
        personal_interests: assessment.personal_interests,
        hobbies: assessment.hobbies,
        aptitude_answers: assessment.aptitude_answers,
        actual_strand: assessment.actual_strand,
        recommendations: {
          "STEM": assessment.actual_strand === "STEM" ? 95 : 5,
          "ABM": assessment.actual_strand === "ABM" ? 95 : 5,
          "HUMSS": assessment.actual_strand === "HUMSS" ? 95 : 5,
          "GAS": 5,
          "TVL": assessment.actual_strand === "TVL" ? 95 : 5,
          "Arts": assessment.actual_strand === "Arts" ? 95 : 5
        }
      };
      
      // Only add student_id if we have one
      if (profileId) {
        insertData.student_id = profileId;
      }
      
      const { data, error } = await supabase
        .from('assessment_responses')
        .insert([insertData]);
      
      if (error) {
        console.error('Error inserting assessment:', error);
      } else {
        console.log(`Inserted assessment for ${assessment.basic_info.fullName} with strand ${assessment.actual_strand}`);
      }
    }
    
    console.log('Finished inserting dummy data.');
  } catch (error) {
    console.error('Error during data insertion:', error);
  }
}

// Run the script
insertDummyData();