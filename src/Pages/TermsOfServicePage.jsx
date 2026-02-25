// TermsOfServicePage.jsx
import { React, useEffect } from 'react';
import { Container, Button, Row, Col, Card, Nav } from 'react-bootstrap';
import { Link, useNavigate} from "react-router-dom";
import NavigationBar from '../Components/NavigationBar';
import '../style/landing.css';
import tlogo from '../style/shiftroomlogo.png';

const TermsOfServicePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="py-5" style={{ 
      backgroundColor: '#f8fafc',
      fontFamily: "'Segoe UI', 'Roboto', sans-serif",
      minHeight: '100vh'
    }}>
      <nav className="landing-nav">
        <Container>
          <Row className="align-items-center py-3">
            <Col xs={6} md={4}>
              <div className="logo">
                <img
                  src={tlogo}
                  alt="ShiftRoom Logo"
                  style={{ maxHeight: "70px" }}
                />
                <span>ShiftRoom</span>
              </div>
            </Col>
            <Col md={4} className="d-none d-md-block">
              <div className="nav-links">
                <a href="features">Features</a>
                <Link to="/contact">Contact Us</Link>
                
              </div>
            </Col>
            <Col xs={6} md={4} className="text-end">
                <Button 
                  variant="outline-primary" 
                  onClick={() => navigate("/signin")}
                  className="nav-button"
                >
                  Sign In | Sign Up
                </Button>
              
            </Col>
          </Row>
        </Container>
      </nav>

      <Container>
        {/* Hero Section */}
        <Row className="py-5 text-center">
          <Col>
            <h1 className="display-4 fw-bold mb-3" style={{ color: '#006D7D' }}>
              Terms of Service
            </h1>
            <p className="lead text-muted">
              Please read these terms carefully before using ShiftRoom.
            </p>
            <p className="text-muted">
              Last Updated: January 2026
            </p>
          </Col>
        </Row>

        {/* Content Card */}
        <Row>
          <Col>
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Body className="p-5">

                <h4 className="fw-bold mb-3" style={{ color: '#006D7D' }}>
                  1. Acceptance of Terms
                </h4>
                <p className="text-muted">
                  By accessing or using ShiftRoom, you agree to be bound by these Terms.
                  If you do not agree, please do not use the app.
                </p>

                <h4 className="fw-bold mt-4 mb-3" style={{ color: '#006D7D' }}>
                  2. Use of the Service
                </h4>
                <ul className="text-muted">
                  <li>You must be at least 13 years old.</li>
                  <li>You agree to provide accurate information.</li>
                  <li>You are responsible for maintaining account security.</li>
                </ul>

                <h4 className="fw-bold mt-4 mb-3" style={{ color: '#006D7D' }}>
                  3. User Content
                </h4>
                <p className="text-muted">
                  You retain ownership of the data you enter (e.g., shift hours).
                  We do not claim ownership of your personal data.
                </p>

                <h4 className="fw-bold mt-4 mb-3" style={{ color: '#006D7D' }}>
                  4. Subscriptions & Payments
                </h4>
                <p className="text-muted">
                  Paid subscriptions are billed through Apple App Store or Google Play.
                  Subscription renewals and cancellations are managed by the platform.
                  Refund policies follow the respective store’s policies.
                </p>

                <h4 className="fw-bold mt-4 mb-3" style={{ color: '#006D7D' }}>
                  5. Prohibited Activities
                </h4>
                <ul className="text-muted">
                  <li>Attempting to reverse engineer the app</li>
                  <li>Using the app for unlawful purposes</li>
                  <li>Disrupting service functionality</li>
                </ul>

                <h4 className="fw-bold mt-4 mb-3" style={{ color: '#006D7D' }}>
                  6. Disclaimer
                </h4>
                <p className="text-muted">
                  ShiftRoom provides time and earnings estimates for informational purposes only.
                  We do not guarantee accuracy for payroll or tax calculations.
                </p>

                <h4 className="fw-bold mt-4 mb-3" style={{ color: '#006D7D' }}>
                  7. Limitation of Liability
                </h4>
                <p className="text-muted">
                  To the maximum extent permitted by law, ShiftRoom shall not be liable 
                  for indirect, incidental, or consequential damages arising from use of the app.
                </p>

                <h4 className="fw-bold mt-4 mb-3" style={{ color: '#006D7D' }}>
                  8. Termination
                </h4>
                <p className="text-muted">
                  We reserve the right to suspend or terminate accounts 
                  that violate these Terms.
                </p>

                <h4 className="fw-bold mt-4 mb-3" style={{ color: '#006D7D' }}>
                  9. Changes to Terms
                </h4>
                <p className="text-muted">
                  We may update these Terms periodically. Continued use 
                  of the app constitutes acceptance of changes.
                </p>

                <h4 className="fw-bold mt-4 mb-3" style={{ color: '#006D7D' }}>
                  10. Contact Information
                </h4>
                <p className="text-muted">
                  Email: support@shiftroom.co.uk <br/>
                  Company: ShiftRoom Ltd
                </p>

              </Card.Body>
            </Card>
          </Col>
        </Row>

      </Container>
    </div>
  );
};

export default TermsOfServicePage;
