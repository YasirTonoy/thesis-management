const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { submitProposal, getProposals, getProposalById, reviewProposal } = require('../controllers/proposalController');

router.post('/', protect, roleCheck('student'), submitProposal);
router.get('/', protect, getProposals);
router.get('/:id', protect, getProposalById);
router.put('/:id/review', protect, roleCheck('supervisor', 'admin'), reviewProposal);

module.exports = router;
