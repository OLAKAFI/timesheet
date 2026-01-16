import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import app from '../firebaseConfig';

const db = getFirestore(app);

const AdminSetupPage = () => {
  const [setupKey, setSetupKey] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetup = async (e) => {
    e.preventDefault();
    
    // Simple security check (change this to a more secure method)
    if (setupKey !== 'SETUP_2024') { // Change this key
      setMessage('❌ Invalid setup key');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const code = "ADMIN" + Math.random().toString(36).substr(2, 8).toUpperCase();
      
      await setDoc(doc(db, "admin_codes", code), {
        code: code,
        active: true,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        maxUses: 10,
        used: 0
      });

      await setDoc(doc(db, "admin_emails", "admin@shiftroom.com"), {
        email: "admin@shiftroom.com",
        role: "super_admin",
        permissions: ["dashboard", "rota", "users", "analytics", "settings"],
        createdAt: new Date(),
        active: true
      });

      setAdminCode(code);
      setMessage('✅ Admin setup completed!');
      
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Card className="shadow-lg">
        <Card.Header className="bg-warning text-dark">
          <h4 className="mb-0">🔧 Admin Setup</h4>
        </Card.Header>
        <Card.Body>
          <p className="text-muted mb-4">
            Run this setup once to initialize the admin system.
          </p>
          
          <Form onSubmit={handleSetup}>
            <Form.Group className="mb-3">
              <Form.Label>Setup Key</Form.Label>
              <Form.Control
                type="password"
                value={setupKey}
                onChange={(e) => setSetupKey(e.target.value)}
                placeholder="Enter setup key"
                required
              />
            </Form.Group>
            
            <Button 
              variant="warning" 
              type="submit" 
              disabled={loading}
              className="w-100"
            >
              {loading ? 'Setting up...' : 'Run Admin Setup'}
            </Button>
          </Form>
          
          {message && (
            <Alert variant={message.includes('❌') ? 'danger' : 'success'} className="mt-3">
              {message}
            </Alert>
          )}
          
          {adminCode && (
            <Alert variant="success" className="mt-3">
              <h5>🎉 Admin Setup Successful!</h5>
              <p><strong>Admin Code:</strong> {adminCode}</p>
              <p><strong>Admin Email:</strong> admin@shiftroom.com</p>
              <p className="small text-muted">
                Save this code! You'll need it for admin login verification.
              </p>
            </Alert>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminSetupPage;