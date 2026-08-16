import React from 'react';
import { useAuth } from '../context/AuthContext';

const ProposalList = ({ proposals, onReview }) => {
  const { user } = useAuth();
  const isSupervisor = user?.role === 'supervisor';

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: '⏳ Pending Review', style: 'bg-amber-50 text-amber-700 border-amber-200' },
      approved: { label: '✅ Approved', style: 'bg-green-50 text-green-700 border-green-200' },
      rejected: { label: '❌ Rejected', style: 'bg-red-50 text-red-700 border-red-200' },
      revision: { label: '🔄 Needs Revision', style: 'bg-yellow-50 text-yellow-700 border-yellow-200' }
    };
    return badges[status] || { label: status, style: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  if (!proposals || proposals.length === 0) {
    return (
      <div className="bg-white border border-slate-200 p-8 text-center text-slate-500 text-sm shadow-sm">
        No proposals found in this section.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {proposals.map((proposal) => {
        const badge = getStatusBadge(proposal.status);
        return (
          <div key={proposal._id} className="bg-white border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex flex-wrap justify-between items-start gap-2">
              <div className="flex-1">
                <h3 className="font-bold text-base text-slate-900">{proposal.title}</h3>
                {proposal.student?.name && (
                  <p className="text-xs text-slate-500 mt-0.5">Submitted by: <strong className="text-slate-700">{proposal.student.name}</strong> ({proposal.student.email})</p>
                )}
              </div>
              <span className={`px-2.5 py-0.5 text-xs font-semibold border ${badge.style}`}>
                {badge.label}
              </span>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 border border-slate-100 p-3.5">
              {proposal.description || proposal.abstract}
            </p>
            
            {proposal.keywords && proposal.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {proposal.keywords.map((keyword, idx) => (
                  <span key={idx} className="bg-blue-50 border border-blue-200 text-blue-700 text-xs px-2 py-0.5">
                    #{keyword}
                  </span>
                ))}
              </div>
            )}
            
            <div className="text-xs text-slate-400 flex justify-between items-center pt-2 border-t border-slate-100">
              <span>Submitted: {new Date(proposal.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>
            
            {isSupervisor && proposal.status === 'pending' && onReview && (
              <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                <button
                  onClick={() => onReview(proposal._id, 'approved', 'Great proposal, approved.')}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs px-3.5 py-1.5 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => onReview(proposal._id, 'revision', 'Please refine the methodology and abstract.')}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-3.5 py-1.5 transition-colors"
                >
                  Request Revision
                </button>
                <button
                  onClick={() => onReview(proposal._id, 'rejected', 'Proposal does not fit department focus.')}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-3.5 py-1.5 transition-colors"
                >
                  Reject
                </button>
              </div>
            )}
            
            {proposal.feedback && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-100 text-xs text-slate-700 space-y-1">
                <span className="font-bold text-blue-800">Supervisor Feedback:</span>
                <p>{proposal.feedback}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProposalList;