const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { createMaterial, addMaterialVersion, getMaterials } = require('../controllers/materialController');

router.post('/', protect, upload.single('file'), createMaterial);
router.post('/:id/versions', protect, upload.single('file'), addMaterialVersion);
router.get('/', protect, getMaterials);

module.exports = router;
