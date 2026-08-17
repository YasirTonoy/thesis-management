const Proposal = require('../models/Proposal');
const User = require('../models/User');

const submitProposal = async (req, res) => {
  try {
    const { title, description, supervisorId, coSupervisorId, students } = req.body;

    if (!title || !supervisorId) {
      return res.status(400).json({ success: false, message: 'Title and supervisor are required' });
    }

    if (!Array.isArray(students) || students.length < 1 || students.length > 5) {
      return res.status(400).json({ success: false, message: 'A proposal must include between 1 and 5 students' });
    }

    for (const s of students) {
      if (!s.name || !s.studentId) {
        return res.status(400).json({ success: false, message: 'Each student needs a name and a Student ID' });
      }
    }

    const requester = req.user;
    const isMember = students.some(
      (s) => s.studentId.trim().toLowerCase() === (requester.studentId || '').trim().toLowerCase()
    );
    if (!isMember) {
      return res.status(400).json({ success: false, message: 'You must include yourself as one of the group members' });
    }

    const supervisor = await User.findOne({ _id: supervisorId, role: 'supervisor' });
    if (!supervisor) {
      return res.status(400).json({ success: false, message: 'Selected supervisor was not found' });
    }

    let coSupervisor = null;
    if (coSupervisorId) {
      coSupervisor = await User.findOne({ _id: coSupervisorId, role: 'supervisor' });
      if (!coSupervisor) {
        return res.status(400).json({ success: false, message: 'Selected co-supervisor was not found' });
      }
      if (String(coSupervisor._id) === String(supervisor._id)) {
        return res.status(400).json({ success: false, message: 'Co-supervisor must be different from the supervisor' });
      }
    }

    const proposal = await Proposal.create({
      title, description: description || '',
      supervisor: supervisor._id,
      coSupervisor: coSupervisor ? coSupervisor._id : null,
      students, submittedBy: requester.id, status: 'pending'
    });

    const populated = await proposal.populate([
      { path: 'supervisor', select: 'name department' },
      { path: 'coSupervisor', select: 'name department' }
    ]);

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map((val) => val.message).join(', ');
      return res.status(400).json({ success: false, message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProposals = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
      query.students = { $elemMatch: { studentId: req.user.studentId } };
    } else if (req.user.role === 'supervisor') {
      query.$or = [{ supervisor: req.user.id }, { coSupervisor: req.user.id }];
    }

    const proposals = await Proposal.find(query)
      .populate('supervisor', 'name department')
      .populate('coSupervisor', 'name department')
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: proposals.length, data: proposals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProposalById = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id)
      .populate('supervisor', 'name department')
      .populate('coSupervisor', 'name department')
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name email');

    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });

    if (req.user.role === 'student') {
      const isMember = proposal.students.some(
        (s) => s.studentId.toLowerCase() === (req.user.studentId || '').toLowerCase()
      );
      if (!isMember) return res.status(403).json({ success: false, message: 'Not authorized to view this proposal' });
    } else if (req.user.role === 'supervisor') {
      const isAssigned =
        String(proposal.supervisor?._id) === String(req.user.id) ||
        String(proposal.coSupervisor?._id) === String(req.user.id);
      if (!isAssigned) return res.status(403).json({ success: false, message: 'Not authorized to view this proposal' });
    }

    res.json({ success: true, data: proposal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const reviewProposal = async (req, res) => {
  try {
    const { status, feedback } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }

    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });

    if (req.user.role === 'supervisor') {
      const isAssigned =
        String(proposal.supervisor) === String(req.user.id) ||
        String(proposal.coSupervisor) === String(req.user.id);
      if (!isAssigned) return res.status(403).json({ success: false, message: 'You are not the supervisor for this proposal' });
    }

    proposal.status = status;
    proposal.feedback = feedback || '';
    proposal.reviewedBy = req.user.id;
    await proposal.save();

    const populated = await proposal.populate([
      { path: 'supervisor', select: 'name department' },
      { path: 'coSupervisor', select: 'name department' }
    ]);

    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { submitProposal, getProposals, getProposalById, reviewProposal };
