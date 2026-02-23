// SupportPage.jsx
import React from 'react';
import { Button, Row, Col, Card } from 'react-bootstrap';
import { FaEnvelope, FaTrashAlt, FaCreditCard, FaBug, FaQuestionCircle } from 'react-icons/fa';
import LegalLayout from './LegalLayout';

const SupportPage = () => {

  const emailSupport = () => {
    window.location.href = "mailto:support@shiftroom.app?subject=ShiftRoom Support Request";
  };

  return (
    <LegalLayout
      title="Support"
      subtitle="We're here to help you with any questions or issues."
      lastUpdated="January 2026"
    >

      {/* Contact Section */}
      <Row className="mb-5">
        <Col md={6}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <FaEnvelope size={32} style={{ color: '#5E7CE2' }} />
              <h5 className="fw-bold mt-3" style={{ color: '#006D7D' }}>
                Contact Support
              </h5>
              <p className="text-muted">
                For general questions, technical issues, or feature requests.
              </p>
              <Button
                variant="primary"
                style={{
                  backgroundColor: '#5E7CE2',
                  border: 'none',
                  borderRadius: '12px'
                }}
                onClick={emailSupport}
              >
                Email Support
              </Button>
              <p className="text-muted mt-3 mb-0">
                We aim to respond within 24–48 hours.
              </p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <FaTrashAlt size={32} style={{ color: '#dc3545' }} />
              <h5 className="fw-bold mt-3" style={{ color: '#006D7D' }}>
                Delete Account
              </h5>
              <p className="text-muted">
                Request permanent deletion of your account and data.
              </p>
              <Button
                variant="outline-danger"
                style={{ borderRadius: '12px' }}
                href="/delete-account"
              >
                Delete My Account
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Subscription Help */}
      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Body className="p-4">
          <FaCreditCard size={28} style={{ color: '#5E7CE2' }} />
          <h5 className="fw-bold mt-3" style={{ color: '#006D7D' }}>
            Subscription & Billing
          </h5>
          <p className="text-muted">
            Subscriptions are managed through the Apple App Store or Google Play.
            To cancel or manage billing:
          </p>
          <ul className="text-muted">
            <li>Open your device Settings</li>
            <li>Go to Subscriptions</li>
            <li>Select ShiftRoom</li>
            <li>Manage or cancel your subscription</li>
          </ul>
          <p className="text-muted mb-0">
            Refunds follow Apple or Google policies.
          </p>
        </Card.Body>
      </Card>

      {/* Technical Issues */}
      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Body className="p-4">
          <FaBug size={28} style={{ color: '#5E7CE2' }} />
          <h5 className="fw-bold mt-3" style={{ color: '#006D7D' }}>
            Technical Issues
          </h5>
          <ul className="text-muted">
            <li>Ensure the app is updated to the latest version</li>
            <li>Restart your device</li>
            <li>Check your internet connection</li>
            <li>Contact support if issues persist</li>
          </ul>
        </Card.Body>
      </Card>

      {/* FAQ Section */}
      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-4">
          <FaQuestionCircle size={28} style={{ color: '#5E7CE2' }} />
          <h5 className="fw-bold mt-3" style={{ color: '#006D7D' }}>
            Frequently Asked Questions
          </h5>

          <div className="mt-3">
            <p className="fw-bold mb-1">Is my data secure?</p>
            <p className="text-muted">
              Yes. We use encrypted HTTPS connections and secure hosting practices.
            </p>

            <p className="fw-bold mb-1">Can I export my data?</p>
            <p className="text-muted">
              Yes. Contact support to request a data export.
            </p>

            <p className="fw-bold mb-1">How do I request data deletion?</p>
            <p className="text-muted">
              Visit the Delete Account page or email support.
            </p>
          </div>
        </Card.Body>
      </Card>

    </LegalLayout>
  );
};

export default SupportPage;
