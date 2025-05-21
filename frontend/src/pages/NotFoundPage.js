import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <Container className="py-5 text-center">
      <Row className="justify-content-center">
        <Col md={6}>
          <h1 className="display-4">404</h1>
          <h2>Page Not Found</h2>
          <p className="lead">
            The page you are looking for does not exist or has been moved.
          </p>
          <Button as={Link} to="/" variant="primary">
            Go to Homepage
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFoundPage;
