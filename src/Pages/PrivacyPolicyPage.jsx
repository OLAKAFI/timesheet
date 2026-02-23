// PrivacyPolicyPage.jsx
import { React, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

const PrivacyPolicyPage = () => {

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="py-5" style={{ 
      backgroundColor: '#f8fafc',
      fontFamily: "'Segoe UI', 'Roboto', sans-serif",
      minHeight: '100vh'
    }}>
      <Container>

        {/* Hero Section */}
        <Row className="py-5 text-center">
          <Col>
            <h1 className="display-4 fw-bold mb-3" style={{ color: '#006D7D' }}>
              Privacy Policy
            </h1>
            <p className="lead text-muted">
              Your privacy and data security are important to us.
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
                  1. Information We Collect
                </h4>
                <p className="text-muted">
                  We collect only the information necessary to provide and improve ShiftRoom:
                </p>
                <ul className="text-muted">
                  <li>Account information (email address, name)</li>
                  <li>Timesheet and shift data you manually enter</li>
                  <li>Device information (for security and performance)</li>
                  <li>Usage analytics (non-personally identifiable)</li>
                </ul>

                <h4 className="fw-bold mt-4 mb-3" style={{ color: '#006D7D' }}>
                  2. How We Use Your Information
                </h4>
                <ul className="text-muted">
                  <li>To provide time tracking and salary calculation features</li>
                  <li>To improve app performance and user experience</li>
                  <li>To provide customer support</li>
                  <li>To ensure security and prevent fraud</li>
                </ul>

                <h4 className="fw-bold mt-4 mb-3" style={{ color: '#006D7D' }}>
                  3. Data Storage & Security
                </h4>
                <p className="text-muted">
                  We implement industry-standard security measures to protect your data. 
                  All sensitive data is transmitted over encrypted connections (HTTPS).
                  We do not sell your personal information to third parties.
                </p>

                <h4 className="fw-bold mt-4 mb-3" style={{ color: '#006D7D' }}>
                  4. Data Sharing
                </h4>
                <p className="text-muted">
                  We only share data with trusted service providers necessary for operating the app 
                  (e.g., hosting providers or analytics services). These providers are contractually 
                  obligated to safeguard your information.
                </p>

                <h4 className="fw-bold mt-4 mb-3" style={{ color: '#006D7D' }}>
                  5. Your Rights
                </h4>
                <ul className="text-muted">
                  <li>Access your stored data</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your account and associated data</li>
                  <li>Withdraw consent where applicable</li>
                </ul>
                <p className="text-muted">
                  To request deletion, contact: support@shiftroom.app
                </p>

                <h4 className="fw-bold mt-4 mb-3" style={{ color: '#006D7D' }}>
                  6. Children's Privacy
                </h4>
                <p className="text-muted">
                  ShiftRoom is not intended for children under 13. 
                  We do not knowingly collect personal data from children.
                </p>

                <h4 className="fw-bold mt-4 mb-3" style={{ color: '#006D7D' }}>
                  7. In-App Purchases & Subscriptions
                </h4>
                <p className="text-muted">
                  If applicable, subscriptions are processed through Apple App Store 
                  or Google Play. We do not directly store payment information.
                  Subscription terms and billing are managed by the respective platform.
                </p>

                <h4 className="fw-bold mt-4 mb-3" style={{ color: '#006D7D' }}>
                  8. Changes to This Policy
                </h4>
                <p className="text-muted">
                  We may update this Privacy Policy from time to time. 
                  Continued use of the app constitutes acceptance of updates.
                </p>

                <h4 className="fw-bold mt-4 mb-3" style={{ color: '#006D7D' }}>
                  9. Contact Us
                </h4>
                <p className="text-muted">
                  Email: support@shiftroom.app <br/>
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

export default PrivacyPolicyPage;
