/**
 * Script to delete dummy user accounts created for presentation purposes
 * 
 * This script identifies and deletes users marked with [DEMO] in their full_name.
 * 
 * Usage:
 *   npx tsx scripts/delete-dummy-users.ts [--dry-run]
 * 
 * Options:
 *   --dry-run    Preview which users would be deleted without actually deleting them
 * 
 * Example:
 *   npx tsx scripts/delete-dummy-users.ts --dry-run
 *   npx tsx scripts/delete-dummy-users.ts
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

// Marker used to identify demo accounts
const DEMO_MARKER = '[DEMO]';

async function deleteDummyUsers(dryRun: boolean = false) {
  console.log(`\n🔍 ${dryRun ? 'Previewing' : 'Deleting'} dummy user accounts...\n`);

  try {
    // First, get all profiles with [DEMO] marker
    console.log('📊 Fetching profiles with [DEMO] marker...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_id, email, full_name')
      .like('full_name', `%${DEMO_MARKER}%`);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      process.exit(1);
    }

    if (!profiles || profiles.length === 0) {
      console.log('✅ No dummy users found with [DEMO] marker.');
      console.log('   All demo accounts may have already been deleted.\n');
      process.exit(0);
    }

    console.log(`📋 Found ${profiles.length} dummy user(s) to ${dryRun ? 'delete' : 'be deleted'}:\n`);

    // Display users that will be deleted
    profiles.forEach((profile, idx) => {
      console.log(`   ${idx + 1}. ${profile.email} (${profile.full_name})`);
    });

    if (dryRun) {
      console.log('\n💡 This is a dry run. No users were actually deleted.');
      console.log('   Run without --dry-run to delete these users.\n');
      process.exit(0);
    }

    // Confirm deletion
    console.log(`\n⚠️  WARNING: You are about to delete ${profiles.length} user account(s).`);
    console.log('   This action cannot be undone!\n');

    // Delete users using admin API
    const deletedUsers: string[] = [];
    const errors: Array<{ email: string; error: string }> = [];

    for (const profile of profiles) {
      try {
        console.log(`🗑️  Deleting: ${profile.email}...`);

        const { error: deleteError } = await supabase.auth.admin.deleteUser(profile.user_id);

        if (deleteError) {
          console.error(`   ❌ Error: ${deleteError.message}`);
          errors.push({ email: profile.email, error: deleteError.message });
        } else {
          console.log(`   ✅ Deleted`);
          deletedUsers.push(profile.email);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: any) {
        console.error(`   ❌ Unexpected error: ${error.message}`);
        errors.push({ email: profile.email, error: error.message });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DELETION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully deleted: ${deletedUsers.length} users`);
    console.log(`❌ Failed: ${errors.length} users`);

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.email}: ${err.error}`);
      });
    }

    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Check for dry-run flag
const dryRun = process.argv.includes('--dry-run');

// Run the script
deleteDummyUsers(dryRun)
  .then(() => {
    console.log('✅ Deletion process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

