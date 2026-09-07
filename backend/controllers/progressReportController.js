const ProgressReport = require('../models/ProgressReport');
const Supervision = require('../models/Supervision');
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

    // Supervisors can get all reports for their supervised students (no proposalId required)
    if (!proposalId && (req.user.role === 'supervisor' || req.user.role === 'admin')) {
      let reports;
      if (req.user.role === 'supervisor') {
        // Find students supervised by this supervisor
        const supervisions = await Supervision.find({ supervisor: req.user.id, isActive: true });
        const studentIds = supervisions.map(s => s.student);
        reports = await ProgressReport.find({ submittedBy: { $in: studentIds } })
          .populate('submittedBy', 'name studentId email department')
          .populate('proposal', 'title')
          .sort({ createdAt: -1 });
      } else {
        reports = await ProgressReport.find()
          .populate('submittedBy', 'name studentId email department')
          .populate('proposal', 'title')
          .sort({ createdAt: -1 });
      }
      return res.json({ success: true, count: reports.length, data: reports });
    }

    if (!proposalId) return res.status(400).json({ success: false, message: 'proposalId is required' });

    const proposal = await getAccessibleProposal(proposalId, req.user);
    if (!proposal) return res.status(403).json({ success: false, message: 'You do not have access to this thesis' });

    const reports = await ProgressReport.find({ proposal: proposalId }).populate('submittedBy', 'name studentId').sort({ createdAt: -1 });
    res.json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const reviewProgressReport = async (req, res) => {
  try {
    const { marks, supervisorFeedback } = req.body;
    if (req.user.role !== 'supervisor' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only supervisors can review progress reports' });
    }
    const report = await ProgressReport.findByIdAndUpdate(
      req.params.id,
      { marks: marks !== undefined ? Number(marks) : undefined, supervisorFeedback: supervisorFeedback || '', reviewedBy: req.user.id, reviewedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('submittedBy', 'name studentId email');

    if (!report) return res.status(404).json({ success: false, message: 'Progress report not found' });
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { submitProgressReport, getProgressReports, reviewProgressReport };
