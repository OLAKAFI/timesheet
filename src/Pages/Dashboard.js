import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Dashboard = ({ username }) => {
  const navigate = useNavigate();

//   // Default welcome name in case no username is provided
//   const displayName = userName || "Guest";

  return (
    <Container fluid className="vh-100 d-flex flex-column align-items-center justify-content-center bg-light">
      <Row className="text-center">
        <Col>
          <h1 className="display-4 text-primary fw-bold">
            Welcome, {username || "Guest"}!
          </h1>
          <p className="fs-5 mt-3 text-muted">
            We're thrilled to have you on board. This platform is designed to
            help you calculate working hours and manage your time effectively. With
            features tailored to enhance productivity, this project empowers you
            to keep track of your work hours, calculate overtime, and ensure a
            balanced work-life schedule.
          </p>
        </Col>
      </Row>
      <Row className="text-center mt-4">
        <Col>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate("/form")}
          >
            Go to Time Management Form
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
