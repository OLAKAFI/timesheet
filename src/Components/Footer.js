import React from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const Footer = () => {
  return (
    <footer 
      className="py-4 py-md-5" 
      style={{ 
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
        fontFamily: "'Segoe UI', 'Roboto', sans-serif"
      }}
    >
      <Container>
        <Row className="g-4">
          {/* Brand Section */}
          <Col xs={12} md={4} className="text-center text-md-start">
            <div className="d-flex flex-column align-items-center align-items-md-start">
              <Link to={`/${"dashboard"}`} className="text-decoration-none mb-3">
                <h2 
                className="mb-2 fw-bold" 
                style={{
                  color: '#006D7D',
                  fontSize: '1.75rem',
                  letterSpacing: '-0.5px'
                }}
                >
                  ShiftRoom
                </h2>
              </Link>
              <p 
                className="mb-0 text-muted" 
                style={{ maxWidth: '280px', fontSize: '0.9rem' }}
              >
                Track your hours, calculate your earnings, and optimize your work schedule.
              </p>
            </div>
          </Col>

          {/* Links Section */}
          <Col xs={6} md={4} className="mt-0">
            <h3 
              className="h5 mb-3 fw-semibold" 
              style={{ color: '#006D7D' }}
            >
              Quick Links
            </h3>
            <ul className="list-unstyled">
              {['Contact', 'Features', 'Coming'].map((item) => (
                <li key={item} className="mb-2">
                  <Link  // Changed from <a> to <Link>
                    to={`/${item.toLowerCase()}`} 
                    className="text-decoration-none d-inline-block py-1"
                    style={{
                      color: '#5c5c5c',
                      fontSize: '0.95rem',
                      transition: 'all 0.2s ease',
                      borderBottom: '1px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#006D7D';
                      e.currentTarget.style.borderBottomColor = '#006D7D';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#5c5c5c';
                      e.currentTarget.style.borderBottomColor = 'transparent';
                    }}
                    aria-label={`Navigate to ${item}`}
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </Col>

          {/* Contact Section */}
          <Col xs={6} md={4} className="mt-0">
            <h3 
              className="h5 mb-3 fw-semibold" 
              style={{ color: '#006D7D' }}
            >
              Contact Us
            </h3>
            <ul className="list-unstyled">
              <li className="mb-2 d-flex align-items-start">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#006D7D" viewBox="0 0 16 16" className="me-2 mt-1">
                  <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414zM0 4.697v7.104l5.803-3.558zM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586zm3.436-.586L16 11.801V4.697z"/>
                </svg>
                <a 
                  href="mailto:support@shiftroom.com" 
                  className="text-decoration-none"
                  style={{ color: '#5c5c5c' }}
                  aria-label="Email support"
                >
                  support@shiftroom.com
                </a>
              </li>
              <li className="mb-2 d-flex align-items-start">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#006D7D" viewBox="0 0 16 16" className="me-2 mt-1">
                  <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.6 17.6 0 0 0 4.168 6.608 17.6 17.6 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.75 1.75 0 0 1-1.657-.459L5.482 8.062a1.75 1.75 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58z"/>
                </svg>
                <span style={{ color: '#5c5c5c' }}>
                  +447 463 233 333
                </span>
              </li>
              <li className="mt-4">
                <div className="d-flex gap-3">
                  {['facebook', 'twitter', 'linkedin', 'instagram'].map((platform) => (
                    <a 
                      key={platform}
                      href={`https://${platform}.com/shiftroom`}
                      className="text-decoration-none"
                      aria-label={`Visit our ${platform}`}
                    >
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: '36px',
                          height: '36px',
                          backgroundColor: '#e9ecef',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#006D7D';
                          e.currentTarget.querySelector('svg').style.fill = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#e9ecef';
                          e.currentTarget.querySelector('svg').style.fill = '#006D7D';
                        }}
                      >
                        {/* Social media icons (simplified for example) */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#006D7D" viewBox="0 0 16 16">
                          <path d="M0 0v16h16V0zm1 1h14v14H1z"/>
                        </svg>
                      </div>
                    </a>
                  ))}
                </div>
              </li>
            </ul>
          </Col>
        </Row>

        {/* Copyright Section */}
        <Row className="mt-4 mt-md-5 pt-3 border-top">
          <Col className="text-center">
            <p 
              className="mb-0 text-muted" 
              style={{ fontSize: '0.85rem' }}
            >
              &copy; {new Date().getFullYear()} ShiftRoom. All rights reserved.
              <span className="d-block d-md-inline mt-1 mt-md-0">
                <span className="mx-2 d-none d-md-inline">•</span> 
                <a 
                  href="/privacy" 
                  className="text-decoration-none text-muted ms-md-2"
                  style={{ borderBottom: '1px dotted #6c757d' }}
                  aria-label="Privacy policy"
                >
                  Privacy Policy
                </a>
                <a 
                  href="/terms" 
                  className="text-decoration-none text-muted ms-3"
                  style={{ borderBottom: '1px dotted #6c757d' }}
                  aria-label="Terms of service"
                >
                  Terms of Service
                </a>
              </span>
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;