import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'admin';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading, refreshAuthState } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const profileTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  console.log('ProtectedRoute check:', { user: !!user, profile, loading, requiredRole });

  // Track when we're waiting for profile to load
  useEffect(() => {
    if (user && !profile && !loading) {
      setProfileLoading(true);
      setProfileError(false);
      
      // Set a timeout to prevent infinite waiting
      if (profileTimeoutRef.current) {
        clearTimeout(profileTimeoutRef.current);
      }
      
      profileTimeoutRef.current = setTimeout(() => {
        console.warn('Profile loading timeout - allowing access but showing warning');
        setProfileLoading(false);
        setProfileError(true);
        
        // Try to refresh auth state as a fallback
        refreshAuthState();
      }, 15000); // 15 seconds timeout
      
      return () => {
        if (profileTimeoutRef.current) {
          clearTimeout(profileTimeoutRef.current);
        }
      };
    } else {
      setProfileLoading(false);
      setProfileError(false);
      
      if (profileTimeoutRef.current) {
        clearTimeout(profileTimeoutRef.current);
      }
    }
  }, [user, profile, loading, refreshAuthState]);

  // Set up loading timeout warning
  useEffect(() => {
    if (loading) {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      loadingTimeoutRef.current = setTimeout(() => {
        if (loading) {
          console.warn('ProtectedRoute: Still loading after 5 seconds. This might indicate an issue.');
        }
      }, 5000);
    }
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loading]);

  // While loading, show a loading spinner - this prevents premature redirects
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading authentication...</span>
        </div>
      </div>
    );
  }

  // If no user, redirect to appropriate login
  if (!user) {
    console.log('No user, redirecting to login');
    // Redirect to appropriate login based on required role
    if (requiredRole === 'admin') {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/student/login" replace />;
  }

  // If user exists but profile is still loading, show loading state
  // This prevents redirecting to login when profile is still being fetched
  if (user && !profile && profileLoading) {
    console.log('User exists but profile is null, waiting for profile to load');
    // Show loading while we wait for profile to load
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  // If a role is required and profile is loaded but role doesn't match, redirect to appropriate login
  if (requiredRole && profile?.role !== requiredRole) {
    console.log('Role mismatch:', { requiredRole, profileRole: profile?.role, profile });
    // Redirect to appropriate login if role doesn't match
    if (requiredRole === 'admin') {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/student/login" replace />;
  }

  // If a role is required but profile is not loaded yet, allow access temporarily
  // This prevents blocking access while profile is loading
  if (requiredRole && !profile) {
    console.log('Role required but profile not loaded yet, allowing temporary access');
    // Show a warning if there was a profile error
    if (profileError) {
      console.warn('Allowing access despite profile loading error');
    }
  }

  console.log('Access granted for:', { role: profile?.role, requiredRole });
  return <>{children}</>;
}