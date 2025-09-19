/**
 * Authentication utilities for handling session cleanup and validation
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Clears all authentication related data from storage
 */
export const clearAuthStorage = () => {
  try {
    // Clear localStorage items related to Supabase auth
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage items related to Supabase auth
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('Auth storage cleared');
  } catch (error) {
    console.error('Error clearing auth storage:', error);
  }
};

/**
 * Validates if the current session is still valid
 */
export const validateSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return { isValid: false, error };
    }
    
    if (!session) {
      console.log('No active session found');
      return { isValid: false, session: null };
    }
    
    // Check if session has expired
    if (session.expires_at && session.expires_at * 1000 < Date.now()) {
      console.log('Session has expired');
      return { isValid: false, session, reason: 'expired' };
    }
    
    // Check if user still exists
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      return { isValid: false, error: userError };
    }
    
    if (!user) {
      console.log('No user found for session');
      return { isValid: false, session, reason: 'no_user' };
    }
    
    console.log('Session is valid', { session, user });
    return { isValid: true, session, user };
  } catch (error) {
    console.error('Error validating session:', error);
    return { isValid: false, error };
  }
};

/**
 * Forces a complete session refresh
 */
export const refreshSession = async () => {
  try {
    console.log('Refreshing session...');
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Error refreshing session:', error);
      return { success: false, error };
    }
    
    console.log('Session refreshed successfully', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error during session refresh:', error);
    return { success: false, error };
  }
};

/**
 * Completely logs out the user and clears all auth data
 */
export const forceLogout = async () => {
  try {
    console.log('Forcing logout...');
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error during sign out:', error);
    }
    
    // Clear all auth storage
    clearAuthStorage();
    
    console.log('Forced logout completed');
    return { success: true };
  } catch (error) {
    console.error('Error during forced logout:', error);
    return { success: false, error };
  }
};