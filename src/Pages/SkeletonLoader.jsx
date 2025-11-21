import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Container, 
  Row, 
  Col, 
  Form as BootstrapForm, 
  Card, 

} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

export default function SkeletonLoader() {
  return (
    <Container className="py-5">
        <Row className="mb-4">
        <Col>
            <div className="skeleton-button mb-3" style={{width: '120px', height: '38px'}}></div>
            <Card className="border-0 shadow-sm bg-primary text-white">
            <Card.Body className="text-center py-4">
                <div className="skeleton-icon mx-auto mb-3" style={{width: '48px', height: '48px'}}></div>
                <div className="skeleton-title mx-auto mb-2" style={{width: '200px', height: '28px'}}></div>
                <div className="skeleton-text mx-auto" style={{width: '300px', height: '20px'}}></div>
            </Card.Body>
            </Card>
        </Col>
        </Row>

        <Row className="g-4">
        <Col lg={6}>
            <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-light">
                <div className="skeleton-text" style={{width: '150px', height: '24px'}}></div>
            </Card.Header>
            <Card.Body>
                <div className="skeleton-field mb-4" style={{height: '38px'}}></div>
                <div className="skeleton-slots">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="skeleton-slot mb-2" style={{height: '40px'}}></div>
                ))}
                </div>
            </Card.Body>
            </Card>
        </Col>
        <Col lg={6}>
            <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-light">
                <div className="skeleton-text" style={{width: '150px', height: '24px'}}></div>
            </Card.Header>
            <Card.Body>
                {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton-field mb-3" style={{height: '38px'}}></div>
                ))}
                <div className="skeleton-button" style={{height: '48px'}}></div>
            </Card.Body>
            </Card>
        </Col>
        </Row>
    </Container>
  )
}


// Add CSS for skeleton loading
const skeletonStyles = `
  .skeleton-button, .skeleton-icon, .skeleton-title, .skeleton-text, 
  .skeleton-field, .skeleton-slot {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 4px;
  }

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

// Add the styles to the document
const styleSheet = document.createElement("style");
styleSheet.innerText = skeletonStyles;
document.head.appendChild(styleSheet);

