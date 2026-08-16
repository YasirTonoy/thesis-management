import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electrical & Electronic Engineering',
  'Civil Engineering',
  'Architecture',
  'Business Administration (BBA)',
  'Economics',
  'English & Humanities',
  'Mathematics & Natural Sciences',
  'Pharmacy',
  'Other'
];

const Signup = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', studentId: '', department: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await register({ ...formData, role: 'student' });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2.5 justify-center mb-10">
          <div className="w-8 h-8 bg-blue-600 flex items-center justify-center text-white font-bold text-sm">BR</div>
          <span className="font-bold text-lg tracking-tight text-slate-900">BRACU ResearchHub</span>
        </Link>

        <div className="border border-slate-200 bg-white shadow-sm">
          <div className="h-1 bg-blue-600" />
          <div className="p-8">
            <h1 className="text-xl font-bold text-slate-900 mb-1">Create your account</h1>
            <p className="text-sm text-slate-500 mb-6">Set up your student workspace</p>

            {error && (
              <div className="border border-red-200 bg-red-50 text-red-700 text-sm px-3.5 py-2.5 mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange('name')}
                  placeholder="Ahana Rahman"
                  className="w-full border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Email <span className="normal-case font-medium text-slate-400">(institutional or personal)</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange('email')}
                  placeholder="you@g.bracu.ac.bd"
                  className="w-full border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Student ID</label>
                  <input
                    type="text"
                    required
                    value={formData.studentId}
                    onChange={handleChange('studentId')}
                    placeholder="21301234"
                    className="w-full border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange('password')}
                    placeholder="••••••••"
                    className="w-full border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Department</label>
                <select
                  required
                  value={formData.department}
                  onChange={handleChange('department')}
                  className="w-full border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors bg-white text-slate-900"
                >
                  <option value="" disabled>Select your department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 text-sm transition-colors mt-2"
              >
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;


