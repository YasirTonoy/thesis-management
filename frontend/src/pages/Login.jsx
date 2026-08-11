import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = ({ onLoginSuccess }) => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    department: 'Computer Science & Engineering'
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isRegister) {
        const user = await register(formData);
        if (onLoginSuccess) onLoginSuccess(user);
      } else {
        const user = await login(formData.email, formData.password);
        if (onLoginSuccess) onLoginSuccess(user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fillQuickAccount = (email, role) => {
    setFormData({
      ...formData,
      email,
      password: 'password123',
      role
    });
    setIsRegister(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambient Glow Accents */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 right-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="relative z-10 max-w-md w-full">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-xl shadow-blue-500/20 mb-4">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <span className="text-2xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                TF
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            ThesisFlow
          </h1>
          <p className="text-slate-400 text-sm mt-1.5 font-medium">
            {isRegister ? 'Create your Academic Workspace' : 'Sign in to access your thesis dashboard'}
          </p>
        </div>

        {/* Card */}
        <div className="backdrop-blur-2xl bg-slate-900/80 border border-slate-800/90 rounded-3xl p-8 shadow-2xl shadow-black/80">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium p-3.5 rounded-xl mb-5 flex items-center space-x-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-200 text-slate-100 placeholder:text-slate-600"
                  placeholder="John Doe"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-200 text-slate-100 placeholder:text-slate-600"
                placeholder="student@test.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-200 text-slate-100 placeholder:text-slate-600"
                placeholder="••••••••"
                required
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-200 text-slate-100"
                >
                  <option value="student">🎓 Student</option>
                  <option value="supervisor">👨‍🏫 Supervisor</option>
                  <option value="admin">👑 Admin</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {submitting ? (
                <span className="flex items-center justify-center space-x-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Authenticating...</span>
                </span>
              ) : isRegister ? (
                'Create Account →'
              ) : (
                'Sign In to Dashboard →'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 transition duration-200"
            >
              {isRegister ? 'Already registered? Back to Sign In' : 'Need an account? Create one here'}
            </button>
          </div>

          {/* Preset Quick Login Buttons */}
          <div className="mt-6 border-t border-slate-800/80 pt-5">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              ⚡ Quick Demo One-Click Login
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillQuickAccount('student@test.com', 'student')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 hover:border-blue-500/40 transition duration-200 group"
              >
                <span className="text-base group-hover:scale-110 transition duration-200">🎓</span>
                <span className="text-xs font-semibold text-slate-300 group-hover:text-blue-400 mt-1">Student</span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickAccount('supervisor@test.com', 'supervisor')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 hover:border-indigo-500/40 transition duration-200 group"
              >
                <span className="text-base group-hover:scale-110 transition duration-200">👨‍🏫</span>
                <span className="text-xs font-semibold text-slate-300 group-hover:text-indigo-400 mt-1">Supervisor</span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickAccount('admin@test.com', 'admin')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 hover:border-purple-500/40 transition duration-200 group"
              >
                <span className="text-base group-hover:scale-110 transition duration-200">👑</span>
                <span className="text-xs font-semibold text-slate-300 group-hover:text-purple-400 mt-1">Admin</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
