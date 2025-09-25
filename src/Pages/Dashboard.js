import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../AuthProvider";
import { FaArrowRight, FaClock, FaChartLine, FaCalendarAlt, FaMobile, FaRocket } from 'react-icons/fa';
import '../style/landing.css';

const Dashboard = ({ username }) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  

  // Feature cards data
  const features = [
      {
        icon: <FaClock className="feature-icon" />,
        title: "Smart Time Tracking",
        description: "Automated time tracking with intelligent categorization and real-time insights",
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        url: '/timesheet'
      },
      {
        icon: <FaChartLine className="feature-icon" />,
        title: "Advanced Analytics",
        description: "Deep insights into your work patterns, productivity trends, and earnings optimization",
        gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
        url: '/dashboard/metrics'
      },
      {
        icon: <FaCalendarAlt className="feature-icon" />,
        title: "Shift Planning",
        description: "Intelligent scheduling that adapts to your preferences and maximizes efficiency",
        gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        url: '/timesheet'
      },
      {
        icon: <FaMobile className="feature-icon" />,
        title: "Mobile First",
        description: "Seamless experience across all devices with offline capability and sync",
        gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
        url: '/dashboard'
      },
      {
        icon: <FaMobile className="feature-icon" />,
        title: "Enterprise Security",
        description: "Bank-level security with end-to-end encryption and privacy controls",
        gradient: "linear-gradient(135deg, #70bafaff 0%, #40fee5ff 100%)",
        url: '/dashboard'
      },
      {
        icon: <FaRocket className="feature-icon" />,
        title: "Instant Setup",
        description: "Get started in minutes with intuitive onboarding and smart defaults",
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        url: '/dashboard'
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

  // Extra insurance to scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
              <div className="d-flex justify-content-center justify-content-md-start ">
                <Button
                  variant="light"
                  size={windowWidth < 768 ? "md" : "lg"}
                  className="fw-bold px-4 py-2 py-md-3"
                  style={{ 
                    backgroundColor: 'white', 
                    color: '#006D7D',
                    borderRadius: '12px',
                    border: 'none'
                  }}
                  onClick={() => navigate("/timesheet")}
                >
                  Go to Timesheet
                  <FaArrowRight className="ms-3 ms-md-3" />
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
      <section id="features" className="features-section">
              <Container>
                <Row className="text-center mb-5">
                  <Col>
                    <h2 className="section-title">Everything You Need in One Platform</h2>
                    <p className="section-subtitle">Designed for professionals who value their time and earnings</p>
                  </Col>
                </Row>
                <Row>
                  {features.map((feature, index) => (
                    
                      <Col md={6} lg={4} key={index} className="mb-4">
                        <Link to={feature.url} key={index} style={{ textDecoration: 'none' }}>
                          <Card 
                            className="feature-card h-100"
                            style={{ background: feature.gradient }}
                          >
                            <Card.Body className="text-center text-white p-4">
                              <div className="feature-icon-wrapper">
                                {feature.icon}
                              </div>
                              <h5 className="mt-3 mb-3">{feature.title}</h5>
                              <p className="opacity-90">{feature.description}</p>
                            </Card.Body>
                          </Card>
                        </Link>
                      </Col>
                    
                  ))}
                </Row>
              </Container>
      </section>

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