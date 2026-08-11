const Milestone = require('../models/Milestone');
const Supervision = require('../models/Supervision');

// @desc    Create a new milestone
// @route   POST /api/milestones
// @access  Supervisor only
const createMilestone = async (req, res) => {
  try {
    const { supervisionId, title, description, dueDate } = req.body;

    // Verify the supervision exists and supervisor is assigned
    const supervision = await Supervision.findOne({
      _id: supervisionId,
      supervisor: req.user.id,
      isActive: true
    });

    if (!supervision) {
      return res.status(403).json({ 
        message: 'Not authorized or supervision not found' 
      });
    }

    const milestone = await Milestone.create({
      supervision: supervisionId,
      student: supervision.student,
      supervisor: req.user.id,
      title,
      description,
      dueDate
    });

    // TODO: Trigger notification to student about new milestone
    // Call your teammate's notification function

    res.status(201).json({
      success: true,
      data: milestone
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get milestones (filtered by role)
// @route   GET /api/milestones
// @access  All authenticated users
const getMilestones = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'student') {
      query.student = req.user.id;
    } else if (req.user.role === 'supervisor') {
      query.supervisor = req.user.id;
    }

    // Optional: filter by supervision
    if (req.query.supervisionId) {
      query.supervision = req.query.supervisionId;
    }

    // Optional: filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    const milestones = await Milestone.find(query)
      .populate('student', 'name email')
      .populate('supervisor', 'name email')
      .populate('supervision', 'assignmentDate')
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      count: milestones.length,
      data: milestones
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit milestone for review (student)
// @route   PUT /api/milestones/:id/submit
// @access  Student only
const submitMilestone = async (req, res) => {
  try {
    const { submissionComment } = req.body;
    const milestone = await Milestone.findById(req.params.id);

    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    // Only the student assigned to this milestone can submit
    if (milestone.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (milestone.status !== 'pending') {
      return res.status(400).json({ 
        message: `Cannot submit milestone in status: ${milestone.status}` 
      });
    }

    milestone.status = 'submitted';
    milestone.submissionComment = submissionComment || '';
    milestone.submissionDate = new Date();

    await milestone.save();

    // TODO: Trigger notification to supervisor

    res.json({
      success: true,
      data: milestone
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Review milestone (supervisor approves/rejects)
// @route   PUT /api/milestones/:id/review
// @access  Supervisor only
const reviewMilestone = async (req, res) => {
  try {
    const { status, feedback } = req.body;
    const milestone = await Milestone.findById(req.params.id);

    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    // Only the supervisor assigned to this milestone can review
    if (milestone.supervisor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (milestone.status !== 'submitted') {
      return res.status(400).json({ 
        message: `Cannot review milestone in status: ${milestone.status}` 
      });
    }

    milestone.status = status;
    milestone.feedback = feedback || '';
    milestone.feedbackDate = new Date();

    await milestone.save();

    // TODO: Trigger notification to student

    res.json({
      success: true,
      data: milestone
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update milestone (supervisor can edit)
// @route   PUT /api/milestones/:id
// @access  Supervisor only
const updateMilestone = async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;
    const milestone = await Milestone.findById(req.params.id);

    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    // Only supervisor can update
    if (milestone.supervisor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Only allow updates if status is pending or rejected
    if (!['pending', 'rejected'].includes(milestone.status)) {
      return res.status(400).json({ 
        message: `Cannot update milestone in status: ${milestone.status}` 
      });
    }

    milestone.title = title || milestone.title;
    milestone.description = description || milestone.description;
    milestone.dueDate = dueDate || milestone.dueDate;

    await milestone.save();

    res.json({
      success: true,
      data: milestone
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createMilestone,
  getMilestones,
  submitMilestone,
  reviewMilestone,
  updateMilestone
};