const mongoose = require('mongoose');

const labResourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Resource name is required'],
      trim: true
    },
    category: {
      type: String,
      enum: [
        'computing_gpu',
        'electronics_hardware',
        'rapid_prototyping_3d',
        'biomedical_sensors',
        'robotics_automation',
        'network_rf',
        'lab_space',
        'specialized_tool'
      ],
      default: 'computing_gpu'
    },
    resourceType: {
      type: String,
      enum: ['equipment', 'lab_space', 'workstation', 'sensor_kit'],
      default: 'equipment'
    },
    labName: {
      type: String,
      required: [true, 'Lab name is required'],
      trim: true
    },
    labRoom: {
      type: String,
      required: [true, 'Lab room / location is required'],
      trim: true
    },
    modelNumber: {
      type: String,
      trim: true,
      default: ''
    },
    assetTag: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    specs: {
      type: Map,
      of: String,
      default: {}
    },
    imageUrl: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['available', 'in_use', 'maintenance', 'reserved', 'decommissioned'],
      default: 'available'
    },
    isRequiresApproval: {
      type: Boolean,
      default: true
    },
    maxBookingHours: {
      type: Number,
      default: 8,
      min: 1
    },
    capacity: {
      type: Number,
      default: 1,
      min: 1
    },
    department: {
      type: String,
      default: 'Computer Science & Engineering',
      trim: true
    },
    safetyGuidelines: {
      type: [String],
      default: []
    },
    managedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    totalBookingsCount: {
      type: Number,
      default: 0
    },
    totalUsageHours: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('LabResource', labResourceSchema);
