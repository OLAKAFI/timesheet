import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthProvider";

const Dashboard = ({ username }) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
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
      description: "Organize your work schedule ",
      icon: "📅"
    }
  ];

  // Track window width for responsive adjustments
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Responsive border radius for hero section
  const getHeroBorderRadius = () => {
    if (windowWidth < 576) return '30px';
    if (windowWidth < 768) return '40px';
    return '50px';
  };

  return (
    <Container fluid className="px-0 overflow-hidden">
      {/* Hero Section */}
      <div 
        className="py-4 py-md-6" 
        style={{ 
          background: 'linear-gradient(135deg, #006D7D 0%, #5E7CE2 100%)',
          borderBottomLeftRadius: getHeroBorderRadius(),
          borderBottomRightRadius: getHeroBorderRadius(),
          overflow: 'hidden'
        }}
      >
        <Container className="px-3 px-md-4">
          <Row className="align-items-center">
            <Col xs={12} md={6} className="text-center text-md-start mb-4 mb-md-0">
              <h1 
                className="display-5 fw-bold text-white mb-3"
                style={{ 
                  fontFamily: "'Segoe UI', 'Roboto', sans-serif",
                  fontSize: windowWidth < 768 ? '1.8rem' : '2.5rem'
                }}
              >
                Welcome back, {username || "Guest"}!
              </h1>
              <p 
                className="text-white mb-4 opacity-90"
                style={{ 
                  fontSize: windowWidth < 768 ? '1rem' : '1.25rem', 
                  maxWidth: '500px',
                  margin: windowWidth < 768 ? '0 auto' : '0'
                }}
              >
                Track your hours, calculate earnings, and optimize your work schedule.
              </p>
              <div className="d-flex justify-content-center justify-content-md-start">
                <Button
                  variant="light"
                  size={windowWidth < 768 ? "md" : "lg"}
                  className="fw-semibold px-4 py-2 py-md-3"
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
              </div>
            </Col>
            <Col xs={12} md={6} className="text-center mt-4 mt-md-0">
              <div 
                className="p-3 p-md-4 rounded-3 d-inline-block"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  maxWidth: '100%',
                  width: windowWidth < 768 ? '100%' : 'auto'
                }}
              >
                <div 
                  className="bg-white rounded-2 p-3 p-md-4 shadow"
                  style={{
                    width: '100%',
                    minHeight: windowWidth < 768 ? '160px' : '220px',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(245,245,245,0.8) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div className="text-center">
                    <div 
                      className="mb-2 mb-md-3" 
                      style={{ 
                        color: '#006D7D', 
                        fontSize: windowWidth < 768 ? '2.5rem' : '3.5rem',
                        fontWeight: 'bold'
                      }}
                    >
                      42h
                    </div>
                    <p 
                      className="mb-0 fw-medium" 
                      style={{ 
                        color: '#5E7CE2', 
                        fontSize: windowWidth < 768 ? '0.9rem' : '1.1rem'
                      }}
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
      <Container className="py-4 py-md-6 px-3">
        <Row className="mb-4 mb-md-5">
          <Col className="text-center">
            <h2 
              className="fw-bold mb-3"
              style={{ 
                color: '#006D7D', 
                fontSize: windowWidth < 768 ? '1.6rem' : '2rem',
                fontFamily: "'Segoe UI', 'Roboto', sans-serif" 
              }}
            >
              Powerful Features
            </h2>
            <p 
              className="text-muted mx-auto"
              style={{ 
                maxWidth: '600px', 
                fontSize: windowWidth < 768 ? '0.95rem' : '1.1rem'
              }}
            >
              Everything you need to manage your work hours and earnings
            </p>
          </Col>
        </Row>
        
        <Row className="g-4 justify-content-center mx-0">
          {features.map((feature, index) => (
            <Col 
              key={index} 
              xs={12} 
              sm={10}
              md={8}
              lg={4} 
              className="d-flex justify-content-center px-0 px-sm-3"
            >
              <Card 
                className="border-0 shadow-sm h-100 rounded-3 overflow-hidden w-100"
                style={{ 
                  transition: 'transform 0.3s ease',
                  maxWidth: '380px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
              >
                <Card.Body className="p-3 p-md-4 d-flex flex-column align-items-center text-center">
                  <div 
                    className="mb-3 d-flex align-items-center justify-content-center"
                    style={{ 
                      color: '#5E7CE2', 
                      fontSize: windowWidth < 768 ? '2.5rem' : '3rem',
                      width: windowWidth < 768 ? '70px' : '80px',
                      height: windowWidth < 768 ? '70px' : '80px',
                      backgroundColor: 'rgba(94, 124, 226, 0.1)',
                      borderRadius: '50%'
                    }}
                  >
                    {feature.icon}
                  </div>
                  <Card.Title 
                    className="fw-semibold mb-3"
                    style={{ 
                      color: '#006D7D', 
                      fontSize: windowWidth < 768 ? '1.2rem' : '1.4rem',
                      fontFamily: "'Segoe UI', 'Roboto', sans-serif" 
                    }}
                  >
                    {feature.title}
                  </Card.Title>
                  <Card.Text 
                    className="mb-3 mb-md-4" 
                    style={{ 
                      color: '#5c5c5c',
                      fontSize: windowWidth < 768 ? '0.9rem' : '1rem'
                    }}
                  >
                    {feature.description}
                  </Card.Text>
                  <Button
                    variant="outline-primary"
                    className="mt-auto fw-medium align-self-center"
                    style={{ 
                      color: '#5E7CE2',
                      borderColor: '#5E7CE2',
                      borderRadius: '30px',
                      padding: windowWidth < 768 ? '6px 16px' : '8px 20px',
                      transition: 'all 0.3s ease',
                      fontSize: windowWidth < 768 ? '0.9rem' : '1rem'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#5E7CE2';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#5E7CE2';
                    }}
                    onClick={() => navigate("/timesheet")}
                  >
                    Get started
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* CTA Section */}
      <div 
        className="py-4 py-md-5" 
        style={{ backgroundColor: 'rgba(94, 124, 226, 0.05)' }}
      >
        <Container className="px-3 px-md-4">
          <Row className="align-items-center">
            <Col xs={12} md={8} className="text-center text-md-start mb-4 mb-md-0">
              <h3 
                className="fw-bold mb-3"
                style={{ 
                  color: '#006D7D', 
                  fontSize: windowWidth < 768 ? '1.4rem' : '1.8rem',
                  fontFamily: "'Segoe UI', 'Roboto', sans-serif" 
                }}
              >
                Ready to optimize your work schedule?
              </h3>
              <p 
                className="mb-0 text-muted"
                style={{ 
                  fontSize: windowWidth < 768 ? '0.95rem' : '1.1rem', 
                  maxWidth: '600px',
                  margin: windowWidth < 768 ? '0 auto' : '0'
                }}
              >
                Start tracking your hours and calculating your earnings in minutes
              </p>
            </Col>
            <Col xs={12} md={4} className="text-center mt-3 mt-md-0">
              <Button
                variant="primary"
                size={windowWidth < 768 ? "md" : "lg"}
                className="fw-semibold px-4 py-2 py-md-3"
                style={{ 
                  backgroundColor: '#006D7D', 
                  border: 'none',
                  borderRadius: '12px',
                  padding: windowWidth < 768 ? '10px 20px' : '12px 24px'
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