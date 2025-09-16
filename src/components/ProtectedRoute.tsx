import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'admin';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  console.log('ProtectedRoute check:', { user: !!user, profile, loading, requiredRole });

  // Add a timeout to prevent infinite loading
  if (loading) {
    // Log a warning if loading takes too long
    setTimeout(() => {
      if (loading) {
        console.warn('ProtectedRoute: Still loading after 5 seconds. This might indicate an issue.');
      }
    }, 5000);

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading authentication...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('No user, redirecting to login');
    // Redirect to appropriate login based on required role
    if (requiredRole === 'admin') {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/student/login" replace />;
  }

  if (requiredRole && profile?.role !== requiredRole) {
    console.log('Role mismatch:', { requiredRole, profileRole: profile?.role, profile });
    // Redirect to appropriate login if role doesn't match
    if (requiredRole === 'admin') {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/student/login" replace />;
  }

  console.log('Access granted for:', { role: profile?.role, requiredRole });
  return <>{children}</>;
}