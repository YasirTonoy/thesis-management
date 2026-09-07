const LiteratureReview = require('../models/LiteratureReview');
const Supervision = require('../models/Supervision');
const { getAccessibleProposal } = require('../utils/proposalAccess');

const submitLiteratureReview = async (req, res) => {
  try {
    const { proposalId, paperName, author, year, journal, review } = req.body;

    if (!proposalId || !paperName || !author || !review) {
      return res.status(400).json({ success: false, message: 'Proposal, paper name, author, and review are required' });
    }
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can submit literature reviews' });
    }

    const proposal = await getAccessibleProposal(proposalId, req.user);
    if (!proposal) {
      return res.status(403).json({ success: false, message: 'You do not have access to this thesis, or it is not yet approved' });
    }

    const entry = await LiteratureReview.create({
      proposal: proposalId, submittedBy: req.user.id, paperName, author, year: year || '', journal: journal || '', review
    });

    const populated = await entry.populate('submittedBy', 'name studentId');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map((val) => val.message).join(', ');
      return res.status(400).json({ success: false, message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLiteratureReviews = async (req, res) => {
  try {
    const { proposalId } = req.query;

    // Supervisors can get all reviews for their supervised students without proposalId
    if (!proposalId && (req.user.role === 'supervisor' || req.user.role === 'admin')) {
      let entries;
      if (req.user.role === 'supervisor') {
        const supervisions = await Supervision.find({ supervisor: req.user.id, isActive: true });
        const studentIds = supervisions.map(s => s.student);
        entries = await LiteratureReview.find({ submittedBy: { $in: studentIds } })
          .populate('submittedBy', 'name studentId email')
          .populate('proposal', 'title')
          .sort({ createdAt: -1 });
      } else {
        entries = await LiteratureReview.find()
          .populate('submittedBy', 'name studentId email')
          .populate('proposal', 'title')
          .sort({ createdAt: -1 });
      }
      return res.json({ success: true, count: entries.length, data: entries });
    }

    if (!proposalId) return res.status(400).json({ success: false, message: 'proposalId is required' });

    const proposal = await getAccessibleProposal(proposalId, req.user);
    if (!proposal) return res.status(403).json({ success: false, message: 'You do not have access to this thesis' });

    const entries = await LiteratureReview.find({ proposal: proposalId }).populate('submittedBy', 'name studentId').sort({ createdAt: -1 });
    res.json({ success: true, count: entries.length, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addFeedback = async (req, res) => {
  try {
    const { supervisorFeedback } = req.body;
    if (req.user.role !== 'supervisor' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only supervisors can add feedback' });
    }
    const entry = await LiteratureReview.findByIdAndUpdate(
      req.params.id,
      { supervisorFeedback: supervisorFeedback || '' },
      { new: true }
    ).populate('submittedBy', 'name studentId email');

    if (!entry) return res.status(404).json({ success: false, message: 'Literature review not found' });
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { submitLiteratureReview, getLiteratureReviews, addFeedback };
