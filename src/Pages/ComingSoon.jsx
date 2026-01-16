import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { FaClock, FaCalculator, FaChartLine, FaMobileAlt, FaEnvelope } from 'react-icons/fa';

const ComingSoon = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your email collection logic here
    setSubmitted(true);
  };

  // Extra insurance to scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div 
      className="vh-100 d-flex align-items-center"
      style={{
        background: 'linear-gradient(135deg, #006D7D 0%, #5E7CE2 100%)',
        fontFamily: "'Segoe UI', 'Roboto', sans-serif",
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Decorative elements */}
      <div 
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        }}
      ></div>
      <div 
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '10%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
        }}
      ></div>
      
      <Container>
        <Row className="justify-content-center">
          <Col md={8} className="text-center text-white position-relative">
            <h1 className="display-3 fw-bold mb-4">
              Track Your Time, Maximize Your Earnings
            </h1>
            
            <p className="lead mb-5 fs-2 opacity-90">
              ShiftRoom: The smart way to log hours & calculate your pay
            </p>
            
            
            <div className="my-4">
              <p className="fs-5 mb-3 opacity-90">
                Join 2,500+ early registrants from:
              </p>
              <div className="d-flex justify-content-center gap-4 flex-wrap">
                {['Healthcare', 'Hospitality', 'Retail', 'Freelance'].map((industry, i) => (
                  <span 
                    key={i} 
                    className="badge rounded-pill px-4 py-2 fw-normal"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      fontSize: '1.1rem'
                    }}
                  >
                    {industry}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="pt-4 border-top border-white border-opacity-25">
              <p className="small mb-2 opacity-75">
                GDPR Compliant • 256-bit Encryption • No Credit Card Required
              </p>
              <p className="small mb-0 opacity-75">
                © 2024 ShiftRoom • Privacy Policy • Terms of Service
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ComingSoon;