import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
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



// function App() {

//   // Set auth persistence globally (run this once, e.g., in your main app file)
//   setPersistence(auth, browserLocalPersistence)
//   .then(() => {
//       console.log("Auth persistence set to local.");
//   })
//   .catch((error) => {
//       console.error("Error setting auth persistence:", error);
//   });
//   const [username, setUsername] = useState(""); // Store the username

//   const [isAuthenticated, setAuthenticated] = useState(false); // Manage auth state


//   return (
//     <Router >
//       <ScrollToTopWrapper>
//         <NavigationBar isAuthenticated={isAuthenticated} setAuthenticated={setAuthenticated} />
//         {/* Public Routes - Outside AuthProvider */}
//         <Routes>
//           <Route path="/book/:userId" element={<BookingPage />} />
//           <Route path="/book" element={<BookingPageFallback />} />
//           <Route path="/" element={<LandingPage />} />
//           <Route path="/features" element={<FeaturesPage />} />
//           <Route path="/contact" element={<ContactPage />} />
//         </Routes>

//         {/* Protected Routes - Inside AuthProvider */}
//         <AuthProvider requireAuth={true}>
//           <Routes>
//             <Route path="/signin" element={<SignInSignUp setUsername={setUsername} />} />
//             <Route path="/dashboard" element={<Dashboard username={username} />} />
//             <Route path="/dashboard/metrics" element={<MetricsPage />} />
//             <Route path="/dashboard/appointments" element={<AppointmentScheduler />} />
//             <Route path="/timesheet" element={<Form />} />
//             <Route path="/coming" element={<ComingSoon />} />
//           </Routes>
//         </AuthProvider>
        
//         <Footer />
//       </ScrollToTopWrapper>
      
//     </Router>

//   );
// }

// export default App;

function App() {
  const [username, setUsername] = useState('');

  return (
    <Router>
      {/* Public Routes - Outside AuthProvider */}
      <Routes>
              {/* PUBLIC ROUTES - NO AuthProvider AT ALL */}
              <Route path="/book/:userId" element={<BookingPage />} />
              <Route path="/book" element={<BookingPageFallback />} />
              
              {/* OTHER PUBLIC ROUTES */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/contact" element={<ContactPage />} />
              
              {/* PROTECTED ROUTES - Inside AuthProvider */}
              <Route path="/signin" element={
                <AuthProvider requireAuth={false}>
                  <SignInSignUp setUsername={setUsername} />
                </AuthProvider>
              } />
              
              {/* All other routes that need auth */}
              <Route path="/dashboard/*" element={
                <AuthProvider>
                  <Dashboard username={username} />
                </AuthProvider>
              } />
              <Route path="/dashboard/metrics" element={
                <AuthProvider>
                  <MetricsPage />
                </AuthProvider>
              } />
              <Route path="/dashboard/appointments" element={
                <AuthProvider>
                  <AppointmentScheduler />
                </AuthProvider>
              } />
              <Route path="/timesheet" element={
                <AuthProvider>
                  <Form />
                </AuthProvider>
              } />
              <Route path="/coming" element={
                <AuthProvider>
                  <ComingSoon />
                </AuthProvider>
              } />
      </Routes>
      
      <Footer />
    </Router>
  );
}

export default App;