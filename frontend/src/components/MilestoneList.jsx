import React, { useState } from 'react';

const MilestoneList = ({ milestones, onMilestoneSubmit, onMilestoneReview, role }) => {
  const [selectedId, setSelectedId] = useState(null);

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      submitted: 'bg-blue-50 text-blue-700 border-blue-200',
      approved: 'bg-green-50 text-green-700 border-green-200',
      rejected: 'bg-red-50 text-red-700 border-red-200'
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

  const handleSubmit = (milestoneId) => {
    const comment = prompt('Add a submission comment for your supervisor:');
    if (comment === null) return;
    onMilestoneSubmit(milestoneId, comment);
  };

  const handleReview = (milestoneId, status) => {
    const feedback = prompt('Provide review feedback for the student:');
    if (feedback === null) return;
    onMilestoneReview(milestoneId, status, feedback);
  };

  if (!milestones || milestones.length === 0) {
    return (
      <div className="text-center py-10 bg-white border border-slate-200 text-slate-500 shadow-sm">
        <p className="text-sm">No milestones found.</p>
      </div>
    );
  }

  // Group by student for supervisor view
  const groupedMilestones = role === 'supervisor' 
    ? milestones.reduce((acc, m) => {
        const studentId = m.student?._id || m.student;
        if (!acc[studentId]) {
          acc[studentId] = {
            student: m.student,
            milestones: []
          };
        }
        acc[studentId].milestones.push(m);
        return acc;
      }, {})
    : null;

  // Supervisor view - Grouped by student
  if (role === 'supervisor' && groupedMilestones) {
    return (
      <div className="space-y-6">
        {Object.values(groupedMilestones).map((group) => (
          <div key={group.student?._id || Math.random()} className="bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span>👨‍🎓</span> {group.student?.name || 'Student'}
              </h3>
              <span className="text-xs bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 font-semibold">
                {group.milestones.filter(m => m.status === 'submitted').length} pending review
              </span>
            </div>
            <div className="space-y-3">
              {group.milestones.map((milestone) => (
                <MilestoneCard
                  key={milestone._id}
                  milestone={milestone}
                  role={role}
                  onReview={handleReview}
                  isOverdue={isOverdue}
                  getStatusBadge={getStatusBadge}
                  getStatusIcon={getStatusIcon}
                  selectedId={selectedId}
                  setSelectedId={setSelectedId}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Student view - Flat list
  return (
    <div className="space-y-3">
      {milestones.map((milestone) => (
        <MilestoneCard
          key={milestone._id}
          milestone={milestone}
          role={role}
          onSubmit={handleSubmit}
          onReview={handleReview}
          isOverdue={isOverdue}
          getStatusBadge={getStatusBadge}
          getStatusIcon={getStatusIcon}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
        />
      ))}
    </div>
  );
};

// Milestone Card Component
const MilestoneCard = ({ 
  milestone, 
  role, 
  onSubmit, 
  onReview, 
  isOverdue,
  getStatusBadge,
  getStatusIcon,
  selectedId,
  setSelectedId
}) => {
  const dueDate = new Date(milestone.dueDate);
  const isPastDue = isOverdue(milestone.dueDate) && milestone.status === 'pending';
  const isExpanded = selectedId === milestone._id;

  return (
    <div 
      className={`border p-5 bg-white transition shadow-sm ${
        isPastDue ? 'border-red-200 bg-red-50/20' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
        <div className="flex-1 cursor-pointer w-full" onClick={() => setSelectedId(isExpanded ? null : milestone._id)}>
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
          
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-3">
            <span>📅 Due: <strong className="text-slate-700">{dueDate.toLocaleDateString()}</strong></span>
            <span>⏰ <strong className="text-slate-700">{dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
          </div>

          {milestone.description && (
            <p className="text-xs text-slate-600 mt-2.5 leading-relaxed bg-slate-50 p-3 border border-slate-100">
              {milestone.description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
          {role === 'student' && milestone.status === 'pending' && (
            <button
              onClick={() => onSubmit(milestone._id)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold transition shadow-sm"
            >
              📤 Submit for Review
            </button>
          )}

          {role === 'supervisor' && milestone.status === 'submitted' && (
            <div className="flex gap-2">
              <button
                onClick={() => onReview(milestone._id, 'approved')}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-xs font-semibold transition"
              >
                Approve
              </button>
              <button
                onClick={() => onReview(milestone._id, 'rejected')}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs font-semibold transition"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-3 text-xs">
          {milestone.submissionComment && (
            <div className="bg-blue-50 border border-blue-200 p-3.5">
              <p className="font-bold text-blue-800">💬 Student Comment:</p>
              <p className="text-slate-700 mt-1">{milestone.submissionComment}</p>
              {milestone.submissionDate && (
                <p className="text-[10px] text-slate-500 mt-1.5">
                  Submitted: {new Date(milestone.submissionDate).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {milestone.feedback && (
            <div className="bg-green-50 border border-green-200 p-3.5">
              <p className="font-bold text-green-800">📝 Supervisor Feedback:</p>
              <p className="text-slate-700 mt-1">{milestone.feedback}</p>
              {milestone.feedbackDate && (
                <p className="text-[10px] text-slate-500 mt-1.5">
                  Reviewed: {new Date(milestone.feedbackDate).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MilestoneList;