// src/components/ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, isAdmin, adminOnly = false }) => {
  const session = sessionStorage.getItem('admin_session');
  const userSession = JSON.parse(session || '{}');

  // Check if admin route requires admin privileges
  if (adminOnly) {
    if (!isAdmin || !userSession.isAdmin || userSession.expiry < Date.now()) {
      return <Navigate to="/admin" replace />;
    }
    return children;
  }

  // Regular protected route - just check if user is authenticated
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user || !user.uid) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;