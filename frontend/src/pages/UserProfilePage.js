import React, { useContext, useEffect, useState } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Form, Button, Alert, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faHeart, faHistory, faCog, faSave } from '@fortawesome/free-solid-svg-icons';
import { UserProfileContext } from '../context/UserProfileContext';
import { AuthContext } from '../context/AuthContext';
import UserFavorites from '../components/UserFavorites';
import WatchHistory from '../components/WatchHistory';


const UserProfilePage = () => {
  const { user } = useContext(AuthContext);
  const { preferences, updatePreferences, loading, error } = useContext(UserProfileContext);
  
  const [activeTab, setActiveTab] = useState('profile');
  const [formPreferences, setFormPreferences] = useState({
    defaultCategory: 'All',
    defaultLanguage: 'All',
    showOnlyLive: false,
    resultsPerPage: 10,
    theme: 'system'
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  useEffect(() => {
    if (preferences) {
      setFormPreferences(preferences);
    }
  }, [preferences]);
  
  const handlePreferenceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormPreferences({
      ...formPreferences,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleSavePreferences = async (e) => {
    e.preventDefault();
    try {
      await updatePreferences(formPreferences);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };
  
  return (
    <Container className="py-4">
      <Row>
        <Col md={3}>
          <Card className="mb-4">
            <Card.Body className="text-center">
              <div className="avatar mb-3">
                <div className="avatar-circle">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              <h5>{user?.username}</h5>
              <p className="text-muted">{user?.email}</p>
              <div className="mt-3">
                <Badge bg={user?.isAdmin ? 'danger' : 'primary'}>
                  {user?.isAdmin ? 'Admin' : 'User'}
                </Badge>
              </div>
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Body className="p-0">
              <Nav variant="pills" className="flex-column">
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'profile'} 
                    onClick={() => setActiveTab('profile')}
                    className="rounded-0"
                  >
                    <FontAwesomeIcon icon={faUser} className="me-2" />
                    Profile
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'favorites'} 
                    onClick={() => setActiveTab('favorites')}
                    className="rounded-0"
                  >
                    <FontAwesomeIcon icon={faHeart} className="me-2" />
                    Favorites
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'history'} 
                    onClick={() => setActiveTab('history')}
                    className="rounded-0"
                  >
                    <FontAwesomeIcon icon={faHistory} className="me-2" />
                    Watch History
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'settings'} 
                    onClick={() => setActiveTab('settings')}
                    className="rounded-0"
                  >
                    <FontAwesomeIcon icon={faCog} className="me-2" />
                    Settings
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={9}>
          {activeTab === 'profile' && (
            <Card>
              <Card.Header>
                <h5 className="mb-0">
                  <FontAwesomeIcon icon={faUser} className="me-2" />
                  User Profile
                </h5>
              </Card.Header>
              <Card.Body>
                <dl className="row">
                  <dt className="col-sm-3">Username</dt>
                  <dd className="col-sm-9">{user?.username}</dd>
                  
                  <dt className="col-sm-3">Email</dt>
                  <dd className="col-sm-9">{user?.email}</dd>
                  
                  <dt className="col-sm-3">Role</dt>
                  <dd className="col-sm-9">{user?.isAdmin ? 'Administrator' : 'User'}</dd>
                  
                  <dt className="col-sm-3">Member Since</dt>
                  <dd className="col-sm-9">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </dd>
                </dl>
              </Card.Body>
            </Card>
          )}
          
          {activeTab === 'favorites' && (
            <UserFavorites />
          )}
          
          {activeTab === 'history' && (
            <WatchHistory />
          )}
          
          {activeTab === 'settings' && (
            <Card>
              <Card.Header>
                <h5 className="mb-0">
                  <FontAwesomeIcon icon={faCog} className="me-2" />
                  User Settings
                </h5>
              </Card.Header>
              <Card.Body>
                {saveSuccess && (
                  <Alert variant="success" dismissible>
                    Settings saved successfully!
                  </Alert>
                )}
                
                {error && (
                  <Alert variant="danger">
                    {error}
                  </Alert>
                )}
                
                <Form onSubmit={handleSavePreferences}>
                  <h6 className="mb-3">Search Preferences</h6>
                  
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Default Category</Form.Label>
                        <Form.Control
                          as="select"
                          name="defaultCategory"
                          value={formPreferences.defaultCategory}
                          onChange={handlePreferenceChange}
                        >
                          <option value="All">All Categories</option>
                          <option value="Movies">Movies</option>
                          <option value="Sports">Sports</option>
                          <option value="News">News</option>
                          <option value="Entertainment">Entertainment</option>
                          <option value="Kids">Kids</option>
                          <option value="Music">Music</option>
                          <option value="Documentary">Documentary</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                    
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Default Language</Form.Label>
                        <Form.Control
                          as="select"
                          name="defaultLanguage"
                          value={formPreferences.defaultLanguage}
                          onChange={handlePreferenceChange}
                        >
                          <option value="All">All Languages</option>
                          <option value="English">English</option>
                          <option value="Spanish">Spanish</option>
                          <option value="French">French</option>
                          <option value="German">German</option>
                          <option value="Italian">Italian</option>
                          <option value="Russian">Russian</option>
                          <option value="Arabic">Arabic</option>
                          <option value="Chinese">Chinese</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Results Per Page</Form.Label>
                        <Form.Control
                          as="select"
                          name="resultsPerPage"
                          value={formPreferences.resultsPerPage}
                          onChange={handlePreferenceChange}
                        >
                          <option value="5">5</option>
                          <option value="10">10</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                          <option value="100">100</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                    
                    <Col md={6}>
                      <Form.Group className="mt-4">
                        <Form.Check
                          type="checkbox"
                          label="Show only live channels by default"
                          name="showOnlyLive"
                          checked={formPreferences.showOnlyLive}
                          onChange={handlePreferenceChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <h6 className="mb-3 mt-4">Appearance</h6>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Theme</Form.Label>
                    <Form.Control
                      as="select"
                      name="theme"
                      value={formPreferences.theme}
                      onChange={handlePreferenceChange}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System Default</option>
                    </Form.Control>
                  </Form.Group>
                  
                  <div className="d-flex justify-content-end mt-4">
                    <Button 
                      type="submit" 
                      variant="primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faSave} className="me-2" />
                          Save Settings
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default UserProfilePage;
