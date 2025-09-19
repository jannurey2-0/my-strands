import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { clearAuthStorage } from '@/lib/authUtils';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// Define strong types for our auth context
interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: 'student' | 'admin';
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
}

// Create context with undefined check
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // State management
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true
  });
  
  // Utilities
  const { toast } = useToast();
  const navigate = useNavigate();
  const initialized = useRef(false);
  const mounted = useRef(true);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update state safely (only if component is mounted)
  const safeSetAuthState = useCallback((update: Partial<AuthState>) => {
    if (mounted.current) {
      setAuthState(curr => ({ ...curr, ...update }));
    }
  }, []);

  // Clear timeout safely
  const clearLoadingTimeout = () => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  };

  // Set loading state without timeout
  const setLoadingState = (isLoading: boolean) => {
    if (!isLoading) {
      clearLoadingTimeout();
      safeSetAuthState({ loading: false });
      return;
    }

    // Set loading to true immediately
    safeSetAuthState({ loading: true });
  };

  // Create a profile for a user if it doesn't exist
  const createProfile = useCallback(async (user: User): Promise<Profile | null> => {
    try {
      console.log('Creating profile for user:', user.id);
      
      const newProfile = {
        user_id: user.id,
        email: user.email!,
        full_name: user.email!.split('@')[0], // Use email prefix as name
        role: 'student' as const
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        toast({
          title: "Profile creation failed",
          description: "Unable to create your profile. Please contact support.",
          variant: "destructive"
        });
        return null;
      }

      console.log('Profile created successfully:', data);
      toast({
        title: "Profile created",
        description: "Your profile has been successfully created."
      });
      
      return data;
    } catch (error) {
      console.error('Error in createProfile:', error);
      toast({
        title: "Profile creation error",
        description: "An unexpected error occurred while creating your profile.",
        variant: "destructive"
      });
      return null;
    }
  }, [toast]);

  // Fetch profile with retries and timeout
  const fetchProfile = useCallback(async (userId: string, user: User): Promise<Profile | null> => {
    const MAX_RETRIES = 2; // Reduced retries
    const TIMEOUT_MS = 5000; // Reduced timeout to 5 seconds
    const RETRY_DELAY_MS = 1000; // Reduced retry delay

    const fetchWithTimeout = async (attempt: number): Promise<Profile | null> => {
      try {
        console.log(`Attempting to fetch profile for user ${userId}, attempt ${attempt}/${MAX_RETRIES}`);
        
        // Create a timeout promise
        const timeoutPromise = new Promise<null>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Profile fetch timeout after ${TIMEOUT_MS/1000} seconds (attempt ${attempt}/${MAX_RETRIES})`));
          }, TIMEOUT_MS);
        });

        // Create the fetch promise
        const fetchPromise = supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single()
          .then(async ({ data, error }) => {
            if (error) {
              console.error(`Supabase error on attempt ${attempt}:`, error);
              
              // If profile not found, try to create it
              if (error.code === 'PGRST116') { // No rows found
                console.log('Profile not found, attempting to create one...');
                const newProfile = await createProfile(user);
                return newProfile;
              }
              
              throw error;
            }
            console.log(`Profile fetch successful on attempt ${attempt}:`, data);
            return data as Profile;
          });

        // Race between fetch and timeout
        const profile: Profile | null = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (!mounted.current) return null;
        console.log('Profile loaded successfully:', profile);
        return profile;

      } catch (error) {
        console.error(`Profile fetch attempt ${attempt}/${MAX_RETRIES} failed:`, error);
        
        if (!mounted.current) return null;
        
        // Retry logic
        if (attempt < MAX_RETRIES) {
          console.log(`Retrying profile fetch in ${RETRY_DELAY_MS}ms...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          return fetchWithTimeout(attempt + 1);
        }
        
        console.warn('Profile fetch failed after all retries');
        // Don't show error toast to user to avoid confusion
        // Just return null to allow auth to continue
        return null;
      }
    };

    const profile = await fetchWithTimeout(1);
    if (mounted.current) {
      safeSetAuthState({ profile, loading: false });
    }
    return profile;
  }, [safeSetAuthState, toast, createProfile]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    console.log('AuthProvider initializing...');
    setLoadingState(true);
    
    const initializeSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted.current) return;
        
        if (error) {
          console.error('Error getting initial session:', error);
          await supabase.auth.signOut();
          if (mounted.current) {
            safeSetAuthState({
              session: null,
              user: null,
              profile: null,
              loading: false
            });
          }
          return;
        }
        
        if (session?.user) {
          console.log('Found existing session, setting user and session');
          if (mounted.current) {
            safeSetAuthState({
              session,
              user: session.user
            });
            // Try to fetch profile but don't block auth if it fails
            fetchProfile(session.user.id, session.user).catch(error => {
              console.error('Non-blocking profile fetch error during init:', error);
              // Even if profile fetch fails, we still want to stop loading
              if (mounted.current) {
                safeSetAuthState({ loading: false });
              }
            });
          }
        } else {
          console.log('No valid session found');
          if (mounted.current) {
            safeSetAuthState({
              session: null,
              user: null,
              profile: null,
              loading: false
            });
          }
        }
      } catch (error) {
        console.error('Error in initial session check:', error);
        if (mounted.current) {
          safeSetAuthState({
            session: null,
            user: null,
            profile: null,
            loading: false
          });
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', { event, session });
        
        if (!mounted.current) return;
        
        safeSetAuthState({
          session,
          user: session?.user ?? null
        });
        
        if (session?.user) {
          // Try to fetch profile but don't block auth if it fails
          fetchProfile(session.user.id, session.user).catch(error => {
            console.error('Non-blocking profile fetch error:', error);
            // Even if profile fetch fails, we still want to stop loading
            if (mounted.current) {
              safeSetAuthState({ loading: false });
            }
          });
        } else {
          if (mounted.current) {
            safeSetAuthState({ profile: null, loading: false });
          }
        }
      }
    );

    // Initialize session
    initializeSession();

    // Cleanup
    return () => {
      mounted.current = false;
      clearLoadingTimeout();
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName
        }
      }
    });

    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link to complete your signup."
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      toast({
        title: "Sign in failed", 
        description: error.message,
        variant: "destructive"
      });
    } else {
      // Successful sign in - let the auth state change handler take care of navigation
      console.log('Sign in successful');
    }

    return { error };
  };

  const signOut = async () => {
    console.log("Attempting to sign out");
    try {
      // Clear state immediately to prevent UI issues
      safeSetAuthState({
        user: null,
        session: null,
        profile: null,
        loading: false
      });
      
      // Clear any remaining timeouts
      clearLoadingTimeout();
      
      // Then try to sign out from Supabase (this might fail if session is already gone)
      // If the request fails (403 / AuthSessionMissingError) we still want to
      // ensure local client-side tokens are removed so a page refresh doesn't
      // resurrect the session from stale storage.
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.warn("Supabase sign out warning (not critical):", error);
          // Fallback: clear local/session storage keys used by Supabase
          try {
            clearAuthStorage();
          } catch (e) {
            console.error('Error clearing auth storage as fallback:', e);
          }
          // Attempt to remove known token key just in case
          try {
            localStorage.removeItem('supabase.auth.token');
            sessionStorage.removeItem('supabase.auth.token');
          } catch (e) {
            // ignore
          }
        } else {
          console.log("Supabase sign out successful");
          // Also clear any leftover client storage to be safe
          try {
            clearAuthStorage();
          } catch (e) {
            console.error('Error clearing auth storage after successful signOut:', e);
          }
        }
      } catch (supabaseError) {
        console.warn("Supabase sign out failed (not critical):", supabaseError);
        // Fallback: clear local/session storage keys used by Supabase
        try {
          clearAuthStorage();
        } catch (e) {
          console.error('Error clearing auth storage after supabase.signOut exception:', e);
        }
        // This is not critical - we've already cleared local state
      }
      
      console.log("Sign out process completed");
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Sign out failed",
        description: "An unexpected error occurred during sign out",
        variant: "destructive"
      });
      // Even if there's an error, clear local state to prevent stuck sessions
      safeSetAuthState({
        user: null,
        session: null,
        profile: null,
        loading: false
      });
    }
  };

  // Expose a method to force refresh the auth state
  const refreshAuthState = async () => {
    console.log("Refreshing auth state");
    setLoadingState(true);
    
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error refreshing session:", error);
        safeSetAuthState({
          user: null,
          session: null,
          profile: null
        });
      } else {
        safeSetAuthState({
          session: currentSession,
          user: currentSession?.user ?? null
        });
        
        if (currentSession?.user) {
          // Fetch user profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', currentSession.user.id)
            .maybeSingle();
          
          if (profileError) {
            console.error('Error fetching profile:', profileError);
            safeSetAuthState({ profile: null });
          } else {
            safeSetAuthState({ profile: profileData || null });
          }
        } else {
          safeSetAuthState({ profile: null });
        }
      }
    } catch (error) {
      console.error("Error refreshing auth state:", error);
      safeSetAuthState({
        user: null,
        session: null,
        profile: null
      });
    } finally {
      setLoadingState(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      ...authState,
      signUp,
      signIn,
      signOut,
      refreshAuthState
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}