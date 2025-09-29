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
        console.log("Creating profile for user:", user.id);

        const { data, error } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            email: user.email!,
            full_name: user.email!.split("@")[0],
            role: "student"
          })
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

        console.log("Profile created:", data);
        return data as Profile;
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
          console.log(
            `Fetching profile for user ${userId}, attempt ${attempt}/${MAX_RETRIES}`
          );

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
            .eq("user_id", userId)
            .single()
            .then(async ({ data, error }) => {
              if (error) {
                console.error("Supabase error fetching profile:", error);

                if (error.code === "PGRST116") {
                  console.log("Profile not found, creating...");
                  return await createProfile(user);
                }
                throw error;
              }
              return data as Profile;
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

      const profile = await fetchWithTimeout(1);
      safeSetAuthState({ profile, loading: false });
      return profile;
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
          safeSetAuthState({ session, user: session.user });
          fetchProfile(session.user.id, session.user).catch((err) => {
            console.error("Profile fetch error during init:", err);
            safeSetAuthState({ loading: false });
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
        console.log("Auth state change:", { event, session });

        safeSetAuthState({
          session,
          user: session?.user ?? null
        });

        if (session?.user) {
          fetchProfile(session.user.id, session.user).catch((err) => {
            console.error("Profile fetch error:", err);
            safeSetAuthState({ loading: false });
          });
        } else {
          safeSetAuthState({ profile: null, loading: false });
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
    const redirectUrl = `${window.location.origin}/auth/callback`; // customize

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName }
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
        description: "We've sent you a confirmation link."
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
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
        safeSetAuthState({ user: null, session: null, profile: null });
      } else {
        safeSetAuthState({
          session,
          user: session?.user ?? null
        });

        if (session?.user) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", session.user.id)
            .maybeSingle();

          safeSetAuthState({ profile: profileData || null });
        } else {
          safeSetAuthState({ profile: null });
        }
      }
    } catch (err) {
      console.error("Error refreshing auth state:", err);
      safeSetAuthState({ user: null, session: null, profile: null });
    } finally {
      safeSetAuthState({ loading: false });
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
