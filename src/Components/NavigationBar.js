import React from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const NavigationBar = ({ isAuthenticated, setAuthenticated }) => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    setAuthenticated(false); // Update auth state
    navigate("/", { replace: true }); // Redirect to login/signup page
  };

  return (
    <Navbar bg="light" expand="lg" className="shadow-sm">
      <Container>
        {/* Logo */}
        <Navbar.Brand href="/" className="fw-bold text-primary">
          <img
            src="https://via.placeholder.com/40"
            alt="Logo"
            className="me-2"
            style={{ borderRadius: "50%" }}
          />
          MyApp
        </Navbar.Brand>

        {/* Responsive Toggle */}
        <Navbar.Toggle aria-controls="navbar-nav" />

        {/* Navigation Links */}
        <Navbar.Collapse id="navbar-nav">
          <Nav className="ms-auto">
            {!isAuthenticated ? (
              <>
                <Nav.Link href="/" className="text-dark fw-semibold">
                  SignUp/Login
                </Nav.Link>
                {/* <Nav.Link href="/login" className="text-dark fw-semibold">
                  Login
                </Nav.Link> */}
                <Nav.Link
                    onClick={handleSignOut}
                    className="text-danger fw-semibold"
                >
                    SignOut
                </Nav.Link>
              </>
            ) : (
              <Nav.Link
                onClick={handleSignOut}
                className="text-danger fw-semibold"
              >
                SignOut
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
