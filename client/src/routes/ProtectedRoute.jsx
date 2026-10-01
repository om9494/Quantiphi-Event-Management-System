import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Wraps routes that require a logged-in user.
// Redirects to /login, preserving the attempted URL so we can redirect back.
const ProtectedRoute = ({ children }) => {
  const { isAuth, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-500 text-sm">Loading…</span>
      </div>
    );
  }

  return isAuth ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

export default ProtectedRoute;
