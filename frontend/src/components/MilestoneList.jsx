import React, { useState } from 'react';

const MilestoneList = ({ milestones, onMilestoneSubmit, onMilestoneReview, role }) => {
  const [selectedId, setSelectedId] = useState(null);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800 border-gray-300',
      submitted: 'bg-blue-100 text-blue-800 border-blue-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
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
    const comment = prompt('Add a comment for your supervisor:');
    if (comment === null) return;
    onMilestoneSubmit(milestoneId, comment);
  };

  const handleReview = (milestoneId, status) => {
    const feedback = prompt('Provide feedback for the student:');
    if (feedback === null) return;
    onMilestoneReview(milestoneId, status, feedback);
  };

  if (!milestones || milestones.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg">🎯 No milestones found</p>
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
          <div key={group.student._id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-lg">
                👨‍🎓 {group.student.name}
              </h3>
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
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
                  getStatusColor={getStatusColor}
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
          getStatusColor={getStatusColor}
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
  getStatusColor,
  getStatusIcon,
  selectedId,
  setSelectedId
}) => {
  const dueDate = new Date(milestone.dueDate);
  const isPastDue = isOverdue(milestone.dueDate) && milestone.status === 'pending';
  const isExpanded = selectedId === milestone._id;

  return (
    <div 
      className={`border rounded-lg p-4 transition ${
        isPastDue ? 'border-red-300 bg-red-50' : 'hover:shadow-md'
      } ${getStatusColor(milestone.status)}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 cursor-pointer" onClick={() => setSelectedId(isExpanded ? null : milestone._id)}>
          <div className="flex items-center gap-3 flex-wrap">
            <h4 className="font-medium text-gray-800">{milestone.title}</h4>
            <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(milestone.status)}`}>
              {getStatusIcon(milestone.status)} {milestone.status.toUpperCase()}
            </span>
            {isPastDue && (
              <span className="bg-red-200 text-red-800 px-2 py-1 rounded text-xs font-medium">
                ⚠️ OVERDUE
              </span>
            )}
          </div>
          
          <div className="text-sm text-gray-600 mt-1">
            <span>📅 Due: {dueDate.toLocaleDateString()}</span>
            <span className="ml-3">
              {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {milestone.description && (
            <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 ml-4">
          {role === 'student' && milestone.status === 'pending' && (
            <button
              onClick={() => onSubmit(milestone._id)}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
            >
              📤 Submit for Review
            </button>
          )}

          {role === 'supervisor' && milestone.status === 'submitted' && (
            <div className="flex flex-col gap-1">
              <button
                onClick={() => onReview(milestone._id, 'approved')}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition"
              >
                ✅ Approve
              </button>
              <button
                onClick={() => onReview(milestone._id, 'rejected')}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
              >
                ❌ Reject
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          {milestone.submissionComment && (
            <div className="bg-blue-50 p-3 rounded-lg mb-2">
              <p className="font-medium text-blue-700">💬 Student Comment:</p>
              <p className="text-blue-600">{milestone.submissionComment}</p>
              {milestone.submissionDate && (
                <p className="text-xs text-gray-500 mt-1">
                  Submitted: {new Date(milestone.submissionDate).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {milestone.feedback && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="font-medium text-green-700">📝 Supervisor Feedback:</p>
              <p className="text-green-600">{milestone.feedback}</p>
              {milestone.feedbackDate && (
                <p className="text-xs text-gray-500 mt-1">
                  Reviewed: {new Date(milestone.feedbackDate).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {milestone.attachments?.length > 0 && (
            <div className="mt-2">
              <p className="font-medium text-gray-700">📎 Attachments:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {milestone.attachments.map((att, idx) => (
                  <a
                    key={idx}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm bg-blue-50 px-2 py-1 rounded"
                  >
                    📄 {att.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MilestoneList;