const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  scheduleDefense,
  getDefense,
  getMyDefenses,
  updateDefense,
  respondToInvitation,
  recordResult
} = require('../controllers/defenseController');

router.post('/', protect, scheduleDefense);
router.get('/', protect, getDefense);
router.get('/mine', protect, getMyDefenses);
router.put('/:id', protect, updateDefense);
router.put('/:id/respond', protect, respondToInvitation);
router.put('/:id/result', protect, recordResult);

module.exports = router;
