import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import CVDetail from './pages/CVDetail';
import Recommendations from './pages/Recommendations';
import LearningRoadmap from './pages/LearningRoadmap';
import ProgressDashboard from './pages/ProgressDashboard';
import Analytics from './pages/Analytics';
import SharedReport from './pages/SharedReport';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/cv/:cvId" element={<CVDetail />} />
          <Route path="/cv/:cvId/recommendations" element={<Recommendations />} />
          <Route path="/recommendations/:cvId" element={<Recommendations />} />
          <Route path="/cv/:cvId/roadmap" element={<LearningRoadmap />} />
          <Route path="/cv/:cvId/progress" element={<ProgressDashboard />} />
          <Route path="/cv/:cvId/analytics" element={<Analytics />} />
          <Route path="/shared/:shareCode" element={<SharedReport />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;

