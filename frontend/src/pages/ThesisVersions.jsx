import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { proposalAPI, thesisVersionAPI } from '../api';

const REVIEW_BADGES = {
  pending: { label: 'Awaiting Review', className: 'bg-slate-100 text-slate-600' },
  approved: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700' },
  revision_required: { label: 'Revision Required', className: 'bg-amber-50 text-amber-700' }
};

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ThesisVersions = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const isSupervisor = user?.role === 'supervisor';

  const [proposal, setProposal] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [changeSummary, setChangeSummary] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [reviewFormOpenId, setReviewFormOpenId] = useState(null);
  const [reviewComment, setReviewComment] = useState('');

  const API_ORIGIN = (import.meta.env?.VITE_API_URL || 'http://localhost:5001/api').replace('/api', '');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [proposalRes, versionsRes] = await Promise.all([
        proposalAPI.getById(id),
        thesisVersionAPI.getAll(id)
      ]);
      setProposal(proposalRes.data.data);
      setVersions(versionsRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load thesis versions');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!changeSummary.trim() || !file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('proposalId', id);
      fd.append('changeSummary', changeSummary.trim());
      fd.append('file', file);
      await thesisVersionAPI.upload(fd);
      setChangeSummary('');
      setFile(null);
      setShowUploadForm(false);
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload thesis version');
    }
    setUploading(false);
  };

  const handleReview = async (versionId, reviewStatus) => {
    try {
      await thesisVersionAPI.review(versionId, { reviewStatus, reviewComment: reviewComment.trim() });
      setReviewFormOpenId(null);
      setReviewComment('');
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to review this version');
    }
  };

  const handleRestore = async (versionId) => {
    try {
      await thesisVersionAPI.restore(versionId);
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to restore this version');
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

  const currentVersion = versions.find((v) => v.isCurrent);

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/my-thesis/${id}`} className="text-sm text-blue-600 hover:underline font-medium">← Back to My Thesis</Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Thesis Version Control</h1>
        <p className="text-sm text-slate-500">{proposal.title}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Current Draft</p>
            {currentVersion ? (
              <React.Fragment>
                <h2 className="text-lg font-bold text-slate-900">
                  Version {currentVersion.versionNumber} — {currentVersion.file?.originalName}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Uploaded by {currentVersion.uploadedBy?.name} on {new Date(currentVersion.createdAt).toLocaleDateString()}
                </p>
              </React.Fragment>
            ) : (
              <p className="text-sm text-slate-400">No thesis draft uploaded yet.</p>
            )}
          </div>
          {isStudent && (
            <button
              onClick={() => setShowUploadForm((s) => !s)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition whitespace-nowrap"
            >
              {showUploadForm ? 'Cancel' : 'Upload New Version'}
            </button>
          )}
        </div>

        {showUploadForm && (
          <form onSubmit={handleUpload} className="border border-slate-200 rounded-lg p-4 mt-5 space-y-4 bg-slate-50">
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-600">
              <div><span className="font-semibold text-slate-800">Thesis Name:</span> {proposal.title}</div>
              <div>
                <span className="font-semibold text-slate-800">Next Version:</span> v{versions.length ? versions[0].versionNumber + 1 : 1}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Thesis Document <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0] || null)}
                className="w-full text-sm text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Change Summary <span className="text-red-500">*</span>
              </label>
              <textarea
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Describe what changed in this revision..."
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Version'}
            </button>
          </form>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold text-slate-900">Revision History ({versions.length})</h2>

        {versions.length === 0 ? (
          <p className="text-sm text-slate-400">No revisions recorded yet.</p>
        ) : (
          versions.map((v) => {
            const badge = REVIEW_BADGES[v.reviewStatus] || REVIEW_BADGES.pending;
            return (
              <div key={v._id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                      Version {v.versionNumber}
                    </span>
                    {v.isCurrent && (
                      <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-md">Current</span>
                    )}
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${badge.className}`}>{badge.label}</span>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(v.createdAt).toLocaleDateString()}</span>
                </div>

                <p className="text-sm text-slate-700 mt-3 leading-relaxed">{v.changeSummary}</p>

                {v.reviewComment && (
                  <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Supervisor Feedback</p>
                    <p className="text-sm text-slate-700">{v.reviewComment}</p>
                    <p className="text-xs text-slate-400 mt-1.5">
                      {v.reviewedBy?.name}{v.reviewedAt ? ` — ${new Date(v.reviewedAt).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                )}

                {isSupervisor && reviewFormOpenId === v._id && (
                  <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={3}
                      placeholder="Feedback for this revision..."
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(v._id, 'approved')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReview(v._id, 'revision_required')}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                      >
                        Request Revision
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-400">
                    By {v.uploadedBy?.name}
                    {v.file?.size ? ` · ${formatSize(v.file.size)}` : ''}
                  </span>
                  <div className="flex items-center gap-3">
                    {isSupervisor && (
                      <button
                        onClick={() => {
                          setReviewFormOpenId(reviewFormOpenId === v._id ? null : v._id);
                          setReviewComment('');
                        }}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        {reviewFormOpenId === v._id ? 'Close' : 'Review'}
                      </button>
                    )}
                    {isStudent && !v.isCurrent && (
                      <button
                        onClick={() => handleRestore(v._id)}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Restore as Current
                      </button>
                    )}
                    {v.file?.url && (
                      <a
                        href={API_ORIGIN + v.file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        Download
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

export default ThesisVersions;
