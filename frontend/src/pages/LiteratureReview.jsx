import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { proposalAPI, literatureReviewAPI } from '../api';

const LiteratureReview = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const isStudent = user?.role === 'student';

  const [proposal, setProposal] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({ paperName: '', author: '', year: '', journal: '', review: '' });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [proposalRes, entriesRes] = await Promise.all([
        proposalAPI.getById(id),
        literatureReviewAPI.getAll(id)
      ]);
      setProposal(proposalRes.data.data);
      setEntries(entriesRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load literature review');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.paperName.trim() || !form.author.trim() || !form.review.trim()) return;
    setSubmitting(true);
    try {
      await literatureReviewAPI.submit({ proposalId: id, ...form });
      setForm({ paperName: '', author: '', year: '', journal: '', review: '' });
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit literature review');
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
    return (
      <div className="bg-white border border-red-200 rounded-lg p-6 text-red-600 text-sm">
        {error || 'Thesis not found'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/my-thesis/${id}`} className="text-sm text-blue-600 hover:underline font-medium">← Back to My Thesis</Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Literature Review</h1>
        <p className="text-sm text-slate-500">{proposal.title}</p>
      </div>

      {isStudent && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900">Add a Reviewed Paper</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Paper Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text" name="paperName" value={form.paperName} onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Author <span className="text-red-500">*</span>
              </label>
              <input
                type="text" name="author" value={form.author} onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Publication Year</label>
              <input
                type="text" name="year" value={form.year} onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Journal / Venue</label>
              <input
                type="text" name="journal" value={form.journal} onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Your Review <span className="text-red-500">*</span>
            </label>
            <textarea
              name="review" value={form.review} onChange={handleChange} rows={5}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Summarize the paper and how it relates to your thesis..."
            />
          </div>

          <button
            type="submit" disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        <h2 className="font-semibold text-slate-900">Previously Submitted Reviews ({entries.length})</h2>
        {entries.length === 0 ? (
          <p className="text-sm text-slate-400">No literature reviews submitted yet.</p>
        ) : (
          entries.map((e) => (
            <div key={e._id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{e.paperName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {e.author}{e.year ? `, ${e.year}` : ''}{e.journal ? ` — ${e.journal}` : ''}
                  </p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(e.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-slate-700 mt-3 leading-relaxed">{e.review}</p>
              <p className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-100">Submitted by {e.submittedBy?.name}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LiteratureReview;
