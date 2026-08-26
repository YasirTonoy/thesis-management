const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadReport, getReports, reviewReport, deleteReport } = require('../controllers/plagiarismReportController');

router.post('/', protect, upload.single('file'), uploadReport);
router.get('/', protect, getReports);
router.put('/:id/review', protect, reviewReport);
router.delete('/:id', protect, deleteReport);

module.exports = router;
