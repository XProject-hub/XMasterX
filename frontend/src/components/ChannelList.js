import { useState, useContext } from 'react';
import { Table, Button, Badge, Tooltip, OverlayTrigger, Pagination, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faCircle, faInfoCircle, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { ChannelContext } from '../context/ChannelContext';
import { AuthContext } from '../context/AuthContext';

const ChannelList = ({ channels, showSelection = false, onChannelClick }) => {
  const [copiedId, setCopiedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const { user } = useContext(AuthContext);
  const { selectedChannels, toggleChannelSelection, selectAllChannels } = useContext(ChannelContext);
  
  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentChannels = channels.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(channels.length / itemsPerPage);
  
  const copyToClipboard = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset to first page
  };
  
  const renderStatusTooltip = (isLive) => (
    <Tooltip id="status-tooltip">
      {isLive ? 'Channel is currently live' : 'Channel is currently down'}
    </Tooltip>
  );
  
  const renderUrlTooltip = (url) => (
    <Tooltip id="url-tooltip">
      {url}
    </Tooltip>
  );
  
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pageItems = [];
    
    // Previous button
    pageItems.push(
      <Pagination.Prev 
        key="prev" 
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      />
    );
    
    // First page
    if (currentPage > 2) {
      pageItems.push(
        <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
          1
        </Pagination.Item>
      );
      
      if (currentPage > 3) {
        pageItems.push(<Pagination.Ellipsis key="ellipsis1" />);
      }
    }
    
    // Current page and neighbors
    for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
      pageItems.push(
        <Pagination.Item 
          key={i} 
          active={i === currentPage}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }
    
    // Last page
    if (currentPage < totalPages - 1) {
      if (currentPage < totalPages - 2) {
        pageItems.push(<Pagination.Ellipsis key="ellipsis2" />);
      }
      
      pageItems.push(
        <Pagination.Item key={totalPages} onClick={() => handlePageChange(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }
    
    // Next button
    pageItems.push(
      <Pagination.Next 
        key="next" 
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      />
    );
    
    return <Pagination className="justify-content-center mt-4">{pageItems}</Pagination>;
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          {showSelection && user && (
            <Form.Check
              type="checkbox"
              id="select-all-channels"
              label="Select All"
              checked={selectedChannels.length === channels.length && channels.length > 0}
              onChange={selectAllChannels}
            />
          )}
        </div>
        <div className="d-flex align-items-center">
          <span className="me-2">Show:</span>
          <Form.Select 
            size="sm" 
            value={itemsPerPage} 
            onChange={handleItemsPerPageChange}
            style={{ width: 'auto' }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </Form.Select>
        </div>
      </div>
      
      <div className="table-responsive">
        <Table striped bordered hover>
          <thead>
            <tr>
              {showSelection && user && (
                <th className="text-center" style={{ width: '40px' }}>
                  <Form.Check
                    type="checkbox"
                    id="select-all-channels-header"
                    checked={selectedChannels.length === channels.length && channels.length > 0}
                    onChange={selectAllChannels}
                  />
                </th>
              )}
              <th className="text-center" style={{ width: '60px' }}>Status</th>
              <th>Channel Name</th>
              <th>Provider</th>
              <th>Format</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentChannels.length === 0 ? (
              <tr>
                <td colSpan={showSelection && user ? 6 : 5} className="text-center">
                  No channels found
                </td>
              </tr>
            ) : (
              currentChannels.map((channel) => (
                <tr key={channel._id} onClick={() => onChannelClick && onChannelClick(channel)}>
                  {showSelection && user && (
                    <td className="text-center" onClick={(e) => e.stopPropagation()}>
                      <Form.Check
                        type="checkbox"
                        id={`select-channel-${channel._id}`}
                        checked={selectedChannels.includes(channel._id)}
                        onChange={() => toggleChannelSelection(channel._id)}
                      />
                    </td>
                  )}
                  <td className="text-center">
                    <OverlayTrigger
                      placement="top"
                      overlay={renderStatusTooltip(channel.isLive)}
                    >
                      <span>
                        <FontAwesomeIcon
                          icon={faCircle}
                          className={channel.isLive ? 'channel-status-live' : 'channel-status-down'}
                          size="sm"
                        />
                      </span>
                    </OverlayTrigger>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <span className="me-2">{channel.name}</span>
                      <OverlayTrigger
                        placement="top"
                        overlay={renderUrlTooltip(channel.url)}
                      >
                        <span className="text-muted">
                          <FontAwesomeIcon icon={faInfoCircle} size="xs" />
                        </span>
                      </OverlayTrigger>
                    </div>
                  </td>
                  <td>{channel.provider}</td>
                  <td>
                    <Badge bg="secondary">{channel.format.toUpperCase()}</Badge>
                  </td>
                  <td className="text-center" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant={copiedId === channel._id ? "success" : "outline-primary"}
                      size="sm"
                      onClick={() => copyToClipboard(channel.url, channel._id)}
                      className="me-1"
                    >
                      <FontAwesomeIcon icon={faCopy} />
                      {copiedId === channel._id ? ' Copied!' : ' Copy'}
                    </Button>
                    
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      as="a"
                      href={channel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FontAwesomeIcon icon={faExternalLinkAlt} /> Open
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
      
      {renderPagination()}
      
      <div className="mt-3 text-muted small text-center">
        Showing {channels.length > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, channels.length)} of {channels.length} channels
      </div>
    </>
  );
};

export default ChannelList;
