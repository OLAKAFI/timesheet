import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../style/dashboard.css"; // Custom CSS for additional styling

const Dashboard = ({ username }) => {
  const navigate = useNavigate();

  return (
    <Container
      fluid
      className="d-flex align-items-center justify-content-center bg-light vh-100"
    >
      <Row className="w-100 mx-3" style={{ maxWidth: "800px" }}>
        
        {/* Welcome Message */}
        <Col xs={12} className="text-center mb-4">
          <h1 className="display-4 text-primary fw-bold">
            Welcome
          </h1>
          <h1 className="display-4 text-primary fw-bold">
            {username || "Guest"}!
          </h1>
          <p className="fs-5 mt-3 text-muted">
            We're thrilled to have you here. This platform is designed to help
            you track your working hours, calculate overtime, and manage your
            time effectively. Achieve productivity and maintain a balanced
            work-life schedule with ease.
          </p>
        </Col>

        {/* Navigation Button */}
        <Col xs={12} className="text-center">
          <Button
            variant="primary"
            size="lg"
            className="px-4 py-2 fw-semibold"
            onClick={() => navigate("/form")}
          >
            Go to Timesheet
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
