const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { submitConference, getConferences } = require('../controllers/conferenceController');

router.post('/', protect, upload.single('document'), submitConference);
router.get('/', protect, getConferences);

module.exports = router;
