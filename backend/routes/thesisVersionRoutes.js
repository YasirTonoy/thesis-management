const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadVersion, getVersions, reviewVersion, restoreVersion } = require('../controllers/thesisVersionController');

router.post('/', protect, upload.single('file'), uploadVersion);
router.get('/', protect, getVersions);
router.put('/:id/review', protect, reviewVersion);
router.put('/:id/restore', protect, restoreVersion);

module.exports = router;
