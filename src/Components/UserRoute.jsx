import React from 'react';
import { Navigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';

const UserRoute = ({ children }) => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    return <Navigate to="/" />;
  }
  
  return children;
};

export default UserRoute;