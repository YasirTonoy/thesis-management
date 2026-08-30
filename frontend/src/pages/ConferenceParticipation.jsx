import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { proposalAPI, conferenceAPI } from '../api';

const ROLE_STYLES = { presenter: 'bg-blue-50 text-blue-700', 'co-author': 'bg-purple-50 text-purple-700', attendee: 'bg-slate-100 text-slate-700' };
const ROLE_LABELS = { presenter: 'Presenter', 'co-author': 'Co-Author', attendee: 'Attendee' };
const emptyForm = { conferenceName: '', paperTitle: '', role: 'presenter', location: '', date: '', notes: '' };

const ConferenceParticipation = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const isStudent = user?.role === 'student';

  const [proposal, setProposal] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [proposalRes, entriesRes] = await Promise.all([proposalAPI.getById(id), conferenceAPI.getAll(id)]);
      setProposal(proposalRes.data.data);
      setEntries(entriesRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load conference records');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.conferenceName.trim() || !form.date) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('proposalId', id);
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('document', file);
      await conferenceAPI.submit(fd);
      setForm(emptyForm);
      setFile(null);
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit conference record');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (error || !proposal) {
    return <div className="bg-white border border-red-200 rounded-lg p-6 text-red-600 text-sm">{error || 'Thesis not found'}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/my-thesis/${id}`} className="text-sm text-blue-600 hover:underline font-medium">← Back to My Thesis</Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Conference Participation</h1>
        <p className="text-sm text-slate-500">{proposal.title}</p>
      </div>

      {isStudent && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900">Add a Conference Record</h2>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Conference Name <span className="text-red-500">*</span></label>
            <input type="text" name="conferenceName" value={form.conferenceName} onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Paper Title <span className="normal-case font-medium text-slate-400">(if presenting)</span>
            </label>
            <input type="text" name="paperTitle" value={form.paperTitle} onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Role</label>
              <select name="role" value={form.role} onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
                <option value="presenter">Presenter</option>
                <option value="co-author">Co-Author</option>
                <option value="attendee">Attendee</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Location</label>
              <input type="text" name="location" value={form.location} onChange={handleChange} placeholder="City or 'Virtual'"
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Date <span className="text-red-500">*</span></label>
              <input type="date" name="date" value={form.date} onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder="Any additional context..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Certificate / Proof <span className="normal-case font-medium text-slate-400">(optional)</span></label>
            <input type="file" onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:text-sm file:font-semibold hover:file:bg-blue-100" />
          </div>

          <button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Add Record'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        <h2 className="font-semibold text-slate-900">Conference Records ({entries.length})</h2>
        {entries.length === 0 ? (
          <p className="text-sm text-slate-400">No conference participation recorded yet.</p>
        ) : (
          entries.map((c) => (
            <div key={c._id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{c.conferenceName}</h3>
                  {c.paperTitle && <p className="text-xs text-slate-500 mt-0.5">{c.paperTitle}</p>}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${ROLE_STYLES[c.role]}`}>{ROLE_LABELS[c.role]}</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-500">
                <span>{new Date(c.date).toLocaleDateString()}</span>
                {c.location && <span>{c.location}</span>}
                {c.document?.url && (
                  <a href={`${(import.meta.env?.VITE_API_URL || 'http://localhost:5001/api').replace('/api', '')}${c.document.url}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    {c.document.originalName} ↗
                  </a>
                )}
              </div>
              {c.notes && <p className="text-sm text-slate-700 mt-3 leading-relaxed">{c.notes}</p>}
              <p className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-100">Submitted by {c.submittedBy?.name}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConferenceParticipation;
