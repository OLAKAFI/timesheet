import React, { useState } from 'react';
import { Button, Card, Alert, Spinner } from 'react-bootstrap';
import { FaKey, FaCopy } from 'react-icons/fa';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import app from '../firebaseConfig';

const db = getFirestore(app);

const AdminTools = () => {
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateInviteCode = async () => {
    setLoading(true);
    setError('');
    
    try {
      const code = 'ADMIN' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      await addDoc(collection(db, 'admin_invite_codes'), {
        code: code,
        generatedBy: 'admin_panel',
        generatedAt: new Date(),
        expiresAt: expiresAt,
        isUsed: false,
        maxUses: 1
      });
      
      setGeneratedCode(code);
    } catch (err) {
      setError('Failed to generate code: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    alert('Code copied to clipboard!');
  };

  return (
    <Card className="admin-tools-card">
      <Card.Header>
        <h5><FaKey className="me-2" />Admin Invite Code Generator</h5>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <div className="text-center mb-4">
          {generatedCode ? (
            <div>
              <Alert variant="success">
                <h4>✅ Code Generated!</h4>
                <div className="d-flex align-items-center justify-content-center my-3">
                  <code className="fs-3 bg-light p-3 rounded">{generatedCode}</code>
                  <Button 
                    variant="outline-secondary" 
                    className="ms-2"
                    onClick={copyToClipboard}
                  >
                    <FaCopy />
                  </Button>
                </div>
                <p className="mb-0">Expires: 7 days from now</p>
              </Alert>
              <Button 
                variant="primary" 
                onClick={() => setGeneratedCode('')}
              >
                Generate Another
              </Button>
            </div>
          ) : (
            <div>
              <p>Generate a new admin invite code. This code can be used once for admin registration.</p>
              <Button 
                variant="warning" 
                onClick={generateInviteCode}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Generating...
                  </>
                ) : (
                  'Generate Invite Code'
                )}
              </Button>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default AdminTools;