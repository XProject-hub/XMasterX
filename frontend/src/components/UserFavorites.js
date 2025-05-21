import React, { useContext, useEffect } from 'react';
import { Card, Table, Button, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faEye, faTrash, faCircle } from '@fortawesome/free-solid-svg-icons';
import { UserProfileContext } from '../context/UserProfileContext';

const UserFavorites = () => {
  const { favorites, loading, error, loadUserProfile, removeFromFavorites, addToWatchHistory } = useContext(UserProfileContext);
  
  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);
  
  const handleRemoveFavorite = async (channelId) => {
    await removeFromFavorites(channelId);
  };
  
  const handleWatchChannel = async (channel) => {
    // Add to watch history
    await addToWatchHistory(channel._id);
    
    // Open channel URL in new tab
    window.open(channel.url, '_blank');
  };
  
  if (loading) {
    return (
      <Card>
        <Card.Body className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading favorites...</p>
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
      <Card.Header>
        <h5 className="mb-0">
          <FontAwesomeIcon icon={faHeart} className="me-2 text-danger" />
          My Favorites
        </h5>
      </Card.Header>
      <Card.Body>
        {favorites.length === 0 ? (
          <Alert variant="info">
            You haven't added any channels to your favorites yet.
          </Alert>
        ) : (
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th className="text-center" style={{ width: '60px' }}>Status</th>
                  <th>Channel Name</th>
                  <th>Provider</th>
                  <th>Format</th>
                  <th className="text-center">Added On</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {favorites.map((favorite) => (
                  <tr key={favorite._id}>
                    <td className="text-center">
                      <FontAwesomeIcon
                        icon={faCircle}
                        className={favorite.channel.isLive ? 'channel-status-live' : 'channel-status-down'}
                        size="sm"
                      />
                    </td>
                    <td>{favorite.channel.name}</td>
                    <td>{favorite.channel.provider}</td>
                    <td>{favorite.channel.format.toUpperCase()}</td>
                    <td className="text-center">
                      {new Date(favorite.addedAt).toLocaleDateString()}
                    </td>
                    <td className="text-center">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleWatchChannel(favorite.channel)}
                        title="Watch Channel"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleRemoveFavorite(favorite.channel._id)}
                        title="Remove from Favorites"
                      >
                        <FontAwesomeIcon icon={faTrash} />
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

export default UserFavorites;
