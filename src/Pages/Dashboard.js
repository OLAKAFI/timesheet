import React from "react";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthProvider";

const Dashboard = ({ username }) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Feature cards data
  const features = [
    {
      title: "Time Tracking",
      description: "Log your work hours with precision",
      icon: "⏱️"
    },
    {
      title: "Salary Calculator",
      description: "Estimate your earnings instantly",
      icon: "💰"
    },
    {
      title: "Shift Planning",
      description: "Organize your work schedule efficiently",
      icon: "📅"
    }
  ];

  return (
    <Container fluid className="px-0">
      {/* Hero Section */}
      <div 
        className="py-5 py-md-6" 
        style={{ 
          background: 'linear-gradient(135deg, #006D7D 0%, #5E7CE2 100%)',
          borderBottomLeftRadius: '50px',
          borderBottomRightRadius: '50px'
        }}
      >
        <Container>
          <Row className="align-items-center">
            <Col md={6} className="text-center text-md-start mb-4 mb-md-0">
              <h1 
                className="display-5 fw-bold text-white mb-3"
                style={{ fontFamily: "'Segoe UI', 'Roboto', sans-serif" }}
              >
                Welcome back, {username || "Guest"}!
              </h1>
              <p 
                className="lead text-white mb-4 opacity-90"
                style={{ fontSize: '1.25rem', maxWidth: '500px' }}
              >
                Track your hours, calculate earnings, and optimize your work schedule.
              </p>
              <Button
                variant="light"
                size="lg"
                className="fw-semibold px-4 py-3"
                style={{ 
                  backgroundColor: 'white', 
                  color: '#006D7D',
                  borderRadius: '12px',
                  border: 'none'
                }}
                onClick={() => navigate("/timesheet")}
              >
                Go to Timesheet →
              </Button>
            </Col>
            <Col md={6} className="text-center">
              <div 
                className="p-4 rounded-3 d-inline-block"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
              >
                <div 
                  className="bg-white rounded-2 p-4 shadow"
                  style={{
                    width: '100%',
                    height: '220px',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(245,245,245,0.8) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div className="text-center">
                    <div 
                      className="display-4 mb-3" 
                      style={{ color: '#006D7D', fontSize: '3.5rem' }}
                    >
                      42h
                    </div>
                    <p 
                      className="mb-0 fw-medium" 
                      style={{ color: '#5E7CE2', fontSize: '1.1rem' }}
                    >
                      Tracked this week
                    </p>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Features Section */}
      <Container className="py-5 py-md-6">
        <Row className="mb-4 mb-md-5">
          <Col className="text-center">
            <h2 
              className="fw-bold mb-3"
              style={{ 
                color: '#006D7D', 
                fontSize: '2rem',
                fontFamily: "'Segoe UI', 'Roboto', sans-serif" 
              }}
            >
              Powerful Features
            </h2>
            <p 
              className="text-muted mx-auto"
              style={{ maxWidth: '600px', fontSize: '1.1rem' }}
            >
              Everything you need to manage your work hours and earnings
            </p>
          </Col>
        </Row>
        
        <Row className="g-4 justify-content-center">
          {features.map((feature, index) => (
            <Col key={index} md={4} className="d-flex">
              <Card 
                className="border-0 shadow-sm h-100 rounded-3 overflow-hidden"
                style={{ transition: 'transform 0.3s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
              >
                <Card.Body className="p-4">
                  <div 
                    className="display-5 mb-3" 
                    style={{ color: '#5E7CE2', fontSize: '2.5rem' }}
                  >
                    {feature.icon}
                  </div>
                  <Card.Title 
                    className="fw-semibold mb-3"
                    style={{ 
                      color: '#006D7D', 
                      fontSize: '1.4rem',
                      fontFamily: "'Segoe UI', 'Roboto', sans-serif" 
                    }}
                  >
                    {feature.title}
                  </Card.Title>
                  <Card.Text style={{ color: '#5c5c5c' }}>
                    {feature.description}
                  </Card.Text>
                </Card.Body>
                <div 
                  className="card-footer border-0 bg-transparent"
                  style={{ borderTop: '1px dashed rgba(0, 109, 125, 0.2)' }}
                >
                  <Button
                    variant="link"
                    className="text-decoration-none p-0 fw-medium"
                    style={{ color: '#5E7CE2' }}
                    onClick={() => navigate("/timesheet")}
                  >
                    Get started →
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* CTA Section */}
      <div 
        className="py-5" 
        style={{ backgroundColor: 'rgba(94, 124, 226, 0.05)' }}
      >
        <Container>
          <Row className="align-items-center">
            <Col md={8}>
              <h3 
                className="fw-bold mb-3"
                style={{ 
                  color: '#006D7D', 
                  fontSize: '1.8rem',
                  fontFamily: "'Segoe UI', 'Roboto', sans-serif" 
                }}
              >
                Ready to optimize your work schedule?
              </h3>
              <p 
                className="mb-0 text-muted"
                style={{ fontSize: '1.1rem', maxWidth: '600px' }}
              >
                Start tracking your hours and calculating your earnings in minutes
              </p>
            </Col>
            <Col md={4} className="text-center text-md-end mt-4 mt-md-0">
              <Button
                variant="primary"
                size="lg"
                className="fw-semibold px-4 py-3"
                style={{ 
                  backgroundColor: '#006D7D', 
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px'
                }}
                onClick={() => navigate("/timesheet")}
              >
                Get Started Now
              </Button>
            </Col>
          </Row>
        </Container>
      </div>
    </Container>
  );
};

export default Dashboard;
