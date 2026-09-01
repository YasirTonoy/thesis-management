const mongoose = require('mongoose');

const resourceBookingSchema = new mongoose.Schema(
  {
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabResource',
      required: [true, 'Resource ID is required']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    proposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal'
    },
    bookingReference: {
      type: String,
      unique: true,
      trim: true
    },
    purpose: {
      type: String,
      required: [true, 'Experiment/Booking purpose is required'],
      trim: true
    },
    startTime: {
      type: Date,
      required: [true, 'Start date & time is required']
    },
    endTime: {
      type: Date,
      required: [true, 'End date & time is required']
    },
    durationHours: {
      type: Number,
      default: 1
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'in_use', 'completed', 'cancelled'],
      default: 'pending'
    },
    safetyAgreementAccepted: {
      type: Boolean,
      default: true
    },
    reviewNotes: {
      type: String,
      default: '',
      trim: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    },
    checkInTime: {
      type: Date
    },
    checkOutTime: {
      type: Date
    },
    conditionOnReturn: {
      type: String,
      default: '',
      trim: true
    },
    cancellationReason: {
      type: String,
      default: '',
      trim: true
    }
  },
  { timestamps: true }
);

// Pre-save hook to generate unique booking reference if not present
resourceBookingSchema.pre('save', function () {
  if (!this.bookingReference) {
    const randomCode = Math.floor(10000 + Math.random() * 90000);
    const dateStr = new Date().getFullYear().toString();
    this.bookingReference = `BK-${dateStr}-${randomCode}`;
  }
  if (this.startTime && this.endTime) {
    const diffMs = new Date(this.endTime) - new Date(this.startTime);
    this.durationHours = Math.max(0.5, Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10);
  }
});

module.exports = mongoose.model('ResourceBooking', resourceBookingSchema);
