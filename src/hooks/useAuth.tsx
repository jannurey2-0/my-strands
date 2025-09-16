import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: 'student' | 'admin';
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialized = useRef(false);

  // Clear timeout safely
  const clearLoadingTimeout = () => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  };

  // Set a timeout to prevent infinite loading
  const setLoadingWithTimeout = (isLoading: boolean) => {
    if (!isLoading) {
      clearLoadingTimeout();
      setLoading(false);
      return;
    }

    // Set loading to true immediately
    setLoading(true);
    
    // Set a timeout to force loading to false after 10 seconds
    clearLoadingTimeout();
    loadingTimeoutRef.current = setTimeout(() => {
      console.warn('Auth loading timeout - forcing loading to false');
      setLoading(false);
    }, 10000); // 10 seconds timeout
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    let mounted = true;
    setLoadingWithTimeout(true); // Start with loading true and set timeout
    
    console.log('AuthProvider initializing...');
    
    // First, check for existing session
    supabase.auth.getSession().then(async ({ data: { session: initialSession }, error }) => {
      console.log('Initial session check result:', { initialSession, error });
      
      if (!mounted) return;
      
      if (error) {
        console.error('Error getting initial session:', error);
        // Clear any potentially corrupted session
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoadingWithTimeout(false);
        return;
      }
      
      if (initialSession?.user) {
        console.log('Found existing session, setting user and session');
        setSession(initialSession);
        setUser(initialSession.user);
        
        // Fetch user profile
        try {
          console.log('Fetching profile for user:', initialSession.user.id);
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', initialSession.user.id)
            .maybeSingle();
          
          console.log('Profile fetch result:', { profileData, profileError });
          if (profileError) {
            console.error('Error fetching profile:', profileError);
          }
          
          if (mounted) {
            setProfile(profileData || null);
          }
        } catch (profileFetchError) {
          console.error('Error fetching profile:', profileFetchError);
          if (mounted) {
            setProfile(null);
          }
        } finally {
          if (mounted) {
            setLoadingWithTimeout(false);
          }
        }
      } else {
        console.log('No valid session found');
        setSession(null);
        setUser(null);
        setProfile(null);
        if (mounted) {
          setLoadingWithTimeout(false);
        }
      }
    }).catch(err => {
      console.error('Error in initial session check:', err);
      if (mounted) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoadingWithTimeout(false);
      }
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', { event, session });
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile when session changes
          try {
            console.log('Fetching profile for user:', session.user.id);
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            console.log('Profile fetch result:', { profileData, error, userId: session.user.id });
            if (error) {
              console.error('Error fetching profile:', error);
            }
            
            if (mounted) {
              setProfile(profileData || null);
            }
          } catch (error) {
            console.error('Error fetching profile:', error);
            if (mounted) {
              setProfile(null);
            }
          }
        } else {
          if (mounted) {
            setProfile(null);
          }
        }
      }
    );

    return () => {
      mounted = false;
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
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      } else {
        console.log("Sign out successful");
        // Explicitly clear state
        setUser(null);
        setSession(null);
        setProfile(null);
      }
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Sign out failed",
        description: "An unexpected error occurred during sign out",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Expose a method to force refresh the auth state
  const refreshAuthState = async () => {
    console.log("Refreshing auth state");
    setLoadingWithTimeout(true);
    
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error refreshing session:", error);
        setUser(null);
        setSession(null);
        setProfile(null);
      } else {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Fetch user profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', currentSession.user.id)
            .maybeSingle();
          
          if (profileError) {
            console.error('Error fetching profile:', profileError);
            setProfile(null);
          } else {
            setProfile(profileData || null);
          }
        } else {
          setProfile(null);
        }
      }
    } catch (error) {
      console.error("Error refreshing auth state:", error);
      setUser(null);
      setSession(null);
      setProfile(null);
    } finally {
      setLoadingWithTimeout(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      // Note: refreshAuthState is not exposed in the context type for backward compatibility
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