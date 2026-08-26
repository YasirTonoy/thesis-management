const FinalSubmission = require('../models/FinalSubmission');
const ThesisVersion = require('../models/ThesisVersion');
const PlagiarismReport = require('../models/PlagiarismReport');
const { getAccessibleProposal } = require('../utils/proposalAccess');
const { buildSubmissionPdf } = require('../utils/submissionPdf');

const POPULATE = [
  { path: 'submittedBy', select: 'name studentId' },
  { path: 'reviewedBy', select: 'name' },
  { path: 'thesisVersion', select: 'versionNumber file isCurrent' },
  { path: 'plagiarismReport', select: 'similarityPercentage toolName report' }
];

const PDF_POPULATE = [
  ...POPULATE,
  {
    path: 'proposal',
    select: 'title students supervisor coSupervisor',
    populate: [
      { path: 'supervisor', select: 'name department' },
      { path: 'coSupervisor', select: 'name' }
    ]
  }
];

const createSubmission = async (req, res) => {
  try {
    const { proposalId, thesisVersionId, plagiarismReportId, abstract, keywords, declarationAccepted } = req.body;

    if (!proposalId || !thesisVersionId || !abstract) {
      return res.status(400).json({ success: false, message: 'Proposal, thesis version and abstract are required' });
    }
    if (declarationAccepted !== true) {
      return res.status(400).json({ success: false, message: 'You must accept the originality declaration' });
    }
    if (req.user.role !== 'student') return res.status(403).json({ success: false, message: 'Only students can submit a final thesis' });

    const proposal = await getAccessibleProposal(proposalId, req.user);
    if (!proposal) return res.status(403).json({ success: false, message: 'You do not have access to this thesis, or it is not yet approved' });

    const existing = await FinalSubmission.findOne({ proposal: proposalId });
    if (existing && existing.status !== 'returned') {
      return res.status(400).json({ success: false, message: 'A final submission already exists for this thesis' });
    }

    const version = await ThesisVersion.findById(thesisVersionId);
    if (!version || String(version.proposal) !== String(proposalId)) {
      return res.status(400).json({ success: false, message: 'The selected thesis version does not belong to this thesis' });
    }

    if (plagiarismReportId) {
      const report = await PlagiarismReport.findById(plagiarismReportId);
      if (!report || String(report.proposal) !== String(proposalId)) {
        return res.status(400).json({ success: false, message: 'The selected plagiarism report does not belong to this thesis' });
      }
    }

    const payload = {
      proposal: proposalId,
      thesisVersion: thesisVersionId,
      plagiarismReport: plagiarismReportId || null,
      abstract: abstract.trim(),
      keywords: Array.isArray(keywords)
        ? keywords.map((k) => String(k).trim()).filter(Boolean)
        : String(keywords || '').split(',').map((k) => k.trim()).filter(Boolean),
      declarationAccepted: true,
      submittedBy: req.user.id,
      status: 'submitted',
      reviewComment: '',
      reviewedBy: undefined,
      reviewedAt: undefined
    };

    let submission;
    if (existing) {
      existing.set(payload);
      await existing.save();
      submission = existing;
    } else {
      submission = await FinalSubmission.create(payload);
    }

    const populated = await submission.populate(POPULATE);
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSubmission = async (req, res) => {
  try {
    const { proposalId } = req.query;
    if (!proposalId) return res.status(400).json({ success: false, message: 'proposalId is required' });

    const proposal = await getAccessibleProposal(proposalId, req.user);
    if (!proposal) return res.status(403).json({ success: false, message: 'You do not have access to this thesis' });

    const submission = await FinalSubmission.findOne({ proposal: proposalId }).populate(POPULATE);
    res.json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const reviewSubmission = async (req, res) => {
  try {
    const { status, reviewComment } = req.body;

    if (!['accepted', 'returned'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be accepted or returned' });
    }
    if (req.user.role !== 'supervisor') return res.status(403).json({ success: false, message: 'Only supervisors can review a final submission' });

    const submission = await FinalSubmission.findById(req.params.id);
    if (!submission) return res.status(404).json({ success: false, message: 'Final submission not found' });

    const proposal = await getAccessibleProposal(submission.proposal, req.user);
    if (!proposal) return res.status(403).json({ success: false, message: 'You do not have access to this thesis' });

    submission.status = status;
    submission.reviewComment = reviewComment || '';
    submission.reviewedBy = req.user.id;
    submission.reviewedAt = new Date();
    await submission.save();

    const populated = await submission.populate(POPULATE);
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadSubmissionPdf = async (req, res) => {
  try {
    const submission = await FinalSubmission.findById(req.params.id).populate(PDF_POPULATE);
    if (!submission) return res.status(404).json({ success: false, message: 'Final submission not found' });

    const proposal = await getAccessibleProposal(submission.proposal?._id || submission.proposal, req.user);
    if (!proposal) return res.status(403).json({ success: false, message: 'You do not have access to this thesis' });

    const safeTitle = String(submission.proposal?.title || 'thesis').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}-final-submission.pdf"`);

    buildSubmissionPdf(submission, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createSubmission, getSubmission, reviewSubmission, downloadSubmissionPdf };
