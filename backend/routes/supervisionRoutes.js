const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  assignSupervisor,
  getSupervisions,
  reassignSupervisor
} = require('../controllers/supervisionController');

// Admin routes
router.post('/', protect, roleCheck('admin'), assignSupervisor);
router.put('/:id/reassign', protect, roleCheck('admin'), reassignSupervisor);

// All authenticated users can view supervisions (controller filters by role)
router.get('/', protect, getSupervisions);

module.exports = router;
