import React from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import tlogo from '../style/shiftroomlogo.png';

const NavigationBar = ({ isAuthenticated, setAuthenticated }) => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    setAuthenticated(false);
    sessionStorage.clear();
    localStorage.clear();
    navigate("/", { replace: true });
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = () => {
      window.history.pushState(null, null, window.location.href);
    };
  };

  return (
    <Navbar 
      bg="light" 
      expand="lg" 
      className="shadow-sm py-2"
      style={{ backgroundColor: '#f8f9fa!important' }} // Ensures light background
    >
      <Container fluid className="px-3 px-md-4"> {/* Improved spacing */}
        {/* Logo & Brand */}
        <Navbar.Brand 
          href="/dashboard" 
          className="d-flex align-items-center me-0 me-md-4" // Better spacing
          aria-label="ShiftRoom Home"
        >
          <img
            src={tlogo}
            alt="ShiftRoom Logo"
            style={{ 
              // width: "50px", 
              // height: "auto",
              maxHeight: "70px" // Better size control
            }}
          />
          <span className="ms-2 fw-bold" style={{ 
            color: '#006D7D', // Primary brand color
            fontSize: 'clamp(1.15rem, 1.5vw, 1.6rem)', // Responsive font size
            letterSpacing: '-0.5px',
            fontFamily: "'Segoe UI', 'Roboto', sans-serif" // Modern font stack
          }}>
            ShiftRoom
          </span>
        </Navbar.Brand>

        {/* Responsive Toggle - Improved accessibility */}
        <Navbar.Toggle 
          aria-controls="navbar-nav" 
          aria-label="Toggle navigation"
          className="border-0 py-1 px-2" // Cleaner appearance
        >
          <span className="navbar-toggler-icon"></span>
        </Navbar.Toggle>

        {/* Navigation Links */}
        <Navbar.Collapse 
          id="navbar-nav" 
          className="justify-content-end" // Better alignment
        >
          <Nav>
            {isAuthenticated ? (
              <Nav.Link
                onClick={handleSignOut}
                className="fw-medium px-3 py-2 py-lg-1"
                style={{
                  color: '#D32F2F', // Accessible red
                  fontSize: '1rem',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                  fontFamily: "'Segoe UI', 'Roboto', sans-serif"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(211, 47, 47, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                aria-label="Sign out"
              >
                Sign Out
              </Nav.Link>
            ) : (
              <>
                {/* <Nav.Link 
                  href="/" 
                  className="fw-medium px-3 py-2 py-lg-1 me-2"
                  style={{
                    color: '#006D7D', // Brand color
                    fontSize: '1rem',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease',
                    fontFamily: "'Segoe UI', 'Roboto', sans-serif"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 109, 125, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  aria-label="Sign up or login"
                >
                  SignUp | Login
                </Nav.Link> */}
                {/* <Nav.Link
                  onClick={handleSignOut}
                  className="fw-medium px-3 py-2 py-lg-1"
                  style={{
                    color: '#5E7CE2', // Secondary brand color
                    fontSize: '1rem',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease',
                    fontFamily: "'Segoe UI', 'Roboto', sans-serif"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(94, 124, 226, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  aria-label="Sign out"
                >
                  SignOut
                </Nav.Link> */}
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;