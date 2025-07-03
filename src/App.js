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
    <Router>
      <NavigationBar isAuthenticated={isAuthenticated} setAuthenticated={setAuthenticated} />
      <AuthProvider>
        <Routes>
          <Route path="/" element={<SignInSignUp setUsername={setUsername}  />} /> 
          <Route path="/dashboard" element={<Dashboard username={username} />} /> 
          <Route path="/timesheet" element={<Form />} />
          {/* <Route path="/rota" element={<StaffSchedule/>} /> */}

        </Routes>
      </AuthProvider>
      <Footer />
    </Router>

  );
}

export default App;
