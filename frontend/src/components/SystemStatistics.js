import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faServer, faCheckCircle, faTimesCircle, faLayerGroup, faTag, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { channelAPI } from '../utils/api';

const SystemStatistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const { data } = await channelAPI.getSystemStatistics();
        
        if (data.success) {
          setStats(data.data);
        }
        
        setLoading(false);
      } catch (error) {
        setError('Error loading system statistics');
        setLoading(false);
        console.error('Error loading system statistics:', error);
      }
    };
    
    fetchStatistics();
  }, []);
  
  if (loading) {
    return (
      <Card>
        <Card.Body className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading system statistics...</p>
        </Card.Body>
      </Card>
    );
  }
  
  if (error || !stats) {
    return (
      <Card>
        <Card.Body className="text-center text-danger">
          {error || 'Failed to load statistics'}
        </Card.Body>
      </Card>
    );
  }
  
  // Group daily stats by date
  const dailyData = {};
  stats.dailyStats.forEach(stat => {
    const date = stat._id.day;
    if (!dailyData[date]) {
      dailyData[date] = { date, live: 0, down: 0, total: 0 };
    }
    
    if (stat._id.isLive) {
      dailyData[date].live += stat.count;
    } else {
      dailyData[date].down += stat.count;
    }
    
    dailyData[date].total += stat.count;
  });
  
  // Convert to array and sort by date
  const dailyStats = Object.values(dailyData).sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
  
  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">System Statistics</h5>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={6} lg={3} className="mb-3">
            <div className="d-flex align-items-center">
              <div className="me-3">
                <FontAwesomeIcon icon={faServer} size="2x" className="text-primary" />
              </div>
              <div>
                <h6 className="mb-0">Total Channels</h6>
                <h4 className="mb-0">{stats.channelCounts.total.toLocaleString()}</h4>
              </div>
            </div>
          </Col>
          
          <Col md={6} lg={3} className="mb-3">
            <div className="d-flex align-items-center">
              <div className="me-3">
                <FontAwesomeIcon icon={faCheckCircle} size="2x" className="text-success" />
              </div>
              <div>
                <h6 className="mb-0">Live Channels</h6>
                <h4 className="mb-0">{stats.channelCounts.live.toLocaleString()}</h4>
              </div>
            </div>
          </Col>
          
          <Col md={6} lg={3} className="mb-3">
            <div className="d-flex align-items-center">
              <div className="me-3">
                <FontAwesomeIcon icon={faTimesCircle} size="2x" className="text-danger" />
              </div>
              <div>
                <h6 className="mb-0">Down Channels</h6>
                <h4 className="mb-0">{stats.channelCounts.down.toLocaleString()}</h4>
              </div>
            </div>
          </Col>
          
          <Col md={6} lg={3} className="mb-3">
            <div className="d-flex align-items-center">
              <div className="me-3">
                <FontAwesomeIcon icon={faLayerGroup} size="2x" className="text-info" />
              </div>
              <div>
                <h6 className="mb-0">Live Percentage</h6>
                <h4 className="mb-0">{stats.channelCounts.livePercentage.toFixed(1)}%</h4>
              </div>
            </div>
            <ProgressBar 
              now={stats.channelCounts.livePercentage} 
              variant={stats.channelCounts.livePercentage > 80 ? 'success' : stats.channelCounts.livePercentage > 50 ? 'warning' : 'danger'} 
              className="mt-2"
            />
          </Col>
        </Row>
        
        <Row className="mt-4">
          <Col md={6}>
            <h6 className="mb-3">
              <FontAwesomeIcon icon={faTag} className="me-2" />
              Top Categories
            </h6>
            <div className="table-responsive">
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Channels</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.categoryDistribution.slice(0, 5).map((category, index) => (
                    <tr key={index}>
                      <td>{category._id || 'Uncategorized'}</td>
                      <td>{category.count}</td>
                      <td>
                        {((category.count / stats.channelCounts.total) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Col>
          
          <Col md={6}>
            <h6 className="mb-3">
              <FontAwesomeIcon icon={faGlobe} className="me-2" />
              Top Providers
            </h6>
            <div className="table-responsive">
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Channels</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.providerDistribution.slice(0, 5).map((provider, index) => (
                    <tr key={index}>
                      <td>{provider._id || 'Unknown'}</td>
                      <td>{provider.count}</td>
                      <td>
                        {((provider.count / stats.channelCounts.total) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Col>
        </Row>
        
        <h6 className="mt-4 mb-3">Daily Status Checks (Last 7 Days)</h6>
        <div className="daily-stats">
          {dailyStats.map((day, index) => (
            <div key={index} className="daily-stat-item">
              <div className="date">{new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}</div>
              <ProgressBar>
                <ProgressBar 
                  variant="success" 
                  now={(day.live / day.total) * 100} 
                  key={1} 
                />
                <ProgressBar 
                  variant="danger" 
                  now={(day.down / day.total) * 100} 
                  key={2} 
                />
              </ProgressBar>
              <div className="counts">
                <span className="text-success">{day.live}</span> / 
                <span className="text-danger">{day.down}</span>
              </div>
            </div>
          ))}
        </div>
        
        <h6 className="mt-4 mb-3">Format Distribution</h6>
        <Row>
          {stats.formatDistribution.map((format, index) => (
            <Col key={index} md={3} sm={6} className="mb-3">
              <Card className="h-100">
                <Card.Body className="text-center">
                  <h5 className="mb-0">
                    <Badge bg="secondary">{format._id.toUpperCase() || 'UNKNOWN'}</Badge>
                  </h5>
                  <div className="mt-2">
                    <strong>{format.count}</strong> channels
                  </div>
                  <div className="text-muted small">
                    {((format.count / stats.channelCounts.total) * 100).toFixed(1)}%
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Card.Body>
      <Card.Footer className="text-muted">
        <small>
          Statistics updated at: {new Date().toLocaleString()}
        </small>
      </Card.Footer>
      
      <style jsx>{`
        .daily-stats {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        
        .daily-stat-item {
          flex: 1;
          padding: 0 5px;
          text-align: center;
        }
        
        .daily-stat-item .date {
          font-size: 0.8rem;
          color: #6c757d;
        }
        
        .daily-stat-item .counts {
          font-size: 0.8rem;
          font-weight: 500;
          margin-top: 2px;
        }
      `}</style>
    </Card>
  );
};

export default SystemStatistics;
