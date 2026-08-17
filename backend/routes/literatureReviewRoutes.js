const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { submitLiteratureReview, getLiteratureReviews } = require('../controllers/literatureReviewController');

router.post('/', protect, submitLiteratureReview);
router.get('/', protect, getLiteratureReviews);

module.exports = router;
