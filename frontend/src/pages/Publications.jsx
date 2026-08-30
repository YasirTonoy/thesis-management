import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { proposalAPI, publicationAPI } from '../api';

const STATUS_STYLES = {
  submitted: 'bg-slate-100 text-slate-700',
  under_review: 'bg-amber-50 text-amber-700',
  accepted: 'bg-blue-50 text-blue-700',
  published: 'bg-emerald-50 text-emerald-700'
};

const STATUS_LABELS = { submitted: 'Submitted', under_review: 'Under Review', accepted: 'Accepted', published: 'Published' };

const emptyForm = { title: '', authors: '', journalName: '', status: 'submitted', volumeIssue: '', publicationDate: '', link: '' };

const Publications = () => {
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
      const [proposalRes, entriesRes] = await Promise.all([proposalAPI.getById(id), publicationAPI.getAll(id)]);
      setProposal(proposalRes.data.data);
      setEntries(entriesRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load publication records');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.authors.trim() || !form.journalName.trim()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('proposalId', id);
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('document', file);
      await publicationAPI.submit(fd);
      setForm(emptyForm);
      setFile(null);
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit publication record');
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
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Publications & Journal Records</h1>
        <p className="text-sm text-slate-500">{proposal.title}</p>
      </div>

      {isStudent && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900">Add a Publication</h2>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Paper Title <span className="text-red-500">*</span></label>
            <input type="text" name="title" value={form.title} onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Authors <span className="text-red-500">*</span></label>
              <input type="text" name="authors" value={form.authors} onChange={handleChange} placeholder="e.g. A. Rahman, Dr. J. Rahman"
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Journal / Venue <span className="text-red-500">*</span></label>
              <input type="text" name="journalName" value={form.journalName} onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Status</label>
              <select name="status" value={form.status} onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="accepted">Accepted</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Volume / Issue</label>
              <input type="text" name="volumeIssue" value={form.volumeIssue} onChange={handleChange} placeholder="e.g. Vol 12, Issue 3"
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Publication Date</label>
              <input type="date" name="publicationDate" value={form.publicationDate} onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">DOI / Link</label>
              <input type="text" name="link" value={form.link} onChange={handleChange} placeholder="https://doi.org/..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Supporting Document <span className="normal-case font-medium text-slate-400">(optional — acceptance letter, PDF, etc.)</span>
            </label>
            <input type="file" onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:text-sm file:font-semibold hover:file:bg-blue-100" />
          </div>

          <button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Add Publication'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        <h2 className="font-semibold text-slate-900">Publication Records ({entries.length})</h2>
        {entries.length === 0 ? (
          <p className="text-sm text-slate-400">No publications recorded yet.</p>
        ) : (
          entries.map((p) => (
            <div key={p._id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{p.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{p.authors} — {p.journalName}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_STYLES[p.status]}`}>{STATUS_LABELS[p.status]}</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-500">
                {p.volumeIssue && <span>{p.volumeIssue}</span>}
                {p.publicationDate && <span>{new Date(p.publicationDate).toLocaleDateString()}</span>}
                {p.link && <a href={p.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View Paper ↗</a>}
                {p.document?.url && (
                  <a href={`${(import.meta.env?.VITE_API_URL || 'http://localhost:5001/api').replace('/api', '')}${p.document.url}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    {p.document.originalName} ↗
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-100">Submitted by {p.submittedBy?.name}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Publications;
