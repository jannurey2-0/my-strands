import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import TestErrorComponent from "./components/TestErrorComponent";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Assessment from "./pages/Assessment";
import Results from "./pages/Results";
import Careers from "./pages/Careers";
import Schools from "./pages/Schools";
import StudentAuth from "./pages/StudentAuth";
import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import TestAssessment from "./pages/TestAssessment";
import DatabaseTest from "./pages/DatabaseTest";
import AuthDebug from "./pages/AuthDebug";
import Profile from "./pages/Profile";
import { ScrollToTopOnNavigate } from "./components/ScrollToTopOnNavigate";

// Debug component to log current route
const RouteDebugger = () => {
  const location = useLocation();
  console.log('Current route:', location.pathname);
  return null;
};

const queryClient = new QueryClient();

// Wrapper component to provide navigation context to AuthProvider
const AppContent = () => (
  <AuthProvider>
    {import.meta.env.DEV && <RouteDebugger />}
    <ScrollToTopOnNavigate />
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/" element={
          <ErrorBoundary>
            <Index />
          </ErrorBoundary>
        } />
        <Route path="/student/login" element={
          <ErrorBoundary>
            <StudentAuth />
          </ErrorBoundary>
        } />
        <Route path="/admin/login" element={
          <ErrorBoundary>
            <AdminAuth />
          </ErrorBoundary>
        } />
        <Route 
          path="/dashboard" 
          element={
            <ErrorBoundary>
              <ProtectedRoute requiredRole="student">
                <Dashboard />
              </ProtectedRoute>
            </ErrorBoundary>
          } 
        />
        <Route 
          path="/assessment" 
          element={
            <ErrorBoundary>
              <ProtectedRoute requiredRole="student">
                <Assessment />
              </ProtectedRoute>
            </ErrorBoundary>
          } 
        />
        <Route 
          path="/results" 
          element={
            <ErrorBoundary>
              <ProtectedRoute requiredRole="student">
                <Results />
              </ProtectedRoute>
            </ErrorBoundary>
          } 
        />
        <Route path="/careers" element={
          <ErrorBoundary>
            <Careers />
          </ErrorBoundary>
        } />
        <Route path="/schools" element={
          <ErrorBoundary>
            <Schools />
          </ErrorBoundary>
        } />
        <Route 
          path="/admin/dashboard" 
          element={
            <ErrorBoundary>
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            </ErrorBoundary>
          } 
        />
        <Route 
          path="/test-assessment" 
          element={
            <ErrorBoundary>
              <ProtectedRoute requiredRole="student">
                <TestAssessment />
              </ProtectedRoute>
            </ErrorBoundary>
          } 
        />
        <Route 
          path="/database-test" 
          element={
            <ErrorBoundary>
              <ProtectedRoute requiredRole="student">
                <DatabaseTest />
              </ProtectedRoute>
            </ErrorBoundary>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ErrorBoundary>
              <ProtectedRoute requiredRole="student">
                <Profile />
              </ProtectedRoute>
            </ErrorBoundary>
          } 
        />
        <Route 
          path="/auth-debug" 
          element={
            <ErrorBoundary>
              <ProtectedRoute requiredRole="student">
                <AuthDebug />
              </ProtectedRoute>
            </ErrorBoundary>
          } 
        />
        <Route path="/test-error" element={
          <ErrorBoundary>
            <TestErrorComponent />
          </ErrorBoundary>
        } />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={
          <ErrorBoundary>
            <NotFound />
          </ErrorBoundary>
        } />
      </Routes>
    </TooltipProvider>
  </AuthProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <div className="pt-header">
        <AppContent />
      </div>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;