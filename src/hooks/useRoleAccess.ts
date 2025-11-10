import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useNavigate } from 'react-router-dom';

export function useRoleAccess() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is an admin trying to access a student-only route
    if (user && profile?.role === 'admin') {
      // Check current path
      const currentPath = window.location.pathname;
      
      // Define student-only routes
      const studentOnlyRoutes = [
        '/student/login',
        '/assessment',
        '/results',
        '/dashboard',
        '/profile'
      ];
      
      // If admin is on a student-only route, show warning and redirect
      if (studentOnlyRoutes.some(route => currentPath.startsWith(route))) {
        toast({
          title: "Admin Access Notice",
          description: "This feature is designed for students. Redirecting to admin dashboard.",
          variant: "default"
        });
        
        // Redirect to admin dashboard
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [user, profile, toast, navigate]);

  return { user, profile };
}