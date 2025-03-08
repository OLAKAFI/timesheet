import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "../style/footer.css"; // Custom CSS for additional styling

const Footer = () => {
  return (
    <footer className="bg-light text-dark py-3">
      <Container>
        <Row className="text-center align-items-center">
            
          {/* Logo Section */}
          <Col xs={12} md={4} className="mb-3 mb-md-0">
            <div className="d-flex flex-column align-items-center">
              {/* <img
                src="https://via.placeholder.com/40"
                alt="Logo"
                style={{ borderRadius: "50%" }}
              /> */}
              <p className="mt-2 fw-bold" style={{ color: "#592693" }}>TimeSheet</p>
            </div>
          </Col>

          {/* Links Section */}
          <Col xs={12} md={4} className="mb-3 mb-md-0">
            <p className="mb-1 fw-semibold">Quick Links</p>
            <ul className="list-unstyled">
              <li>
                <a href="/" className="text-dark text-decoration-none">
                  Home
                </a>
              </li>
              <li>
                <a href="/about" className="text-dark text-decoration-none">
                  About
                </a>
              </li>
              <li>
                <a href="/contact" className="text-dark text-decoration-none">
                  Contact
                </a>
              </li>
            </ul>
          </Col>

          {/* Contact Section */}
          <Col xs={12} md={4}>
            <p className="mb-1 fw-semibold">Contact</p>
            <p className="mb-0">Email: support@timesheet.com</p>
            <p className="mb-0">Phone: +123 456 7890</p>
          </Col>
        </Row>

        {/* Bottom Section */}
        <Row className="mt-3">
          <Col className="text-center">
            <p className="mb-0">
              &copy; {new Date().getFullYear()} TimeSheet. All rights reserved.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
