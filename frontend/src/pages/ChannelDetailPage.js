import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCopy, faEye, faHeart, faHeartBroken } from '@fortawesome/free-solid-svg-icons';
import ChannelStatistics from '../components/ChannelStatistics';
import { channelAPI } from '../utils/api';
import { UserProfileContext } from '../context/UserProfileContext';

const ChannelDetailPage = () => {
  const { id } = useParams();
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  
  const { isInFavorites, addToFavorites, removeFromFavorites, addToWatchHistory } = useContext(UserProfileContext);
  
  useEffect(() => {
    const fetchChannel = async () => {
      try {
        setLoading(true);
        const { data } = await channelAPI.getById(id);
        
        if (data.success) {
          setChannel(data.data);
        }
        
        setLoading(false);
      } catch (error) {
        setError('Error loading channel details');
        setLoading(false);
        console.error('Error loading channel details:', error);
      }
    };
    
    fetchChannel();
  }, [id]);
  
  const copyToClipboard = () => {
    if (channel) {
      navigator.clipboard.writeText(channel.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleWatchChannel = async () => {
    if (channel) {
      // Add to watch history
      await addToWatchHistory(channel._id);
      
      // Open channel URL in new tab
      window.open(channel.url, '_blank');
    }
  };
  
  const handleFavoriteToggle = async () => {
    if (channel) {
      if (isInFavorites(channel._id)) {
        await removeFromFavorites(channel._id);
      } else {
        await addToFavorites(channel._id);
      }
    }
  };
  
  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading channel details...</p>
        </div>
      </Container>
    );
  }
  
  if (error || !channel) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          {error || 'Channel not found'}
        </Alert>
        <Button as={Link} to="/" variant="outline-primary">
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Back to Home
        </Button>
      </Container>
    );
  }
  
  return (
    <Container className="py-4">
      <Button as={Link} to="/" variant="outline-primary" className="mb-4">
        <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
        Back to Home
      </Button>
      
      <Card className="mb-4">
        <Card.Header>
          <h4 className="mb-0">{channel.name}</h4>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <dl className="row">
                <dt className="col-sm-4">Provider</dt>
                <dd className="col-sm-8">{channel.provider}</dd>
                
                <dt className="col-sm-4">Format</dt>
                <dd className="col-sm-8">
                  <Badge bg="secondary">{channel.format.toUpperCase()}</Badge>
                </dd>
                
                <dt className="col-sm-4">Status</dt>
                <dd className="col-sm-8">
                  <Badge bg={channel.isLive ? 'success' : 'danger'}>
                    {channel.isLive ? 'Live' : 'Down'}
                  </Badge>
                </dd>
                
                {channel.category && (
                  <>
                    <dt className="col-sm-4">Category</dt>
                    <dd className="col-sm-8">{channel.category}</dd>
                  </>
                )}
                
                {channel.language && channel.language !== 'Unknown' && (
                  <>
                    <dt className="col-sm-4">Language</dt>
                    <dd className="col-sm-8">{channel.language}</dd>
                  </>
                )}
                
                {channel.country && channel.country !== 'Unknown' && (
                  <>
                    <dt className="col-sm-4">Country</dt>
                    <dd className="col-sm-8">{channel.country}</dd>
                  </>
                )}
                
                {channel.tags && channel.tags.length > 0 && (
                  <>
                    <dt className="col-sm-4">Tags</dt>
                    <dd className="col-sm-8">
                      {channel.tags.map((tag, index) => (
                        <Badge key={index} bg="info" className="me-1 mb-1">{tag}</Badge>
                      ))}
                    </dd>
                  </>
                )}
                
                <dt className="col-sm-4">Last Checked</dt>
                <dd className="col-sm-8">
                  {channel.lastChecked ? new Date(channel.lastChecked).toLocaleString() : 'Never'}
                </dd>
                
                {channel.lastLive && (
                  <>
                    <dt className="col-sm-4">Last Live</dt>
                    <dd className="col-sm-8">
                      {new Date(channel.lastLive).toLocaleString()}
                    </dd>
                  </>
                )}
              </dl>
            </Col>
            <Col md={6}>
              <div className="d-flex flex-column h-100 justify-content-center align-items-center">
                <div className="mb-3">
                  <Button
                    variant="primary"
                    size="lg"
                    className="me-2"
                    onClick={handleWatchChannel}
                  >
                    <FontAwesomeIcon icon={faEye} className="me-2" />
                    Watch Channel
                  </Button>
                  
                  <Button
                    variant={isInFavorites(channel._id) ? "danger" : "outline-danger"}
                    size="lg"
                    onClick={handleFavoriteToggle}
                  >
                    <FontAwesomeIcon 
                      icon={isInFavorites(channel._id) ? faHeartBroken : faHeart} 
                      className="me-2" 
                    />
                    {isInFavorites(channel._id) ? 'Remove from Favorites' : 'Add to Favorites'}
                  </Button>
                </div>
                
                <div className="mt-3">
                  <Button
                    variant="outline-secondary"
                    onClick={copyToClipboard}
                  >
                    <FontAwesomeIcon icon={faCopy} className="me-2" />
                    {copied ? 'Copied!' : 'Copy Channel URL'}
                  </Button>
                </div>
                
                {channel.description && (
                  <div className="mt-4 p-3 bg-light rounded">
                    <h6>Description:</h6>
                    <p className="mb-0">{channel.description}</p>
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      <ChannelStatistics channelId={channel._id} />
    </Container>
  );
};

export default ChannelDetailPage;
