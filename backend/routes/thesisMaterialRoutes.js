const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ThesisMaterial = require('../models/ThesisMaterial');
const Proposal = require('../models/Proposal');
const Supervision = require('../models/Supervision');

// @route   POST /api/thesis-materials
// @desc    Upload new thesis dataset or supporting document (Version 1)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, category, description, documentUrl, changeNotes } = req.body;

    const proposal = await Proposal.findOne({ submittedBy: req.user._id, status: 'approved' });

    const newMaterial = await ThesisMaterial.create({
      student: req.user.role === 'student' ? req.user._id : (req.body.studentId || req.user._id),
      proposal: proposal ? proposal._id : null,
      title,
      category: category || 'supporting_doc',
      description: description || '',
      currentVersion: 1,
      history: [{
        version: 1,
        documentUrl,
        changeNotes: changeNotes || 'Initial material upload.',
        updatedBy: req.user._id,
        updatedByName: req.user.name,
        updatedByRole: req.user.role,
        updatedAt: new Date()
      }]
    });

    res.status(201).json({ success: true, data: newMaterial });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/thesis-materials/:id
// @desc    Update material / upload new version (appends to history with version increment & updater name log)
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { documentUrl, changeNotes } = req.body;
    const material = await ThesisMaterial.findById(req.params.id);

    if (!material) {
      return res.status(404).json({ success: false, message: 'Thesis material record not found.' });
    }

    const nextVersion = material.currentVersion + 1;
    material.currentVersion = nextVersion;

    material.history.push({
      version: nextVersion,
      documentUrl,
      changeNotes: changeNotes || `Updated to version ${nextVersion}`,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      updatedByRole: req.user.role,
      updatedAt: new Date()
    });

    await material.save();
    res.json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/thesis-materials
// @desc    Get thesis materials & complete version history logs
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

    const materials = await ThesisMaterial.find(query)
      .populate('student', 'name email department studentId')
      .sort({ updatedAt: -1 });

    res.json({ success: true, count: materials.length, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
