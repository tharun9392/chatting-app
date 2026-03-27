import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  
  // Check if user is authenticated
  if (!isAuthenticated) {
    // Redirect to login page with the return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check for role-based access (admin)
  if (requiredRole === 'admin' && !user?.isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  // User is authenticated and has the required role, render the component
  return <>{children}</>;
};

export default ProtectedRoute; 