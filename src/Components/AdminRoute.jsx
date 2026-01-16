import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Spinner, Alert } from "react-bootstrap";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import app from "../firebaseConfig";

const auth = getAuth(app);
const db = getFirestore(app);

const AdminRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const user = auth.currentUser;
        
        if (!user) {
          setError("You must be logged in to access this page");
          setLoading(false);
          return;
        }

        // Check if user is in admin_users collection
        const adminDoc = await getDoc(doc(db, "admin_users", user.uid));
        
        if (!adminDoc.exists()) {
          setError("You are not authorized to access the admin panel");
          setLoading(false);
          return;
        }

        const adminData = adminDoc.data();
        
        // Check if admin is approved
        if (!adminData.approved) {
          setError("Your admin account is pending approval");
          setLoading(false);
          return;
        }

        // Check if admin is active
        if (!adminData.isActive) {
          setError("Your admin account is deactivated");
          setLoading(false);
          return;
        }

        setIsAdmin(true);
        setLoading(false);
      } catch (error) {
        console.error("Admin check error:", error);
        setError("Error verifying admin access");
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Verifying admin access...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <Alert variant="danger">
          <Alert.Heading>Access Denied</Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Alert.Link href="/dashboard">Go to Dashboard</Alert.Link>
          </div>
        </Alert>
      </div>
    );
  }

  return isAdmin ? children : <Navigate to="/dashboard" />;
};

export default AdminRoute;