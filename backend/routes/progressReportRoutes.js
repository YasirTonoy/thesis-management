const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const upload = require('../middleware/upload');
const { submitProgressReport, getProgressReports, reviewProgressReport } = require('../controllers/progressReportController');

router.post('/', protect, upload.single('document'), submitProgressReport);
router.get('/', protect, getProgressReports);
router.put('/:id/review', protect, roleCheck('supervisor', 'admin'), reviewProgressReport);

module.exports = router;
