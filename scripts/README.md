# Assessment Response Generation Script

This script generates 5 assessment responses for each student profile in your database.

## Prerequisites

1. **Environment Variables**: Make sure you have the following in your `.env` or `.env.local` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

   > **Note**: The script will automatically check for `.env.local` first, then fall back to `.env` if `.env.local` doesn't exist.
   
   > **Important**: You need the **Service Role Key** (not the anon key) to bypass Row-Level Security (RLS) policies when inserting data.

2. **Database Setup**:
   - At least 100 student profiles in the `profiles` table
   - At least 15 aptitude questions in the `aptitude_questions` table (all multiple choice)

## Usage

### Option 1: Using npm script (Recommended)
```bash
npm run generate-assessments
```

### Option 2: Direct execution
```bash
npx tsx scripts/generate-assessment-responses.ts
```

## What the Script Does

1. **Fetches Data**:
   - Retrieves the first 100 student profiles from the database
   - Retrieves all 15 aptitude questions

2. **Generates Assessment Responses**:
   - Creates 5 assessment responses per student (500 total)
   - Each assessment includes:
     - **Basic Info**: Name, age, gender, school, region, email
     - **Academic Profile**: GWA, favorite subjects (1-3), least favorite subjects (1-3)
     - **Personal Interests**: 1-3 interests aligned with the target strand
     - **Hobbies**: 2-5 hobbies aligned with the target strand
     - **Aptitude Answers**: 15 multiple-choice answers (numeric 0-based indices)
     - **Actual Strand**: Distributed evenly across all 6 strands (STEM, ABM, HUMSS, GAS, TVL, Arts)

3. **Data Quality**:
   - Strand-aligned data: Favorite subjects, interests, and hobbies are generated to match the target strand
   - Realistic distributions: Strands are distributed evenly across all assessments
   - Unique submissions: Each assessment has a different `submitted_at` timestamp (staggered by days)

## Output

The script will:
- Show progress every 50 assessments
- Display final statistics:
  - Total assessments generated
  - Number of errors (if any)
  - Strand distribution verification

## Example Output

```
🚀 Starting assessment response generation...

📋 Fetching student profiles...
✅ Found 100 student profiles

📝 Fetching aptitude questions...
✅ Found 15 aptitude questions

🔄 Generating assessment responses...
   Progress: 50/500 assessments generated...
   Progress: 100/500 assessments generated...
   ...

✅ Generation complete!
   - Generated: 500 assessments
   - Errors: 0
   - Total students: 100
   - Assessments per student: 5

📊 Verifying data...
   Strand distribution:
     - STEM: 84
     - ABM: 83
     - HUMSS: 83
     - GAS: 83
     - TVL: 83
     - Arts: 84

🎉 Script completed successfully!
```

## Notes

- The script uses the **Service Role Key** to bypass RLS policies
- All aptitude questions are assumed to be **multiple choice** (numeric answers)
- The script will **not** delete existing assessment responses
- If you run the script multiple times, it will create duplicate assessments (each student will have more than 5)

## Troubleshooting

### Error: "Missing required environment variables"
- Make sure your `.env` or `.env.local` file exists and contains `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

### Error: "No student profiles found"
- Verify that you have at least 100 student profiles in the `profiles` table with `role = 'student'`

### Error: "Only found X questions, expected 15"
- Make sure you have at least 15 aptitude questions in the `aptitude_questions` table

### Error: "new row violates row-level security policy"
- This shouldn't happen if you're using the Service Role Key, but if it does, check your RLS policies

## After Running

Once the script completes:
1. **Train the ML Model**: Go to Admin Dashboard → ML Model Management → Click "Train Model"
2. **Verify Data**: Check the assessment responses in your Supabase dashboard
3. **Test Predictions**: Have a student complete an assessment to test the ML model predictions

