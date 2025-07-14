// FeaturesPage.jsx
import React from 'react';
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FaChartLine, FaClock, FaCalculator, FaMobileAlt, FaSyncAlt, FaComments } from 'react-icons/fa';

const FeaturesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="py-5" style={{ 
      backgroundColor: '#f8fafc',
      fontFamily: "'Segoe UI', 'Roboto', sans-serif",
      minHeight: '100vh'
    }}>
      <Container>
        {/* Hero Section */}
        <Row className="align-items-center py-5">
          <Col md={6} className="text-center text-md-start mb-4 mb-md-0">
            <h1 className="display-4 fw-bold mb-3" style={{ color: '#006D7D' }}>
              ShiftRoom Features
            </h1>
            <p className="lead text-muted mb-4" style={{ fontSize: '1.25rem' }}>
              Powerful tools designed to simplify your work life and maximize your earnings
            </p>
            <div className="d-flex gap-3 justify-content-center justify-content-md-start">
              <Button 
                variant="primary" 
                size="lg" 
                style={{ 
                  backgroundColor: '#5E7CE2', 
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px'
                }}
                onClick={() => navigate("/timesheet")}
              >
                Get Started
              </Button>
              <Button 
                variant="outline-primary" 
                size="lg"
                style={{ 
                  color: '#5E7CE2', 
                  borderColor: '#5E7CE2',
                  borderRadius: '12px',
                  padding: '12px 24px'
                }}
              >
                View Demo
              </Button>
            </div>
          </Col>
          <Col md={6} className="text-center">
            <div className="position-relative">
              <div 
                className="position-absolute top-0 start-50 translate-middle"
                style={{
                  width: '300px',
                  height: '300px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #006D7D 0%, #5E7CE2 100%)',
                  opacity: 0.1,
                  zIndex: 0
                }}
              ></div>
              <div className="position-relative z-1">
                <div className="bg-white p-4 rounded-4 shadow d-inline-block">
                  <div className="d-flex gap-3 mb-3">
                    <div className="bg-light p-3 rounded-3" style={{ width: '120px', height: '120px' }}></div>
                    <div className="bg-light p-3 rounded-3" style={{ width: '120px', height: '120px' }}></div>
                  </div>
                  <div className="bg-light p-3 rounded-3" style={{ width: '250px', height: '120px' }}></div>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Feature Cards */}
        <Row className="py-5">
          <Col className="text-center mb-5">
            <h2 className="fw-bold" style={{ color: '#006D7D', fontSize: '2.5rem' }}>
              Everything You Need in One Platform
            </h2>
            <p className="text-muted mx-auto" style={{ maxWidth: '700px', fontSize: '1.1rem' }}>
              ShiftRoom combines powerful tools with an intuitive interface to give you complete control over your work hours and earnings
            </p>
          </Col>
          
          <Row className="g-4">
            {[
              { 
                icon: <FaClock size={48} style={{ color: '#5E7CE2' }} />, 
                title: 'Time Tracking', 
                description: 'Precisely log your work hours with our intuitive calendar interface. Never lose track of your time again.',
                color: '#e9f7f9'
              },
              { 
                icon: <FaCalculator size={48} style={{ color: '#006D7D' }} />, 
                title: 'Salary Calculation', 
                description: 'Automatically calculate your earnings based on hours worked. See exactly how much each shift is worth.',
                color: '#e0f7fa'
              },
              { 
                icon: <FaChartLine size={48} style={{ color: '#5E7CE2' }} />, 
                title: 'Overtime Analysis', 
                description: 'Instantly see your overtime hours and how they impact your paycheck. Maximize your earnings efficiently.',
                color: '#e9f7f9'
              },
              { 
                icon: <FaMobileAlt size={48} style={{ color: '#006D7D' }} />, 
                title: 'Mobile Access', 
                description: 'Track your time from anywhere with our mobile-friendly interface. Perfect for on-the-go professionals.',
                color: '#e0f7fa'
              },
              { 
                icon: <FaSyncAlt size={48} style={{ color: '#5E7CE2' }} />, 
                title: 'Shift Planning', 
                description: 'Plan your schedule in advance and see how it impacts your monthly earnings. Optimize your work-life balance.',
                color: '#e9f7f9'
              },
              { 
                icon: <FaComments size={48} style={{ color: '#006D7D' }} />, 
                title: 'Team Collaboration', 
                description: 'Share schedules with colleagues and coordinate shifts effortlessly. Perfect for team-based environments.',
                color: '#e0f7fa'
              }
            ].map((feature, index) => (
              <Col md={4} key={index}>
                <Card className="border-0 shadow-sm h-100 rounded-4 overflow-hidden">
                  <Card.Body className="p-4" style={{ backgroundColor: feature.color }}>
                    <div className="mb-4">{feature.icon}</div>
                    <Card.Title className="fw-bold mb-3" style={{ color: '#006D7D', fontSize: '1.5rem' }}>
                      {feature.title}
                    </Card.Title>
                    <Card.Text className="text-muted">
                      {feature.description}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Row>

        {/* Stats Section */}
        <Row className="py-5 mt-4 rounded-4" style={{ background: 'linear-gradient(135deg, #006D7D 0%, #5E7CE2 100%)' }}>
          <Col md={3} className="text-center text-white py-4">
            <h3 className="display-4 fw-bold mb-2">95%</h3>
            <p className="mb-0">Accuracy Improvement</p>
          </Col>
          <Col md={3} className="text-center text-white py-4">
            <h3 className="display-4 fw-bold mb-2">3.5h</h3>
            <p className="mb-0">Time Saved Weekly</p>
          </Col>
          <Col md={3} className="text-center text-white py-4">
            <h3 className="display-4 fw-bold mb-2">1k+</h3>
            <p className="mb-0">Active Users</p>
          </Col>
          <Col md={3} className="text-center text-white py-4">
            <h3 className="display-4 fw-bold mb-2">£250+</h3>
            <p className="mb-0">Avg. Monthly Savings</p>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default FeaturesPage;