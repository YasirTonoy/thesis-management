const LabResource = require('../models/LabResource');
const ResourceBooking = require('../models/ResourceBooking');
const Supervision = require('../models/Supervision');

// @desc    Get all lab resources with optional filters
// @route   GET /api/lab-resources
// @access  Private
exports.getResources = async (req, res) => {
  try {
    const { category, labName, status, department, search } = req.query;
    const query = {};

    if (category && category !== 'all') query.category = category;
    if (labName && labName !== 'all') query.labName = labName;
    if (status && status !== 'all') query.status = status;
    if (department && department !== 'all') query.department = department;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { labName: { $regex: search, $options: 'i' } },
        { labRoom: { $regex: search, $options: 'i' } },
        { modelNumber: { $regex: search, $options: 'i' } },
        { assetTag: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const resources = await LabResource.find(query)
      .populate('managedBy', 'name email department')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: resources.length,
      data: resources
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single lab resource by ID with upcoming bookings
// @route   GET /api/lab-resources/:id
// @access  Private
exports.getResourceById = async (req, res) => {
  try {
    const resource = await LabResource.findById(req.params.id).populate('managedBy', 'name email department');
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // Fetch upcoming and active bookings for timeline display
    const upcomingBookings = await ResourceBooking.find({
      resource: resource._id,
      status: { $in: ['approved', 'in_use', 'pending'] },
      endTime: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
      .populate('user', 'name email studentId role')
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      data: {
        ...resource.toObject(),
        upcomingBookings
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new lab resource (Admin / Supervisor)
// @route   POST /api/lab-resources
// @access  Private (Supervisor/Admin)
exports.createResource = async (req, res) => {
  try {
    const {
      name,
      category,
      resourceType,
      labName,
      labRoom,
      modelNumber,
      assetTag,
      description,
      specs,
      imageUrl,
      status,
      isRequiresApproval,
      maxBookingHours,
      capacity,
      department,
      safetyGuidelines
    } = req.body;

    const resource = await LabResource.create({
      name,
      category,
      resourceType,
      labName,
      labRoom,
      modelNumber,
      assetTag: assetTag || `EQ-${Date.now().toString().slice(-6)}`,
      description,
      specs: specs || {},
      imageUrl,
      status: status || 'available',
      isRequiresApproval: isRequiresApproval !== undefined ? isRequiresApproval : true,
      maxBookingHours: Number(maxBookingHours) || 8,
      capacity: Number(capacity) || 1,
      department: department || req.user.department || 'Computer Science & Engineering',
      safetyGuidelines: Array.isArray(safetyGuidelines) ? safetyGuidelines : (safetyGuidelines ? [safetyGuidelines] : []),
      managedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Lab resource created successfully',
      data: resource
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update lab resource (Admin / Supervisor)
// @route   PUT /api/lab-resources/:id
// @access  Private (Supervisor/Admin)
exports.updateResource = async (req, res) => {
  try {
    let resource = await LabResource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    resource = await LabResource.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('managedBy', 'name email department');

    res.status(200).json({
      success: true,
      message: 'Lab resource updated successfully',
      data: resource
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete / decommission lab resource (Admin / Supervisor)
// @route   DELETE /api/lab-resources/:id
// @access  Private (Supervisor/Admin)
exports.deleteResource = async (req, res) => {
  try {
    const resource = await LabResource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    await LabResource.findByIdAndDelete(req.params.id);
    // Also cancel any pending bookings for this resource
    await ResourceBooking.updateMany(
      { resource: req.params.id, status: { $in: ['pending', 'approved'] } },
      { status: 'cancelled', cancellationReason: 'Resource removed from lab inventory' }
    );

    res.status(200).json({
      success: true,
      message: 'Lab resource removed successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get bookings (Role-filtered)
// @route   GET /api/resource-bookings
// @access  Private
exports.getBookings = async (req, res) => {
  try {
    const { resourceId, status, view } = req.query;
    const query = {};

    if (resourceId) query.resource = resourceId;
    if (status && status !== 'all') query.status = status;

    if (req.user.role === 'student') {
      query.user = req.user._id;
    } else if (req.user.role === 'supervisor') {
      if (view === 'my_supervisees') {
        // Find students supervised by this supervisor
        const supervisions = await Supervision.find({ supervisor: req.user._id, isActive: true });
        const studentIds = supervisions.map(s => s.student);
        query.user = { $in: [...studentIds, req.user._id] };
      }
      // If view is not specified or 'all', supervisors can view all bookings or filter by query
    }
    // Admins can see all by default

    const bookings = await ResourceBooking.find(query)
      .populate('resource')
      .populate('user', 'name email studentId department role')
      .populate('supervisor', 'name email')
      .populate('proposal', 'title status')
      .populate('reviewedBy', 'name email role')
      .sort({ startTime: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new booking with conflict detection
// @route   POST /api/resource-bookings
// @access  Private
exports.createBooking = async (req, res) => {
  try {
    const { resourceId, proposalId, purpose, startTime, endTime, safetyAgreementAccepted } = req.body;

    if (!resourceId || !startTime || !endTime || !purpose) {
      return res.status(400).json({ success: false, message: 'Please provide resource, purpose, start time, and end time' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid start or end date/time format' });
    }

    if (start >= end) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    if (start < new Date(Date.now() - 15 * 60 * 1000)) {
      return res.status(400).json({ success: false, message: 'Cannot book time slots in the past' });
    }

    const resource = await LabResource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Lab resource not found' });
    }

    if (resource.status === 'maintenance') {
      return res.status(400).json({
        success: false,
        message: 'This equipment is currently under maintenance and unavailable for booking'
      });
    }

    if (resource.status === 'decommissioned') {
      return res.status(400).json({
        success: false,
        message: 'This equipment has been decommissioned'
      });
    }

    // Check maximum booking duration
    const diffHours = (end - start) / (1000 * 60 * 60);
    if (resource.maxBookingHours && diffHours > resource.maxBookingHours) {
      return res.status(400).json({
        success: false,
        message: `Booking duration (${diffHours.toFixed(1)} hrs) exceeds maximum allowed limit of ${resource.maxBookingHours} hrs per reservation for this equipment`
      });
    }

    // Strict Conflict Detection: Check for overlapping bookings that are approved or in_use
    const conflictingBookings = await ResourceBooking.find({
      resource: resourceId,
      status: { $in: ['approved', 'in_use'] },
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: start } }
      ]
    }).populate('user', 'name email studentId');

    if (conflictingBookings.length >= resource.capacity) {
      const conflictTimes = conflictingBookings.map(b => 
        `${new Date(b.startTime).toLocaleString()} to ${new Date(b.endTime).toLocaleString()}`
      ).join('; ');

      return res.status(409).json({
        success: false,
        message: `Time slot conflict detected! The resource is already reserved during: ${conflictTimes}. Please choose another time slot.`,
        conflicts: conflictingBookings
      });
    }

    // Find student's active supervisor if available
    let supervisorId = null;
    if (req.user.role === 'student') {
      const supervision = await Supervision.findOne({ student: req.user._id, isActive: true });
      if (supervision) supervisorId = supervision.supervisor;
    }

    // Auto-approve if user is supervisor or admin, or if resource doesn't require approval
    const initialStatus = (!resource.isRequiresApproval || req.user.role === 'supervisor' || req.user.role === 'admin')
      ? 'approved'
      : 'pending';

    const booking = await ResourceBooking.create({
      resource: resourceId,
      user: req.user._id,
      supervisor: supervisorId,
      proposal: proposalId || undefined,
      purpose,
      startTime: start,
      endTime: end,
      durationHours: Math.round(diffHours * 10) / 10,
      status: initialStatus,
      safetyAgreementAccepted: Boolean(safetyAgreementAccepted),
      reviewedBy: initialStatus === 'approved' ? req.user._id : undefined,
      reviewedAt: initialStatus === 'approved' ? new Date() : undefined,
      reviewNotes: initialStatus === 'approved' ? (req.user.role === 'student' ? 'Auto-approved (No supervisor sign-off required)' : 'Directly booked by faculty/admin') : ''
    });

    // Update resource total booking count
    await LabResource.findByIdAndUpdate(resourceId, { $inc: { totalBookingsCount: 1 } });

    const populated = await ResourceBooking.findById(booking._id)
      .populate('resource')
      .populate('user', 'name email studentId department')
      .populate('supervisor', 'name email')
      .populate('proposal', 'title');

    res.status(201).json({
      success: true,
      message: initialStatus === 'approved' ? 'Resource reserved successfully!' : 'Booking request submitted! Awaiting supervisor/lab manager approval.',
      data: populated
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Respond to booking request (Approve/Reject)
// @route   PUT /api/resource-bookings/:id/respond
// @access  Private (Supervisor/Admin)
exports.respondToBooking = async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be either approved or rejected' });
    }

    const booking = await ResourceBooking.findById(req.params.id).populate('resource');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // If approving, re-check conflict in case another booking was approved in the meantime
    if (status === 'approved') {
      const conflict = await ResourceBooking.findOne({
        _id: { $ne: booking._id },
        resource: booking.resource._id,
        status: { $in: ['approved', 'in_use'] },
        $or: [
          { startTime: { $lt: booking.endTime }, endTime: { $gt: booking.startTime } }
        ]
      });

      if (conflict) {
        return res.status(409).json({
          success: false,
          message: 'Cannot approve: another overlapping booking was approved for this time slot.'
        });
      }
    }

    booking.status = status;
    booking.reviewedBy = req.user._id;
    booking.reviewedAt = new Date();
    if (reviewNotes) booking.reviewNotes = reviewNotes;

    await booking.save();

    const populated = await ResourceBooking.findById(booking._id)
      .populate('resource')
      .populate('user', 'name email studentId')
      .populate('reviewedBy', 'name email role');

    res.status(200).json({
      success: true,
      message: `Booking ${status} successfully`,
      data: populated
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Check-in / start equipment usage session
// @route   PUT /api/resource-bookings/:id/check-in
// @access  Private
exports.checkInBooking = async (req, res) => {
  try {
    const booking = await ResourceBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Allow user who booked or supervisor/admin
    if (booking.user.toString() !== req.user._id.toString() && req.user.role === 'student') {
      return res.status(403).json({ success: false, message: 'Not authorized to check into this booking' });
    }

    if (booking.status !== 'approved') {
      return res.status(400).json({ success: false, message: `Cannot check in a booking with status "${booking.status}"` });
    }

    booking.status = 'in_use';
    booking.checkInTime = new Date();
    await booking.save();

    await LabResource.findByIdAndUpdate(booking.resource, { status: 'in_use' });

    const populated = await ResourceBooking.findById(booking._id)
      .populate('resource')
      .populate('user', 'name email studentId');

    res.status(200).json({
      success: true,
      message: 'Check-in confirmed. Equipment is now marked IN USE.',
      data: populated
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Check-out / complete equipment usage session
// @route   PUT /api/resource-bookings/:id/check-out
// @access  Private
exports.checkOutBooking = async (req, res) => {
  try {
    const { conditionOnReturn } = req.body;
    const booking = await ResourceBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user._id.toString() && req.user.role === 'student') {
      return res.status(403).json({ success: false, message: 'Not authorized to check out this booking' });
    }

    booking.status = 'completed';
    booking.checkOutTime = new Date();
    booking.conditionOnReturn = conditionOnReturn || 'Standard condition verified';
    await booking.save();

    // Revert resource status to available and accumulate usage hours
    await LabResource.findByIdAndUpdate(booking.resource, {
      status: 'available',
      $inc: { totalUsageHours: booking.durationHours || 1 }
    });

    const populated = await ResourceBooking.findById(booking._id)
      .populate('resource')
      .populate('user', 'name email studentId');

    res.status(200).json({
      success: true,
      message: 'Check-out completed. Equipment returned successfully.',
      data: populated
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Cancel an upcoming booking
// @route   PUT /api/resource-bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await ResourceBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user._id.toString() && req.user.role === 'student') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel booking that is already ${booking.status}` });
    }

    booking.status = 'cancelled';
    booking.cancellationReason = reason || 'Cancelled by user';
    await booking.save();

    // If resource was marked in_use, free it
    if (booking.status === 'in_use') {
      await LabResource.findByIdAndUpdate(booking.resource, { status: 'available' });
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get equipment and laboratory analytics
// @route   GET /api/lab-resources/analytics/stats
// @access  Private
exports.getResourceAnalytics = async (req, res) => {
  try {
    const totalResources = await LabResource.countDocuments();
    const availableResources = await LabResource.countDocuments({ status: 'available' });
    const inUseResources = await LabResource.countDocuments({ status: 'in_use' });
    const maintenanceResources = await LabResource.countDocuments({ status: 'maintenance' });

    const totalBookings = await ResourceBooking.countDocuments();
    const pendingBookings = await ResourceBooking.countDocuments({ status: 'pending' });
    const approvedBookings = await ResourceBooking.countDocuments({ status: 'approved' });
    const completedBookings = await ResourceBooking.countDocuments({ status: 'completed' });

    // Category breakdown
    const categoryStats = await LabResource.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, totalHours: { $sum: '$totalUsageHours' } } }
    ]);

    // Lab facility breakdown
    const labStats = await LabResource.aggregate([
      { $group: { _id: '$labName', count: { $sum: 1 }, totalBookings: { $sum: '$totalBookingsCount' } } },
      { $sort: { totalBookings: -1 } }
    ]);

    // Most used equipment items
    const topEquipment = await LabResource.find()
      .sort({ totalBookingsCount: -1 })
      .limit(5)
      .select('name labName category totalBookingsCount totalUsageHours status');

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalResources,
          availableResources,
          inUseResources,
          maintenanceResources,
          utilizationRate: totalResources > 0 ? Math.round((inUseResources / totalResources) * 100) : 0,
          totalBookings,
          pendingBookings,
          approvedBookings,
          completedBookings
        },
        categoryStats,
        labStats,
        topEquipment
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
