import React from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import tlogo from '../TIMESHEET.png'

const NavigationBar = ({ isAuthenticated, setAuthenticated }) => {
  const navigate = useNavigate();


  const handleSignOut = () => {
    // Clear authentication state
    setAuthenticated(false);

  
    // Clear session storage or local storage if used for auth
    sessionStorage.clear();
    localStorage.clear();

  
    // Redirect to the login/signup page and replace the current history entry
    navigate("/", { replace: true });

  
    // Optionally clear browser history stack (disable back/forward navigation)
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = () => {
      window.history.pushState(null, null, window.location.href);
    };
  };
  

  return (
    <Navbar bg="light" expand="lg" className="shadow-sm">
      <Container>
        {/* App name and Logo */}
        <Navbar.Brand href="/" className="fw-bold text-primary">
          <div className="h-100">
            <img
              src={tlogo}
              alt="Logo"
              className="me-2 img-fluid" 
              // style={{ borderRadius: "50%" }}
            />
          </div>
          
        </Navbar.Brand>

        {/* Responsive Toggle */}
        <Navbar.Toggle aria-controls="navbar-nav" />

        {/* Navigation Links */}
        <Navbar.Collapse id="navbar-nav">
          <Nav className="ms-auto">
            {!isAuthenticated ? (
              <>
                <Nav.Link href="/" className="text-dark fw-semibold">
                  SignUp | Login
                </Nav.Link>
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
