const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { submitProgressReport, getProgressReports } = require('../controllers/progressReportController');

router.post('/', protect, upload.single('document'), submitProgressReport);
router.get('/', protect, getProgressReports);

module.exports = router;
