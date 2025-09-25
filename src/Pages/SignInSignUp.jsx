import React, { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Button, Container, Form, Row, Col, Card } from "react-bootstrap";
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import app from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { updateProfile } from "firebase/auth";
import '../style/signinsignup.css';

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const SignInSignUp = ({ setUsername }) => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setLocalUsername] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      provider.setCustomParameters({
        prompt: "select_account"
      });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const displayName = user.displayName || user.email.split('@')[0] || user.email;
      
      setUser(user);
      setLocalUsername(displayName);
      setUsername(displayName);
      
      navigate("/dashboard", {
        state: {
          user: {
            email: user.email,
            displayName: displayName,
            uid: user.uid
          }
        }
      });
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      
      let errorMessage = "Google authentication failed";
      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Popup closed before completing sign-in";
      } else if (error.code === "auth/account-exists-with-different-credential") {
        errorMessage = "Account already exists with different method";
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailPasswordAuth = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    if (!email || !password) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }
    
    if (isSignUp && !username) {
      setError("Please enter a username");
      setIsLoading(false);
      return;
    }
    
    try {
      let userCredential;
      
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: username
        });
      } else {
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container fluid className="auth-container p-0 min-vh-100 d-flex align-items-center justify-content-center">
      <Row className="g-0 w-100 h-100">
        {/* Left Side - Enhanced Brand Showcase */}
        <Col 
          lg={6} 
          md={5}
          className="brand-section d-none d-md-flex align-items-center justify-content-center p-4 p-lg-5"
        >
          <div className="brand-content text-center text-white position-relative">
            {/* Enhanced Background Elements */}
            <div className="floating-shape shape-1"></div>
            <div className="floating-shape shape-2"></div>
            <div className="floating-shape shape-3"></div>
            <div className="floating-shape shape-4"></div>
            <div className="floating-shape shape-5"></div>
            
            {/* Geometric Pattern Overlay */}
            <div className="geometric-pattern"></div>
            
            {/* Main Brand Content */}
            <div className="brand-header mb-4">
              <h1 className="brand-title mb-3">
                ShiftRoom
              </h1>
              <div className="brand-subtitle-container">
                <p className="brand-subtitle">Track. Calculate. Optimize.</p>
                <div className="title-underline"></div>
              </div>
            </div>
            
            {/* Enhanced Features Grid */}
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-number">01</div>
                <div className="feature-content">
                  <h4>Smart Tracking</h4>
                  <p>Precision time tracking with intelligent categorization</p>
                </div>
              </div>
              
              <div className="feature-card">
                <div className="feature-number">02</div>
                <div className="feature-content">
                  <h4>Earnings Insight</h4>
                  <p>Real-time calculations and financial analytics</p>
                </div>
              </div>
              
              <div className="feature-card">
                <div className="feature-number">03</div>
                <div className="feature-content">
                  <h4>Productivity Analytics</h4>
                  <p>Deep insights into your work patterns and efficiency</p>
                </div>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="stats-bar">
              <div className="stat-item">
                <div className="stat-value">10K+</div>
                <div className="stat-label">Users</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">500K+</div>
                <div className="stat-label">Hours Tracked</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">98%</div>
                <div className="stat-label">Satisfaction</div>
              </div>
            </div>
          </div>
        </Col>

        {/* Right Side - Compact Form */}
        <Col 
          lg={6} 
          md={7}
          className="form-section d-flex align-items-center justify-content-center p-3 p-md-4"
        >
          <div className="form-container compact-form w-100">
            {/* Compact Header */}
            <div className="text-center mb-3">
              <h2 className="form-title mb-1">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h2>
              <p className="form-subtitle">
                {isSignUp ? "Join thousands of professionals" : "Continue your productivity journey"}
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="auth-tabs compact-tabs mb-3">
              <button
                className={`auth-tab ${!isSignUp ? 'auth-tab-active' : ''}`}
                onClick={() => {
                  setIsSignUp(false);
                  setError("");
                }}
                disabled={isLoading}
              >
                Sign In
              </button>
              <button
                className={`auth-tab ${isSignUp ? 'auth-tab-active' : ''}`}
                onClick={() => {
                  setIsSignUp(true);
                  setError("");
                }}
                disabled={isLoading}
              >
                Sign Up
              </button>
            </div>

            {/* Compact Form Card */}
            <Card className="auth-card compact-card">
              <Card.Body className="p-3">
                {error && (
                  <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
                    <div className="alert-icon">⚠️</div>
                    <div className="alert-message small">{error}</div>
                  </div>
                )}
                
                <Form onSubmit={handleEmailPasswordAuth} className="auth-form compact-form">
                  {isSignUp && (
                    <Form.Group controlId="formUsername" className="mb-2">
                      <Form.Label className="form-label small">Username</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setLocalUsername(e.target.value)}
                        className="form-input compact-input"
                        disabled={isLoading}
                        required
                      />
                    </Form.Group>
                  )}
                  
                  <Form.Group controlId="formEmail" className="mb-2">
                    <Form.Label className="form-label small">Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input compact-input"
                      disabled={isLoading}
                      required
                    />
                  </Form.Group>
                  
                  <Form.Group controlId="formPassword" className="mb-3">
                    <Form.Label className="form-label small">Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input compact-input"
                      disabled={isLoading}
                      required
                    />
                    {isSignUp && (
                      <Form.Text className="form-help extra-small">
                        Minimum 6 characters
                      </Form.Text>
                    )}
                  </Form.Group>
                  
                  <Button
                    type="submit"
                    className="auth-button primary w-100 mb-2 compact-button"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : null}
                    {isSignUp ? "Create Account" : "Sign In"}
                  </Button>
                </Form>



                {/* Google Sign-In */}
                <Button
                  variant="outline"
                  className="auth-button google w-100 d-flex align-items-center justify-content-center mb-3 compact-button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <span className="divider-text  me-2 ">or continue with Google</span>
                  <FcGoogle className="google-icon me-2" />
                </Button>

                {/* Toggle between Sign In/Sign Up */}
                {/* <div className="text-center mt-3">
                  <p className="toggle-text small mb-0">
                    {isSignUp ? "Have an account? " : "No account? "}
                    <button
                      type="button"
                      className="toggle-link small"
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError("");
                      }}
                      disabled={isLoading}
                    >
                      {isSignUp ? "Sign In" : "Sign Up"}
                    </button>
                  </p>
                </div> */}
              </Card.Body>
            </Card>

            {/* Compact Legal Text */}
            <p className="legal-text extra-small text-center mt-3">
              By signing in, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy</a>
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default SignInSignUp;