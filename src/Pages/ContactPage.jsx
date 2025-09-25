// ContactPage.jsx
import {React, useEffect} from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { FaEnvelope, FaMapMarkerAlt, FaPhone, FaComments } from 'react-icons/fa';

const ContactPage = () => {
  // Extra insurance to scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="py-5" style={{ 
      backgroundColor: '#ffffff',
      fontFamily: "'Segoe UI', 'Roboto', sans-serif",
      minHeight: '100vh'
    }}>
      <Container>
        <Row className="align-items-center py-5">
          <Col md={6} className="mb-4 mb-md-0">
            <h1 className="display-4 fw-bold mb-3" style={{ color: '#006D7D' }}>
              Get in Touch
            </h1>
            <p className="lead text-muted mb-4" style={{ fontSize: '1.25rem' }}>
              Have questions or need support? Our team is ready to help you get the most out of ShiftRoom.
            </p>
            
            <div className="mb-5">
              <div className="d-flex align-items-start mb-4">
                <div className="bg-primary text-white p-3 rounded-circle me-3">
                  <FaEnvelope size={24} />
                </div>
                <div>
                  <h5 className="fw-bold" style={{ color: '#006D7D' }}>Email Us</h5>
                  <p className="mb-0">support@shiftroom.com</p>
                </div>
              </div>
              
              <div className="d-flex align-items-start mb-4">
                <div className="bg-primary text-white p-3 rounded-circle me-3">
                  <FaPhone size={24} />
                </div>
                <div>
                  <h5 className="fw-bold" style={{ color: '#006D7D' }}>Call Us</h5>
                  <p className="mb-0">+44 7463 233 333</p>
                  <p>Mon-Fri, 9am-5pm GMT</p>
                </div>
              </div>
              
              <div className="d-flex align-items-start">
                <div className="bg-primary text-white p-3 rounded-circle me-3">
                  <FaMapMarkerAlt size={24} />
                </div>
                <div>
                  <h5 className="fw-bold" style={{ color: '#006D7D' }}>Location</h5>
                  <p className="mb-0">Manchester</p>
                  <p>UK</p>
                </div>
              </div>
            </div>
            
            <div className="d-flex gap-3">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="rounded-circle d-flex align-items-center justify-content-center" style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#e9f7f9',
                  color: '#006D7D',
                  fontSize: '1.25rem'
                }}>
                  {item === 1 ? 'f' : item === 2 ? 'in' : item === 3 ? 't' : 'ig'}
                </div>
              ))}
            </div>
          </Col>
          
          <Col md={6}>
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
              <Card.Body className="p-4 p-md-5">
                <h3 className="fw-bold mb-4" style={{ color: '#006D7D' }}>Send us a message</h3>
                
                <Form>
                  <Row className="mb-4">
                    <Col md={6}>
                      <Form.Group controlId="formName">
                        <Form.Label className="fw-medium text-muted">Full Name</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter your name"
                          className="py-3 px-3 border-1"
                          style={{ 
                            borderColor: '#ddd',
                            borderRadius: '10px',
                            backgroundColor: '#fdfdfd'
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="formEmail">
                        <Form.Label className="fw-medium text-muted">Email</Form.Label>
                        <Form.Control
                          type="email"
                          placeholder="Enter your email"
                          className="py-3 px-3 border-1"
                          style={{ 
                            borderColor: '#ddd',
                            borderRadius: '10px',
                            backgroundColor: '#fdfdfd'
                          }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Form.Group controlId="formSubject" className="mb-4">
                    <Form.Label className="fw-medium text-muted">Subject</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="What's this regarding?"
                      className="py-3 px-3 border-1"
                      style={{ 
                        borderColor: '#ddd',
                        borderRadius: '10px',
                        backgroundColor: '#fdfdfd'
                      }}
                    />
                  </Form.Group>
                  
                  <Form.Group controlId="formMessage" className="mb-4">
                    <Form.Label className="fw-medium text-muted">Message</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      placeholder="How can we help you?"
                      className="py-3 px-3 border-1"
                      style={{ 
                        borderColor: '#ddd',
                        borderRadius: '10px',
                        backgroundColor: '#fdfdfd'
                      }}
                    />
                  </Form.Group>
                  
                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100 py-3 fw-bold border-0"
                    style={{ 
                      backgroundColor: '#006D7D', 
                      borderRadius: '10px',
                      fontSize: '1.1rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Send Message
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        {/* FAQ Section */}
        <Row className="py-5">
          <Col className="text-center mb-5">
            <h2 className="fw-bold" style={{ color: '#006D7D', fontSize: '2.5rem' }}>
              Frequently Asked Questions
            </h2>
            <p className="text-muted mx-auto" style={{ maxWidth: '700px', fontSize: '1.1rem' }}>
              Find quick answers to common questions about ShiftRoom
            </p>
          </Col>
          
          <Row className="g-4">
            {[
              { 
                question: 'How secure is my data with ShiftRoom?', 
                answer: 'We use bank-level encryption and strict security protocols to ensure your data is always protected. Your information is never shared with third parties.' 
              },
              { 
                question: 'Can I access ShiftRoom on my mobile device?', 
                answer: 'Yes! ShiftRoom is fully responsive and works on all devices. You can track your hours from anywhere at any time.' 
              },
              { 
                question: 'What happens if I work overtime?', 
                answer: 'Our system automatically calculates overtime based on your contract hours. You\'ll see exactly how much extra you\'ve earned.' 
              },
              { 
                question: 'How often is my data saved?', 
                answer: 'All changes are saved automatically in real-time. You never have to worry about losing your timesheet data.' 
              },
              { 
                question: 'Can I export my timesheets?', 
                answer: 'Yes, you can export your timesheets as PDF or CSV files for record-keeping or sharing with your employer.' 
              },
              { 
                question: 'Is there a free trial available?', 
                answer: 'Absolutely! You can try all features free for 14 days with no credit card required. After that, choose a plan that suits you best.' 
              }
            ].map((faq, index) => (
              <Col md={6} key={index}>
                <div className="p-4 rounded-4 mb-3" style={{ backgroundColor: '#e9f7f9', borderLeft: '4px solid #5E7CE2' }}>
                  <h5 className="fw-bold mb-3" style={{ color: '#006D7D' }}>{faq.question}</h5>
                  <p className="text-muted mb-0">{faq.answer}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Row>
      </Container>
    </div>
  );
};

export default ContactPage;