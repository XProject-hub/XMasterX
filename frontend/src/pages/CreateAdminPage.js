import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { authAPI } from '../utils/api';

const CreateAdminPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('info');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !email || !password || !secretKey) {
      setMessage('All fields are required');
      setMessageType('danger');
      return;
    }
    
    try {
      setLoading(true);
      const { data } = await authAPI.createAdmin(username, email, password, secretKey);
      
      setMessage('Admin account created successfully!');
      setMessageType('success');
      
      // Clear form
      setUsername('');
      setEmail('');
      setPassword('');
      setSecretKey('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error creating admin account');
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title className="text-center mb-4">Create Admin Account</Card.Title>
              
              {message && (
                <Alert variant={messageType} onClose={() => setMessage(null)} dismissible>
                  {message}
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Admin Secret Key</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter admin secret key"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    required
                  />
                  <Form.Text className="text-muted">
                    This is the secret key defined in your backend .env file
                  </Form.Text>
                </Form.Group>
                
                <Button
                  variant="primary"
                  type="submit"
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Admin Account'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CreateAdminPage;
