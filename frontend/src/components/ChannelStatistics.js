import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faHeart, faSignal, faCalendarCheck, faCalendarTimes } from '@fortawesome/free-solid-svg-icons';
import { channelAPI } from '../utils/api';

const ChannelStatistics = ({ channelId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const { data } = await channelAPI.getStatistics(channelId);
        
        if (data.success) {
          setStats(data.data);
        }
        
        setLoading(false);
      } catch (error) {
        setError('Error loading channel statistics');
        setLoading(false);
        console.error('Error loading channel statistics:', error);
      }
    };
    
    fetchStatistics();
  }, [channelId]);
  
  if (loading) {
    return (
      <Card>
        <Card.Body className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading statistics...</p>
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
  
  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">Channel Statistics</h5>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={6} lg={3} className="mb-3">
            <div className="d-flex align-items-center">
              <div className="me-3">
                <FontAwesomeIcon icon={faSignal} size="2x" className="text-primary" />
              </div>
              <div>
                <h6 className="mb-0">Uptime</h6>
                <h4 className="mb-0">{stats.uptime.toFixed(1)}%</h4>
              </div>
            </div>
            <ProgressBar 
              now={stats.uptime} 
              variant={stats.uptime > 80 ? 'success' : stats.uptime > 50 ? 'warning' : 'danger'} 
              className="mt-2"
            />
          </Col>
          
          <Col md={6} lg={3} className="mb-3">
            <div className="d-flex align-items-center">
              <div className="me-3">
                <FontAwesomeIcon icon={faEye} size="2x" className="text-info" />
              </div>
              <div>
                <h6 className="mb-0">Views</h6>
                <h4 className="mb-0">{stats.viewCount.toLocaleString()}</h4>
              </div>
            </div>
          </Col>
          
          <Col md={6} lg={3} className="mb-3">
            <div className="d-flex align-items-center">
              <div className="me-3">
                <FontAwesomeIcon icon={faHeart} size="2x" className="text-danger" />
              </div>
              <div>
                <h6 className="mb-0">Favorites</h6>
                <h4 className="mb-0">{stats.favoriteCount.toLocaleString()}</h4>
              </div>
            </div>
          </Col>
          
          <Col md={6} lg={3} className="mb-3">
            <div className="d-flex align-items-center">
              <div className="me-3">
                <FontAwesomeIcon 
                  icon={stats.isLive ? faCalendarCheck : faCalendarTimes} 
                  size="2x" 
                  className={stats.isLive ? 'text-success' : 'text-danger'} 
                />
              </div>
              <div>
                <h6 className="mb-0">Status</h6>
                <h4 className="mb-0">
                  <Badge bg={stats.isLive ? 'success' : 'danger'}>
                    {stats.isLive ? 'Live' : 'Down'}
                  </Badge>
                </h4>
              </div>
            </div>
          </Col>
        </Row>
        
        <h6 className="mt-4 mb-3">Daily Uptime (Last 7 Days)</h6>
        <div className="daily-stats">
          {stats.dailyStats.map((day, index) => (
            <div key={index} className="daily-stat-item">
              <div className="date">{new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}</div>
              <ProgressBar 
                now={day.uptime} 
                variant={day.uptime > 80 ? 'success' : day.uptime > 50 ? 'warning' : 'danger'} 
                className="mt-1"
              />
              <div className="percentage">{day.uptime.toFixed(0)}%</div>
            </div>
          ))}
        </div>
        
        <h6 className="mt-4 mb-3">Recent Status Checks</h6>
        <div className="table-responsive">
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Time</th>
                <th>Status</th>
                <th>Response Time</th>
                <th>Status Code</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentChecks.map((check, index) => (
                <tr key={index}>
                  <td>{new Date(check.checkedAt).toLocaleString()}</td>
                  <td>
                    <Badge bg={check.isLive ? 'success' : 'danger'}>
                      {check.isLive ? 'Live' : 'Down'}
                    </Badge>
                  </td>
                  <td>{check.responseTime} ms</td>
                  <td>{check.statusCode || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card.Body>
      <Card.Footer className="text-muted">
        <small>
          Last checked: {new Date(stats.lastChecked).toLocaleString()}
          {stats.lastLive && (
            <> • Last seen live: {new Date(stats.lastLive).toLocaleString()}</>
          )}
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
        
        .daily-stat-item .percentage {
          font-size: 0.8rem;
          font-weight: 500;
          margin-top: 2px;
        }
      `}</style>
    </Card>
  );
};

export default ChannelStatistics;
