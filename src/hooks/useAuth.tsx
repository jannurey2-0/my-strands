import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { clearAuthStorage } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

// ---- Types ----
interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: "student" | "admin";
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
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: Error | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
}

// ---- Email Validation ----
const validateEmail = (email: string): { isValid: boolean; message: string } => {
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: "Please enter a valid email address." };
  }

  // Check for common disposable email domains
  const disposableDomains = [
    'mail.com', 'mail.ru', '10minutemail.com', 'guerrillamail.com', 
    'tempmail.org', 'throwawaymail.com', 'mailinator.com', 'yopmail.com',
    'temp-mail.org', 'disposablemail.com', 'trashmail.com', 'fakeinbox.com'
  ];

  const [localPart, domain] = email.split('@');
  const lowerDomain = domain.toLowerCase();
  
  if (disposableDomains.includes(lowerDomain)) {
    return { isValid: false, message: "Please use a valid institutional or personal email address." };
  }

  // Enhanced validation for common email providers
  if (['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(lowerDomain)) {
    // Check if local part is too short
    if (localPart.length < 3) {
      return { isValid: false, message: "Email address appears to be invalid." };
    }

    // Check for too many repeated characters
    const repeatedCharPattern = /(.)\1{2,}/;
    if (repeatedCharPattern.test(localPart)) {
      return { isValid: false, message: "Email address appears to be invalid." };
    }

    // Check for obviously fake patterns
    const fakePatterns = [
      'asdf', 'qwer', 'zxcv', 'test', 'dummy', 'fake', 'example', 'dfandfanda',
      'aaaa', '1234', 'abcd', 'qwerty', 'fawefdsdsdwwaaf'
    ];

    const lowerLocalPart = localPart.toLowerCase();
    if (fakePatterns.some(pattern => lowerLocalPart.includes(pattern))) {
      return { isValid: false, message: "Please use a real email address." };
    }

    // Check for random character sequences (more than 5 consecutive consonants or vowels)
    const consonantCluster = /[bcdfghjklmnpqrstvwxyz]{6,}/i;
    const vowelCluster = /[aeiou]{4,}/i;
    
    if (consonantCluster.test(localPart) || vowelCluster.test(localPart)) {
      return { isValid: false, message: "Email address appears to be invalid." };
    }

    // Check if it looks like a real name pattern (firstname.lastname or similar)
    const validPattern = /^[a-zA-Z]+([._-][a-zA-Z]+)*$/;
    if (!validPattern.test(localPart)) {
      // Allow some common patterns even if they don't match the strict pattern
      const allowedPatterns = [
        /\d+[a-zA-Z]/, // Numbers followed by letters (like 2023john)
        /[a-zA-Z]+\d+/, // Letters followed by numbers (like john123)
      ];
      
      const isAllowedPattern = allowedPatterns.some(pattern => pattern.test(localPart));
      if (!isAllowedPattern) {
        return { isValid: false, message: "Email address appears to be invalid." };
      }
    }
  }

  return { isValid: true, message: "" };
};

// ---- Password Validation ----
const validatePassword = (password: string): { isValid: boolean; message: string } => {
  // Check if password is empty or only whitespace
  if (!password || !password.trim()) {
    return { isValid: false, message: "Password cannot be empty or contain only spaces." };
  }

  // Check minimum length
  if (password.length < 6) {
    return { isValid: false, message: "Password must be at least 6 characters long." };
  }

  // Check if password is all whitespace
  if (password.trim().length === 0) {
    return { isValid: false, message: "Password cannot contain only spaces." };
  }

  return { isValid: true, message: "" };
};

// ---- Context ----
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true
  });

  const { toast } = useToast();
  const navigate = useNavigate();
  const initialized = useRef(false);
  const mounted = useRef(true);

  // Safe state update
  const safeSetAuthState = useCallback(
    (update: Partial<AuthState>) => {
      if (mounted.current) {
        setAuthState((curr) => ({ ...curr, ...update }));
      }
    },
    []
  );

  // ---- Create Profile ----
  const createProfile = useCallback(
    async (user: User): Promise<Profile | null> => {
      try {
        // Only log in development environment
        if (import.meta.env.DEV) {
          console.log("Creating profile for user:", user.id);
        }

        const { data, error } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            email: user.email!,
            full_name: user.email!.split("@")[0],
            role: "student" as any
          } as any)
          .select("*")
          .single();

        if (error) {
          console.error("Error creating profile:", error);
          toast({
            title: "Profile creation failed",
            description: error.message,
            variant: "destructive"
          });
          return null;
        }

        // Only log in development environment
        if (import.meta.env.DEV) {
          console.log("Profile created:", data ? 'Data present' : 'No data');
        }
        return data as any as Profile;
      } catch (err: any) {
        console.error("Unexpected error creating profile:", err);
        toast({
          title: "Profile creation failed",
          description: err.message ?? "Unexpected error",
          variant: "destructive"
        });
        return null;
      }
    },
    [toast]
  );

  // ---- Fetch Profile with retry ----
  const fetchProfile = useCallback(
    async (userId: string, user: User): Promise<Profile | null> => {
      const MAX_RETRIES = 2;
      const TIMEOUT_MS = 5000;
      const RETRY_DELAY_MS = 1000;

      const fetchWithTimeout = async (attempt: number): Promise<Profile | null> => {
        try {
          // Only log in development environment
          if (import.meta.env.DEV) {
            console.log(
              `Fetching profile for user ${userId}, attempt ${attempt}/${MAX_RETRIES}`
            );
          }

          const timeoutPromise = new Promise<null>((_, reject) => {
            setTimeout(() => {
              reject(
                new Error(
                  `Profile fetch timeout after ${
                    TIMEOUT_MS / 1000
                  }s (attempt ${attempt})`
                )
              );
            }, TIMEOUT_MS);
          });

          const fetchPromise = supabase
            .from("profiles")
            .select("*")
            .eq("user_id", userId as any)
            .single()
            .then(async ({ data, error }) => {
              if (error) {
                console.error("Supabase error fetching profile:", error);

                if (error.code === "PGRST116") {
                  // Only log in development environment
                  if (import.meta.env.DEV) {
                    console.log("Profile not found, creating...");
                  }
                  return await createProfile(user);
                }
                throw error;
              }
              return data as any as Profile;
            });

          return await Promise.race([fetchPromise, timeoutPromise]);
        } catch (error) {
          console.error(
            `Profile fetch attempt ${attempt}/${MAX_RETRIES} failed:`,
            error
          );

          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
            return fetchWithTimeout(attempt + 1);
          }
          return null;
        }
      };

      try {
        const profile = await fetchWithTimeout(1);
        safeSetAuthState({ profile, loading: false });
        return profile;
      } catch (error) {
        console.error("Profile fetch failed after all retries:", error);
        // Even if profile fetch fails, we should not block the authentication flow
        safeSetAuthState({ loading: false });
        return null;
      }
    },
    [safeSetAuthState, createProfile]
  );

  // ---- Init Effect ----
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    console.log("AuthProvider initializing...");

    const initializeSession = async () => {
      try {
        const {
          data: { session },
          error
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          await supabase.auth.signOut();
          safeSetAuthState({
            session: null,
            user: null,
            profile: null,
            loading: false
          });
          return;
        }

        if (session?.user) {
          // Only log in development environment
          if (import.meta.env.DEV) {
            console.log("User authenticated:", session.user.id);
          }
          safeSetAuthState({ session, user: session.user, loading: false });
          
          // Fetch profile in background without blocking
          fetchProfile(session.user.id, session.user).catch((err) => {
            console.error("Profile fetch error during init:", err);
            // Don't set loading to false here as it's already false
          });
        } else {
          safeSetAuthState({
            session: null,
            user: null,
            profile: null,
            loading: false
          });
        }
      } catch (err) {
        console.error("Error in initial session check:", err);
        safeSetAuthState({
          session: null,
          user: null,
          profile: null,
          loading: false
        });
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only log in development environment
        if (import.meta.env.DEV) {
          console.log("Auth state change:", { event, session: session ? 'Session present' : 'No session' });
        }

        safeSetAuthState({
          session,
          user: session?.user ?? null,
          loading: false // Always set loading to false on auth state change
        });

        if (session?.user) {
          // Fetch profile in background without blocking
          fetchProfile(session.user.id, session.user).catch((err) => {
            console.error("Profile fetch error:", err);
            // Don't set loading to false here as it's already false
          });
        } else {
          safeSetAuthState({ profile: null });
        }
      }
    );

    initializeSession();

    return () => {
      mounted.current = false;
      listener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // ---- Auth Actions ----
  const signUp = async (email: string, password: string, fullName: string) => {
    // Validate email before proceeding
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      toast({
        title: "Invalid Email",
        description: emailValidation.message,
        variant: "destructive"
      });
      return { error: new Error(emailValidation.message) };
    }

    // Validate password before proceeding
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      toast({
        title: "Invalid Password",
        description: passwordValidation.message,
        variant: "destructive"
      });
      return { error: new Error(passwordValidation.message) };
    }

    // Ensure we're using the correct redirect URL for auth callback
    const redirectUrl = `${window.location.origin}/auth/callback`;
    console.log("Using redirect URL for signup:", redirectUrl);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName }
      }
    });

    if (error) {
      console.error("Signup error:", error);
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link to complete your registration."
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Validate password before proceeding
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      toast({
        title: "Invalid Password",
        description: passwordValidation.message,
        variant: "destructive"
      });
      return { error: new Error(passwordValidation.message) };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive"
      });
    }

    return { error };
  };

  const signOut = async () => {
    try {
      safeSetAuthState({
        user: null,
        session: null,
        profile: null,
        loading: false
      });

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn("Supabase sign out warning:", error);
      }

      clearAuthStorage();
    } catch (err) {
      console.error("Sign out error:", err);
      toast({
        title: "Sign out failed",
        description: "Unexpected error during sign out",
        variant: "destructive"
      });
    }
  };

  const refreshAuthState = async () => {
    safeSetAuthState({ loading: true });

    try {
      const {
        data: { session },
        error
      } = await supabase.auth.getSession();

      if (error) {
        safeSetAuthState({ user: null, session: null, profile: null, loading: false });
      } else {
        safeSetAuthState({
          session,
          user: session?.user ?? null,
          loading: false
        });

        if (session?.user) {
          // Fetch profile in background without blocking using the existing fetchProfile function
          fetchProfile(session.user.id, session.user).catch((err) => {
            console.error("Profile fetch error during refresh:", err);
            // Don't set loading to false here as it's already false
          });
        } else {
          safeSetAuthState({ profile: null });
        }
      }
    } catch (err) {
      console.error("Error refreshing auth state:", err);
      // Ensure loading state is always reset even on error
      safeSetAuthState({ user: null, session: null, profile: null, loading: false });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        signUp,
        signIn,
        signOut,
        refreshAuthState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}