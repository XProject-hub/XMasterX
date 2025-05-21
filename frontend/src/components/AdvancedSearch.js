import React, { useState, useContext, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Collapse } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faTimes, faSave } from '@fortawesome/free-solid-svg-icons';
import { ChannelContext } from '../context/ChannelContext';
import { UserProfileContext } from '../context/UserProfileContext';

const AdvancedSearch = ({ onSearch }) => {
  const { categories, providers, languages, countries, tags, loadMetadata } = useContext(ChannelContext);
  const { preferences, updatePreferences } = useContext(UserProfileContext);
  
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState('');
  const [provider, setProvider] = useState('');
  const [format, setFormat] = useState('');
  const [language, setLanguage] = useState('');
  const [country, setCountry] = useState('');
  const [status, setStatus] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sort, setSort] = useState('name');
  const [order, setOrder] = useState('asc');
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  
  // Load metadata on component mount
  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);
  
  // Apply preferences when they change
  useEffect(() => {
    if (preferences) {
      if (preferences.defaultCategory && preferences.defaultCategory !== 'All') {
        setCategory(preferences.defaultCategory);
      }
      
      if (preferences.defaultLanguage && preferences.defaultLanguage !== 'All') {
        setLanguage(preferences.defaultLanguage);
      }
      
      if (preferences.showOnlyLive) {
        setStatus('live');
      }
    }
  }, [preferences]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Build search params
    const searchParams = {
      query,
      category: category || undefined,
      provider: provider || undefined,
      format: format || undefined,
      language: language || undefined,
      country: country || undefined,
      status: status || undefined,
      tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
      sort,
      order
    };
    
    // Save preferences if requested
    if (saveAsDefault) {
      updatePreferences({
        defaultCategory: category || 'All',
        defaultLanguage: language || 'All',
        showOnlyLive: status === 'live'
      });
    }
    
    onSearch(searchParams);
  };
  
  const clearFilters = () => {
    setCategory('');
    setProvider('');
    setFormat('');
    setLanguage('');
    setCountry('');
    setStatus('');
    setSelectedTags([]);
    setSort('name');
    setOrder('asc');
  };
  
  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Row className="align-items-end">
            <Col md={8}>
              <Form.Group>
                <Form.Label>Search Channels</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter channel name, provider, or description..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <div className="d-flex">
                <Button variant="primary" type="submit" className="me-2 flex-grow-1">
                  <FontAwesomeIcon icon={faSearch} className="me-2" />
                  Search
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowFilters(!showFilters)}
                  aria-controls="advanced-filters"
                  aria-expanded={showFilters}
                >
                  <FontAwesomeIcon icon={faFilter} />
                </Button>
              </div>
            </Col>
          </Row>
          
          <Collapse in={showFilters}>
            <div id="advanced-filters" className="mt-3">
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat, index) => (
                        <option key={index} value={cat}>{cat}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Provider</Form.Label>
                    <Form.Select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                    >
                      <option value="">All Providers</option>
                      {providers.map((prov, index) => (
                        <option key={index} value={prov}>{prov}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Format</Form.Label>
                    <Form.Select
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                    >
                      <option value="">All Formats</option>
                      <option value="m3u">M3U</option>
                      <option value="m3u8">M3U8</option>
                      <option value="mp4">MP4</option>
                      <option value="hls">HLS</option>
                      <option value="other">Other</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Language</Form.Label>
                    <Form.Select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      <option value="">All Languages</option>
                      {languages.map((lang, index) => (
                        <option key={index} value={lang}>{lang}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Country</Form.Label>
                    <Form.Select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    >
                      <option value="">All Countries</option>
                      {countries.map((c, index) => (
                        <option key={index} value={c}>{c}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      <option value="live">Live</option>
                      <option value="down">Down</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tags</Form.Label>
                    <div className="d-flex flex-wrap gap-2">
                      {tags.slice(0, 20).map((tag, index) => (
                        <Button
                          key={index}
                          variant={selectedTags.includes(tag) ? "primary" : "outline-secondary"}
                          size="sm"
                          onClick={() => handleTagToggle(tag)}
                        >
                          {tag}
                        </Button>
                      ))}
                      {tags.length > 20 && (
                        <span className="text-muted align-self-center">
                          +{tags.length - 20} more
                        </span>
                      )}
                    </div>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Sort By</Form.Label>
                    <div className="d-flex">
                      <Form.Select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="me-2"
                      >
                        <option value="name">Name</option>
                        <option value="provider">Provider</option>
                        <option value="format">Format</option>
                        <option value="category">Category</option>
                        <option value="lastChecked">Last Checked</option>
                        <option value="createdAt">Date Added</option>
                        <option value="viewCount">Views</option>
                        <option value="favoriteCount">Favorites</option>
                      </Form.Select>
                      <Form.Select
                        value={order}
                        onChange={(e) => setOrder(e.target.value)}
                      >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                      </Form.Select>
                    </div>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col>
                  <div className="d-flex justify-content-between">
                    <Form.Check
                      type="checkbox"
                      id="save-preferences"
                      label="Save as default preferences"
                      checked={saveAsDefault}
                      onChange={(e) => setSaveAsDefault(e.target.checked)}
                    />
                    <div>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={clearFilters}
                        className="me-2"
                      >
                        <FontAwesomeIcon icon={faTimes} className="me-1" />
                        Clear Filters
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        type="submit"
                      >
                        <FontAwesomeIcon icon={faSearch} className="me-1" />
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </Collapse>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default AdvancedSearch;
