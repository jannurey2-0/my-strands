# System Algorithms Documentation

This document lists all algorithms and processes in the Strand Recommendation System for flowchart creation.

## 1. Authentication & User Management

### 1.1 Student Account Registration Algorithm
**Location:** `src/hooks/useAuth.tsx`, `src/pages/StudentAuth.tsx`

**Steps:**
1. Validate email format (regex pattern)
2. Validate password (minimum 6 characters)
3. Submit signup request to Supabase Auth
4. Create user profile in `profiles` table (via database trigger)
5. Send email confirmation link
6. Wait for email verification
7. Auto-create profile with role='student'

**Input:** Email, Password, Full Name
**Output:** User account created, confirmation email sent

### 1.2 Student Account Login Algorithm
**Location:** `src/hooks/useAuth.tsx`, `src/pages/StudentAuth.tsx`

**Steps:**
1. Validate email and password
2. Authenticate with Supabase Auth
3. Check if email is confirmed
4. Fetch user profile from `profiles` table
5. Verify role is 'student'
6. Create session
7. Redirect to student dashboard

**Input:** Email, Password
**Output:** Authenticated session, user profile loaded

### 1.3 Admin Account Login Algorithm
**Location:** `src/hooks/useAuth.tsx`, `src/pages/AdminAuth.tsx`

**Steps:**
1. Validate email and password
2. Authenticate with Supabase Auth
3. Fetch user profile
4. Verify role is 'admin'
5. If not admin, sign out and redirect
6. Create session
7. Redirect to admin dashboard

**Input:** Email, Password
**Output:** Authenticated admin session

### 1.4 Session Validation Algorithm
**Location:** `src/lib/authUtils.ts`

**Steps:**
1. Check if session exists
2. Check if session has expired
3. Verify user still exists in database
4. Return validation result

**Input:** Session object
**Output:** Validation status (valid/invalid)

## 2. Assessment Form Processing

### 2.1 Assessment Form Validation Algorithm
**Location:** `src/pages/Assessment.tsx`

**Steps:**
1. Validate each step before proceeding
2. Step 1: Basic Info (name, age, gender, school, region, email)
3. Step 2: Academic Profile (GWA, favorite subjects max 3, least favorite subjects max 3)
4. Step 3: Personal Interests (at least 1 required)
5. Step 4: Hobbies (at least 1 required)
6. Step 5: Aptitude Test (all questions must be answered)
7. Enforce mutual exclusivity: favorite subjects cannot be in least favorite list
8. Save progress to localStorage

**Input:** Form data per step
**Output:** Validation result (valid/invalid with error messages)

### 2.2 Assessment Submission Algorithm
**Location:** `src/pages/Assessment.tsx`, `src/integrations/supabase/assessmentService.ts`

**Steps:**
1. Validate all form data
2. Calculate aptitude test score
3. Prepare assessment data structure
4. Insert into `assessment_responses` table
5. Clear localStorage
6. Redirect to results page

**Input:** Complete assessment form data
**Output:** Assessment saved to database, redirect to results

### 2.3 Aptitude Test Score Calculation Algorithm
**Location:** `src/pages/Assessment.tsx`

**Steps:**
1. Filter scored questions (multiple_choice, true_false)
2. Count correct answers
3. Calculate percentage: (correct / total) * 100
4. Return score with badge (Excellent ≥80%, Good ≥70%, Needs Improvement <70%)

**Input:** Aptitude test answers
**Output:** Score percentage (0-100)

## 3. Feature Extraction (ML)

### 3.1 Feature Extraction Algorithm
**Location:** `src/ml/features/featureExtractor.ts`

**Steps:**
1. Validate assessment data
2. Extract GWA and normalize (0-1 scale)
3. Calculate favorite subject score (average alignment with strands)
4. Calculate least favorite subject score (penalty system)
5. Calculate interest alignment scores (6 strands)
6. Calculate hobby alignment scores (6 strands)
7. Calculate aptitude score (0-1 normalized)
8. Encode age (normalized)
9. Encode gender (binary: 0=male, 1=female)
10. Return 18-feature array

**Input:** IAssessment object
**Output:** IAssessmentFeatures (18 numerical features)

### 3.2 Subject Score Calculation Algorithm
**Location:** `src/ml/features/featureExtractor.ts`

**Steps:**
1. Map subjects to strand categories (STEM, ABM, HUMSS)
2. Count matches per strand
3. Calculate average alignment score
4. Return normalized score (0-1)

**Input:** Array of subjects
**Output:** Normalized subject score

### 3.3 Interest/Hobby Alignment Algorithm
**Location:** `src/ml/features/featureExtractor.ts`

**Steps:**
1. Get interest/hobby mappings from MODEL_CONFIG
2. Count matches per strand
3. Calculate alignment score per strand
4. Normalize scores (0-1 range)

**Input:** Array of interests/hobbies
**Output:** 6 alignment scores (one per strand)

## 4. Rule-Based Strand Scoring

### 4.1 Rule-Based Strand Recommendation Algorithm
**Location:** `src/pages/Results.tsx`, `src/pages/Dashboard.tsx`, `src/ml/services/modelService.ts`

**Steps:**
1. Initialize scores for all 6 strands (STEM, ABM, HUMSS, GAS, TVL, Arts) to 0
2. **Academic Performance Scoring (20% weight)**
   - Calculate GWA score: (GWA - 75) * 4, clamped to 0-100
   - Distribute points for favorite subjects (15 points total, divided by number of subjects)
   - Apply GWA bonus (10% of GWA score per favorite subject)
3. **Interest Alignment Scoring (15% weight)**
   - Map interests to strands with weights
   - Add points per matching interest
4. **Hobby Alignment Scoring (10% weight)**
   - Map hobbies to strands with weights
   - Add points per matching hobby
5. **Aptitude Test Results (30% weight)**
   - Calculate aptitude score from answers
   - Distribute to strands: STEM 12%, ABM 8%, HUMSS 6%, TVL 7%, Arts 5%, GAS 2%
6. **Subject Dislike Penalty (10% weight)**
   - Apply -8 point penalty for disliking relevant subjects
7. **Balanced Interests Bonus (5% weight)**
   - Add +1 to all strands if ≥2 interests
8. **Diverse Hobbies Bonus (5% weight)**
   - Add +1 to all strands if ≥3 hobbies
9. **Age-based Adjustments (5% weight)**
   - Add +2 to STEM for age 15-16
10. Normalize scores (ensure no negatives)
11. Convert to percentages (sum to 100%)

**Input:** Assessment response data
**Output:** Strand scores as percentages (0-100% each, sum to 100%)

### 4.2 Aptitude Score Distribution Algorithm
**Location:** `src/pages/Results.tsx`, `src/ml/services/modelService.ts`

**Steps:**
1. Calculate raw aptitude score from answers
2. Map questions to strand categories
3. Distribute score across strands based on question types
4. Return strand-specific aptitude scores

**Input:** Aptitude test answers
**Output:** Aptitude scores per strand

## 5. Machine Learning Model

### 5.1 ML Model Architecture Initialization Algorithm
**Location:** `src/ml/models/strandModel.ts`

**Steps:**
1. Create sequential neural network
2. Add input layer (18 features)
3. Add first hidden layer (20 units, ReLU activation)
4. Add dropout layer (30% dropout)
5. Add second hidden layer (10 units, ReLU activation)
6. Add output layer (6 units, Softmax activation)
7. Compile with Adam optimizer, categorical crossentropy loss
8. Set model ready flag

**Input:** None (uses MODEL_CONFIG)
**Output:** Initialized model architecture

### 5.2 ML Model Training Algorithm
**Location:** `src/ml/models/strandModel.ts`, `src/ml/services/modelService.ts`

**Steps:**
1. Validate training data (non-empty)
2. Extract features and labels from training data
3. Convert features to TensorFlow tensors
4. Convert labels to one-hot encoded tensors (0-1 range)
5. Calculate class weights (for imbalanced data handling)
6. Train model with:
   - 150 epochs
   - Batch size: 8
   - Validation split: 10%
   - Learning rate: 0.001
   - Callbacks for epoch logging
7. Monitor training loss and accuracy
8. Set trained flag after completion
9. Return training history

**Input:** Array of ITrainingData (features + labels)
**Output:** Trained model, training history

### 5.3 ML Model Prediction Algorithm
**Location:** `src/ml/models/strandModel.ts`, `src/ml/services/modelService.ts`

**Steps:**
1. Validate model is trained
2. Extract features from assessment data
3. Convert features to tensor (shape: [1, 18])
4. Run model prediction (forward pass)
5. Get output probabilities (softmax)
6. Convert to percentages (0-100 range)
7. Clamp values to valid range
8. Return strand predictions

**Input:** IAssessment object
**Output:** IStrandPrediction (6 strand percentages)

### 5.4 ML Model Save Algorithm
**Location:** `src/ml/models/strandModel.ts`

**Steps:**
1. Save model to IndexedDB temporarily (gets correct TensorFlow.js format)
2. Load model artifacts from IndexedDB using IO handler
3. Extract modelTopology, weightSpecs, weightData
4. Create model.json structure:
   - modelTopology
   - weightsManifest (with paths and weight specs)
5. Upload model.json to Supabase Storage
6. Upload weights.bin to Supabase Storage
7. Clean up temporary IndexedDB model
8. Cache model to IndexedDB for faster loading

**Input:** Trained model
**Output:** Model saved to Supabase Storage and IndexedDB

### 5.5 ML Model Load Algorithm
**Location:** `src/ml/models/strandModel.ts`

**Steps:**
1. Check if model exists in Supabase Storage
2. Get model URL from Supabase Storage
3. Fetch model.json with cache-busting (timestamp query param)
4. Validate JSON structure (has modelTopology, weightsManifest)
5. Load model using TensorFlow.js loadLayersModel
6. Cache model to IndexedDB for faster future loads
7. Set trained flag
8. Fallback to IndexedDB if Supabase fails

**Input:** Model name
**Output:** Loaded model ready for predictions

### 5.6 Training Data Preparation Algorithm
**Location:** `src/ml/services/modelService.ts`

**Steps:**
1. Fetch all assessment responses from database
2. Filter valid assessments
3. Extract features using FeatureExtractor
4. Get labels from recommendations (if available) or calculate using rule-based
5. Convert to ITrainingData format
6. Return training data array

**Input:** Assessment responses from database
**Output:** Array of ITrainingData

## 6. Hybrid Recommendation System

### 6.1 Strand Recommendation Decision Algorithm
**Location:** `src/pages/Results.tsx`

**Steps:**
1. Check if ML model is enabled (system settings)
2. If ML enabled:
   - Initialize model service
   - Wait for training to complete
   - Make ML prediction
   - Use ML scores
3. If ML disabled or fails:
   - Fall back to rule-based scoring
4. Save recommendations to database
5. Format results for display

**Input:** Assessment data
**Output:** Final strand recommendations (percentages)

## 7. Data Validation & Processing

### 7.1 GWA Validation Algorithm
**Location:** `src/ml/features/featureExtractor.ts`

**Steps:**
1. Parse GWA string to float
2. Validate range (75-100)
3. Normalize to 0-1 scale: (GWA - 75) / 25
4. Return normalized value

**Input:** GWA string
**Output:** Normalized GWA (0-1)

### 7.2 Age Validation Algorithm
**Location:** `src/ml/features/featureExtractor.ts`

**Steps:**
1. Parse age string to integer
2. Validate range (13-18 typical)
3. Normalize to 0-1 scale
4. Return normalized value

**Input:** Age string
**Output:** Normalized age (0-1)

### 7.3 Gender Encoding Algorithm
**Location:** `src/ml/features/featureExtractor.ts`

**Steps:**
1. Check gender value
2. Encode: Male = 0, Female = 1, Other = 0.5
3. Return encoded value

**Input:** Gender string
**Output:** Encoded gender (0, 0.5, or 1)

## 8. Results Processing

### 8.1 Results Formatting Algorithm
**Location:** `src/pages/Results.tsx`, `src/pages/Dashboard.tsx`

**Steps:**
1. Sort strands by match percentage (descending)
2. Round percentages to 2 decimal places
3. Add strand information (name, description, icon, color, careers, subjects)
4. Format for display
5. Return formatted results array

**Input:** Raw strand scores
**Output:** Formatted results with metadata

### 8.2 Recommendations Saving Algorithm
**Location:** `src/integrations/supabase/assessmentService.ts`

**Steps:**
1. Validate assessment ID exists
2. Update assessment_responses table
3. Set recommendations field with scores
4. Return success status

**Input:** Assessment ID, Strand scores
**Output:** Saved recommendations in database

## 9. Admin Functions

### 9.1 ML Model Training Management Algorithm
**Location:** `src/components/MLModelManagement.tsx`

**Steps:**
1. Check if training is already in progress (lock mechanism)
2. Initialize model if not ready
3. Fetch all assessment data
4. Convert to training format
5. Train model with progress tracking
6. Save model to Supabase Storage
7. Update model status
8. Release training lock

**Input:** None (uses database assessments)
**Output:** Trained and saved ML model

### 9.2 System Settings Management Algorithm
**Location:** `src/pages/AdminDashboard.tsx`

**Steps:**
1. Fetch system settings from database
2. Allow admin to toggle ML model enabled/disabled
3. Save settings to database
4. Update system-wide behavior

**Input:** System settings changes
**Output:** Updated system settings

## 10. Data Flow Summary

### Complete Assessment Flow:
1. **Registration** → Student creates account
2. **Login** → Student authenticates
3. **Assessment** → Student fills form (5 steps)
4. **Validation** → Each step validated
5. **Submission** → Assessment saved to database
6. **Feature Extraction** → Convert to ML features (if ML enabled)
7. **Recommendation** → ML prediction OR rule-based scoring
8. **Results** → Display strand recommendations
9. **Save** → Recommendations saved to database

### ML Model Lifecycle:
1. **Initialization** → Create model architecture
2. **Training** → Train with assessment data
3. **Saving** → Save to Supabase Storage
4. **Loading** → Load from Supabase Storage (with IndexedDB cache)
5. **Prediction** → Make predictions on new assessments
6. **Retraining** → Admin can retrain with new data

---

## Algorithm Categories for Flowchart:

1. **Authentication Flow**
   - Registration
   - Login (Student/Admin)
   - Session Management

2. **Assessment Flow**
   - Form Validation
   - Step-by-step Processing
   - Aptitude Score Calculation
   - Submission

3. **Recommendation Engine**
   - Feature Extraction
   - ML Model Prediction
   - Rule-Based Scoring
   - Hybrid Decision Making

4. **ML Model Management**
   - Model Training
   - Model Saving/Loading
   - Prediction

5. **Data Processing**
   - Validation
   - Normalization
   - Encoding

6. **Results Processing**
   - Score Calculation
   - Formatting
   - Display

