import React from "react";
import { Navbar, Nav, Container, Button, Col } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import { FaSignOutAlt, FaClock, FaMoneyBillWave, FaCalendarAlt, FaCalculator } from "react-icons/fa";
import tlogo from '../style/shiftroomlogo.png';

const NavigationBar = ({ isAuthenticated, setAuthenticated }) => {
  const navigate = useNavigate();
  const location = useLocation();

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

  // Check if we're on authentication pages
  const isAuthPage = location.pathname === "/";

  return (
    <Navbar 
      bg="light" 
      expand="lg" 
      className="shadow-sm py-2"
      style={{ backgroundColor: '#f8f9fa!important' }}
    >
      <Container fluid className="px-3 px-md-4">
        {/* Logo & Brand */}
        <Navbar.Brand 
          href="/" 
          className="d-flex align-items-center me-0 me-md-4"
          aria-label="ShiftRoom Home"
        >
          <img
            src={tlogo}
            alt="ShiftRoom Logo"
            style={{ maxHeight: "70px" }}
          />
          <span className="ms-2 fw-bold" style={{ 
            color: '#006D7D',
            fontSize: 'clamp(1.15rem, 1.5vw, 1.6rem)',
            letterSpacing: '-0.5px',
            fontFamily: "'Segoe UI', 'Roboto', sans-serif"
          }}>
            ShiftRoom
          </span>
        </Navbar.Brand>

        {/* Responsive Toggle */}
        <Navbar.Toggle 
          aria-controls="navbar-nav" 
          aria-label="Toggle navigation"
          className="border-0 py-1 px-2"
        >
          <span className="navbar-toggler-icon"></span>
        </Navbar.Toggle>

        {/* Navigation Links */}
        <Navbar.Collapse 
          id="navbar-nav" 
          className="justify-content-end"
        >
          <Nav>
            {/* For authenticated users */}
            {isAuthenticated && !isAuthPage && (
              <Nav.Link
                onClick={handleSignOut}
                className="fw-medium px-3 py-2 py-lg-1"
                style={{
                  color: '#D32F2F',
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
            )}
            
            {/* For unauthenticated users */}
            {!isAuthenticated && !isAuthPage && (
              <Nav.Link 
                href="/" 
                className="fw-medium  py-2 py-lg-1"
                style={{
                  color: '',
                  // fontSize: '1.2rem',
                  borderRadius: '',
                  // transition: 'all 0.2s ease',
                  fontFamily: "'Segoe UI', 'Roboto', sans-serif"
                }}
                // onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(230, 151, 131, 0.1)'}
                // onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                aria-label="Sign out"
              >
                    <Col md="auto" className="mt-3 mt-md-0">
                      <Button variant="light" 
                        onClick={handleSignOut}
                        style={{
                         borderRadius: '12px',
                         padding: '12px 24px',
                         color: '#0f7184ff',
                         transition: 'all 0.3s ease'
                        }}
                      
                        onMouseEnter={(e) => {
                         e.currentTarget.style.borderColor = '#625153ff';
                         e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                          e.currentTarget.style.transform = 'none';
                        }}
                        className="fw-bold"
                      >
                                               
                        <FaSignOutAlt className="me-2" />
                        Sign Out
                      </Button>
                    </Col>
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;