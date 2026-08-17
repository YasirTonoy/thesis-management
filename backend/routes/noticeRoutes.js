const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { createNotice, getMyNotices, getNoticesBySupervisor } = require('../controllers/noticeController');

router.post('/', protect, roleCheck('supervisor'), createNotice);
router.get('/mine', protect, roleCheck('supervisor'), getMyNotices);
router.get('/by-supervisor/:supervisorId', protect, getNoticesBySupervisor);

module.exports = router;
