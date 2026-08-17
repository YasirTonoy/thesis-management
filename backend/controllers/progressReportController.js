const ProgressReport = require('../models/ProgressReport');
const { getAccessibleProposal } = require('../utils/proposalAccess');

const submitProgressReport = async (req, res) => {
  try {
    const { proposalId, phase, description } = req.body;

    if (!proposalId || !phase || !description) {
      return res.status(400).json({ success: false, message: 'Proposal, phase, and description are required' });
    }
    if (!['p1', 'p2', 'defense'].includes(phase)) {
      return res.status(400).json({ success: false, message: 'Invalid phase' });
    }
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can submit progress reports' });
    }

    const proposal = await getAccessibleProposal(proposalId, req.user);
    if (!proposal) {
      return res.status(403).json({ success: false, message: 'You do not have access to this thesis, or it is not yet approved' });
    }

    const reportData = { proposal: proposalId, submittedBy: req.user.id, phase, description };
    if (req.file) {
      reportData.document = { filename: req.file.filename, originalName: req.file.originalname, url: `/uploads/${req.file.filename}` };
    }

    const report = await ProgressReport.create(reportData);
    const populated = await report.populate('submittedBy', 'name studentId');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProgressReports = async (req, res) => {
  try {
    const { proposalId } = req.query;
    if (!proposalId) return res.status(400).json({ success: false, message: 'proposalId is required' });

    const proposal = await getAccessibleProposal(proposalId, req.user);
    if (!proposal) return res.status(403).json({ success: false, message: 'You do not have access to this thesis' });

    const reports = await ProgressReport.find({ proposal: proposalId }).populate('submittedBy', 'name studentId').sort({ createdAt: -1 });
    res.json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { submitProgressReport, getProgressReports };
