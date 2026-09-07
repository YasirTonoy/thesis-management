const Supervision = require('../models/Supervision');
const User = require('../models/User');
const Proposal = require('../models/Proposal');

// @desc    Assign a supervisor to a student
// @route   POST /api/supervisions
// @access  Admin only
const assignSupervisor = async (req, res) => {
  try {
    const { studentId, supervisorId, reassignmentReason } = req.body;

    // Check if student exists
    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if supervisor exists
    const supervisor = await User.findOne({ _id: supervisorId, role: 'supervisor' });
    if (!supervisor) {
      return res.status(404).json({ message: 'Supervisor not found' });
    }

    // Check if student has a proposal (match submittedBy or studentId in group)
    const existingProposal = await Proposal.findOne({
      $or: [
        { submittedBy: studentId },
        ...(student.studentId ? [{ 'students.studentId': student.studentId }] : [])
      ]
    });

    // If proposal exists, update its supervisor to keep in sync
    if (existingProposal) {
      await Proposal.updateMany(
        {
          $or: [
            { submittedBy: studentId },
            ...(student.studentId ? [{ 'students.studentId': student.studentId }] : [])
          ]
        },
        { supervisor: supervisorId }
      );
    }

    // Deactivate any existing active supervision (save the old one first for reference)
    const existingSupervision = await Supervision.findOneAndUpdate(
      { student: studentId, isActive: true },
      { 
        isActive: false,
        reassignmentReason: reassignmentReason || 'Reassigned by admin'
      },
      { new: false } // return the OLD document before update
    );

    // Create new supervision
    const supervision = await Supervision.create({
      student: studentId,
      supervisor: supervisorId,
      assignedBy: req.user.id,
      previousSupervisor: existingSupervision?.supervisor || null
    });

    const populated = await Supervision.findById(supervision._id)
      .populate('student', 'name email department studentId')
      .populate('supervisor', 'name email department')
      .populate('assignedBy', 'name email');

    res.status(201).json({
      success: true,
      data: populated
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all supervisions (with filters)
// @route   GET /api/supervisions
// @access  All authenticated users
const getSupervisions = async (req, res) => {
  try {
    let query = {};
    
    // Filter based on role
    if (req.user.role === 'student') {
      query.student = req.user.id;
    } else if (req.user.role === 'supervisor') {
      query.supervisor = req.user.id;
    }
    
    // Optional: filter by active status
    if (req.query.active === 'true') {
      query.isActive = true;
    }

    const supervisions = await Supervision.find(query)
      .populate('student', 'name email department')
      .populate('supervisor', 'name email department')
      .populate('assignedBy', 'name email')
      .sort({ assignmentDate: -1 });

    res.json({
      success: true,
      count: supervisions.length,
      data: supervisions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reassign supervisor (Admin version)
// @route   PUT /api/supervisions/:id/reassign
// @access  Admin only
const reassignSupervisor = async (req, res) => {
  try {
    const newSupervisorId = req.body.newSupervisorId || req.body.supervisorId;
    const reason = req.body.reason || req.body.reassignmentReason || 'Reassigned by admin';

    if (!newSupervisorId) {
      return res.status(400).json({ message: 'New supervisor ID is required' });
    }

    const supervision = await Supervision.findById(req.params.id);

    if (!supervision) {
      return res.status(404).json({ message: 'Supervision record not found' });
    }

    // Verify new supervisor exists
    const supervisor = await User.findOne({ _id: newSupervisorId, role: 'supervisor' });
    if (!supervisor) {
      return res.status(404).json({ message: 'New supervisor not found' });
    }

    // Deactivate current supervision
    supervision.isActive = false;
    supervision.reassignmentReason = reason;
    await supervision.save();

    // Create new supervision with new supervisor
    const newSupervision = await Supervision.create({
      student: supervision.student,
      supervisor: newSupervisorId,
      assignedBy: req.user.id,
      previousSupervisor: supervision.supervisor,
      reassignmentReason: reason
    });

    // Update any proposals for this student to reflect the new supervisor
    await Proposal.updateMany(
      { submittedBy: supervision.student },
      { supervisor: newSupervisorId }
    );

    const populatedNew = await Supervision.findById(newSupervision._id)
      .populate('student', 'name email department studentId')
      .populate('supervisor', 'name email department')
      .populate('assignedBy', 'name email');

    res.json({
      success: true,
      data: {
        oldSupervision: supervision,
        newSupervision: populatedNew
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  assignSupervisor,
  getSupervisions,
  reassignSupervisor
};