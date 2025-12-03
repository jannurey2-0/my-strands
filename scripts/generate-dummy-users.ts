/**
 * Script to generate dummy user accounts for presentation purposes
 * 
 * These accounts will be marked with a special identifier for easy deletion later.
 * 
 * Usage:
 *   npx tsx scripts/generate-dummy-users.ts [count]
 * 
 * Example:
 *   npx tsx scripts/generate-dummy-users.ts 200
 * 
 * Default: 200 users
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

// Filipino first names (common names)
const FIRST_NAMES = [
  'Maria', 'Juan', 'Jose', 'Ana', 'Carlos', 'Rosa', 'Miguel', 'Carmen',
  'Antonio', 'Elena', 'Francisco', 'Isabel', 'Manuel', 'Patricia', 'Ricardo', 'Sofia',
  'Fernando', 'Andrea', 'Roberto', 'Gabriela', 'Eduardo', 'Valentina', 'Alberto', 'Camila',
  'Rafael', 'Lucia', 'Diego', 'Mariana', 'Santiago', 'Isabella', 'Alejandro', 'Emma',
  'Daniel', 'Olivia', 'Andres', 'Mia', 'Sebastian', 'Amelia', 'Mateo', 'Charlotte',
  'Nicolas', 'Harper', 'Lucas', 'Evelyn', 'Benjamin', 'Abigail', 'David', 'Emily',
  'Javier', 'Elizabeth', 'Pablo', 'Samantha', 'Adrian', 'Victoria', 'Gabriel', 'Grace',
  'Luis', 'Chloe', 'Pedro', 'Zoe', 'Raul', 'Lily', 'Victor', 'Natalie', 'Oscar', 'Aria',
  'Hector', 'Scarlett', 'Ivan', 'Hannah', 'Julio', 'Avery', 'Marco', 'Ella', 'Enrique', 'Madison'
];

// Filipino last names (common surnames)
const LAST_NAMES = [
  'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres',
  'Flores', 'Rivera', 'Gonzales', 'Ramos', 'Villanueva', 'Fernandez', 'Lopez', 'Martinez',
  'Sanchez', 'Dela Cruz', 'Gutierrez', 'Perez', 'Rodriguez', 'Morales', 'Castillo', 'Romero',
  'Diaz', 'Herrera', 'Jimenez', 'Vargas', 'Moreno', 'Alvarez', 'Medina', 'Castro',
  'Ortega', 'Silva', 'Vega', 'Molina', 'Navarro', 'Guerrero', 'Ramos', 'Soto',
  'Delgado', 'Marquez', 'Vasquez', 'Suarez', 'Munoz', 'Hernandez', 'Ramirez', 'Gomez',
  'Pena', 'Acosta', 'Leon', 'Marin', 'Serrano', 'Ruiz', 'Blanco', 'Iglesias'
];

// Generate realistic Filipino name
function generateName(): string {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${firstName} ${lastName}`;
}

// Generate realistic Gmail address
// Format: firstname.lastname.YYYY@gmail.com (where YYYY is a random year between 2020-2025)
function generateEmail(fullName: string, index: number): string {
  const [firstName, lastName] = fullName.split(' ');
  const firstNameLower = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const lastNameLower = lastName.toLowerCase().replace(/[^a-z]/g, '');
  const year = 2020 + Math.floor(Math.random() * 6); // 2020-2025
  const randomNum = Math.floor(Math.random() * 1000); // Add some randomness
  
  // Use index to ensure uniqueness, but make it look natural
  const email = `${firstNameLower}.${lastNameLower}.${year}${randomNum}@gmail.com`;
  return email;
}

// Generate a secure random password
function generatePassword(): string {
  // Generate a random password that looks realistic
  const adjectives = ['happy', 'bright', 'calm', 'swift', 'brave', 'wise', 'kind', 'bold'];
  const nouns = ['star', 'moon', 'river', 'mountain', 'ocean', 'forest', 'cloud', 'sun'];
  const num = Math.floor(Math.random() * 10000);
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}${noun}${num}`;
}

// Marker to identify demo accounts (will be added to full_name)
const DEMO_MARKER = '[DEMO]';

async function generateDummyUsers(count: number) {
  console.log(`\n🚀 Generating ${count} dummy user accounts...\n`);
  console.log(`📌 These accounts will be marked with "${DEMO_MARKER}" for easy identification.\n`);

  const createdUsers: Array<{ email: string; userId: string; fullName: string }> = [];
  const errors: Array<{ email: string; error: string }> = [];

  for (let i = 0; i < count; i++) {
    try {
      const fullName = generateName();
      const email = generateEmail(fullName, i);
      const password = generatePassword();
      
      // Add demo marker to full name for identification
      const markedName = `${fullName} ${DEMO_MARKER}`;

      console.log(`[${i + 1}/${count}] Creating user: ${email} (${fullName})...`);

      // Create user using admin API
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: markedName
        }
      });

      if (userError) {
        console.error(`   ❌ Error: ${userError.message}`);
        errors.push({ email, error: userError.message });
      } else if (userData?.user) {
        // Ensure the profile has the [DEMO] marker (update if needed)
        // The trigger should create the profile, but we'll update it to be sure
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ full_name: markedName })
          .eq('user_id', userData.user.id);

        if (updateError) {
          console.warn(`   ⚠️  Profile update warning: ${updateError.message}`);
        }

        console.log(`   ✅ Created: ${userData.user.id}`);
        createdUsers.push({
          email,
          userId: userData.user.id,
          fullName: markedName
        });
      }

      // Small delay to avoid rate limiting
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error: any) {
      const email = `user${i}@gmail.com`;
      console.error(`   ❌ Unexpected error: ${error.message}`);
      errors.push({ email, error: error.message });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 GENERATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully created: ${createdUsers.length} users`);
  console.log(`❌ Failed: ${errors.length} users`);
  
  if (createdUsers.length > 0) {
    console.log('\n📝 Created users (first 10):');
    createdUsers.slice(0, 10).forEach((user, idx) => {
      console.log(`   ${idx + 1}. ${user.email} (${user.fullName})`);
    });
    if (createdUsers.length > 10) {
      console.log(`   ... and ${createdUsers.length - 10} more`);
    }
  }

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.slice(0, 10).forEach((err, idx) => {
      console.log(`   ${idx + 1}. ${err.email}: ${err.error}`);
    });
    if (errors.length > 10) {
      console.log(`   ... and ${errors.length - 10} more errors`);
    }
  }

  console.log('\n💡 To delete these accounts later, run:');
  console.log('   npm run delete-dummy-users');
  console.log('='.repeat(60) + '\n');
}

// Get count from command line argument or use default
const countArg = process.argv[2];
const count = countArg ? parseInt(countArg, 10) : 200;

if (isNaN(count) || count < 1) {
  console.error('❌ Invalid count. Please provide a positive number.');
  console.error('   Usage: npx tsx scripts/generate-dummy-users.ts [count]');
  process.exit(1);
}

// Run the script
generateDummyUsers(count)
  .then(() => {
    console.log('✅ Dummy user generation completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

