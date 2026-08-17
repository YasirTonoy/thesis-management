const Meeting = require('../models/Meeting');
const Supervision = require('../models/Supervision');

// @desc    Request a new meeting (student or supervisor)
// @route   POST /api/meetings
// @access  Protected (student or supervisor)
const requestMeeting = async (req, res) => {
  try {
    const { title, agenda, proposedDateTime, supervisorId, studentId } = req.body;

    let student, supervisor;

    if (req.user.role === 'student') {
      // Student requests meeting with their supervisor
      student = req.user.id;
      // Find their active supervision to get supervisor
      const supervision = await Supervision.findOne({ student: req.user.id, isActive: true });
      if (!supervision && !supervisorId) {
        return res.status(400).json({ success: false, message: 'No active supervision found. Cannot request meeting.' });
      }
      supervisor = supervisorId || supervision.supervisor;
    } else if (req.user.role === 'supervisor') {
      // Supervisor requests meeting with a student
      supervisor = req.user.id;
      if (!studentId) {
        return res.status(400).json({ success: false, message: 'studentId is required when supervisor creates a meeting.' });
      }
      student = studentId;
    } else {
      return res.status(403).json({ success: false, message: 'Not authorized to create meetings.' });
    }

    const meeting = await Meeting.create({
      student,
      supervisor,
      requestedBy: req.user.id,
      title,
      agenda: agenda || '',
      proposedDateTime: new Date(proposedDateTime)
    });

    const populated = await Meeting.findById(meeting._id)
      .populate('student', 'name email department')
      .populate('supervisor', 'name email department')
      .populate('requestedBy', 'name role');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get meetings for the logged-in user
// @route   GET /api/meetings
// @access  Protected
const getMeetings = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'student') {
      query.student = req.user.id;
    } else if (req.user.role === 'supervisor') {
      query.supervisor = req.user.id;
    }
    // admin sees all

    if (req.query.status) {
      query.status = req.query.status;
    }

    const meetings = await Meeting.find(query)
      .populate('student', 'name email department studentId')
      .populate('supervisor', 'name email department')
      .populate('requestedBy', 'name role')
      .sort({ proposedDateTime: 1 });

    res.json({ success: true, count: meetings.length, data: meetings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Respond to a meeting request (confirm or reject) — supervisor
// @route   PUT /api/meetings/:id/respond
// @access  Supervisor
const respondToMeeting = async (req, res) => {
  try {
    const { status, confirmedDateTime, location, meetingLink, rejectionReason, supervisorNotes } = req.body;

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    // Only the supervisor of this meeting can respond
    if (meeting.supervisor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!['pending'].includes(meeting.status)) {
      return res.status(400).json({ success: false, message: `Meeting is already ${meeting.status}` });
    }

    if (!['confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be confirmed or rejected' });
    }

    meeting.status = status;
    if (status === 'confirmed') {
      meeting.confirmedDateTime = confirmedDateTime ? new Date(confirmedDateTime) : meeting.proposedDateTime;
      meeting.location = location || '';
      meeting.meetingLink = meetingLink || '';
    } else {
      meeting.rejectionReason = rejectionReason || '';
    }
    meeting.supervisorNotes = supervisorNotes || '';

    await meeting.save();

    const populated = await Meeting.findById(meeting._id)
      .populate('student', 'name email department')
      .populate('supervisor', 'name email department')
      .populate('requestedBy', 'name role');

    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel a meeting
// @route   PUT /api/meetings/:id/cancel
// @access  Protected (student or supervisor)
const cancelMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    // Only student or supervisor of this meeting can cancel
    const isParticipant =
      meeting.student.toString() === req.user.id ||
      meeting.supervisor.toString() === req.user.id;

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (['cancelled', 'completed'].includes(meeting.status)) {
      return res.status(400).json({ success: false, message: `Meeting is already ${meeting.status}` });
    }

    meeting.status = 'cancelled';
    await meeting.save();

    res.json({ success: true, data: meeting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark meeting as completed
// @route   PUT /api/meetings/:id/complete
// @access  Supervisor
const completeMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    if (meeting.supervisor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    meeting.status = 'completed';
    if (req.body.supervisorNotes) meeting.supervisorNotes = req.body.supervisorNotes;
    await meeting.save();

    res.json({ success: true, data: meeting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { requestMeeting, getMeetings, respondToMeeting, cancelMeeting, completeMeeting };
