import React, { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Button, Container, Form, Row, Col, Card } from "react-bootstrap";
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword} from "firebase/auth";
import app from "../firebaseConfig"; // Firebase initialization
import { useNavigate } from "react-router-dom";



const auth = getAuth(app);
const provider = new GoogleAuthProvider();



const SignInSignUp = ({ setUsername }) => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setLocalUsername] = useState("");
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  


  // Handle Google Sign-Up/Sign-In
  // const handleGoogleSignIn = async () => {
  //   try {
  //     const result = await signInWithPopup(auth, provider);
  //     const user = result.user;
  //     setUser(user);
  //     setUsername(user.displayName); // Use Google account's display name
  //     console.log("Google Sign-In Success:", user);
  //     // Step 1: Load data from Firestore
  //     navigate("/dashboard");
  //   } catch (error) {
  //     console.error("Google Sign-In Error:", error.message);
  //   }
  // };


  // Handle Form Submission with handleEmailPasswordAuth
  const handleEmailPasswordAuth = async (e) => {
    e.preventDefault();
    try {
      const userCredential = isSignUp 
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);
      
        const user = userCredential.user;
        setUsername(isSignUp ? username : user.email); // For sign-up, use input username
        console.log("Authentication Success:", user);
        navigate("/dashboard", { state: { user: { email: user.email, displayName: user.displayName, uid: user.uid } } });
      } catch (error) {
        console.error("Email/Password Auth Error:", error.message);
        alert(error.message);
      }
  };

  return (
    <Container fluid className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <Row className="w-100">
        <Col md={6} lg={4} className="mx-auto">
          <Card className="p-4 shadow-sm border-0 rounded">
            <h2 className="text-center mb-4">{isSignUp ? "Sign Up" : "Sign In"}</h2>
            <Form onSubmit={handleEmailPasswordAuth}>
              {isSignUp && (
                <Form.Group controlId="formUsername" className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setLocalUsername(e.target.value)}
                    required
                  />
                </Form.Group>
              )}
              <Form.Group controlId="formEmail" className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group controlId="formPassword" className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>
              <Button variant="primary" type="submit" className="w-100 mb-3">
                {isSignUp ? "Sign Up" : "Sign In"}
              </Button>
            </Form>
            {/* <div className="text-center mb-3">
              <Button
                variant="outline-secondary"
                className="d-flex align-items-center justify-content-center w-100"
                onClick={handleGoogleSignIn}
              >
                <FcGoogle className="me-2" />
                {isSignUp ? "Sign Up with Google" : "Sign In with Google"}
              </Button>
            </div> */}
            <div className="text-center">
              <p className="mb-0">
                {isSignUp
                  ? "Already have an account? "
                  : "Don't have an account? "}
                <span
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="cursor-pointer"
                  style={{color:'#4D0FD8', cursor: "pointer" }}
                  
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </span>
              </p>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SignInSignUp;
