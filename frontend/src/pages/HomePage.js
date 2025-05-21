import React, { useState, useContext, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Form, InputGroup, Button, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faTimes } from '@fortawesome/free-solid-svg-icons';
import ChannelList from '../components/ChannelList';
import { ChannelContext } from '../context/ChannelContext';
import { AuthContext } from '../context/AuthContext';

const HomePage = () => {
  const { searchChannels, channels, loading, error } = useContext(ChannelContext);
  const { user } = useContext(AuthContext);
  const [searched, setSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterProvider, setFilterProvider] = useState('');
  const [filterFormat, setFilterFormat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [uniqueProviders, setUniqueProviders] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches));
      } catch (e) {
        console.error('Error parsing recent searches:', e);
      }
    }
  }, []);

  // Update filtered channels when filters or channels change
  useEffect(() => {
    if (channels.length > 0) {
      // Extract unique providers for filter dropdown
      const providers = [...new Set(channels.map(channel => channel.provider))];
      setUniqueProviders(providers);
      
      // Apply filters
      let filtered = [...channels];
      
      if (filterProvider) {
        filtered = filtered.filter(channel => channel.provider === filterProvider);
      }
      
      if (filterFormat) {
        filtered = filtered.filter(channel => channel.format === filterFormat.toLowerCase());
      }
      
      if (filterStatus) {
        const isLive = filterStatus === 'live';
        filtered = filtered.filter(channel => channel.isLive === isLive);
      }
      
      setFilteredChannels(filtered);
    } else {
      setFilteredChannels([]);
    }
  }, [channels, filterProvider, filterFormat, filterStatus]);

  const handleSearch = async (query) => {
    if (!query || query.trim() === '') {
      return;
    }
    
    setSearchQuery(query);
    
    // Save to recent searches
    const updatedSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    
    try {
      await searchChannels({ query: query });
      setSearched(true);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleRecentSearchClick = (query) => {
    handleSearch(query);
  };

  const clearFilters = () => {
    setFilterProvider('');
    setFilterFormat('');
    setFilterStatus('');
  };

  const displayedChannels = filteredChannels.length > 0 ? filteredChannels : channels;

  return (
    <Container className="py-3">
      <Row className="justify-content-center mb-4">
        <Col md={10} lg={8}>
          <Card>
            <Card.Body>
              <Card.Title className="text-center mb-4">
                Search for TV Channels
              </Card.Title>
              
              <Form onSubmit={(e) => {
                e.preventDefault();
                handleSearch(searchQuery);
              }}>
                <InputGroup className="mb-3">
                  <Form.Control
                    type="text"
                    placeholder="Search for channels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button variant="primary" type="submit">
                    <FontAwesomeIcon icon={faSearch} /> Search
                  </Button>
                </InputGroup>
              </Form>
              
              {recentSearches.length > 0 && (
                <div className="mt-2">
                  <small className="text-muted">Recent searches: </small>
                  {recentSearches.map((search, index) => (
                    <Button 
                      key={index} 
                      variant="link" 
                      size="sm" 
                      className="p-0 ms-2"
                      onClick={() => handleRecentSearchClick(search)}
                    >
                      {search}
                    </Button>
                  ))}
                </div>
              )}
              
              <div className="d-flex justify-content-end mt-3">
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <FontAwesomeIcon icon={faFilter} /> {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
              </div>
              
              {showFilters && (
                <Card className="mt-3 bg-light">
                  <Card.Body>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Provider</Form.Label>
                          <Form.Select
                            value={filterProvider}
                            onChange={(e) => setFilterProvider(e.target.value)}
                          >
                            <option value="">All Providers</option>
                            {uniqueProviders.map((provider, index) => (
                              <option key={index} value={provider}>{provider}</option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Format</Form.Label>
                          <Form.Select
                            value={filterFormat}
                            onChange={(e) => setFilterFormat(e.target.value)}
                          >
                            <option value="">All Formats</option>
                            <option value="M3U">M3U</option>
                            <option value="M3U8">M3U8</option>
                            <option value="MP4">MP4</option>
                            <option value="HLS">HLS</option>
                            <option value="OTHER">Other</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Status</Form.Label>
                          <Form.Select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                          >
                            <option value="">All Statuses</option>
                            <option value="live">Live</option>
                            <option value="down">Down</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="d-flex justify-content-end">
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={clearFilters}
                      >
                        <FontAwesomeIcon icon={faTimes} /> Clear Filters
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {loading && (
        <Row className="justify-content-center">
          <Col md={8}>
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-2">Searching for channels...</p>
            </div>
          </Col>
        </Row>
      )}

      {error && (
        <Row className="justify-content-center">
          <Col md={8}>
            <Alert variant="danger">{error}</Alert>
          </Col>
        </Row>
      )}

      {searched && !loading && !error && (
        <Row>
          <Col>
            <Card>
              <Card.Body>
                <Card.Title className="d-flex justify-content-between align-items-center">
                  <span>
                    Search Results for "{searchQuery}"
                    {(filterProvider || filterFormat || filterStatus) ? (
                      <span className="ms-2 text-muted fs-6">
                        (Filtered)
                      </span>
                    ) : null}
                  </span>
                  <span className="badge bg-primary">
                    {displayedChannels.length} {displayedChannels.length === 1 ? 'channel' : 'channels'} found
                  </span>
                </Card.Title>
                
                {displayedChannels.length === 0 ? (
                  <Alert variant="info">
                    No channels found matching your criteria. Try a different search or adjust your filters.
                  </Alert>
                ) : (
                  <ChannelList 
                    channels={displayedChannels} 
                    showActions={!!user} 
                  />
                )}
                
                {!user && displayedChannels.length > 0 && (
                  <Alert variant="info" className="mt-3">
                    <Alert.Heading>Sign in for more features</Alert.Heading>
                    <p>
                      Sign in or create an account to access additional features like saving favorites, 
                      viewing channel details, and more.
                    </p>
                    <div className="d-flex justify-content-end">
                      <Button variant="outline-primary" href="/login" className="me-2">
                        Sign In
                      </Button>
                      <Button variant="outline-secondary" href="/register">
                        Register
                      </Button>
                    </div>
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default HomePage;
