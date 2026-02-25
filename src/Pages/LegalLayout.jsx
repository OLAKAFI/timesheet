// LegalLayout.jsx
import { React, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

const LegalLayout = ({ title, subtitle, lastUpdated, children }) => {

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
              {title}
            </h1>
            <p className="lead text-muted">{subtitle}</p>
            <p className="text-muted">
              Last Updated: {lastUpdated}
            </p>
          </Col>
        </Row>

        {/* Content Card */}
        <Row>
          <Col>
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Body className="p-5">
                {children}
              </Card.Body>
            </Card>
          </Col>
        </Row>

      </Container>
    </div>
  );
};

export default LegalLayout;