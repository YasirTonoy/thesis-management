const Proposal = require('../models/Proposal');

const getAccessibleProposal = async (proposalId, user, { requireApproved = true } = {}) => {
  const proposal = await Proposal.findById(proposalId)
    .populate('supervisor', 'name department')
    .populate('coSupervisor', 'name department');

  if (!proposal) return null;
  if (requireApproved && proposal.status !== 'approved') return null;

  if (user.role === 'admin') return proposal;

  if (user.role === 'student') {
    const isMember = proposal.students.some(
      (s) => s.studentId.toLowerCase() === (user.studentId || '').toLowerCase()
    );
    return isMember ? proposal : null;
  }

  if (user.role === 'supervisor') {
    const isAssigned =
      String(proposal.supervisor?._id || proposal.supervisor) === String(user.id) ||
      String(proposal.coSupervisor?._id || proposal.coSupervisor) === String(user.id);
    return isAssigned ? proposal : null;
  }

  return null;
};

module.exports = { getAccessibleProposal };
