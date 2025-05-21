import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="nav-brand">
          <h1>Master X</h1>
        </div>
        <div className="nav-links">
          {user ? (
            <>
              <button onClick={() => navigate('/dashboard')}>Dashboard</button>
              <button onClick={() => navigate('/profile')}>Profile</button>
              {user.role === 'admin' && (
                <button onClick={() => navigate('/admin')}>Admin</button>
              )}
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            location.pathname !== '/login' && (
              <button onClick={() => navigate('/login')}>Login</button>
            )
          )}
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
