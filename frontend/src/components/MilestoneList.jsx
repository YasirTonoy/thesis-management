import React, { useState } from 'react';

const MilestoneList = ({ milestones, onMilestoneSubmit, onMilestoneReview, onMilestoneDelete, role }) => {
  const [selectedId, setSelectedId] = useState(null);

  // Submit modal
  const [submitMilestoneId, setSubmitMilestoneId] = useState(null);
  const [submissionComment, setSubmissionComment] = useState('');

  // Review modal
  const [reviewMilestoneId, setReviewMilestoneId] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('approved');
  const [reviewFeedback, setReviewFeedback] = useState('');

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-amber-50 text-amber-700 border-amber-300',
      submitted: 'bg-blue-50 text-blue-700 border-blue-300',
      approved: 'bg-green-50 text-green-700 border-green-300',
      rejected: 'bg-red-50 text-red-700 border-red-300'
    };
    return colors[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      submitted: '📤',
      approved: '✅',
      rejected: '❌'
    };
    return icons[status] || '📌';
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const handleOpenSubmit = (id) => {
    setSubmitMilestoneId(id);
    setSubmissionComment('');
  };

  const handleConfirmSubmit = (e) => {
    e.preventDefault();
    if (!submitMilestoneId) return;
    onMilestoneSubmit(submitMilestoneId, submissionComment);
    setSubmitMilestoneId(null);
  };

  const handleOpenReview = (id, status) => {
    setReviewMilestoneId(id);
    setReviewStatus(status);
    setReviewFeedback('');
  };

  const handleConfirmReview = (e) => {
    e.preventDefault();
    if (!reviewMilestoneId) return;
    onMilestoneReview(reviewMilestoneId, reviewStatus, reviewFeedback);
    setReviewMilestoneId(null);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this milestone?')) return;
    if (onMilestoneDelete) onMilestoneDelete(id);
  };

  if (!milestones || milestones.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-slate-200 text-slate-500 shadow-sm">
        <p className="text-sm font-semibold">No milestones assigned yet.</p>
      </div>
    );
  }

  const isSupervisorOrAdmin = role === 'supervisor' || role === 'admin';

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {milestones.map((milestone) => {
          const dueDate = new Date(milestone.dueDate);
          const isPastDue = isOverdue(milestone.dueDate) && milestone.status === 'pending';
          const isExpanded = selectedId === milestone._id;

          return (
            <div
              key={milestone._id}
              className={`border p-5 bg-white transition shadow-sm ${
                isPastDue ? 'border-red-300 bg-red-50/10' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div
                  className="flex-1 cursor-pointer w-full"
                  onClick={() => setSelectedId(isExpanded ? null : milestone._id)}
                >
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h4 className="font-bold text-base text-slate-900">{milestone.title}</h4>
                    <span className={`px-2 py-0.5 text-xs font-bold border ${getStatusBadge(milestone.status)}`}>
                      {getStatusIcon(milestone.status)} {milestone.status.toUpperCase()}
                    </span>
                    {isPastDue && (
                      <span className="bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 text-xs font-bold">
                        ⚠️ OVERDUE
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 mt-2 flex flex-wrap items-center gap-4">
                    <span>📅 Due: <strong className="text-slate-700">{dueDate.toLocaleDateString()}</strong></span>
                    <span>⏰ <strong className="text-slate-700">{dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                    {milestone.student && isSupervisorOrAdmin && (
                      <span className="text-blue-700 font-semibold">
                        👨‍🎓 Student: {milestone.student?.name || 'Student'}
                      </span>
                    )}
                  </div>

                  {milestone.description && (
                    <p className="text-xs text-slate-600 mt-2.5 leading-relaxed bg-slate-50 p-3 border border-slate-100">
                      {milestone.description}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto items-end">
                  {role === 'student' && milestone.status === 'pending' && (
                    <button
                      onClick={() => handleOpenSubmit(milestone._id)}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold transition shadow-sm flex items-center justify-center gap-1.5"
                    >
                      📤 Submit Milestone
                    </button>
                  )}

                  {isSupervisorOrAdmin && milestone.status === 'submitted' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenReview(milestone._id, 'approved')}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-xs font-semibold transition shadow-sm"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleOpenReview(milestone._id, 'rejected')}
                        className="border border-red-300 text-red-600 hover:bg-red-50 px-3 py-1.5 text-xs font-semibold transition"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}

                  {isSupervisorOrAdmin && onMilestoneDelete && (
                    <button
                      onClick={() => handleDelete(milestone._id)}
                      className="text-slate-400 hover:text-red-600 text-xs px-2 py-1 transition"
                      title="Delete milestone"
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Expandable Submission & Review Details */}
              {isExpanded && (
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-3 text-xs">
                  {milestone.submissionComment && (
                    <div className="bg-blue-50 border border-blue-200 p-3.5 space-y-1">
                      <p className="font-bold text-blue-900">💬 Student Submission Notes:</p>
                      <p className="text-slate-700 leading-relaxed">{milestone.submissionComment}</p>
                      {milestone.submissionDate && (
                        <p className="text-[10px] text-slate-500 pt-1">
                          Submitted: {new Date(milestone.submissionDate).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {milestone.feedback && (
                    <div className="bg-green-50 border border-green-200 p-3.5 space-y-1">
                      <p className="font-bold text-green-900">📝 Supervisor Feedback:</p>
                      <p className="text-slate-700 leading-relaxed">{milestone.feedback}</p>
                      {milestone.feedbackDate && (
                        <p className="text-[10px] text-slate-500 pt-1">
                          Reviewed: {new Date(milestone.feedbackDate).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* STUDENT SUBMIT MODAL */}
      {submitMilestoneId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSubmitMilestoneId(null)}>
          <div className="bg-white w-full max-w-md shadow-2xl border border-slate-200 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-base text-slate-900">Submit Milestone for Review</h3>
              <button onClick={() => setSubmitMilestoneId(null)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">×</button>
            </div>
            <form onSubmit={handleConfirmSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Submission Comments & Links
                </label>
                <textarea
                  value={submissionComment}
                  onChange={(e) => setSubmissionComment(e.target.value)}
                  placeholder="Describe the completed work, link to GitHub, Google Docs, or attachments..."
                  rows={4}
                  className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setSubmitMilestoneId(null)} className="flex-1 border border-slate-300 text-slate-700 py-2 text-xs font-semibold hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 text-xs font-semibold shadow-sm transition">
                  Confirm Submission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPERVISOR REVIEW MODAL */}
      {reviewMilestoneId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setReviewMilestoneId(null)}>
          <div className="bg-white w-full max-w-md shadow-2xl border border-slate-200 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-base text-slate-900">
                {reviewStatus === 'approved' ? 'Approve Milestone' : 'Reject Milestone'}
              </h3>
              <button onClick={() => setReviewMilestoneId(null)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">×</button>
            </div>
            <form onSubmit={handleConfirmReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Feedback for Student
                </label>
                <textarea
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder="Provide guidance, comments on quality, or required revisions..."
                  rows={4}
                  className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setReviewMilestoneId(null)} className="flex-1 border border-slate-300 text-slate-700 py-2 text-xs font-semibold hover:bg-slate-50">Cancel</button>
                <button
                  type="submit"
                  className={`flex-1 text-white py-2 text-xs font-semibold shadow-sm transition ${
                    reviewStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {reviewStatus === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestoneList;