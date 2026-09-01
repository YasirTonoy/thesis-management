const express = require('express');
const router = express.Router();
const {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  getBookings,
  createBooking,
  respondToBooking,
  checkInBooking,
  checkOutBooking,
  cancelBooking,
  getResourceAnalytics
} = require('../controllers/resourceBookingController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// -------------------------------------------------------------
// Lab Resources Endpoints (/api/lab-resources)
// -------------------------------------------------------------
router.get('/', protect, getResources);
router.get('/analytics/stats', protect, getResourceAnalytics);
router.get('/:id', protect, getResourceById);
router.post('/', protect, roleCheck('supervisor', 'admin'), createResource);
router.put('/:id', protect, roleCheck('supervisor', 'admin'), updateResource);
router.delete('/:id', protect, roleCheck('supervisor', 'admin'), deleteResource);

module.exports = router;
