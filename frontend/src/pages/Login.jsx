import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2.5 justify-center mb-10">
          <div className="w-8 h-8 bg-blue-600 flex items-center justify-center text-white font-bold text-sm">BR</div>
          <span className="font-bold text-lg tracking-tight text-slate-900">BRACU ResearchHub</span>
        </Link>

        <div className="border border-slate-200 bg-white shadow-sm">
          <div className="h-1 bg-blue-600" />
          <div className="p-8">
            <h1 className="text-xl font-bold text-slate-900 mb-1">Log in</h1>
            <p className="text-sm text-slate-500 mb-6">Access your thesis dashboard</p>

            {error && (
              <div className="border border-red-200 bg-red-50 text-red-700 text-sm px-3.5 py-2.5 mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@test.com"
                  className="w-full border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 text-sm transition-colors mt-2"
              >
                {loading ? 'Logging in…' : 'Log In'}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-200">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Quick Test Logins</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ email: 'student@test.com', password: 'password123' })}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-1.5 px-2 rounded border border-slate-300 font-medium transition"
                >
                  Student Fill
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ email: 'supervisor@test.com', password: 'password123' })}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-1.5 px-2 rounded border border-slate-300 font-medium transition"
                >
                  Supervisor Fill
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-600 font-semibold hover:text-blue-700">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;


