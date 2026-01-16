import React, { useState, useEffect, useRef } from "react";
import { FcGoogle} from "react-icons/fc";
import { RiAdminLine } from "react-icons/ri";
import { 
  Button, Container, Form, Row, Col, Card, Alert, Spinner, 
  Modal, Badge, ToggleButton, ToggleButtonGroup 
} from "react-bootstrap";
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword 
} from "firebase/auth";
import { getFirestore, doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import app from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { updateProfile } from "firebase/auth";
import '../style/signinsignup.css';

const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Security Configuration
const SECURITY_CONFIG = {
  MAX_ATTEMPTS: 5,
  LOCKOUT_TIME: 15 * 60 * 1000,
  SESSION_TIMEOUT: 30 * 60 * 1000,
  PASSWORD_MIN_LENGTH: 8,
  RATE_LIMIT_DELAY: 2000,
  ADMIN_EMAIL_DOMAINS: ["@shiftroom.com", "@company.com"], // Add your admin domains
};

const SignInSignUp = ({ setUsername }) => {
  const [authMode, setAuthMode] = useState("user"); // "user" or "admin"
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setLocalUsername] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminVerified, setAdminVerified] = useState(false);
  
  // Security State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [securityLevel, setSecurityLevel] = useState("low");
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
    
    // Check admin email domain if in admin mode
    if (authMode === "admin") {
      const isAdminDomain = SECURITY_CONFIG.ADMIN_EMAIL_DOMAINS.some(domain => 
        email.endsWith(domain)
      );
      if (!isAdminDomain) {
        handleSecurityAlert("This email is not authorized for admin access");
        return false;
      }
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

  // Check if user is admin in Firestore
  const checkAdminStatus = async (email, uid) => {
    try {
      const adminDoc = await getDoc(doc(db, "admins", uid));
      
      if (adminDoc.exists()) {
        return adminDoc.data();
      }
      
      // Check by email as fallback
      const adminByEmail = await getDoc(doc(db, "admin_emails", email));
      if (adminByEmail.exists()) {
        // Create admin record for this user
        await setDoc(doc(db, "admins", uid), {
          email: email,
          role: adminByEmail.data().role || "admin",
          createdAt: new Date(),
          permissions: adminByEmail.data().permissions || ["dashboard", "rota", "users", "analytics"]
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Admin check error:", error);
      return false;
    }
  };



  // Verify Admin Code - SIMPLIFIED VERSION
  const verifyAdminCode = async () => {
    console.log("DEBUG - Verifying admin code:", adminCode);
    
    if (!adminCode) {
      handleSecurityAlert("Please enter admin verification code");
      return false;
    }

    // FOR TESTING: Accept any code starting with "ADMIN"
    if (process.env.NODE_ENV === 'development') {
      if (adminCode.startsWith('ADMIN') || adminCode === 'TEST') {
        console.log("DEBUG - Test admin code accepted");
        setAdminVerified(true);
        return true;
      }
    }

    try {
      const codeDoc = await getDoc(doc(db, "admin_codes", adminCode));
      console.log("DEBUG - Code document exists:", codeDoc.exists());
      
      if (codeDoc.exists() && codeDoc.data().active) {
        const codeData = codeDoc.data();
        
        // Check if code is expired
        if (codeData.expiresAt && codeData.expiresAt.toDate() < new Date()) {
          handleSecurityAlert("Admin code has expired");
          return false;
        }
        
        // Check if code has been used too many times
        if (codeData.used >= codeData.maxUses) {
          handleSecurityAlert("Admin code has been used too many times");
          return false;
        }
        
        // Increment usage count
        await updateDoc(doc(db, "admin_codes", adminCode), {
          used: (codeData.used || 0) + 1
        });
        
        setAdminVerified(true);
        return true;
      } else {
        handleSecurityAlert("Invalid or inactive admin code");
        return false;
      }
    } catch (error) {
      console.error("DEBUG - Error verifying admin code:", error);
      handleSecurityAlert("Error verifying admin code");
      return false;
    }
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

      // For admin mode, require code verification
      if (authMode === "admin" && !adminVerified) {
        setShowAdminModal(true);
        setIsLoading(false);
        return;
      }

      provider.setCustomParameters({
        prompt: "select_account",
        login_hint: email || '',
        hd: "*"
      });

      provider.addScope('email');
      provider.addScope('profile');

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email || !user.emailVerified) {
        handleSecurityAlert("Please verify your email with Google before signing in");
        await auth.signOut();
        return;
      }

      // Check admin status if in admin mode
      let isAdmin = false;
      let adminData = null;
      if (authMode === "admin") {
        adminData = await checkAdminStatus(user.email, user.uid);
        if (!adminData) {
          handleSecurityAlert("Not authorized for admin access");
          await auth.signOut();
          setIsLoading(false);
          return;
        }
        isAdmin = true;
      }

      const displayName = sanitizeInput(user.displayName || user.email.split('@')[0] || user.email);
      
      setUser(user);
      setLocalUsername(displayName);
      setUsername(displayName);
      
      setFailedAttempts(0);

      console.log("Security: Successful Google authentication", {
        email: user.email,
        mode: authMode,
        timestamp: new Date().toISOString()
      });

      // Redirect based on mode
      if (isAdmin) {
        navigate("/admin/dashboard", {
          state: {
            user: {
              email: user.email,
              displayName: displayName,
              uid: user.uid,
              isAdmin: true,
              permissions: adminData?.permissions || []
            }
          },
          replace: true
        });
      } else {
        navigate("/dashboard", {
          state: {
            user: {
              email: user.email,
              displayName: displayName,
              uid: user.uid,
              isAdmin: false
            }
          },
          replace: true
        });
      }
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

  

  // Enhanced Email/Password Authentication - FIXED VERSION
  const handleEmailPasswordAuth = async (e) => {
    e.preventDefault();
    
    console.log("DEBUG - Form submitted with:", {
      authMode,
      email,
      adminVerified,
      adminCode,
      isSignUp
    });
    
    if (isLocked) {
      handleSecurityAlert(`Account temporarily locked. Please try again in ${Math.ceil(lockTimeRemaining / 60000)} minutes`, "danger");
      return;
    }

    if (!checkRateLimit()) return;

    setError("");
    setIsLoading(true);
    updateActivity();
    
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

    // FOR ADMIN MODE: Check verification
    if (authMode === "admin") {
      console.log("DEBUG - Checking admin verification...");
      
      // Check if admin code is provided
      if (!adminCode) {
        handleSecurityAlert("Please enter admin verification code");
        setIsLoading(false);
        return;
      }
      
      // Verify admin code
      const isValid = await verifyAdminCode();
      console.log("DEBUG - Admin code verification result:", isValid);
      
      if (!isValid) {
        setIsLoading(false);
        return;
      }
      
      // Code is valid, mark as verified
      setAdminVerified(true);
      console.log("DEBUG - Admin code verified successfully");
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
      let isAdmin = false;
      let adminData = null;
      
      if (isSignUp) {
        // Skip sign-up for admin mode
        if (authMode === "admin") {
          handleSecurityAlert("Please sign in instead of signing up for admin access");
          setIsLoading(false);
          return;
        }

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

        console.log("Security: New user registered", {
          email: email,
          username: sanitizedUsername,
          mode: authMode,
          timestamp: new Date().toISOString()
        });

      } else {
        console.log("DEBUG - Attempting sign in...");
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("DEBUG - Sign in successful");
        
        // For admin mode, check admin status
        if (authMode === "admin") {
          console.log("DEBUG - Checking admin status for:", email);
          adminData = await checkAdminStatus(email, userCredential.user.uid);
          
          if (!adminData) {
            console.log("DEBUG - No admin data found");
            
            // Check if email is in admin_emails collection
            try {
              const adminEmailRef = doc(db, "admin_emails", email);
              const adminEmailDoc = await getDoc(adminEmailRef);
              
              if (adminEmailDoc.exists()) {
                console.log("DEBUG - Found in admin_emails, creating admin record");
                // Create admin record
                await setDoc(doc(db, "admins", userCredential.user.uid), {
                  email: email,
                  role: adminEmailDoc.data().role || "admin",
                  createdAt: new Date(),
                  permissions: adminEmailDoc.data().permissions || ["dashboard", "rota", "users", "analytics"],
                  active: true
                });
                adminData = { permissions: ["dashboard", "rota", "users", "analytics"] };
                isAdmin = true;
              } else {
                handleSecurityAlert("Not authorized for admin access");
                await auth.signOut();
                setIsLoading(false);
                return;
              }
            } catch (error) {
              console.error("DEBUG - Admin check error:", error);
              handleSecurityAlert("Error checking admin permissions");
              setIsLoading(false);
              return;
            }
          } else {
            console.log("DEBUG - Admin data found:", adminData);
            isAdmin = true;
          }
        }

        console.log("Security: User signed in", {
          email: email,
          mode: authMode,
          timestamp: new Date().toISOString()
        });
      }
      
      const user = userCredential.user;
      console.log("DEBUG - Authentication successful, user:", user.email);
      
      setFailedAttempts(0);
      
      const newToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
      setCsrfToken(newToken);
      sessionStorage.setItem('csrf_token', newToken);

      setUsername(user.displayName || user.email);
      
      // Redirect based on mode
      console.log("DEBUG - Redirecting, isAdmin:", isAdmin, "authMode:", authMode);
      
      if (isAdmin || authMode === "admin") {
        navigate("/admin/dashboard", {
          state: {
            user: {
              email: user.email,
              displayName: user.displayName || user.email,
              uid: user.uid,
              isAdmin: true,
              permissions: adminData?.permissions || ["dashboard", "rota", "users", "analytics"]
            }
          },
          replace: true
        });
      } else {
        navigate("/dashboard", {
          state: {
            user: {
              email: user.email,
              displayName: user.displayName || user.email,
              uid: user.uid,
              isAdmin: false
            }
          },
          replace: true
        });
      }
      
    } catch (error) {
      console.error("Authentication Error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
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
          setError("No account found with this email. Please sign up first.");
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
          setError(`Authentication failed: ${error.message}`);
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

  // Add activity tracking
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

  // Handle mode change
  const handleModeChange = (mode) => {
    setAuthMode(mode);
    setError("");
    setAdminVerified(false);
    setIsSignUp(false); // Default to sign in when switching modes
  };

  return (
    <>
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
                    <h4>Admin Controls</h4>
                    <p>Comprehensive admin tools for workforce management</p>
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
                  {authMode === "admin" ? "Admin Portal" : 
                   isSignUp ? "Create Secure Account" : "Welcome Back"}
                </h2>
                <p className="form-subtitle text-muted small">
                  {authMode === "admin" ? "Administrator Access Only" : "Secure Workforce Management"}
                </p>
              </div>

              {/* Authentication Mode Selector */}
              <div className="auth-mode-selector mb-3">
                <ToggleButtonGroup 
                  type="radio" 
                  name="authMode" 
                  value={authMode}
                  onChange={handleModeChange}
                  className="w-100"
                >
                  <ToggleButton 
                    id="mode-user" 
                    value="user"
                    variant={authMode === "user" ? "primary" : "outline-primary"}
                    className="py-2"
                    disabled={isLoading || isLocked}
                  >
                    <i className="bi bi-person me-2"></i>User Login
                  </ToggleButton>
                  <ToggleButton 
                    id="mode-admin" 
                    value="admin"
                    variant={authMode === "admin" ? "warning" : "outline-warning"}
                    className="py-2"
                    disabled={isLoading || isLocked}
                  >
                    <RiAdminLine className="me-2" />Admin Login
                  </ToggleButton>
                </ToggleButtonGroup>
              </div>

              {/* Admin Badge */}
              {authMode === "admin" && (
                <Alert variant="warning" className="mb-3 py-2 d-flex align-items-center">
                  <RiAdminLine className="me-2" size={20} />
                  <div className="small">
                    <strong>Admin Access Required</strong>
                    {/* <div className="extra-small">
                      Authorized personnel only. Requires admin email domain.
                    </div> */}
                  </div>
                </Alert>
              )}

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
                  disabled={isLoading || isLocked || authMode === "admin"}
                >
                  Sign Up
                </button>
              </div>

              {/* Enhanced Security Form Card */}
              <Card className={`auth-card compact-card security-card ${authMode === "admin" ? 'border-warning' : ''}`}>
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
                          disabled={isLoading || isLocked || authMode === "admin"}
                          required
                          minLength={2}
                          maxLength={50}
                        />
                      </Form.Group>
                    )}
                    
                    <Form.Group controlId="formEmail" className="mb-2">
                      {/* <Form.Label className="form-label small">
                        Email {authMode === "admin" && <Badge bg="warning" text="dark" className="ms-1">Admin</Badge>}
                      </Form.Label> */}
                      <div className="input-group">
                        <Form.Control
                          type="email"
                          placeholder={authMode === "admin" ? "Enter Admin email" : "Enter your email"}
                          value={email}
                          onChange={(e) => setEmail(sanitizeInput(e.target.value))}
                          className={`form-input compact-input ${authMode === "admin" ? 'border-warning' : ''}`}
                          disabled={isLoading || isLocked}
                          required
                          inputMode="email"
                        />
                        {authMode === "admin" && !adminVerified && (
                          <Button
                            variant="outline-warning"
                            onClick={() => setShowAdminModal(true)}
                            disabled={isLoading}
                          >
                            <i className="bi bi-key"></i> Verify
                          </Button>
                        )}
                      </div>
                      {authMode === "admin" && (
                        <div className="mt-1">
                          {/* <Form.Text className="extra-small text-muted">
                            Use: admin@shiftroom.com or your admin email
                          </Form.Text> */}
                          {adminVerified && (
                            <Form.Text className="extra-small text-success">
                              <i className="bi bi-check-circle me-1"></i>Admin code verified
                            </Form.Text>
                          )}
                        </div>
                      )}
                    </Form.Group>
                                        
                    <Form.Group controlId="formPassword" className="mb-3">
                      {/* <Form.Label className="form-label small">
                        Password {isSignUp && <span className="text-muted">(8+ characters)</span>}
                      </Form.Label> */}
                      <Form.Control
                        type="password"
                        placeholder="Enter password (8+ characters)"
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
                      className={`auth-button w-100 mb-2 compact-button ${authMode === "admin" ? 'btn-warning' : 'btn-primary'}`}
                      disabled={isLoading || isLocked || (authMode === "admin" && !adminVerified)}
                      onClick={async (e) => {
                        e.preventDefault();
                        
                        console.log("Direct button click handler");
                        
                        // For admin mode, verify code first
                        if (authMode === "admin" && !adminVerified) {
                          if (!adminCode) {
                            handleSecurityAlert("Please verify admin code first");
                            return;
                          }
                          
                          const verified = await verifyAdminCode();
                          if (!verified) {
                            handleSecurityAlert("Admin code verification failed");
                            return;
                          }
                          setAdminVerified(true);
                        }
                        
                        // Trigger form submission
                        const form = document.getElementById('authForm');
                        if (form) {
                          const submitEvent = new Event('submit', { cancelable: true });
                          form.dispatchEvent(submitEvent);
                        } else {
                          // Fallback: call the handler directly
                          handleEmailPasswordAuth(e);
                        }
                      }}
                    >
                        {isLoading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            {isLocked ? "Account Locked" : 
                            authMode === "admin" ? "Admin Access..." : "Securing..."}
                          </>
                        ) : (
                          authMode === "admin" ? "Admin Sign In" :
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
                    variant={authMode === "admin" ? "outline-warning" : "outline"}
                    className="auth-button google w-100 d-flex align-items-center justify-content-center compact-button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading || isLocked}
                  >
                    <FcGoogle className="google-icon me-2" size={18} />
                    <span>Google {authMode === "admin" && "Admin"}</span>
                  </Button>

                  {/* Admin Verification Status */}
                  {authMode === "admin" && adminVerified && (
                    <Alert variant="success" className="mt-3 py-2 mb-0">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-shield-check me-2"></i>
                        <div className="small">
                          <strong>Admin Verified</strong>
                          <div className="extra-small">Proceed with authentication</div>
                        </div>
                      </div>
                    </Alert>
                  )}
                </Card.Body>
              </Card>

              {/* Enhanced Legal Text */}
              <p className="legal-text extra-small text-center mt-3">
                By signing in, you agree to our{" "}
                <a href="#terms" className="text-decoration-underline">Terms</a> and{" "}
                <a href="#privacy" className="text-decoration-underline">Privacy Policy</a>
                <br />
                <small className="text-muted">
                  {authMode === "admin" 
                    ? "Admin access is logged and monitored" 
                    : "All data is encrypted and securely stored"}
                </small>
              </p>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Admin Verification Modal */}
      <Modal 
        show={showAdminModal} 
        onHide={() => setShowAdminModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton className="bg-warning text-dark">
          <Modal.Title className="h5">
            <RiAdminLine className="me-2" />
            Admin Verification Required
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="small mb-3">
            To access the admin portal, please enter the verification code provided by your system administrator.
          </p>
          
          <Form.Group controlId="formAdminCode">
            <Form.Label className="small">Admin Verification Code</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter admin code"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              className="mb-3"
            />
          </Form.Group>
          
          <div className="d-grid gap-2">
            <Button 
              variant="warning" 
              onClick={async () => {
                if (await verifyAdminCode()) {
                  setShowAdminModal(false);
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Verifying...
                </>
              ) : (
                "Verify & Continue"
              )}
            </Button>
            <Button 
              variant="outline-secondary" 
              onClick={() => {
                setShowAdminModal(false);
                setAuthMode("user");
              }}
            >
              Switch to User Login
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default SignInSignUp;