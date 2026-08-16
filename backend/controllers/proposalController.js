const Proposal = require('../models/Proposal');

// @desc    Submit a new thesis proposal
// @route   POST /api/proposals
// @access  Student only
const submitProposal = async (req, res) => {
  try {
    const { title, abstract, keywords } = req.body;
    
    // Check if student already has a pending or approved proposal
    const existingProposal = await Proposal.findOne({
      student: req.user.id,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingProposal) {
      return res.status(400).json({ 
        message: 'You already have a pending or approved proposal' 
      });
    }

    const proposal = await Proposal.create({
      student: req.user.id,
      title,
      abstract,
      keywords: keywords || [],
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      data: proposal
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all proposals (filtered by role)
// @route   GET /api/proposals
// @access  All authenticated users
const getProposals = async (req, res) => {
  try {
    let query = {};
    
    // Students can only see their own proposals
    if (req.user.role === 'student') {
      query.student = req.user.id;
    } 
    // Supervisors can see proposals assigned to them
    else if (req.user.role === 'supervisor') {
      // Get all students supervised by this supervisor
      const Supervision = require('../models/Supervision');
      const supervisions = await Supervision.find({ 
        supervisor: req.user.id, 
        isActive: true 
      });
      const studentIds = supervisions.map(s => s.student);
      query.student = { $in: studentIds };
      query.status = 'pending'; // Supervisors only see pending ones by default
    }
    // Admins can see all proposals
    // (no filter for admin)

    const proposals = await Proposal.find(query)
      .populate('student', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: proposals.length,
      data: proposals
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Review a proposal (approve/reject)
// @route   PUT /api/proposals/:id/review
// @access  Supervisor only
const reviewProposal = async (req, res) => {
  try {
    const { status, feedback } = req.body;
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Check if the current supervisor is assigned to this student
    const Supervision = require('../models/Supervision');
    const supervision = await Supervision.findOne({
      student: proposal.student,
      supervisor: req.user.id,
      isActive: true
    });

    if (!supervision && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'You are not assigned as the supervisor for this student' 
      });
    }

    // If status is 'revision', store the old abstract in revision history
    if (status === 'revision') {
      proposal.revisionHistory.push({
        abstract: proposal.abstract
      });
    }

    proposal.status = status;
    proposal.supervisorFeedback = feedback || '';
    proposal.approvedBy = req.user.id;

    await proposal.save();

    // TODO: If status is 'approved', trigger notification (your teammate's job)
    // You can emit a socket event or call a notification function here

    res.json({
      success: true,
      data: proposal
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update proposal (student resubmits after revision)
// @route   PUT /api/proposals/:id
// @access  Student only
const updateProposal = async (req, res) => {
  try {
    const { abstract, title, keywords } = req.body;
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Only the student who owns the proposal can update it
    if (proposal.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this proposal' });
    }

    // Only allow updates if status is 'rejected' or 'revision'
    if (!['rejected', 'revision'].includes(proposal.status)) {
      return res.status(400).json({ 
        message: 'Cannot update proposal at this stage' 
      });
    }

    // Store previous version in history
    proposal.revisionHistory.push({
      abstract: proposal.abstract
    });

    proposal.title = title || proposal.title;
    proposal.abstract = abstract || proposal.abstract;
    proposal.keywords = keywords || proposal.keywords;
    proposal.status = 'pending'; // Reset to pending for re-review
    proposal.supervisorFeedback = ''; // Clear previous feedback

    await proposal.save();

    res.json({
      success: true,
      data: proposal
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitProposal,
  getProposals,
  reviewProposal,
  updateProposal
};