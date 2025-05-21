import React, { useContext, useEffect } from 'react';
import { Card, Table, Button, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory, faEye, faTrash, faCircle } from '@fortawesome/free-solid-svg-icons';
import { UserProfileContext } from '../context/UserProfileContext';

const WatchHistory = () => {
  const { watchHistory, loading, error, loadUserProfile, clearWatchHistory, addToWatchHistory } = useContext(UserProfileContext);
  
  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);
  
  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear your watch history?')) {
      await clearWatchHistory();
    }
  };
  
  const handleWatchChannel = async (channel) => {
    // Add to watch history
    await addToWatchHistory(channel._id);
    
    // Open channel URL in new tab
    window.open(channel.url, '_blank');
  };
  
  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };
  
  if (loading) {
    return (
      <Card>
        <Card.Body className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading watch history...</p>
        </Card.Body>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <Card.Body>
          <Alert variant="danger">{error}</Alert>
        </Card.Body>
      </Card>
    );
  }
  
  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <FontAwesomeIcon icon={faHistory} className="me-2 text-info" />
          Watch History
        </h5>
        {watchHistory.length > 0 && (
          <Button
            variant="outline-danger"
            size="sm"
            onClick={handleClearHistory}
          >
            <FontAwesomeIcon icon={faTrash} className="me-1" />
            Clear History
          </Button>
        )}
      </Card.Header>
      <Card.Body>
        {watchHistory.length === 0 ? (
          <Alert variant="info">
            Your watch history is empty.
          </Alert>
        ) : (
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th className="text-center" style={{ width: '60px' }}>Status</th>
                  <th>Channel Name</th>
                  <th>Provider</th>
                  <th className="text-center">Watched On</th>
                  <th className="text-center">Duration</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {watchHistory.map((item) => (
                  <tr key={item._id}>
                    <td className="text-center">
                      <FontAwesomeIcon
                        icon={faCircle}
                        className={item.channel.isLive ? 'channel-status-live' : 'channel-status-down'}
                        size="sm"
                      />
                    </td>
                    <td>{item.channel.name}</td>
                    <td>{item.channel.provider}</td>
                    <td className="text-center">
                      {new Date(item.watchedAt).toLocaleString()}
                    </td>
                    <td className="text-center">
                      {formatDuration(item.duration)}
                    </td>
                    <td className="text-center">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleWatchChannel(item.channel)}
                        title="Watch Channel"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default WatchHistory;
