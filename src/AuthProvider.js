// // AuthProvider.js
// import React, { createContext, useState, useEffect, useContext } from "react";
// import { auth } from "./firebaseConfig";
// import { onAuthStateChanged } from "firebase/auth";

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(null);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//             setUser(currentUser);
//             setLoading(false);
//         });

//         return () => unsubscribe();
//     }, []);

//     return (
//         <AuthContext.Provider value={{ user, loading }}>
//             {!loading && children}
//         </AuthContext.Provider>
//     );
// };

// export const useAuth = () => useContext(AuthContext);

// In your AuthProvider component
const AuthProvider = ({ children, requireAuth = true }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      // Only redirect if authentication is required
      if (requireAuth && !user && !loading) {
        // Don't redirect from booking pages
        const isBookingPage = window.location.pathname.includes('/book');
        if (!isBookingPage) {
          navigate('/signin');
        }
      }
    });

    return () => unsubscribe();
  }, [requireAuth]);

  if (loading) {
    return <div>Loading...</div>;
  }

  // If no auth required, show children regardless of auth state
  if (!requireAuth) {
    return children;
  }

  // If auth required, only show children when user is authenticated
  return user ? children : <Navigate to="/signin" replace />;
};