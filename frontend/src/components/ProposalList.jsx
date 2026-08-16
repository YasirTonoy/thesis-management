import React from 'react';
import { useAuth } from '../context/AuthContext';

const ProposalList = ({ proposals, onReview }) => {
  const { user } = useAuth();
  const isSupervisor = user?.role === 'supervisor';

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: '⏳ Pending Review', style: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
      approved: { label: '✅ Approved', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
      rejected: { label: '❌ Rejected', style: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
      revision: { label: '🔄 Needs Revision', style: 'bg-amber-500/10 text-amber-400 border-amber-500/30' }
    };
    return badges[status] || { label: status, style: 'bg-slate-800 text-slate-300 border-slate-700' };
  };

  if (!proposals || proposals.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center text-slate-400 text-sm">
        No proposals found in this section.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {proposals.map((proposal) => {
        const badge = getStatusBadge(proposal.status);
        return (
          <div key={proposal._id} className="backdrop-blur-xl bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-lg transition hover:border-slate-700/80 space-y-3">
            <div className="flex flex-wrap justify-between items-start gap-2">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-slate-100">{proposal.title}</h3>
                {proposal.student?.name && (
                  <p className="text-xs text-slate-400 mt-0.5">Submitted by: <strong className="text-slate-200">{proposal.student.name}</strong> ({proposal.student.email})</p>
                )}
              </div>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${badge.style}`}>
                {badge.label}
              </span>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed bg-slate-950/60 border border-slate-800/60 rounded-xl p-3.5">
              {proposal.abstract}
            </p>
            
            {proposal.keywords && proposal.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {proposal.keywords.map((keyword, idx) => (
                  <span key={idx} className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs px-2.5 py-0.5 rounded-lg">
                    #{keyword}
                  </span>
                ))}
              </div>
            )}
            
            <div className="text-[11px] text-slate-500 flex justify-between items-center pt-2 border-t border-slate-800/80">
              <span>📅 {new Date(proposal.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>
            
            {isSupervisor && proposal.status === 'pending' && onReview && (
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap gap-2">
                <button
                  onClick={() => onReview(proposal._id, 'approved', 'Great proposal, approved.')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shadow-md shadow-emerald-600/20"
                >
                  Approve Proposal
                </button>
                <button
                  onClick={() => onReview(proposal._id, 'revision', 'Please refine the methodology and abstract.')}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shadow-md shadow-amber-600/20"
                >
                  Request Revision
                </button>
                <button
                  onClick={() => onReview(proposal._id, 'rejected', 'Proposal does not fit department focus.')}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shadow-md shadow-rose-600/20"
                >
                  Reject
                </button>
              </div>
            )}
            
            {proposal.supervisorFeedback && (
              <div className="mt-2 p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1">
                <span className="font-semibold text-indigo-400">👨‍🏫 Supervisor Feedback:</span>
                <p>{proposal.supervisorFeedback}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProposalList;