const PlagiarismReport = require('../models/PlagiarismReport');
const ThesisVersion = require('../models/ThesisVersion');
const { getAccessibleProposal } = require('../utils/proposalAccess');

const POPULATE = [
  { path: 'uploadedBy', select: 'name studentId' },
  { path: 'reviewedBy', select: 'name' },
  { path: 'thesisVersion', select: 'versionNumber' }
];

const uploadReport = async (req, res) => {
  try {
    const { proposalId, similarityPercentage, toolName, notes, thesisVersionId } = req.body;

    if (!proposalId || similarityPercentage === undefined || similarityPercentage === '') {
      return res.status(400).json({ success: false, message: 'Proposal and similarity percentage are required' });
    }
    if (!req.file) return res.status(400).json({ success: false, message: 'A plagiarism report file is required' });
    if (req.user.role !== 'student') return res.status(403).json({ success: false, message: 'Only students can upload plagiarism reports' });

    const similarity = Number(similarityPercentage);
    if (Number.isNaN(similarity) || similarity < 0 || similarity > 100) {
      return res.status(400).json({ success: false, message: 'Similarity percentage must be a number between 0 and 100' });
    }

    const proposal = await getAccessibleProposal(proposalId, req.user);
    if (!proposal) return res.status(403).json({ success: false, message: 'You do not have access to this thesis, or it is not yet approved' });

    if (thesisVersionId) {
      const version = await ThesisVersion.findById(thesisVersionId);
      if (!version || String(version.proposal) !== String(proposalId)) {
        return res.status(400).json({ success: false, message: 'The selected thesis version does not belong to this thesis' });
      }
    }

    const report = await PlagiarismReport.create({
      proposal: proposalId,
      thesisVersion: thesisVersionId || null,
      toolName: (toolName || 'Turnitin').trim(),
      similarityPercentage: similarity,
      notes: (notes || '').trim(),
      report: { filename: req.file.filename, originalName: req.file.originalname, url: `/uploads/${req.file.filename}`, size: req.file.size },
      uploadedBy: req.user.id
    });

    const populated = await report.populate(POPULATE);
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getReports = async (req, res) => {
  try {
    const { proposalId } = req.query;
    if (!proposalId) return res.status(400).json({ success: false, message: 'proposalId is required' });

    const proposal = await getAccessibleProposal(proposalId, req.user);
    if (!proposal) return res.status(403).json({ success: false, message: 'You do not have access to this thesis' });

    const reports = await PlagiarismReport.find({ proposal: proposalId }).populate(POPULATE).sort({ createdAt: -1 });
    res.json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const reviewReport = async (req, res) => {
  try {
    const { reviewStatus, reviewComment } = req.body;

    if (!['accepted', 'rejected'].includes(reviewStatus)) {
      return res.status(400).json({ success: false, message: 'reviewStatus must be accepted or rejected' });
    }
    if (req.user.role !== 'supervisor') return res.status(403).json({ success: false, message: 'Only supervisors can review plagiarism reports' });

    const report = await PlagiarismReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Plagiarism report not found' });

    const proposal = await getAccessibleProposal(report.proposal, req.user);
    if (!proposal) return res.status(403).json({ success: false, message: 'You do not have access to this thesis' });

    report.reviewStatus = reviewStatus;
    report.reviewComment = reviewComment || '';
    report.reviewedBy = req.user.id;
    report.reviewedAt = new Date();
    await report.save();

    const populated = await report.populate(POPULATE);
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteReport = async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ success: false, message: 'Only students can delete plagiarism reports' });

    const report = await PlagiarismReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Plagiarism report not found' });

    const proposal = await getAccessibleProposal(report.proposal, req.user);
    if (!proposal) return res.status(403).json({ success: false, message: 'You do not have access to this thesis' });

    if (String(report.uploadedBy) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'You can only delete a report you uploaded' });
    }
    if (report.reviewStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'A report that has already been reviewed cannot be deleted' });
    }

    await report.deleteOne();
    res.json({ success: true, message: 'Plagiarism report deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { uploadReport, getReports, reviewReport, deleteReport };
