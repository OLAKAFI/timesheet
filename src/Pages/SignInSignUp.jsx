import React, { useState, useEffect, useRef } from "react";
import { FcGoogle } from "react-icons/fc";
import { Button, Container, Form, Row, Col, Card, Alert, Spinner } from "react-bootstrap";
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import app from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { updateProfile } from "firebase/auth";
import '../style/signinsignup.css';

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Security Configuration
const SECURITY_CONFIG = {
  MAX_ATTEMPTS: 5,
  LOCKOUT_TIME: 15 * 60 * 1000, // 15 minutes
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  PASSWORD_MIN_LENGTH: 8,
  RATE_LIMIT_DELAY: 2000, // 2 seconds between attempts
};

const SignInSignUp = ({ setUsername }) => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setLocalUsername] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Security State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [securityLevel, setSecurityLevel] = useState("low"); // Password strength
  const [csrfToken, setCsrfToken] = useState("");
  
  const navigate = useNavigate();
  const attemptTimerRef = useRef(null);
  const lockTimerRef = useRef(null);
  const sessionTimerRef = useRef(null);

  // Generate CSRF Token
  useEffect(() => {
    const generateCsrfToken = () => {
      const token = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
      setCsrfToken(token);
      sessionStorage.setItem('csrf_token', token);
    };
    generateCsrfToken();
  }, []);

  // Session Timeout Protection
  useEffect(() => {
    const checkSession = () => {
      const timeSinceLastActivity = Date.now() - lastActivity;
      if (timeSinceLastActivity > SECURITY_CONFIG.SESSION_TIMEOUT) {
        handleSecurityAlert("Session expired due to inactivity");
        handleAutoLogout();
      }
    };

    sessionTimerRef.current = setInterval(checkSession, 60000);
    return () => clearInterval(sessionTimerRef.current);
  }, [lastActivity]);

  // Activity Tracker
  const updateActivity = () => {
    setLastActivity(Date.now());
  };

  // Lockout Timer
  useEffect(() => {
    if (isLocked && lockTimeRemaining > 0) {
      lockTimerRef.current = setTimeout(() => {
        setLockTimeRemaining(prev => {
          if (prev <= 1000) {
            setIsLocked(false);
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }

    return () => clearTimeout(lockTimerRef.current);
  }, [isLocked, lockTimeRemaining]);

  // Security Alert Handler
  const handleSecurityAlert = (message, level = "warning") => {
    setError(`${level === "danger" ? "🔒 " : "⚠️ "}${message}`);
    console.warn(`Security ${level}: ${message}`);
  };

  // Rate Limiting
  const checkRateLimit = () => {
    if (isRateLimited) {
      handleSecurityAlert("Please wait before trying again", "danger");
      return false;
    }

    setIsRateLimited(true);
    setTimeout(() => setIsRateLimited(false), SECURITY_CONFIG.RATE_LIMIT_DELAY);
    return true;
  };

  // Input Validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      handleSecurityAlert("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const validatePassword = (password) => {
    if (password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
      handleSecurityAlert(`Password must be at least ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} characters`);
      return false;
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
    
    if (strength < 3) {
      handleSecurityAlert("Password should include uppercase, lowercase, numbers, and special characters");
      return false;
    }

    setSecurityLevel(strength === 4 ? "high" : strength === 3 ? "medium" : "low");
    return true;
  };

  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .substring(0, 100);
  };

  // Account Lockout System
  const handleFailedAttempt = () => {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);

    if (newAttempts >= SECURITY_CONFIG.MAX_ATTEMPTS) {
      setIsLocked(true);
      setLockTimeRemaining(SECURITY_CONFIG.LOCKOUT_TIME);
      handleSecurityAlert(`Too many failed attempts. Account locked for ${SECURITY_CONFIG.LOCKOUT_TIME / 60000} minutes`, "danger");
    } else {
      handleSecurityAlert(`Invalid credentials. ${SECURITY_CONFIG.MAX_ATTEMPTS - newAttempts} attempts remaining`);
    }
  };

  const handleAutoLogout = () => {
    if (auth.currentUser) {
      auth.signOut();
    }
    navigate("/", { replace: true });
  };

  // Enhanced Google Sign-In with Security
  const handleGoogleSignIn = async () => {
    if (isLocked) {
      handleSecurityAlert(`Account temporarily locked. Please try again in ${Math.ceil(lockTimeRemaining / 60000)} minutes`, "danger");
      return;
    }

    if (!checkRateLimit()) return;

    try {
      setIsLoading(true);
      setError("");
      updateActivity();

      // Enhanced Google Auth configuration
      provider.setCustomParameters({
        prompt: "select_account",
        login_hint: email || '',
        hd: "*" // Restrict to specific domain if needed
      });

      provider.addScope('email');
      provider.addScope('profile');

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Validate user data
      if (!user.email || !user.emailVerified) {
        handleSecurityAlert("Please verify your email with Google before signing in");
        await auth.signOut();
        return;
      }

      const displayName = sanitizeInput(user.displayName || user.email.split('@')[0] || user.email);
      
      setUser(user);
      setLocalUsername(displayName);
      setUsername(displayName);
      
      // Reset failed attempts on successful login
      setFailedAttempts(0);

      // Log security event
      console.log("Security: Successful Google authentication", {
        email: user.email,
        timestamp: new Date().toISOString()
      });

      navigate("/dashboard", {
        state: {
          user: {
            email: user.email,
            displayName: displayName,
            uid: user.uid
          }
        },
        replace: true // Prevent back navigation to auth page
      });
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      
      let errorMessage = "Google authentication failed";
      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Popup closed before completing sign-in";
      } else if (error.code === "auth/account-exists-with-different-credential") {
        errorMessage = "Account already exists with different method. Please try email sign-in.";
      } else if (error.code === "auth/popup-blocked") {
        errorMessage = "Popup blocked by browser. Please allow popups for this site.";
      } else if (error.code === "auth/unauthorized-domain") {
        errorMessage = "This domain is not authorized for Google sign-in";
      }
      
      handleSecurityAlert(errorMessage, "danger");
      handleFailedAttempt();
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced Email/Password Authentication
  const handleEmailPasswordAuth = async (e) => {
    e.preventDefault();
    
    if (isLocked) {
      handleSecurityAlert(`Account temporarily locked. Please try again in ${Math.ceil(lockTimeRemaining / 60000)} minutes`, "danger");
      return;
    }

    if (!checkRateLimit()) return;

    setError("");
    setIsLoading(true);
    updateActivity();
    
    // Input validation
    if (!email || !password) {
      handleSecurityAlert("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setIsLoading(false);
      return;
    }

    if (isSignUp && !username) {
      handleSecurityAlert("Please enter a username");
      setIsLoading(false);
      return;
    }

    if (isSignUp && !validatePassword(password)) {
      setIsLoading(false);
      return;
    }

    // CSRF Protection
    const storedToken = sessionStorage.getItem('csrf_token');
    if (!csrfToken || csrfToken !== storedToken) {
      handleSecurityAlert("Security token invalid. Please refresh the page.", "danger");
      setIsLoading(false);
      return;
    }

    try {
      let userCredential;
      
      if (isSignUp) {
        // Additional sign-up validation
        const sanitizedUsername = sanitizeInput(username);
        if (sanitizedUsername.length < 2) {
          handleSecurityAlert("Username must be at least 2 characters long");
          setIsLoading(false);
          return;
        }

        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: sanitizedUsername
        });

        // Log successful registration
        console.log("Security: New user registered", {
          email: email,
          username: sanitizedUsername,
          timestamp: new Date().toISOString()
        });

      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Log successful login
        console.log("Security: User signed in", {
          email: email,
          timestamp: new Date().toISOString()
        });
      }
      
      const user = userCredential.user;
      
      // Reset failed attempts on success
      setFailedAttempts(0);
      
      // Generate new CSRF token for session
      const newToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
      setCsrfToken(newToken);
      sessionStorage.setItem('csrf_token', newToken);

      setUsername(user.displayName || user.email);
      navigate("/dashboard", { 
        state: { 
          user: { 
            email: user.email, 
            displayName: user.displayName || user.email, 
            uid: user.uid 
          } 
        },
        replace: true // Prevent back navigation
      });
      
    } catch (error) {
      console.error("Authentication Error:", error);
      handleFailedAttempt();
      
      switch (error.code) {
        case "auth/email-already-in-use":
          setError("Email already in use. Please sign in instead.");
          break;
        case "auth/invalid-email":
          setError("Please enter a valid email address");
          break;
        case "auth/weak-password":
          setError(`Password should be at least ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} characters with mixed characters`);
          break;
        case "auth/user-not-found":
          setError("No account found with this email");
          break;
        case "auth/wrong-password":
          setError("Incorrect password");
          break;
        case "auth/too-many-requests":
          setError("Too many attempts. Account temporarily locked");
          setIsLocked(true);
          setLockTimeRemaining(SECURITY_CONFIG.LOCKOUT_TIME);
          break;
        case "auth/network-request-failed":
          setError("Network error. Please check your connection");
          break;
        default:
          setError("Authentication failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Password Strength Indicator
  const PasswordStrengthIndicator = ({ password }) => {
    if (!password) return null;

    const getStrength = (pwd) => {
      let score = 0;
      if (pwd.length >= SECURITY_CONFIG.PASSWORD_MIN_LENGTH) score++;
      if (/[A-Z]/.test(pwd)) score++;
      if (/[a-z]/.test(pwd)) score++;
      if (/\d/.test(pwd)) score++;
      if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++;
      return score;
    };

    const strength = getStrength(password);
    const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    const strengthColors = ["#ff4d4d", "#ffa500", "#ffd700", "#90ee90", "#008000"];

    return (
      <div className="password-strength mt-1">
        <div className="strength-bar d-flex gap-1 mb-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className="strength-segment flex-fill"
              style={{
                backgroundColor: level <= strength ? strengthColors[strength - 1] : '#e0e0e0',
                height: '4px',
                borderRadius: '2px',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
        <small className={`text-${strength === 0 ? 'muted' : strength <= 2 ? 'danger' : strength <= 3 ? 'warning' : 'success'}`}>
          {strengthLabels[strength]} {isSignUp && `(${strength}/5)`}
        </small>
      </div>
    );
  };

  // Add activity tracking to user interactions
  useEffect(() => {
    const events = ['click', 'keypress', 'scroll', 'mousemove', 'touchstart'];
    const updateActivityOnEvent = () => updateActivity();

    events.forEach(event => {
      window.addEventListener(event, updateActivityOnEvent);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivityOnEvent);
      });
    };
  }, []);

  // Format lock time remaining
  const formatLockTime = (ms) => {
    const minutes = Math.ceil(ms / 60000);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
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

        {/* Right Side - Enhanced Security Form */}
        <Col 
          lg={6} 
          md={7}
          className="form-section d-flex align-items-center justify-content-center p-3 p-md-4"
        >
          <div className="form-container compact-form w-100">


            {/* Compact Header */}
            <div className="text-center mb-3">
              <h2 className="form-title mb-1">
                {isSignUp ? "Create Secure Account" : "Welcome Back"}
              </h2>
            </div>

            {/* Account Lockout Warning */}
            {isLocked && (
              <Alert variant="danger" className="mb-3 py-2">
                <div className="d-flex align-items-center">
                  <span className="me-2">🚫</span>
                  <div>
                    <strong>Account Temporarily Locked</strong>
                    <div className="small">
                      Too many failed attempts. Try again in {formatLockTime(lockTimeRemaining)}
                    </div>
                  </div>
                </div>
              </Alert>
            )}

            {/* Tab Navigation */}
            <div className="auth-tabs compact-tabs mb-3">
              <button
                className={`auth-tab ${!isSignUp ? 'auth-tab-active' : ''}`}
                onClick={() => {
                  setIsSignUp(false);
                  setError("");
                }}
                disabled={isLoading || isLocked}
              >
                Sign In
              </button>
              <button
                className={`auth-tab ${isSignUp ? 'auth-tab-active' : ''}`}
                onClick={() => {
                  setIsSignUp(true);
                  setError("");
                }}
                disabled={isLoading || isLocked}
              >
                Sign Up
              </button>
            </div>

            {/* Enhanced Security Form Card */}
            <Card className="auth-card compact-card security-card">
              <Card.Body className="p-3">
                {error && (
                  <div className={`alert ${error.includes('locked') || error.includes('Security') ? 'alert-danger' : 'alert-warning'} d-flex align-items-center mb-3 py-2`} role="alert">
                    <div className="alert-icon me-2">
                      {error.includes('locked') ? '🚫' : '⚠️'}
                    </div>
                    <div className="alert-message small">{error}</div>
                  </div>
                )}
                
                <Form onSubmit={handleEmailPasswordAuth} className="auth-form compact-form">
                  <input type="hidden" name="csrf_token" value={csrfToken} />
                  
                  {isSignUp && (
                    <Form.Group controlId="formUsername" className="mb-2">
                      <Form.Label className="form-label small">
                        Username <span className="text-muted">(2+ characters)</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setLocalUsername(sanitizeInput(e.target.value))}
                        className="form-input compact-input"
                        disabled={isLoading || isLocked}
                        required
                        minLength={2}
                        maxLength={50}
                      />
                    </Form.Group>
                  )}
                  
                  <Form.Group controlId="formEmail" className="mb-2">
                    <Form.Label className="form-label small">Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter email"
                      value={email}
                      onChange={(e) => setEmail(sanitizeInput(e.target.value))}
                      className="form-input compact-input"
                      disabled={isLoading || isLocked}
                      required
                      inputMode="email"
                    />
                  </Form.Group>
                  
                  <Form.Group controlId="formPassword" className="mb-3">
                    <Form.Label className="form-label small">
                      Password {isSignUp && <span className="text-muted">(8+ characters)</span>}
                    </Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input compact-input"
                      disabled={isLoading || isLocked}
                      required
                      minLength={SECURITY_CONFIG.PASSWORD_MIN_LENGTH}
                    />
                    <PasswordStrengthIndicator password={password} />
                    {isSignUp && (
                      <Form.Text className="form-help extra-small text-muted">
                        Uppercase, lowercase, numbers, and special characters
                      </Form.Text>
                    )}
                  </Form.Group>
                  
                  <Button
                    type="submit"
                    className="auth-button primary w-100 mb-2 compact-button"
                    disabled={isLoading || isLocked}
                    variant={isLocked ? "secondary" : "primary"}
                  >
                    {isLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        {isLocked ? "Account Locked" : "Securing..."}
                      </>
                    ) : (
                      isSignUp ? "Create an Account" : "Sign In"
                    )}
                  </Button>
                </Form>

                {/* Enhanced Google Sign-In */}
                {/* <div className="position-relative my-3">
                  <hr />
                  <div className="divider-text position-absolute top-50 start-50 translate-middle bg-white px-2 small text-muted">
                    or continue with
                  </div>
                </div> */}

                <Button
                  variant="outline"
                  className="auth-button google w-100 d-flex align-items-center justify-content-center compact-button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading || isLocked}
                >
                  <FcGoogle className="google-icon me-2" size={18} />
                  <span>Google</span>
                </Button>

                {/* Security Footer */}
                {/* <div className="security-footer mt-3 pt-2 border-top">
                  <div className="row text-center">
                    <div className="col-4">
                      <small className="text-muted">🔒 Encrypted</small>
                    </div>
                    <div className="col-4">
                      <small className="text-muted">🛡️ Secure</small>
                    </div>
                    <div className="col-4">
                      <small className="text-muted">⚡ Fast</small>
                    </div>
                  </div>
                </div> */}
              </Card.Body>
            </Card>

            {/* Enhanced Legal Text */}
            <p className="legal-text extra-small text-center mt-3">
              By signing in, you agree to our{" "}
              <a href="#terms" className="text-decoration-underline">Terms</a> and{" "}
              <a href="#privacy" className="text-decoration-underline">Privacy Policy</a>
              <br />
              <small className="text-muted">All data is encrypted and securely stored</small>
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default SignInSignUp;