import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { proposalAPI, finalSubmissionAPI, thesisVersionAPI, plagiarismReportAPI } from '../api';

const STATUS_BADGES = {
  submitted: { label: 'Submitted', className: 'bg-blue-50 text-blue-700' },
  accepted: { label: 'Accepted', className: 'bg-emerald-50 text-emerald-700' },
  returned: { label: 'Returned for Correction', className: 'bg-amber-50 text-amber-700' }
};

const DECLARATION =
  'I declare that this thesis is my own original work, that it has not been submitted for any other degree, and that all sources used have been properly acknowledged.';

const FinalSubmission = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const isSupervisor = user?.role === 'supervisor';

  const [proposal, setProposal] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [versions, setVersions] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ thesisVersionId: '', plagiarismReportId: '', abstract: '', keywords: '', declarationAccepted: false });
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewComment, setReviewComment] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [proposalRes, submissionRes, versionsRes, reportsRes] = await Promise.all([
        proposalAPI.getById(id),
        finalSubmissionAPI.get(id),
        thesisVersionAPI.getAll(id),
        plagiarismReportAPI.getAll(id)
      ]);
      setProposal(proposalRes.data.data);
      setSubmission(submissionRes.data.data || null);
      setVersions(versionsRes.data.data || []);
      setReports(reportsRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load final submission');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.thesisVersionId || !form.abstract.trim() || !form.declarationAccepted) return;
    setSubmitting(true);
    try {
      await finalSubmissionAPI.submit({
        proposalId: id,
        thesisVersionId: form.thesisVersionId,
        plagiarismReportId: form.plagiarismReportId || undefined,
        abstract: form.abstract.trim(),
        keywords: form.keywords,
        declarationAccepted: true
      });
      setForm({ thesisVersionId: '', plagiarismReportId: '', abstract: '', keywords: '', declarationAccepted: false });
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit final thesis');
    }
    setSubmitting(false);
  };

  const handleReview = async (status) => {
    try {
      await finalSubmissionAPI.review(submission._id, { status, reviewComment: reviewComment.trim() });
      setShowReviewForm(false);
      setReviewComment('');
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to review the submission');
    }
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await finalSubmissionAPI.downloadPdf(submission._id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${proposal.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-final-submission.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to generate the submission PDF');
    }
    setDownloading(false);
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

  const badge = submission ? STATUS_BADGES[submission.status] || STATUS_BADGES.submitted : null;
  const canSubmit = isStudent && (!submission || submission.status === 'returned');

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/my-thesis/${id}`} className="text-sm text-blue-600 hover:underline font-medium">← Back to My Thesis</Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Final Thesis Submission</h1>
        <p className="text-sm text-slate-500">{proposal.title}</p>
      </div>

      {submission && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-start gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${badge.className}`}>{badge.label}</span>
              {submission.thesisVersion && (
                <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-md">
                  Version {submission.thesisVersion.versionNumber}
                </span>
              )}
              {submission.plagiarismReport && (
                <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-md">
                  {submission.plagiarismReport.similarityPercentage}% Similarity
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(submission.createdAt).toLocaleDateString()}</span>
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Abstract</p>
            <p className="text-sm text-slate-700 leading-relaxed">{submission.abstract}</p>
          </div>

          {submission.keywords?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Keywords</p>
              <div className="flex flex-wrap gap-2">
                {submission.keywords.map((k) => (
                  <span key={k} className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-md">{k}</span>
                ))}
              </div>
            </div>
          )}

          {submission.reviewComment && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Supervisor Remarks</p>
              <p className="text-sm text-slate-700">{submission.reviewComment}</p>
              <p className="text-xs text-slate-400 mt-1.5">
                {submission.reviewedBy?.name}{submission.reviewedAt ? ` — ${new Date(submission.reviewedAt).toLocaleDateString()}` : ''}
              </p>
            </div>
          )}

          {isSupervisor && showReviewForm && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 space-y-2">
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                placeholder="Remarks on the final submission..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleReview('accepted')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                >
                  Accept Submission
                </button>
                <button
                  onClick={() => handleReview('returned')}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                >
                  Return for Correction
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">Submitted by {submission.submittedBy?.name}</span>
            <div className="flex items-center gap-3">
              {isSupervisor && (
                <button
                  onClick={() => { setShowReviewForm((s) => !s); setReviewComment(''); }}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  {showReviewForm ? 'Close' : 'Review'}
                </button>
              )}
              <button
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                {downloading ? 'Generating...' : 'Download Cover Sheet (PDF)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {canSubmit && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900">
            {submission ? 'Resubmit Final Thesis' : 'Submit Final Thesis'}
          </h2>

          {versions.length === 0 ? (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              You must upload at least one thesis version before making a final submission.{' '}
              <Link to={`/my-thesis/${id}/versions`} className="font-semibold underline">Go to Thesis Versions</Link>
            </p>
          ) : (
            <React.Fragment>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Thesis Version <span className="text-red-500">*</span>
                </label>
                <select
                  name="thesisVersionId" value={form.thesisVersionId} onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Select the version to submit --</option>
                  {versions.map((v) => (
                    <option key={v._id} value={v._id}>
                      Version {v.versionNumber}{v.isCurrent ? ' (current)' : ''} — {v.file?.originalName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Plagiarism Report (optional)</label>
                <select
                  name="plagiarismReportId" value={form.plagiarismReportId} onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Not attached --</option>
                  {reports.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.similarityPercentage}% — {r.toolName} ({new Date(r.createdAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Abstract <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="abstract" value={form.abstract} onChange={handleChange} rows={6}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Summarize your thesis — this appears on the generated cover sheet..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Keywords</label>
                <input
                  type="text" name="keywords" value={form.keywords} onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Comma separated, e.g., machine learning, NLP, healthcare"
                />
              </div>

              <label className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-lg p-3 cursor-pointer">
                <input
                  type="checkbox" name="declarationAccepted" checked={form.declarationAccepted} onChange={handleChange}
                  className="mt-0.5"
                />
                <span className="text-sm text-slate-700">{DECLARATION} <span className="text-red-500">*</span></span>
              </label>

              <button
                type="submit"
                disabled={submitting || !form.declarationAccepted}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : submission ? 'Resubmit Thesis' : 'Submit Final Thesis'}
              </button>
            </React.Fragment>
          )}
        </form>
      )}

      {!submission && !isStudent && (
        <p className="text-sm text-slate-400">This thesis has not been submitted for final review yet.</p>
      )}
    </div>
  );
};

export default FinalSubmission;
