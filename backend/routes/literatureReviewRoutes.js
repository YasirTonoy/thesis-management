const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { submitLiteratureReview, getLiteratureReviews, addFeedback } = require('../controllers/literatureReviewController');

router.post('/', protect, submitLiteratureReview);
router.get('/', protect, getLiteratureReviews);
router.put('/:id/feedback', protect, roleCheck('supervisor', 'admin'), addFeedback);

module.exports = router;
