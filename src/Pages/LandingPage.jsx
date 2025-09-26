import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import { Link, useNavigate} from "react-router-dom";
// import { useAuth } from "../AuthProvider";
import { FaArrowRight, FaPlay, FaChartLine, FaClock, FaCalendarAlt, FaMobile, FaRocket } from 'react-icons/fa';
import '../style/landing.css';
import tlogo from '../style/shiftroomlogo.png';

const LandingPage = ({ username }) => {
  const navigate = useNavigate();
//   const { user, loading } = useAuth();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isVisible, setIsVisible] = useState(false);


  // Feature cards data
  const features = [
    {
      icon: <FaClock className="feature-icon" />,
      title: "Smart Time Tracking",
      description: "Automated time tracking with intelligent categorization and real-time insights",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    {
      icon: <FaChartLine className="feature-icon" />,
      title: "Advanced Analytics",
      description: "Deep insights into your work patterns, productivity trends, and earnings optimization",
      gradient: "linear-gradient(135deg, #70bafaff 0%, #40fee5ff 100%)"
    },
    {
      icon: <FaCalendarAlt className="feature-icon" />,
      title: "Shift Planning",
      description: "Intelligent scheduling that adapts to your preferences and maximizes efficiency",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
    },
    {
      icon: <FaMobile className="feature-icon" />,
      title: "Mobile First",
      description: "Seamless experience across all devices with offline capability and sync",
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
    },
    {
      icon: <FaMobile className="feature-icon" />,
      title: "Enterprise Security",
      description: "Bank-level security with end-to-end encryption and privacy controls",
      gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
    },
    {
      icon: <FaRocket className="feature-icon" />,
      title: "Instant Setup",
      description: "Get started in minutes with intuitive onboarding and smart defaults",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    }
  ];

  const stats = [
    { number: "1K+", label: "Active Users" },
    { number: "500K+", label: "Hours Tracked" },
    { number: "98%", label: "Satisfaction Rate" },
    { number: "24/7", label: "Support" }
  ];

  // Animation on scroll
  useEffect(() => {
    setIsVisible(true);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="landing-page">
      {/* Navigation */}
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
                <a href="#features">Features</a>
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

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-gradient"></div>
        </div>
        <Container>
          <Row className="align-items-center min-vh-80 py-5">
            <Col lg={6} className={`hero-content ${isVisible ? 'fade-in-up' : ''}`}>
              <div className="badge">Trusted by 10,000+ professionals</div>
              <h1 className="hero-title">
                Work Smarter, 
                <span className="gradient-text"> Not Harder</span>
              </h1>
              <p className="hero-description">
                ShiftRoom transforms how you track time, manage shifts, and optimize your earnings. 
                Join thousands of professionals who've reclaimed their time and increased their productivity.
              </p>
              <div className="hero-buttons">
                <Button 
                  size="lg" 
                  className="primary-btn me-3 mb-2"
                //  onClick={() => navigate(user ? "/timesheet" : "/signin")}
                    onClick={() => navigate("/signin")}
                >
                   Start Free Trial
                  <FaArrowRight className="ms-2" />
                </Button>
                <Button 
                  variant="outline-light" 
                  size="lg"
                  className="secondary-btn mb-2"
                  onClick={() => navigate("/signin")}
                >
                  <FaPlay className="me-2" />
                  Watch Demo
                </Button>
              </div>
              <div className=" hero-stats">
                <div className=" d-none d-md-block stat-item">
                  <strong>10+</strong>
                  <span>Features</span>
                </div>
                <div className=" d-none d-md-block stat-item">
                  <strong>99.9%</strong>
                  <span>Uptime</span>
                </div>
                <div className=" d-none d-md-block stat-item">
                  <strong>24/7</strong>
                  <span>Support</span>
                </div>
              </div>
            </Col>
            <Col lg={6} className={`hero-visual ${isVisible ? 'fade-in' : ''}`}>
              <div className="hero-card-stack">
                <div className="card-item card-1">
                  <div className="card-header">
                    <div className="card-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                  <div className="card-content">
                    <div className="chart-placeholder"></div>
                    <div className="card-stats">
                      <div className="stat">
                        <span className="label">Hours This Week</span>
                        <span className="value">42h</span>
                      </div>
                      <div className="stat">
                        <span className="label">Earnings</span>
                        <span className="value">£600</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-item card-2">
                  <div className="card-header">
                    <FaCalendarAlt />
                    <span>Shift Planner</span>
                  </div>
                  <div className="calendar-placeholder"></div>
                </div>
                <div className="card-item card-3">
                  <div className="progress-ring">
                    <div className="ring"></div>
                    <div className="progress-text">
                      <span>75%</span>
                      <small>Productivity</small>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <Container>
          <Row>
            {stats.map((stat, index) => (
              <Col xs={6} md={3} key={index} className="text-center">
                <div className="stat-card">
                  <h3>{stat.number}</h3>
                  <p>{stat.label}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

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
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <Container>
          <Row className="text-center">
            <Col lg={8} className="mx-auto">
              <h2>Ready to Transform Your Work Life?</h2>
              <p className="mb-4">Join thousands of professionals who use ShiftRoom to save time and increase earnings</p>
              <Button 
                size="lg" 
                className="primary-btn"
                onClick={() => navigate("/signin")}
              >
                Sign In | Register
                <FaArrowRight className="ms-2" />
              </Button>
              <div className="trust-badge mt-3">
                <small>No credit card required • 14-day free trial • Cancel anytime</small>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

    
    </div>
  );
};

export default LandingPage;