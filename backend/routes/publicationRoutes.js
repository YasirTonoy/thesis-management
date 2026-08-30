const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { submitPublication, getPublications } = require('../controllers/publicationController');

router.post('/', protect, upload.single('document'), submitPublication);
router.get('/', protect, getPublications);

module.exports = router;
