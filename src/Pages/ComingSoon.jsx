import React, { useState } from 'react';
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
            
            {/* <div className="d-flex justify-content-center flex-wrap gap-4 mb-5">
              {[
                { icon: <FaClock size={36} />, text: 'Instant overtime calculations' },
                { icon: <FaCalculator size={36} />, text: 'Accurate salary projections' },
                { icon: <FaChartLine size={36} />, text: 'Visual work pattern analysis' },
                { icon: <FaMobileAlt size={36} />, text: 'Mobile-friendly access' }
              ].map((item, index) => (
                <div key={index} className="d-flex flex-column align-items-center" style={{ minWidth: '200px' }}>
                  <div className="mb-3">{item.icon}</div>
                  <p className="mb-0 fs-5">{item.text}</p>
                </div>
              ))}
            </div> */}
            
            {/* <div className="bg-white rounded-4 shadow-lg p-4 p-md-5 mb-5">
              {!submitted ? (
                <>
                  <h3 className="fw-bold mb-4" style={{ color: '#006D7D' }}>
                    Launching October 2024
                  </h3>
                  
                  <p className="text-muted mb-4 fs-5">
                    First 500 signups get <span className="fw-bold text-success">premium features free for 6 months</span>
                  </p>
                  
                  <Form onSubmit={handleSubmit} className="mb-4">
                    <Row className="g-3 justify-content-center">
                      <Col md={7}>
                        <Form.Control
                          type="email"
                          placeholder="Your professional email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="py-3 px-4 border-1"
                          style={{ 
                            borderColor: '#ddd',
                            borderRadius: '10px',
                          }}
                          required
                        />
                      </Col>
                      <Col md={5} className="d-grid">
                        <Button
                          type="submit"
                          className="py-3 fw-bold border-0"
                          style={{ 
                            backgroundColor: '#006D7D', 
                            borderRadius: '10px',
                            fontSize: '1.1rem'
                          }}
                        >
                          <FaEnvelope className="me-2" />
                          Notify Me
                        </Button>
                      </Col>
                    </Row>
                  </Form>
                  
                  <p className="text-muted mb-0 small">
                    Get launch updates + free productivity guide
                  </p>
                </>
              ) : (
                <div className="py-4">
                  <h3 className="fw-bold mb-3 text-success">You're On The List!</h3>
                  <p className="fs-5 text-muted">
                    Check your inbox for confirmation. We'll send launch updates and your free productivity guide.
                  </p>
                </div>
              )}
            </div> */}
            
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