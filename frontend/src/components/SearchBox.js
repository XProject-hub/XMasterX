import React, { useState, useEffect } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';

const SearchBox = ({ onSearch, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Load suggestions from localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      try {
        setSuggestions(JSON.parse(savedSearches));
      } catch (e) {
        console.error('Error parsing recent searches:', e);
      }
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };
  
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    // Show suggestions if input is not empty and has at least 2 characters
    if (value.length >= 2) {
      const filtered = suggestions.filter(s => 
        s.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };
  
  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };
  
  const clearSearch = () => {
    setQuery('');
    setShowSuggestions(false);
  };

  return (
    <div className="position-relative">
      <Form onSubmit={handleSubmit}>
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Search for channels..."
            value={query}
            onChange={handleInputChange}
            onFocus={() => query.length >= 2 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            autoComplete="off"
            className="search-input"
          />
          {query && (
            <Button 
              variant="outline-secondary" 
              onClick={clearSearch}
              title="Clear search"
            >
              <FontAwesomeIcon icon={faTimes} />
            </Button>
          )}
          <Button variant="primary" type="submit">
            <FontAwesomeIcon icon={faSearch} /> Search
          </Button>
        </InputGroup>
      </Form>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestion-dropdown">
          {suggestions.map((suggestion, index) => (
            <div 
              key={index} 
              className="suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <FontAwesomeIcon icon={faSearch} className="me-2 text-muted" />
              {suggestion}
            </div>
          ))}
        </div>
      )}
      
      <style jsx>{`
        .position-relative {
          position: relative;
        }
        .suggestion-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ddd;
          border-top: none;
          border-radius: 0 0 4px 4px;
          z-index: 1000;
          max-height: 200px;
          overflow-y: auto;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .suggestion-item {
          padding: 8px 12px;
          cursor: pointer;
        }
        .suggestion-item:hover {
          background-color: #f8f9fa;
        }
      `}</style>
    </div>
  );
};

export default SearchBox;
