import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';
import Form from './Pages/Form';
import { useState } from 'react';
import SignInSignUp from './Pages/SignInSignUp';
import Dashboard from "./Pages/Dashboard";
import NavigationBar from "./Components/NavigationBar";
import Footer from "./Components/Footer";


import { setPersistence, browserLocalPersistence } from "firebase/auth";
import { auth } from "../src/firebaseConfig";
import { AuthProvider } from "./AuthProvider";
import Rota from "./Pages/StaffSchedule";
import StaffSchedule from "./Pages/StaffSchedule";
import ContactPage from "./Pages/ContactPage";
import FeaturesPage from "./Pages/FeaturesPage";
import ComingSoon from "./Pages/ComingSoon";
import MetricsPage from "./Pages/MetricsPage";
import LandingPage from "./Pages/LandingPage";
import AppointmentScheduler from "./Pages/AppointmentScheduler";
import ScrollToTopWrapper from "./Components/ScrollToTopWrapper";
import BookingPage from "./Pages/BookingPage";
import BookingPageFallback from "./Pages/BookingPageFallback";



function App() {

  // Set auth persistence globally (run this once, e.g., in your main app file)
  setPersistence(auth, browserLocalPersistence)
  .then(() => {
      console.log("Auth persistence set to local.");
  })
  .catch((error) => {
      console.error("Error setting auth persistence:", error);
  });
  const [username, setUsername] = useState(""); // Store the username

  const [isAuthenticated, setAuthenticated] = useState(false); // Manage auth state


  return (
    <Router basename="/">
      <ScrollToTopWrapper>
        <NavigationBar isAuthenticated={isAuthenticated} setAuthenticated={setAuthenticated} />
        <AuthProvider>
          <Routes>
              <Route path="/" element={<LandingPage/>} />
              <Route path="/signin" element={<SignInSignUp setUsername={setUsername}  />} />
              <Route path="/dashboard/metrics" element={<MetricsPage />} />
              <Route path="/dashboard" element={<Dashboard username={username} />} /> 
              <Route path="/timesheet" element={<Form />} />
              <Route path="/contact" element={<ContactPage />} />   
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/coming" element={<ComingSoon />} />
              // In your App.js or routing file
              <Route path="/dashboard/appointments" element={<AppointmentScheduler />} />

              {/* Booking Routes - Critical for external access */}
              <Route path="/book/:userId" element={<BookingPage />} />
              <Route path="/book" element={<BookingPageFallback />} /> {/* Add fallback */}
              {/* <Route path="/rota" element={<StaffSchedule/>} /> */}

        
            

          </Routes>
        </AuthProvider>
        <Footer />

        </ScrollToTopWrapper>
      
    </Router>

  );
}

export default App;
