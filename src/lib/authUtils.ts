import { supabase } from '@/integrations/supabase/client';
import logger from './logger';

/**
 * Clears all authentication-related data from localStorage
 */
export const clearAuthStorage = () => {
  // Clear all auth-related items from localStorage
  const keysToRemove = [
    'supabase.auth.token',
    'supabase.auth.user', 
    'supabase.auth.session',
    // Add any other auth-related keys your app might use
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Clear all keys that start with 'sb-' (Supabase default prefix)
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  logger.debug('Cleared authentication storage');
};

/**
 * Validates if a session is still valid
 */
export const validateSession = async (session: any) => {
  try {
    // Check if session exists
    if (!session) {
      logger.debug('No session provided');
      return { isValid: false, session: null };
    }
    
    // Check if session has expired
    if (session.expires_at && session.expires_at * 1000 < Date.now()) {
      logger.debug('Session has expired');
      return { isValid: false, session, reason: 'expired' };
    }
    
    // Check if user still exists
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      logger.error('Error getting user:', userError);
      return { isValid: false, error: userError };
    }
    
    if (!user) {
      logger.debug('No user found for session');
      return { isValid: false, session, reason: 'no_user' };
    }
    
    logger.debug('Session is valid', { session, user });
    return { isValid: true, session, user };
  } catch (error) {
    logger.error('Error validating session:', error);
    return { isValid: false, error };
  }
};

/**
 * Forces a complete session refresh
 */
export const refreshSession = async () => {
  try {
    logger.debug('Refreshing session...');
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      logger.error('Error refreshing session:', error);
      return { success: false, error };
    }
    
    logger.debug('Session refreshed successfully', data);
    return { success: true, data };
  } catch (error) {
    logger.error('Error refreshing session:', error);
    return { success: false, error };
  }
};