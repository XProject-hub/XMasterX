import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPanel from './pages/AdminPanel';
import ChannelDetailPage from './pages/ChannelDetailPage';
import UserProfilePage from './pages/UserProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import { AuthProvider } from './context/AuthContext';
import { ChannelProvider } from './context/ChannelContext';
import { UserProfileProvider } from './context/UserProfileContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <ChannelProvider>
        <UserProfileProvider>
          <Router>
            <div className="d-flex flex-column min-vh-100">
              <Header />
              <main className="flex-grow-1 py-3">
                <Container>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    
                    {/* Protected Routes */}
                    <Route 
                      path="/profile/*" 
                      element={
                        <PrivateRoute>
                          <UserProfilePage />
                        </PrivateRoute>
                      } 
                    />
                    <Route 
                      path="/channels/:id" 
                      element={
                        <PrivateRoute>
                          <ChannelDetailPage />
                        </PrivateRoute>
                      } 
                    />
                    
                    {/* Admin Routes */}
                    <Route 
                      path="/admin/*" 
                      element={
                        <AdminRoute>
                          <AdminPanel />
                        </AdminRoute>
                      } 
                    />
                    
                    {/* 404 Route */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Container>
              </main>
              <footer className="py-3 bg-light">
                <Container>
                  <div className="text-center text-muted">
                    <small>
                      Master X - Channel Management System &copy; {new Date().getFullYear()}
                    </small>
                  </div>
                </Container>
              </footer>
            </div>
          </Router>
        </UserProfileProvider>
      </ChannelProvider>
    </AuthProvider>
  );
}

export default App;
