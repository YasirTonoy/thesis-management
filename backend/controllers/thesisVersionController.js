const ThesisVersion = require('../models/ThesisVersion');
const { getAccessibleProposal } = require('../utils/proposalAccess');

const POPULATE = [
  { path: 'uploadedBy', select: 'name studentId' },
  { path: 'reviewedBy', select: 'name' }
];

const uploadVersion = async (req, res) => {
  try {
    const { proposalId, changeSummary } = req.body;

    if (!proposalId || !changeSummary) return res.status(400).json({ success: false, message: 'Proposal and change summary are required' });
    if (!req.file) return res.status(400).json({ success: false, message: 'A thesis document is required' });
    if (req.user.role !== 'student') return res.status(403).json({ success: false, message: 'Only students can upload thesis versions' });

    const proposal = await getAccessibleProposal(proposalId, req.user);
    if (!proposal) return res.status(403).json({ success: false, message: 'You do not have access to this thesis, or it is not yet approved' });

    const latest = await ThesisVersion.findOne({ proposal: proposalId }).sort({ versionNumber: -1 });
    const versionNumber = latest ? latest.versionNumber + 1 : 1;

    await ThesisVersion.updateMany({ proposal: proposalId, isCurrent: true }, { isCurrent: false });

    const version = await ThesisVersion.create({
      proposal: proposalId,
      versionNumber,
      changeSummary: changeSummary.trim(),
      file: { filename: req.file.filename, originalName: req.file.originalname, url: `/uploads/${req.file.filename}`, size: req.file.size },
      uploadedBy: req.user.id,
      isCurrent: true
    });

    const populated = await version.populate(POPULATE);
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getVersions = async (req, res) => {
  try {
    const { proposalId } = req.query;
    if (!proposalId) return res.status(400).json({ success: false, message: 'proposalId is required' });

    const proposal = await getAccessibleProposal(proposalId, req.user);
    if (!proposal) return res.status(403).json({ success: false, message: 'You do not have access to this thesis' });

    const versions = await ThesisVersion.find({ proposal: proposalId }).populate(POPULATE).sort({ versionNumber: -1 });
    res.json({ success: true, count: versions.length, data: versions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const reviewVersion = async (req, res) => {
  try {
    const { reviewStatus, reviewComment } = req.body;

    if (!['approved', 'revision_required'].includes(reviewStatus)) {
      return res.status(400).json({ success: false, message: 'reviewStatus must be approved or revision_required' });
    }
    if (req.user.role !== 'supervisor') return res.status(403).json({ success: false, message: 'Only supervisors can review thesis versions' });

    const version = await ThesisVersion.findById(req.params.id);
    if (!version) return res.status(404).json({ success: false, message: 'Thesis version not found' });

    const proposal = await getAccessibleProposal(version.proposal, req.user);
    if (!proposal) return res.status(403).json({ success: false, message: 'You do not have access to this thesis' });

    version.reviewStatus = reviewStatus;
    version.reviewComment = reviewComment || '';
    version.reviewedBy = req.user.id;
    version.reviewedAt = new Date();
    await version.save();

    const populated = await version.populate(POPULATE);
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const restoreVersion = async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ success: false, message: 'Only students can restore thesis versions' });

    const version = await ThesisVersion.findById(req.params.id);
    if (!version) return res.status(404).json({ success: false, message: 'Thesis version not found' });

    const proposal = await getAccessibleProposal(version.proposal, req.user);
    if (!proposal) return res.status(403).json({ success: false, message: 'You do not have access to this thesis' });

    if (version.isCurrent) return res.status(400).json({ success: false, message: 'This version is already the current one' });

    await ThesisVersion.updateMany({ proposal: version.proposal, isCurrent: true }, { isCurrent: false });
    version.isCurrent = true;
    await version.save();

    const populated = await version.populate(POPULATE);
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { uploadVersion, getVersions, reviewVersion, restoreVersion };
