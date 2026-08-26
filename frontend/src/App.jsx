import React, { Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Homepage from './pages/Homepage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Placeholder from './pages/Placeholder';
import Proposals from './pages/Proposals';
import Notices from './pages/Notices';
import ResearchGroups from './pages/ResearchGroups';
import MyThesis from './pages/MyThesis';
import LiteratureReview from './pages/LiteratureReview';
import ThesisVersions from './pages/ThesisVersions';
import PlagiarismReports from './pages/PlagiarismReports';
import FinalSubmission from './pages/FinalSubmission';
import DefenseSchedule from './pages/DefenseSchedule';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h1>
          <p className="text-slate-500 max-w-md mb-6 text-sm">{this.state.error?.toString() || 'An unexpected error occurred.'}</p>
          <button onClick={this.handleReset} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 text-sm font-semibold transition-colors">
            Reset & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : children;
};

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<PublicRoute><Homepage /></PublicRoute>} />
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/proposals" element={<ProtectedRoute><Proposals /></ProtectedRoute>} />
    <Route path="/notices" element={<ProtectedRoute><Notices /></ProtectedRoute>} />
    <Route path="/research-groups" element={<ProtectedRoute><ResearchGroups /></ProtectedRoute>} />
    <Route path="/supervision" element={<ProtectedRoute><Placeholder title="Supervision" /></ProtectedRoute>} />
    <Route path="/milestones" element={<ProtectedRoute><Placeholder title="Milestones" /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Placeholder title="Profile" /></ProtectedRoute>} />

    <Route path="/my-thesis/:id" element={<ProtectedRoute><MyThesis /></ProtectedRoute>} />
    <Route path="/my-thesis/:id/literature-review" element={<ProtectedRoute><LiteratureReview /></ProtectedRoute>} />
    <Route path="/my-thesis/:id/versions" element={<ProtectedRoute><ThesisVersions /></ProtectedRoute>} />
    <Route path="/my-thesis/:id/plagiarism" element={<ProtectedRoute><PlagiarismReports /></ProtectedRoute>} />
    <Route path="/my-thesis/:id/final-submission" element={<ProtectedRoute><FinalSubmission /></ProtectedRoute>} />
    <Route path="/my-thesis/:id/defense" element={<ProtectedRoute><DefenseSchedule /></ProtectedRoute>} />

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
