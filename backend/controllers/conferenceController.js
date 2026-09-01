const ConferenceParticipation = require('../models/ConferenceParticipation');
const { getAccessibleProposal } = require('../utils/proposalAccess');

const submitConference = async (req, res) => {
  try {
    const { proposalId, conferenceName, paperTitle, role, location, date, notes } = req.body;

    if (!proposalId || !conferenceName || !date) {
      return res.status(400).json({ success: false, message: 'Proposal, conference name, and date are required' });
    }
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can submit conference records' });
    }

    const proposal = await getAccessibleProposal(proposalId, req.user);
    if (!proposal) {
      return res.status(403).json({ success: false, message: 'You do not have access to this thesis, or it is not yet approved' });
    }

    const data = {
      proposal: proposalId, submittedBy: req.user.id, conferenceName,
      paperTitle: paperTitle || '', role: role || 'presenter', location: location || '', date, notes: notes || ''
    };
    if (req.file) {
      data.document = { filename: req.file.filename, originalName: req.file.originalname, url: `/uploads/${req.file.filename}` };
    }

    const entry = await ConferenceParticipation.create(data);
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

const getConferences = async (req, res) => {
  try {
    const { proposalId } = req.query;
    if (!proposalId) return res.status(400).json({ success: false, message: 'proposalId is required' });

    const proposal = await getAccessibleProposal(proposalId, req.user);
    if (!proposal) return res.status(403).json({ success: false, message: 'You do not have access to this thesis' });

    const entries = await ConferenceParticipation.find({ proposal: proposalId }).populate('submittedBy', 'name studentId').sort({ date: -1 });
    res.json({ success: true, count: entries.length, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { submitConference, getConferences };
