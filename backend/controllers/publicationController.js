const Publication = require('../models/Publication');
const { getAccessibleProposal } = require('../utils/proposalAccess');

const submitPublication = async (req, res) => {
  try {
    const { proposalId, title, authors, journalName, status, volumeIssue, publicationDate, link } = req.body;

    if (!proposalId || !title || !authors || !journalName) {
      return res.status(400).json({ success: false, message: 'Proposal, title, authors, and journal name are required' });
    }
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can submit publication records' });
    }

    const proposal = await getAccessibleProposal(proposalId, req.user);
    if (!proposal) {
      return res.status(403).json({ success: false, message: 'You do not have access to this thesis, or it is not yet approved' });
    }

    const pubData = {
      proposal: proposalId, submittedBy: req.user.id, title, authors, journalName,
      status: status || 'submitted', volumeIssue: volumeIssue || '', link: link || ''
    };
    if (publicationDate) pubData.publicationDate = publicationDate;
    if (req.file) {
      pubData.document = { filename: req.file.filename, originalName: req.file.originalname, url: `/uploads/${req.file.filename}` };
    }

    const publication = await Publication.create(pubData);
    const populated = await publication.populate('submittedBy', 'name studentId');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map((val) => val.message).join(', ');
      return res.status(400).json({ success: false, message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPublications = async (req, res) => {
  try {
    const { proposalId } = req.query;
    if (!proposalId) return res.status(400).json({ success: false, message: 'proposalId is required' });

    const proposal = await getAccessibleProposal(proposalId, req.user);
    if (!proposal) return res.status(403).json({ success: false, message: 'You do not have access to this thesis' });

    const publications = await Publication.find({ proposal: proposalId }).populate('submittedBy', 'name studentId').sort({ createdAt: -1 });
    res.json({ success: true, count: publications.length, data: publications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { submitPublication, getPublications };
