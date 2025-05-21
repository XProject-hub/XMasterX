import React, { useState, useContext } from 'react';
import { Card, Button, ButtonGroup, Dropdown, Modal, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEdit, faSync, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { ChannelContext } from '../context/ChannelContext';

const BulkActions = () => {
  const { 
    selectedChannels, 
    clearChannelSelection, 
    bulkDeleteChannels, 
    bulkUpdateChannels,
    checkSelectedChannels,
    categories,
    languages,
    countries,
    providers
  } = useContext(ChannelContext);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateField, setUpdateField] = useState('category');
  const [updateValue, setUpdateValue] = useState('');
  
  const handleBulkDelete = async () => {
    try {
      await bulkDeleteChannels(selectedChannels);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting channels:', error);
    }
  };
  
  const handleBulkUpdate = async () => {
    try {
      const updates = {
        [updateField]: updateValue
      };
      
      await bulkUpdateChannels(selectedChannels, updates);
      setShowUpdateModal(false);
    } catch (error) {
      console.error('Error updating channels:', error);
    }
  };
  
  const handleCheckStatus = async () => {
    try {
      await checkSelectedChannels();
    } catch (error) {
      console.error('Error checking channel status:', error);
    }
  };
  
  if (selectedChannels.length === 0) {
    return null;
  }
  
  return (
    <>
      <Card className="mb-4 bg-light">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong>{selectedChannels.length}</strong> channels selected
            </div>
            <div>
              <ButtonGroup>
                <Button 
                  variant="outline-primary" 
                  onClick={handleCheckStatus}
                >
                  <FontAwesomeIcon icon={faSync} className="me-1" />
                  Check Status
                </Button>
                
                <Dropdown as={ButtonGroup}>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setShowUpdateModal(true)}
                  >
                    <FontAwesomeIcon icon={faEdit} className="me-1" />
                    Update
                  </Button>
                  <Dropdown.Toggle split variant="outline-secondary" />
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => {
                      setUpdateField('category');
                      setShowUpdateModal(true);
                    }}>
                      Update Category
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => {
                      setUpdateField('language');
                      setShowUpdateModal(true);
                    }}>
                      Update Language
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => {
                      setUpdateField('country');
                      setShowUpdateModal(true);
                    }}>
                      Update Country
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => {
                      setUpdateField('provider');
                      setShowUpdateModal(true);
                    }}>
                      Update Provider
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                
                <Button 
                  variant="outline-danger" 
                  onClick={() => setShowDeleteModal(true)}
                >
                  <FontAwesomeIcon icon={faTrash} className="me-1" />
                  Delete
                </Button>
                
                <Button 
                  variant="outline-secondary" 
                  onClick={clearChannelSelection}
                >
                  <FontAwesomeIcon icon={faTimes} className="me-1" />
                  Clear Selection
                </Button>
              </ButtonGroup>
            </div>
          </div>
        </Card.Body>
      </Card>
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete {selectedChannels.length} selected channels?
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleBulkDelete}>
            Delete {selectedChannels.length} Channels
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Update Modal */}
      <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update {selectedChannels.length} Channels</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>
                {updateField.charAt(0).toUpperCase() + updateField.slice(1)}
              </Form.Label>
              
              {updateField === 'category' && (
                <Form.Select
                  value={updateValue}
                  onChange={(e) => setUpdateValue(e.target.value)}
                >
                  <option value="">Select Category</option>
                  {categories.map((category, index) => (
                    <option key={index} value={category}>{category}</option>
                  ))}
                  <option value="Uncategorized">Uncategorized</option>
                </Form.Select>
              )}
              
              {updateField === 'language' && (
                <Form.Select
                  value={updateValue}
                  onChange={(e) => setUpdateValue(e.target.value)}
                >
                  <option value="">Select Language</option>
                  {languages.map((language, index) => (
                    <option key={index} value={language}>{language}</option>
                  ))}
                  <option value="Unknown">Unknown</option>
                </Form.Select>
              )}
              
              {updateField === 'country' && (
                <Form.Select
                  value={updateValue}
                  onChange={(e) => setUpdateValue(e.target.value)}
                >
                  <option value="">Select Country</option>
                  {countries.map((country, index) => (
                    <option key={index} value={country}>{country}</option>
                  ))}
                  <option value="Unknown">Unknown</option>
                </Form.Select>
              )}
              
              {updateField === 'provider' && (
                <Form.Select
                  value={updateValue}
                  onChange={(e) => setUpdateValue(e.target.value)}
                >
                  <option value="">Select Provider</option>
                  {providers.map((provider, index) => (
                    <option key={index} value={provider}>{provider}</option>
                  ))}
                  <option value="Unknown Provider">Unknown Provider</option>
                </Form.Select>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUpdateModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleBulkUpdate}
            disabled={!updateValue}
          >
            <FontAwesomeIcon icon={faCheck} className="me-1" />
            Update {selectedChannels.length} Channels
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default BulkActions;
