const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ProgressReport = require('../models/ProgressReport');
const Proposal = require('../models/Proposal');
const Supervision = require('../models/Supervision');

// @route   POST /api/progress-reports
// @desc    Submit a new progress report for phase (P1, P2, Defence)
// @access  Private (Student)
router.post('/', protect, async (req, res) => {
  try {
    const { phase, description, supportingDocuments, thesisTitle, thesisId } = req.body;

    // Check if student has an active proposal
    const proposal = await Proposal.findOne({ submittedBy: req.user._id, status: 'approved' });
    if (!proposal) {
      return res.status(400).json({ success: false, message: 'No approved thesis proposal found for this student.' });
    }

    // Find assigned supervisor
    const supervision = await Supervision.findOne({ student: req.user._id, isActive: true });
    
    const phaseNames = {
      p1: 'Pre-Thesis 1 (P1)',
      p2: 'Pre-Thesis 2 (P2)',
      defence: 'Thesis Defence Phase'
    };

    const report = await ProgressReport.create({
      student: req.user._id,
      proposal: proposal._id,
      supervisor: supervision ? supervision.supervisor : null,
      thesisId: thesisId || proposal._id.toString().substring(0, 8).toUpperCase(),
      thesisTitle: thesisTitle || proposal.title,
      phase,
      phaseName: phaseNames[phase] || 'Pre-Thesis 1 (P1)',
      description,
      supportingDocuments: supportingDocuments || '',
      status: 'submitted'
    });

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/progress-reports
// @desc    Get progress reports for logged-in user (Student or Supervisor)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
      query = { student: req.user._id };
    } else if (req.user.role === 'supervisor') {
      query = { supervisor: req.user._id };
    }

    const reports = await ProgressReport.find(query)
      .populate('student', 'name email department studentId')
      .populate('supervisor', 'name email department')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/progress-reports/:id/review
// @desc    Supervisor evaluates report, assigns phase marks & feedback
// @access  Private (Supervisor/Admin)
router.put('/:id/review', protect, async (req, res) => {
  try {
    const { marks, supervisorFeedback } = req.body;
    const report = await ProgressReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Progress report not found.' });
    }

    if (marks !== undefined) report.marks = marks;
    if (supervisorFeedback !== undefined) report.supervisorFeedback = supervisorFeedback;
    report.reviewedBy = req.user._id;
    report.reviewedAt = Date.now();
    report.status = 'evaluated';

    await report.save();
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
