import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';
import Form from './Pages/Form';
import { useState } from 'react';
import SignInSignUp from './Pages/SignInSignUp';
import Dashboard from "./Pages/Dashboard";
import NavigationBar from "./Components/NavigationBar";
import Footer from "./Components/Footer";

function App() {
  const [username, setUsername] = useState(""); // Store the username

  const [isAuthenticated, setAuthenticated] = useState(false); // Manage auth state


  return (
    <Router>
      <NavigationBar isAuthenticated={isAuthenticated} setAuthenticated={setAuthenticated} />
      <Routes>
        <Route path="/" element={<SignInSignUp setUsername={setUsername}  />} /> 
        <Route path="/dashboard" element={<Dashboard username={username} />} /> 
        <Route path="/form" element={<Form />} />

      </Routes>
      <Footer />
    </Router>

  );
}

export default App;
