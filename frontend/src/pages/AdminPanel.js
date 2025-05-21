import React, { useState, useContext, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Tabs, Tab, Alert, Spinner, Table, Modal, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faSync, faCopy, faCircle } from '@fortawesome/free-solid-svg-icons';
import { ChannelContext } from '../context/ChannelContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { channelAPI } from '../utils/api';

const AdminPanel = () => {
  // Context
  const { 
    channels,
    loading,
    error,
    getAllChannels,
    cleanupInactiveChannels
  } = useContext(ChannelContext);
  
  const { isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // State for file upload
  const [file, setFile] = useState(null);
  const [provider, setProvider] = useState('');
  
  // State for URL upload
  const [url, setUrl] = useState('');
  const [urlProvider, setUrlProvider] = useState('');
  
  // State for credentials upload
  const [serverUrl, setServerUrl] = useState('');
  const [port, setPort] = useState('80');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [credProvider, setCredProvider] = useState('');
  
  // State for UI
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('info');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State for channel editing
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editProvider, setEditProvider] = useState('');
  const [editFormat, setEditFormat] = useState('');
  
  // State for channel deletion
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState(null);
  
  // State for status checking
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [channelBeingChecked, setChannelBeingChecked] = useState(null);
  
  // State for progress tracking
  const [checkProgress, setCheckProgress] = useState(null);
  const [eventSource, setEventSource] = useState(null);
  const [totalChannelCount, setTotalChannelCount] = useState(0);

  // Load channels with pagination and get total count
  const loadChannels = useCallback(async () => {
    if (!dataLoaded && !loading) {
      try {
        // First, get the total count of channels
        const { data } = await channelAPI.getAll({ limit: 10, page: 1 });
        if (data.success && data.pagination) {
          setTotalChannelCount(data.pagination.total);
        }
        
        // Then load the first page of channels for display
        await getAllChannels({ limit: 100, page: 1 });
        setDataLoaded(true);
      } catch (error) {
        console.error('Error loading channels:', error);
        setMessage('Failed to load channels. Please try again.');
        setMessageType('danger');
      }
    }
  }, [getAllChannels, dataLoaded, loading]);

  useEffect(() => {
    // Redirect if not admin
    if (!isAdmin) {
      navigate('/');
      return;
    }
    
    // Load channels only once
    loadChannels();
    
    // Clean up event source on unmount
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isAdmin, navigate, loadChannels, eventSource]);

  // File upload handler
  const handleFileUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setMessage('Please select a file');
      setMessageType('danger');
      return;
    }
    
    try {
      setIsProcessing(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('provider', provider);
      
      const { data } = await channelAPI.uploadFile(formData);
      
      setMessage(data.message);
      setMessageType('success');
      setFile(null);
      setProvider('');
      
      // Refresh channel list and total count
      loadChannels();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error uploading file');
      setMessageType('danger');
    } finally {
      setIsProcessing(false);
    }
  };

  // URL upload handler
  const handleUrlUpload = async (e) => {
    e.preventDefault();
    
    if (!url) {
      setMessage('Please enter a URL');
      setMessageType('danger');
      return;
    }
    
    try {
      setIsProcessing(true);
      const { data } = await channelAPI.uploadFromUrl({ url, provider: urlProvider });
      
      setMessage(data.message);
      setMessageType('success');
      setUrl('');
      setUrlProvider('');
      
      // Refresh channel list and total count
      loadChannels();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error uploading from URL');
      setMessageType('danger');
    } finally {
      setIsProcessing(false);
    }
  };

  // Credentials upload handler
  const handleCredentialsUpload = async (e) => {
    e.preventDefault();
    
    if (!serverUrl || !username || !password) {
      setMessage('Please fill all required fields');
      setMessageType('danger');
      return;
    }
    
    try {
      setIsProcessing(true);
      const { data } = await channelAPI.uploadFromCredentials({
        serverUrl,
        port,
        username,
        password,
        provider: credProvider
      });
      
      setMessage(data.message);
      setMessageType('success');
      setServerUrl('');
      setPort('80');
      setUsername('');
      setPassword('');
      setCredProvider('');
      
      // Refresh channel list and total count
      loadChannels();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error uploading from credentials');
      setMessageType('danger');
    } finally {
      setIsProcessing(false);
    }
  };

  // Check all channels status with SSE for real-time progress updates
  const handleCheckAllChannels = async () => {
    try {
      setIsProcessing(true);
      setMessage('Checking all channels. This may take a few minutes...');
      setMessageType('info');
      
      // Initialize progress
      setCheckProgress({
        percentage: 0,
        processed: 0,
        total: totalChannelCount || 0,
        live: 0
      });
      
      // Close any existing event source
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
      }
      
      // Get the auth token from localStorage
      const userInfo = localStorage.getItem('userInfo');
      const token = userInfo ? JSON.parse(userInfo).token : null;
      
      if (!token) {
        setMessage('Authentication required. Please log in again.');
        setMessageType('danger');
        setIsProcessing(false);
        return;
      }
      
      // Create a new EventSource for SSE
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // Create a custom EventSource that includes credentials
      const source = new EventSource(`${apiUrl}/api/channels/check-all`, { 
        withCredentials: true 
      });
      
      // Store the event source for cleanup
      setEventSource(source);
      
      // Handle connection open
      source.onopen = () => {
        console.log('SSE connection opened');
      };
      
      // Handle messages
      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('SSE message received:', data);
          
          if (data.error) {
            setMessage(data.error);
            setMessageType('danger');
            source.close();
            setEventSource(null);
            setIsProcessing(false);
            return;
          }
          
          // Update progress if data contains progress information
          if (data.processed !== undefined && data.total !== undefined) {
            setCheckProgress({
              percentage: data.percentage || Math.round((data.processed / data.total) * 100),
              processed: data.processed,
              total: data.total,
              live: data.live || 0
            });
          }
          
          // Check if the process is complete
          if (data.done) {
            setMessage(`Status check completed. ${data.live} out of ${data.total} channels are live.`);
            setMessageType('success');
            source.close();
            setEventSource(null);
            setIsProcessing(false);
            
            // Refresh channel list
            getAllChannels({ limit: 100, page: 1 });
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };
      
      // Handle errors
      source.onerror = (error) => {
        console.error('SSE error:', error);
        
        // If we can't establish a connection with SSE, fall back to polling
        if (source.readyState === 2) { // CLOSED
          source.close();
          setEventSource(null);
          
          // Fall back to polling approach
          fallbackToPolling();
        }
      };
      
    } catch (error) {
      console.error('Error checking channels:', error);
      setMessage(error.response?.data?.message || 'Error checking channels');
      setMessageType('danger');
      setIsProcessing(false);
      
      // Clean up event source on error
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
      }
    }
  };
  
  // Fallback to polling if SSE fails
  const fallbackToPolling = async () => {
    try {
      console.log('Falling back to polling approach');
      setMessage('Using alternative method for progress tracking...');
      
      // Start the server-side check process
      await channelAPI.checkAll();
      
      // Set up polling to check progress
      let pollCount = 0;
      const maxPolls = 600; // Maximum number of polls (10 minutes at 1 second intervals)
      
      const pollInterval = setInterval(async () => {
        try {
          pollCount++;
          
          // Get the current live channel count
          const { data: liveData } = await channelAPI.getLiveCount();
          
          if (liveData.success) {
            // Update progress based on poll count (estimate)
            const processed = Math.min(pollCount * 100, totalChannelCount);
            const percentage = Math.round((processed / totalChannelCount) * 100);
            
            setCheckProgress({
              percentage: Math.min(percentage, 100),
              processed: processed,
              total: totalChannelCount,
              live: liveData.count || 0
            });
            
            // If we've reached the maximum polls or processed all channels, stop polling
            if (pollCount >= maxPolls || processed >= totalChannelCount) {
              clearInterval(pollInterval);
              setMessage(`Status check completed. ${liveData.count} out of ${totalChannelCount} channels are live.`);
              setMessageType('success');
              setIsProcessing(false);
              
              // Refresh channel list
              await getAllChannels({ limit: 100, page: 1 });
            }
          }
        } catch (error) {
          console.error('Error polling progress:', error);
          // Don't stop polling on error, just log it
        }
      }, 1000); // Poll every second
      
      // Store the interval ID for cleanup
      setEventSource({ close: () => clearInterval(pollInterval) });
      
    } catch (error) {
      console.error('Error in fallback polling:', error);
      setMessage('Error tracking progress. Please check server logs.');
      setMessageType('danger');
      setIsProcessing(false);
    }
  };

  // Cleanup inactive channels
  const handleCleanupChannels = async () => {
    try {
      setIsProcessing(true);
      const { data } = await cleanupInactiveChannels();
      
      setMessage(data.message);
      setMessageType('success');
      
      // Refresh channel list and total count
      loadChannels();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error cleaning up channels');
      setMessageType('danger');
    } finally {
      setIsProcessing(false);
    }
  };

  // Check individual channel status
  const handleCheckChannelStatus = async (id) => {
    try {
      setChannelBeingChecked(id);
      setCheckingStatus(true);
      
      const { data } = await channelAPI.checkStatus(id);
      
      if (data.success) {
        // Refresh the entire list instead of updating individual channel
        await getAllChannels({ limit: 100, page: 1 });
        
        setMessage(`Channel status updated: ${data.data.isLive ? 'Live' : 'Down'}`);
        setMessageType(data.data.isLive ? 'success' : 'warning');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error checking channel status');
      setMessageType('danger');
    } finally {
      setCheckingStatus(false);
      setChannelBeingChecked(null);
    }
  };

  // Open edit modal
  const handleEditClick = (channel) => {
    setCurrentChannel(channel);
    setEditName(channel.name);
    setEditUrl(channel.url);
    setEditProvider(channel.provider);
    setEditFormat(channel.format);
    setShowEditModal(true);
  };

  // Save channel edits
  const handleSaveEdit = async () => {
    try {
      setIsProcessing(true);
      
      const { data } = await channelAPI.update(currentChannel._id, {
        name: editName,
        url: editUrl,
        provider: editProvider,
        format: editFormat
      });
      
      if (data.success) {
        setMessage('Channel updated successfully');
        setMessageType('success');
        setShowEditModal(false);
        
        // Refresh channel list
        await getAllChannels({ limit: 100, page: 1 });
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error updating channel');
      setMessageType('danger');
    } finally {
      setIsProcessing(false);
    }
  };

  // Open delete confirmation modal
  const handleDeleteClick = (channel) => {
    setChannelToDelete(channel);
    setShowDeleteModal(true);
  };

  // Confirm channel deletion
  const handleConfirmDelete = async () => {
    try {
      setIsProcessing(true);
      
      const { data } = await channelAPI.delete(channelToDelete._id);
      
      if (data.success) {
        setMessage('Channel deleted successfully');
        setMessageType('success');
        setShowDeleteModal(false);
        
        // Refresh channel list and total count
        loadChannels();
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error deleting channel');
      setMessageType('danger');
    } finally {
      setIsProcessing(false);
    }
  };

  // Copy channel URL to clipboard
  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    setMessage('Channel URL copied to clipboard');
    setMessageType('info');
    
    // Clear message after 3 seconds
    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  return (
    <Container className="py-3">
      <h1 className="mb-4">Admin Panel</h1>
      
      {message && (
        <Alert variant={messageType} onClose={() => setMessage(null)} dismissible>
          {message}
        </Alert>
      )}
      
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>Channel Management</Card.Title>
              <div className="d-flex mb-3">
                <Button 
                  variant="primary" 
                  className="me-2"
                  onClick={handleCheckAllChannels}
                  disabled={isProcessing}
                >
                  {isProcessing && checkProgress ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      <span className="ms-2">Checking...</span>
                    </>
                  ) : (
                    <>Check All Channels Status</>
                  )}
                </Button>
                <Button 
                  variant="danger"
                  onClick={handleCleanupChannels}
                  disabled={isProcessing}
                >
                  {isProcessing && !checkProgress ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      <span className="ms-2">Cleaning...</span>
                    </>
                  ) : (
                    <>Cleanup Inactive Channels</>
                  )}
                </Button>
              </div>
              
              {/* Progress bar for channel checking */}
              {isProcessing && checkProgress && (
                <div className="mt-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Progress: {checkProgress.percentage}%</span>
                    <span>{checkProgress.processed} / {checkProgress.total} channels checked</span>
                  </div>
                  <ProgressBar 
                    now={checkProgress.percentage} 
                    label={`${checkProgress.percentage}%`} 
                    variant="info" 
                    animated
                  />
                  <div className="text-center mt-1">
                    <small>Live channels found: {checkProgress.live}</small>
                  </div>
                </div>
              )}
              
              {/* Display total channel count */}
              <div className="mt-3">
                <Alert variant="info">
                  Total channels in database: {totalChannelCount}
                  <br />
                  <small>Showing up to 100 channels in the table below</small>
                </Alert>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Tabs defaultActiveKey="file" className="mb-3">
                <Tab eventKey="file" title="Upload File">
                  <Form onSubmit={handleFileUpload}>
                    <Form.Group className="mb-3">
                      <Form.Label>M3U/M3U8 File</Form.Label>
                      <Form.Control 
                        type="file" 
                        onChange={(e) => setFile(e.target.files[0])}
                        accept=".m3u,.m3u8,.txt"
                        className="bg-dark text-light"
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Provider Name</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="Enter provider name"
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                      />
                    </Form.Group>
                    
                    <Button variant="primary" type="submit" disabled={isProcessing}>
                      {isProcessing ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                          <span className="ms-2">Uploading...</span>
                        </>
                      ) : (
                        <>Upload</>
                      )}
                    </Button>
                  </Form>
                </Tab>
                
                <Tab eventKey="url" title="From URL">
                  <Form onSubmit={handleUrlUpload}>
                    <Form.Group className="mb-3">
                      <Form.Label>M3U/M3U8 URL</Form.Label>
                      <Form.Control 
                        type="url" 
                        placeholder="Enter M3U/M3U8 URL"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Provider Name</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="Enter provider name"
                        value={urlProvider}
                        onChange={(e) => setUrlProvider(e.target.value)}
                      />
                    </Form.Group>
                    
                    <Button variant="primary" type="submit" disabled={isProcessing}>
                      {isProcessing ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                          <span className="ms-2">Processing...</span>
                        </>
                      ) : (
                        <>Upload</>
                      )}
                    </Button>
                  </Form>
                </Tab>
                
                <Tab eventKey="credentials" title="From Credentials">
                  <Form onSubmit={handleCredentialsUpload}>
                    <Form.Group className="mb-3">
                      <Form.Label>Server URL</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="Enter server URL"
                        value={serverUrl}
                        onChange={(e) => setServerUrl(e.target.value)}
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Port</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="Enter port"
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Username</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Password</Form.Label>
                      <Form.Control 
                        type="password" 
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Provider Name</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="Enter provider name"
                        value={credProvider}
                        onChange={(e) => setCredProvider(e.target.value)}
                      />
                    </Form.Group>
                    
                    <Button variant="primary" type="submit" disabled={isProcessing}>
                      {isProcessing ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                          <span className="ms-2">Processing...</span>
                        </>
                      ) : (
                        <>Upload</>
                      )}
                    </Button>
                  </Form>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>All Channels</Card.Title>
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <p className="mt-2">Loading channels...</p>
                </div>
              ) : error ? (
                <Alert variant="danger">{error}</Alert>
              ) : channels.length === 0 ? (
                <Alert variant="info">No channels found. Upload some channels to get started.</Alert>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover className="bg-dark text-light">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Channel Name</th>
                        <th>Provider</th>
                        <th>Format</th>
                        <th>Last Checked</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {channels.map((channel) => (
                        <tr key={channel._id}>
                          <td className="text-center">
                            <FontAwesomeIcon
                              icon={faCircle}
                              color={channel.isLive ? 'green' : 'red'}
                              title={channel.isLive ? 'Live' : 'Down'}
                            />
                          </td>
                          <td>{channel.name}</td>
                          <td>{channel.provider}</td>
                          <td>{channel.format.toUpperCase()}</td>
                          <td>
                            {channel.lastChecked 
                              ? new Date(channel.lastChecked).toLocaleString() 
                              : 'Never'}
                          </td>
                          <td>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              className="me-1"
                              onClick={() => handleCheckChannelStatus(channel._id)}
                              disabled={checkingStatus && channelBeingChecked === channel._id}
                            >
                              {checkingStatus && channelBeingChecked === channel._id ? (
                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                              ) : (
                                <FontAwesomeIcon icon={faSync} />
                              )}
                            </Button>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-1"
                              onClick={() => copyToClipboard(channel.url)}
                            >
                              <FontAwesomeIcon icon={faCopy} />
                            </Button>
                            <Button
                              variant="outline-info"
                              size="sm"
                              className="me-1"
                              onClick={() => handleEditClick(channel)}
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteClick(channel)}
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
        </Col>
      </Row>
      
      {/* Edit Channel Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Channel</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Channel Name</Form.Label>
              <Form.Control
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Channel URL</Form.Label>
              <Form.Control
                type="text"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Provider</Form.Label>
              <Form.Control
                type="text"
                value={editProvider}
                onChange={(e) => setEditProvider(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Format</Form.Label>
              <Form.Select
                value={editFormat}
                onChange={(e) => setEditFormat(e.target.value)}
              >
                <option value="m3u">M3U</option>
                <option value="m3u8">M3U8</option>
                <option value="mp4">MP4</option>
                <option value="hls">HLS</option>
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveEdit} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Saving...</span>
              </>
            ) : (
              <>Save Changes</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the channel "{channelToDelete?.name}"?
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Deleting...</span>
              </>
            ) : (
              <>Delete</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminPanel;
