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

// AuthProvider.js
import React, { createContext, useState, useEffect, useContext } from "react";
import { auth } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children, requireAuth = true }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
            
            // Only handle redirects if authentication is required
            if (requireAuth && !currentUser && !loading) {
                // Check if current route is a booking page - don't redirect from booking pages
                const isBookingPage = location.pathname.includes('/book');
                const isPublicRoute = location.pathname === '/' || 
                                     location.pathname === '/signin' || 
                                     location.pathname === '/features' ||
                                     location.pathname === '/contact';
                
                // Only redirect if not on a public route and not on booking page
                if (!isBookingPage && !isPublicRoute) {
                    console.log("Redirecting to signin from:", location.pathname);
                    navigate('/signin');
                }
            }
        });

        return () => unsubscribe();
    }, [requireAuth, loading, navigate, location]);

    // If no authentication required, show children regardless of auth state
    if (!requireAuth) {
        return (
            <AuthContext.Provider value={{ user, loading }}>
                {children}
            </AuthContext.Provider>
        );
    }

    // Show loading state
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);