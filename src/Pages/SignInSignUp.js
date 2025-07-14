import React, { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Button, Container, Form, Row, Col, Card } from "react-bootstrap";
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import app from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { updateProfile } from "firebase/auth";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const SignInSignUp = ({ setUsername }) => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setLocalUsername] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      setUser(user);
      setUsername(user.displayName);
      navigate("/dashboard", { 
        state: { 
          user: { 
            email: user.email, 
            displayName: user.displayName || user.email, 
            uid: user.uid 
          } 
        } 
      });
    } catch (error) {
      console.error("Google Sign-In Error:", error.message);
      setError(error.message);
    }
  };

  // FIXED: Email/password authentication
  const handleEmailPasswordAuth = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    
    // Validation
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    
    if (isSignUp && !username) {
      setError("Please enter a username");
      return;
    }
    
    try {
      let userCredential;
      
      if (isSignUp) {
        // Create new user
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Update profile with username
        await updateProfile(userCredential.user, {
          displayName: username
        });
      } else {
        // Sign in existing user
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      
      const user = userCredential.user;
      setUsername(user.displayName || user.email);
      navigate("/dashboard", { 
        state: { 
          user: { 
            email: user.email, 
            displayName: user.displayName || user.email, 
            uid: user.uid 
          } 
        } 
      });
      
    } catch (error) {
      console.error("Authentication Error:", error);
      
      // User-friendly error messages
      switch (error.code) {
        case "auth/email-already-in-use":
          setError("Email already in use. Please sign in instead.");
          break;
        case "auth/invalid-email":
          setError("Please enter a valid email address");
          break;
        case "auth/weak-password":
          setError("Password should be at least 6 characters");
          break;
        case "auth/user-not-found":
          setError("No account found with this email");
          break;
        case "auth/wrong-password":
          setError("Incorrect password");
          break;
        case "auth/too-many-requests":
          setError("Too many attempts. Try again later");
          break;
        default:
          setError("Authentication failed. Please try again.");
      }
    }
  };

  return (
    <Container fluid className="p-0 min-vh-100">
      <Row className="g-0 h-100">
        {/* Left Side - Brand Showcase */}
        <Col 
          md={6} 
          className="d-none d-md-flex align-items-center justify-content-center p-5"
          style={{
            background: 'linear-gradient(135deg, #006D7D 0%, #5E7CE2 100%)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Animated background elements */}
          <div 
            style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }}
          ></div>
          <div 
            style={{
              position: 'absolute',
              bottom: '20%',
              left: '10%',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
            }}
          ></div>
          
          <div className="text-center text-white position-relative z-1" style={{ maxWidth: '500px' }}>
            <h1 
              className="display-4 fw-bold mb-4"
              style={{ fontFamily: "'Segoe UI', 'Roboto', sans-serif" }}
            >
              ShiftRoom
            </h1>
            <p className="fs-3 mb-4">Track. Calculate. Optimize.</p>
            <div className="mt-5 pt-3">
              {[
                { icon: '⏱️', text: 'Track working hours with precision' },
                { icon: '💰', text: 'Calculate earnings instantly' },
                { icon: '📊', text: 'Analyze your work patterns' }
              ].map((item, index) => (
                <div key={index} className="d-flex align-items-center mb-3">
                  <div className="fs-2 me-3">{item.icon}</div>
                  <p className="mb-0 fs-5">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </Col>

        {/* Right Side - Form */}
                <Col 
          md={6} 
          className="d-flex align-items-center justify-content-center p-4 p-md-5"
          style={{ backgroundColor: '#f8fafc' }}
        >
          <div 
            className="w-100" 
            style={{ maxWidth: '450px' }}
          >
            <div className="text-center mb-4">
              <h2 
                className="fw-bold mb-1"
                style={{
                  color: '#006D7D',
                  fontSize: '2rem',
                  fontFamily: "'Segoe UI', 'Roboto', sans-serif"
                }}
              >
                {isSignUp ? "Create Your Account" : "Welcome Back"}
              </h2>
              <p 
                className="text-muted"
                style={{ fontSize: '1.1rem' }}
              >
                {isSignUp 
                  ? "Start tracking your work hours today" 
                  : "Sign in to continue your work journey"}
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="d-flex mb-4 border rounded-pill overflow-hidden">
              <button
                className={`flex-grow-1 py-3 fw-bold border-0 ${!isSignUp ? 'active-tab' : 'inactive-tab'}`}
                onClick={() => {
                  setIsSignUp(false);
                  setError("");
                }}
                style={{
                  backgroundColor: !isSignUp ? '#006D7D' : 'transparent',
                  color: !isSignUp ? 'white' : '#006D7D',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
              >
                Sign In
              </button>
              <button
                className={`flex-grow-1 py-3 fw-bold border-0 ${isSignUp ? 'active-tab' : 'inactive-tab'}`}
                onClick={() => {
                  setIsSignUp(true);
                  setError("");
                }}
                style={{
                  backgroundColor: isSignUp ? '#006D7D' : 'transparent',
                  color: isSignUp ? 'white' : '#006D7D',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
              >
                Sign Up
              </button>
            </div>

            <Card className="border-0 shadow-sm rounded-3 overflow-hidden">
              <Card.Body className="p-4 p-md-5">
                {error && (
                  <div className="alert alert-danger mb-4">
                    {error}
                  </div>
                )}
                
                <Form onSubmit={handleEmailPasswordAuth}>
                  {isSignUp && (
                    <Form.Group controlId="formUsername" className="mb-4">
                      <Form.Label className="fw-medium" style={{ color: '#5c5c5c' }}>Username</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setLocalUsername(e.target.value)}
                        className="py-3 px-4 border-1"
                        style={{ 
                          borderColor: '#ddd',
                          borderRadius: '10px',
                          backgroundColor: '#fdfdfd'
                        }}
                        required
                      />
                    </Form.Group>
                  )}
                  
                  <Form.Group controlId="formEmail" className="mb-4">
                    <Form.Label className="fw-medium" style={{ color: '#5c5c5c' }}>Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="py-3 px-4 border-1"
                      style={{ 
                        borderColor: '#ddd',
                        borderRadius: '10px',
                        backgroundColor: '#fdfdfd'
                      }}
                      required
                    />
                  </Form.Group>
                  
                  <Form.Group controlId="formPassword" className="mb-4">
                    <Form.Label className="fw-medium" style={{ color: '#5c5c5c' }}>Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="py-3 px-4 border-1"
                      style={{ 
                        borderColor: '#ddd',
                        borderRadius: '10px',
                        backgroundColor: '#fdfdfd'
                      }}
                      required
                    />
                    {isSignUp && (
                      <Form.Text className="text-muted">
                        Password must be at least 6 characters
                      </Form.Text>
                    )}
                  </Form.Group>
                  
                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100 py-3 fw-bold border-0 mb-3"
                    style={{ 
                      backgroundColor: '#006D7D', 
                      borderRadius: '10px',
                      fontSize: '1.1rem',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#005a68'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#006D7D'}
                  >
                    {isSignUp ? "Create Account" : "Sign In"}
                  </Button>
                </Form>

                {/* Divider */}
                <div className="position-relative text-center my-4">
                  <div 
                    style={{ 
                      height: '1px', 
                      backgroundColor: '#eee',
                      position: 'absolute',
                      top: '50%',
                      left: 0,
                      right: 0
                    }}
                  ></div>
                  <span 
                    className="px-3 bg-white position-relative"
                    style={{ color: '#777' }}
                  >
                    or continue with
                  </span>
                </div>

                {/* Google Sign-In */}
                <Button
                  variant="outline-light"
                  className="w-100 py-3 d-flex align-items-center justify-content-center border-1 mb-3"
                  style={{ 
                    borderColor: '#ddd',
                    borderRadius: '10px',
                    backgroundColor: '#fff',
                    color: '#5c5c5c',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f8f8'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                  onClick={handleGoogleSignIn}
                >
                  <FcGoogle className="fs-4 me-2" />
                  <span className="fw-medium">
                    {isSignUp ? "Sign up with Google" : "Sign in with Google"}
                  </span>
                </Button>

                {/* Toggle between Sign In/Sign Up */}
                <div className="text-center mt-3 pt-2">
                  <p className="mb-0" style={{ color: '#777' }}>
                    {isSignUp
                      ? "Already have an account? "
                      : "Don't have an account? "}
                    <span
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError(""); // Clear error when toggling
                      }}
                      className="fw-bold cursor-pointer"
                      style={{
                        color: '#5E7CE2',
                        cursor: "pointer",
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#4a64c7'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#5E7CE2'}
                    >
                      {isSignUp ? "Sign In" : "Sign Up"}
                    </span>
                  </p>
                </div>
              </Card.Body>
            </Card>

            {/* Footer Note */}
            <p className="text-center text-muted mt-4" style={{ fontSize: '0.85rem' }}>
              By signing in, you agree to our <span style={{ color: '#5E7CE2', cursor: 'pointer' }}>Terms</span> and <span style={{ color: '#5E7CE2', cursor: 'pointer' }}>Privacy Policy</span>
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default SignInSignUp;