import React from "react";
// import { Link } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from "react-router-dom";
import {FaChartLine} from 'react-icons/fa'

const Footer = () => {
  return (
    
      <footer className="landing-footer">
        <Container>
              <Row>
                <Col lg={4} className="mb-4">
                  <Link to="/" className="text-white text-decoration-none">
                    <div className="logo">  
                      <span>ShiftRoom</span>
                    </div>
                  </Link>
                  
                  <p className="footer-description">
                    The intelligent time tracking and shift management platform for modern professionals.
                  </p>
                </Col>
                <Col lg={2} md={4} xs={6} className="mb-4">
                  <h6>Product</h6>
                  <ul>
                    <li>
                      <Link to="/features" className="text-white text-decoration-none small">Features</Link>
                    </li>
                    <li><a href="#pricing">Pricing</a></li>
                    
                  </ul>
                </Col>
                <Col lg={2} md={4} xs={6} className="mb-4">
                  <h6>Company</h6>
                  <ul>
                    <li>
                      <Link to="/landing" className="text-white text-decoration-none small">About</Link>
                    </li>
                    <li>
                      <Link to="/coming" className="text-white text-decoration-none small">Blogs</Link>
                    </li>
                    <li>
                      <Link to="/contact" className="text-white text-decoration-none small">Contact</Link>
                    </li>      
                  </ul>
                </Col>
                <Col lg={2} md={4} xs={6} className="mb-4">
                  <h6>Resources</h6>
                  <ul>
                    <li>
                      <Link to="/contact" className="text-white text-decoration-none small">Help Center</Link>
                    </li>
                    <li>
                      <Link to="/coming" className="text-white text-decoration-none small">Community</Link>
                    </li>
                    <li>
                      <Link to="/landing" className="text-white text-decoration-none small">Guide</Link>
                    </li>
                  </ul>
                </Col>
                <Col lg={2} md={4} xs={6} className="mb-4">
                  <h6>Legal</h6>
                  <ul>
                    <li><a href="#privacy">Privacy</a></li>
                    <li><a href="#terms">Terms</a></li>
                    <li><a href="#security">Security</a></li>
                  </ul>
                </Col>
              </Row>
              <hr />
              <Row className="align-items-center">
                <Col md={6}>
                  <p className="mb-0">&copy; 2025 ShiftRoom. All rights reserved.</p>
                </Col>
                <Col md={6} className="text-md-end">
                  <div className="social-links">
                    <a href="#twitter">X(Twitter)</a>
                    <a href="#linkedin">LinkedIn</a>
                    <a href="#facebook">Facebook</a>
                    <a href="#instagram">Instagram</a>
                  </div>
                </Col>
              </Row>
        </Container>
    </footer>
  );
};

export default Footer;