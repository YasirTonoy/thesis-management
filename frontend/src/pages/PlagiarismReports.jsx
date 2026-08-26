import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { proposalAPI, plagiarismReportAPI, thesisVersionAPI } from '../api';

const TOOLS = ['Turnitin', 'iThenticate', 'Grammarly', 'Copyleaks', 'Other'];

const REVIEW_BADGES = {
  pending: { label: 'Awaiting Review', className: 'bg-slate-100 text-slate-600' },
  accepted: { label: 'Accepted', className: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700' }
};

const similarityStyle = (value) => {
  if (value <= 20) return { className: 'bg-emerald-50 text-emerald-700', label: 'Within Limit' };
  if (value <= 40) return { className: 'bg-amber-50 text-amber-700', label: 'Needs Attention' };
  return { className: 'bg-red-50 text-red-700', label: 'Above Threshold' };
};

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const PlagiarismReports = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const isSupervisor = user?.role === 'supervisor';

  const [proposal, setProposal] = useState(null);
  const [reports, setReports] = useState([]);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [form, setForm] = useState({ similarityPercentage: '', toolName: 'Turnitin', notes: '', thesisVersionId: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [reviewFormOpenId, setReviewFormOpenId] = useState(null);
  const [reviewComment, setReviewComment] = useState('');

  const API_ORIGIN = (import.meta.env?.VITE_API_URL || 'http://localhost:5001/api').replace('/api', '');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [proposalRes, reportsRes, versionsRes] = await Promise.all([
        proposalAPI.getById(id),
        plagiarismReportAPI.getAll(id),
        thesisVersionAPI.getAll(id)
      ]);
      setProposal(proposalRes.data.data);
      setReports(reportsRes.data.data || []);
      setVersions(versionsRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load plagiarism reports');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleUpload = async (e) => {
    e.preventDefault();
    if (form.similarityPercentage === '' || !file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('proposalId', id);
      fd.append('similarityPercentage', form.similarityPercentage);
      fd.append('toolName', form.toolName);
      fd.append('notes', form.notes.trim());
      if (form.thesisVersionId) fd.append('thesisVersionId', form.thesisVersionId);
      fd.append('file', file);
      await plagiarismReportAPI.upload(fd);
      setForm({ similarityPercentage: '', toolName: 'Turnitin', notes: '', thesisVersionId: '' });
      setFile(null);
      setShowUploadForm(false);
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload plagiarism report');
    }
    setUploading(false);
  };

  const handleReview = async (reportId, reviewStatus) => {
    try {
      await plagiarismReportAPI.review(reportId, { reviewStatus, reviewComment: reviewComment.trim() });
      setReviewFormOpenId(null);
      setReviewComment('');
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to review this report');
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Delete this plagiarism report? This cannot be undone.')) return;
    try {
      await plagiarismReportAPI.delete(reportId);
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete this report');
    }
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

  const latest = reports[0];

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/my-thesis/${id}`} className="text-sm text-blue-600 hover:underline font-medium">← Back to My Thesis</Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Plagiarism Reports</h1>
        <p className="text-sm text-slate-500">{proposal.title}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Latest Similarity Score</p>
            {latest ? (
              <React.Fragment>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold text-slate-900">{latest.similarityPercentage}%</h2>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${similarityStyle(latest.similarityPercentage).className}`}>
                    {similarityStyle(latest.similarityPercentage).label}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  {latest.toolName} · uploaded by {latest.uploadedBy?.name} on {new Date(latest.createdAt).toLocaleDateString()}
                </p>
              </React.Fragment>
            ) : (
              <p className="text-sm text-slate-400">No plagiarism report uploaded yet.</p>
            )}
          </div>
          {isStudent && (
            <button
              onClick={() => setShowUploadForm((s) => !s)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition whitespace-nowrap"
            >
              {showUploadForm ? 'Cancel' : 'Upload Report'}
            </button>
          )}
        </div>

        {showUploadForm && (
          <form onSubmit={handleUpload} className="border border-slate-200 rounded-lg p-4 mt-5 space-y-4 bg-slate-50">
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-600">
              <div><span className="font-semibold text-slate-800">Thesis Name:</span> {proposal.title}</div>
              <div><span className="font-semibold text-slate-800">Thesis ID:</span> {proposal._id}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Similarity Percentage <span className="text-red-500">*</span>
                </label>
                <input
                  type="number" name="similarityPercentage" min="0" max="100" step="0.1"
                  value={form.similarityPercentage} onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., 12.5"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Checking Tool</label>
                <select
                  name="toolName" value={form.toolName} onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {TOOLS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Thesis Version (optional)</label>
              <select
                name="thesisVersionId" value={form.thesisVersionId} onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Not linked to a specific version --</option>
                {versions.map((v) => (
                  <option key={v._id} value={v._id}>
                    Version {v.versionNumber}{v.isCurrent ? ' (current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Report File <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0] || null)}
                className="w-full text-sm text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Notes</label>
              <textarea
                name="notes" value={form.notes} onChange={handleChange} rows={2}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Anything your supervisor should know about this report..."
              />
            </div>

            <button
              type="submit" disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Report'}
            </button>
          </form>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold text-slate-900">Report History ({reports.length})</h2>

        {reports.length === 0 ? (
          <p className="text-sm text-slate-400">No plagiarism reports uploaded yet.</p>
        ) : (
          reports.map((r) => {
            const badge = REVIEW_BADGES[r.reviewStatus] || REVIEW_BADGES.pending;
            const score = similarityStyle(r.similarityPercentage);
            return (
              <div key={r._id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${score.className}`}>
                      {r.similarityPercentage}% Similarity
                    </span>
                    <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-md">{r.toolName}</span>
                    {r.thesisVersion && (
                      <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-md">
                        Version {r.thesisVersion.versionNumber}
                      </span>
                    )}
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${badge.className}`}>{badge.label}</span>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>

                {r.notes && <p className="text-sm text-slate-700 mt-3 leading-relaxed">{r.notes}</p>}

                {r.reviewComment && (
                  <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Supervisor Feedback</p>
                    <p className="text-sm text-slate-700">{r.reviewComment}</p>
                    <p className="text-xs text-slate-400 mt-1.5">
                      {r.reviewedBy?.name}{r.reviewedAt ? ` — ${new Date(r.reviewedAt).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                )}

                {isSupervisor && reviewFormOpenId === r._id && (
                  <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={3}
                      placeholder="Feedback on this plagiarism report..."
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(r._id, 'accepted')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleReview(r._id, 'rejected')}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-400">
                    By {r.uploadedBy?.name}
                    {r.report?.size ? ` · ${formatSize(r.report.size)}` : ''}
                  </span>
                  <div className="flex items-center gap-3">
                    {isSupervisor && (
                      <button
                        onClick={() => {
                          setReviewFormOpenId(reviewFormOpenId === r._id ? null : r._id);
                          setReviewComment('');
                        }}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        {reviewFormOpenId === r._id ? 'Close' : 'Review'}
                      </button>
                    )}
                    {isStudent && r.reviewStatus === 'pending' && (
                      <button
                        onClick={() => handleDelete(r._id)}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                    {r.report?.url && (
                      <a
                        href={API_ORIGIN + r.report.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        View Report
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PlagiarismReports;
