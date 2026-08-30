const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createSubmission, getSubmission, reviewSubmission, downloadSubmissionPdf } = require('../controllers/finalSubmissionController');

router.post('/', protect, createSubmission);
router.get('/', protect, getSubmission);
router.put('/:id/review', protect, reviewSubmission);
router.get('/:id/pdf', protect, downloadSubmissionPdf);

module.exports = router;
