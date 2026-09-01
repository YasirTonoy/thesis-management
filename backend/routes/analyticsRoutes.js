const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getOverview, downloadCsv, downloadPdf } = require('../controllers/analyticsController');

router.get('/overview', protect, getOverview);
router.get('/report.csv', protect, downloadCsv);
router.get('/report.pdf', protect, downloadPdf);

module.exports = router;
