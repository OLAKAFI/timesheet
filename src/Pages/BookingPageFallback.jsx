// src/Pages/BookingPageFallback.jsx
import React from 'react';
import { Container, Card, Button, Alert } from 'react-bootstrap';
import { FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const BookingPageFallback = () => {
  const navigate = useNavigate();

  return (
    <Container className="min-vh-100 d-flex align-items-center justify-content-center">
      <Card className="border-0 shadow-sm" style={{ maxWidth: '500px' }}>
        <Card.Body className="text-center p-5">
          <FaExclamationTriangle size={64} className="text-warning mb-4" />
          <h2 className="mb-3">Invalid Booking Link</h2>
          <Alert variant="warning" className="mb-4">
            <p className="mb-0">
              The booking link appears to be incomplete or invalid. 
              Please check that you have the complete booking URL.
            </p>
          </Alert>
          <p className="text-muted mb-4">
            If you received this link from someone, please ask them to provide 
            the complete booking URL.
          </p>
          <div className="d-flex gap-3 justify-content-center">
            <Button 
              variant="primary" 
              onClick={() => navigate("/")}
              size="lg"
            >
              <FaArrowLeft className="me-2" />
              Return Home
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default BookingPageFallback;