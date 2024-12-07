
// import React, { useState } from "react";
// import { Form, Button, Row } from "react-bootstrap";
// import { useNavigate } from "react-router-dom";
// import { auth } from "./firebaseConfig"; // Firebase config file
// import {
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
//   // signOut,
//   GoogleAuthProvider,
//   signInWithPopup,
// } from "firebase/auth";
// // import "./register.css"; // Import custom CSS for styling if needed

// function SignInSignUpPage({ setIsSignedIn }) {
//   const [isSignUp, setIsSignUp] = useState(false); // Toggles between sign-in and sign-up
//   const [email, setEmail] = useState(""); // User email
//   const [password, setPassword] = useState(""); // User password
//   const navigate = useNavigate(); // For programmatic navigation

//   const handleFormSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       if (isSignUp) {
//         // Handle user registration
//         const userCredential = await createUserWithEmailAndPassword(
//           auth,
//           email,
//           password
//         );
//         console.log("User signed up:", userCredential.user);
//       } else {
//         // Handle user login
//         const userCredential = await signInWithEmailAndPassword(
//           auth,
//           email,
//           password
//         );
//         console.log("User signed in:", userCredential.user);
//       }
//       setIsSignedIn(true); // Set signed-in state
//       navigate("/dashboard", { replace: true }); // Navigate to the welcome page
//     } catch (error) {
//       console.error("Authentication error:", error.message);
//       alert(error.message); // Show error to the user
//     }
//   };

//   const handleGoogleSignIn = async () => {
//     const provider = new GoogleAuthProvider();
//     try {
//       const result = await signInWithPopup(auth, provider);
//       console.log("Google Sign-In successful:", result.user);
//       setIsSignedIn(true); // Set signed-in state
//       navigate("/dashboard", { replace: true }); // Navigate to the welcome page
//     } catch (error) {
//       console.error("Google Sign-In error:", error.message);
//       alert(error.message); // Show error to the user
//     }
//   };

//   return (
//     <div id="wrapper">
//       <section id="register" className="know-you-container">
//         <Row className="vh-100 justify-content-center align-items-center">
//           <div className="auth-container text-dark">
//             <h2>{isSignUp ? "Sign Up" : "Sign In"}</h2>
//             <Form onSubmit={handleFormSubmit}>
//               {isSignUp && (
//                 <Form.Group controlId="formFullName">
//                   <Form.Control
//                     type="text"
//                     placeholder="Full Name"
//                     className="form-control-lg input-field text-dark"
//                     required
//                   />
//                 </Form.Group>
//               )}
//               <Form.Group controlId="formEmail" className="my-3">
//                 <Form.Control
//                   type="email"
//                   placeholder="Email"
//                   className="form-control-lg input-field text-dark"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   required
//                 />
//               </Form.Group>
//               <Form.Group controlId="formPassword" className="my-3">
//                 <Form.Control
//                   type="password"
//                   placeholder="Password"
//                   className="form-control-lg input-field text-dark"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   required
//                 />
//               </Form.Group>
//               <Button type="submit" size="lg" variant="primary" className="my-3">
//                 {isSignUp ? "Register" : "Log In"}
//               </Button>
//             </Form>
//             <Button
//               onClick={handleGoogleSignIn}
//               size="lg"
//               variant="secondary"
//               className="my-3"
//             >
//               Sign in with Google
//             </Button>

//             <h5>
//               {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
//               <span
//                 className="toggle-link text-decoration-none"
//                 onClick={() => setIsSignUp(!isSignUp)}
//               >
//                 {isSignUp ? "Sign In" : "Sign Up"}
//               </span>
//             </h5>
//           </div>
//         </Row>
//       </section>
//     </div>
//   );
// }

// export default SignInSignUpPage;