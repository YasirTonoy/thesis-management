import React, { Component } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import StudentDashboard from './pages/StudentDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center text-3xl mb-4">
            💥
          </div>
          <h1 className="text-2xl font-extrabold text-red-400 mb-2">Application Notice</h1>
          <p className="text-slate-400 max-w-md mb-6 text-sm">
            {this.state.error?.toString() || 'An error occurred during state rendering.'}
          </p>
          <button
            onClick={this.handleReset}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-500/20"
          >
            Reset Session & Reload 🔄
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const MainContent = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return <Login />;
  }

  const roleBadges = {
    admin: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    supervisor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    student: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Sleek Top Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800/80 py-3.5 px-6 shadow-xl shadow-black/40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-md shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span className="text-sm font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  TF
                </span>
              </div>
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Thesis Management
              </span>
              <span className={`ml-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${roleBadges[user.role] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                {user.role}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-slate-950/60 border border-slate-800/80 px-3.5 py-1.5 rounded-2xl">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="font-semibold text-xs text-slate-200 leading-tight">{user.name}</p>
                <p className="text-[11px] text-slate-400 leading-tight truncate max-w-[150px]">{user.email}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 text-xs font-semibold px-3.5 py-2 rounded-xl transition duration-200 flex items-center space-x-1.5"
            >
              <span>Logout</span>
              <span>🚪</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {user.role === 'admin' && <AdminDashboard />}
        {user.role === 'supervisor' && <SupervisorDashboard />}
        {user.role === 'student' && <StudentDashboard />}
      </main>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
