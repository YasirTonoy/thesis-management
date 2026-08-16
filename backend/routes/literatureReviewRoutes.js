const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const LiteratureReview = require('../models/LiteratureReview');
const Proposal = require('../models/Proposal');
const Supervision = require('../models/Supervision');

// @route   POST /api/literature-reviews
// @desc    Submit a literature review paper entry
// @access  Private (Student)
router.post('/', protect, async (req, res) => {
  try {
    const { paperName, authors, publicationYear, journalName, paperLink, reviewText } = req.body;

    const proposal = await Proposal.findOne({ submittedBy: req.user._id, status: 'approved' });

    const review = await LiteratureReview.create({
      student: req.user._id,
      proposal: proposal ? proposal._id : null,
      paperName,
      authors,
      publicationYear: Number(publicationYear),
      journalName,
      paperLink: paperLink || '',
      reviewText
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/literature-reviews
// @desc    Get literature reviews (for student or supervisor's supervised students)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
      query = { student: req.user._id };
    } else if (req.user.role === 'supervisor') {
      const supervisions = await Supervision.find({ supervisor: req.user._id, isActive: true });
      const studentIds = supervisions.map(s => s.student);
      query = { student: { $in: studentIds } };
    }

    const reviews = await LiteratureReview.find(query)
      .populate('student', 'name email department studentId')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/literature-reviews/:id/feedback
// @desc    Add supervisor feedback to literature review
// @access  Private (Supervisor/Admin)
router.put('/:id/feedback', protect, async (req, res) => {
  try {
    const { supervisorFeedback } = req.body;
    const review = await LiteratureReview.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Literature review not found.' });
    }

    review.supervisorFeedback = supervisorFeedback;
    review.reviewedBy = req.user._id;
    await review.save();

    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
