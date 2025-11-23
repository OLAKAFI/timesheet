import React from 'react';
import { AuthProvider } from '../AuthProvider';

// This wrapper allows booking page to work without requiring login
const PublicBookingWrapper = ({ children }) => {
  return (
    <AuthProvider requireAuth={false}>
      {children}
    </AuthProvider>
  );
};

export default PublicBookingWrapper;