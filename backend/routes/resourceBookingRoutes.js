const express = require('express');
const router = express.Router();
const {
  getBookings,
  createBooking,
  respondToBooking,
  checkInBooking,
  checkOutBooking,
  cancelBooking
} = require('../controllers/resourceBookingController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// -------------------------------------------------------------
// Resource Bookings Endpoints (/api/resource-bookings)
// -------------------------------------------------------------
router.get('/', protect, getBookings);
router.post('/', protect, createBooking);
router.put('/:id/respond', protect, roleCheck('supervisor', 'admin'), respondToBooking);
router.put('/:id/check-in', protect, checkInBooking);
router.put('/:id/check-out', protect, checkOutBooking);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;
