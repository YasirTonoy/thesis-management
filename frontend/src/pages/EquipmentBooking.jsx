import React, { useState, useEffect } from 'react';
import { labResourceAPI, resourceBookingAPI, proposalAPI } from '../api';
import {
  IconEquipment,
  IconCalendar,
  IconClock,
  IconCpu,
  IconCheck,
  IconAlertTriangle,
  IconPlus,
  IconFilter
} from '../components/icons';

const CATEGORY_MAP = {
  computing_gpu: { label: 'GPU & AI Compute', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: '⚡' },
  electronics_hardware: { label: 'Electronics & Test Benches', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '🔌' },
  rapid_prototyping_3d: { label: '3D Prototyping & CNC', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '🖨️' },
  biomedical_sensors: { label: 'Biomedical & Bio-Signals', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '🩺' },
  robotics_automation: { label: 'Robotics & Control Systems', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: '🤖' },
  network_rf: { label: 'Network & RF Analyzers', color: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: '📡' },
  lab_space: { label: 'Specialized Lab Room', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: '🏛️' },
  specialized_tool: { label: 'Specialized Hardware Tool', color: 'bg-slate-50 text-slate-700 border-slate-200', icon: '🔧' }
};

const STATUS_BADGE = {
  available: { label: 'Available Now', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  in_use: { label: 'In Use / Active Session', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  maintenance: { label: 'Under Maintenance', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  reserved: { label: 'Reserved', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  decommissioned: { label: 'Decommissioned', color: 'bg-slate-100 text-slate-500 border-slate-300' }
};

const BOOKING_STATUS_BADGE = {
  pending: { label: 'Pending Approval', color: 'bg-amber-50 text-amber-700 border-amber-300' },
  approved: { label: 'Approved & Scheduled', color: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  rejected: { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-300' },
  in_use: { label: 'Active Session (Checked-In)', color: 'bg-blue-50 text-blue-700 border-blue-300' },
  completed: { label: 'Completed & Returned', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500 border-gray-300' }
};

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
];

const EquipmentBooking = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog', 'schedule', 'my_bookings', 'approvals', 'analytics', 'manage'
  const [loading, setLoading] = useState(true);

  // Resources Data
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLab, setSelectedLab] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Bookings Data
  const [bookings, setBookings] = useState([]);
  const [userProposals, setUserProposals] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Modals
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showSpecsModal, setShowSpecsModal] = useState(false);
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [showCheckInOutModal, setShowCheckInOutModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Selected entities for modals
  const [targetBooking, setTargetBooking] = useState(null);
  const [checkOutCondition, setCheckOutCondition] = useState('Cleaned and powered off in normal working condition.');
  const [approvalDecision, setApprovalDecision] = useState({ status: 'approved', notes: '' });

  // Reserve Form State
  const [reserveForm, setReserveForm] = useState({
    resourceId: '',
    proposalId: '',
    bookingDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '14:00',
    purpose: '',
    safetyAccepted: true
  });

  // Resource Create/Edit Form State
  const [resourceForm, setResourceForm] = useState({
    name: '',
    category: 'computing_gpu',
    resourceType: 'equipment',
    labName: 'AI & High-Performance Computing Lab',
    labRoom: '',
    modelNumber: '',
    assetTag: '',
    description: '',
    specs: '', // JSON or key:value lines
    imageUrl: '',
    status: 'available',
    isRequiresApproval: true,
    maxBookingHours: 8,
    capacity: 1,
    safetyGuidelines: ''
  });

  // Schedule View Filter
  const [scheduleResourceFilter, setScheduleResourceFilter] = useState('');
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [resResources, resBookings, resAnalytics, resProposals] = await Promise.all([
        labResourceAPI.getAll(),
        resourceBookingAPI.getAll(),
        labResourceAPI.getAnalytics(),
        proposalAPI.getAll()
      ]);

      setResources(resResources.data.data || []);
      setBookings(resBookings.data.data || []);
      setAnalytics(resAnalytics.data.data || null);
      setUserProposals(resProposals.data.data || []);

      if (resResources.data.data?.length > 0 && !scheduleResourceFilter) {
        setScheduleResourceFilter(resResources.data.data[0]._id);
      }
    } catch (err) {
      console.error('Error loading equipment data:', err);
    }
    setLoading(false);
  };

  const refreshBookingsAndResources = async () => {
    try {
      const [resResources, resBookings, resAnalytics] = await Promise.all([
        labResourceAPI.getAll(),
        resourceBookingAPI.getAll(),
        labResourceAPI.getAnalytics()
      ]);
      setResources(resResources.data.data || []);
      setBookings(resBookings.data.data || []);
      setAnalytics(resAnalytics.data.data || null);
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  };

  // Open Reserve Modal for a specific equipment
  const handleOpenReserve = (resource) => {
    setSelectedResource(resource);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    setReserveForm({
      resourceId: resource._id,
      proposalId: userProposals.length > 0 ? userProposals[0]._id : '',
      bookingDate: dateStr,
      startTime: '10:00',
      endTime: '13:00',
      purpose: '',
      safetyAccepted: true
    });
    setShowReserveModal(true);
  };

  // Submit Reservation Request
  const handleReserveSubmit = async (e) => {
    e.preventDefault();
    if (!reserveForm.purpose.trim()) {
      alert('Please describe the experiment or research purpose for this booking.');
      return;
    }

    const start = new Date(`${reserveForm.bookingDate}T${reserveForm.startTime}:00`);
    const end = new Date(`${reserveForm.bookingDate}T${reserveForm.endTime}:00`);

    if (start >= end) {
      alert('End time must be after start time.');
      return;
    }

    try {
      const res = await resourceBookingAPI.create({
        resourceId: reserveForm.resourceId,
        proposalId: reserveForm.proposalId || undefined,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        purpose: reserveForm.purpose,
        safetyAgreementAccepted: reserveForm.safetyAccepted
      });

      alert(res.data.message || 'Reservation submitted successfully!');
      setShowReserveModal(false);
      await refreshBookingsAndResources();
      setActiveTab('my_bookings');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit reservation. Please check for scheduling conflicts.');
    }
  };

  // Check-In Session
  const handleCheckIn = async (bookingId) => {
    if (!window.confirm('Confirm equipment handover and start laboratory session?')) return;
    try {
      await resourceBookingAPI.checkIn(bookingId);
      alert('Check-in confirmed! Equipment is marked as IN USE.');
      await refreshBookingsAndResources();
    } catch (err) {
      alert(err.response?.data?.message || 'Error during check-in');
    }
  };

  // Open Check-Out Modal
  const handleOpenCheckOut = (booking) => {
    setTargetBooking(booking);
    setCheckOutCondition('Returned in clean, fully functional condition. Calibration and power cycled.');
    setShowCheckInOutModal(true);
  };

  // Submit Check-Out
  const handleCheckOutSubmit = async (e) => {
    e.preventDefault();
    try {
      await resourceBookingAPI.checkOut(targetBooking._id, {
        conditionOnReturn: checkOutCondition
      });
      alert('Check-out completed! Equipment marked available.');
      setShowCheckInOutModal(false);
      await refreshBookingsAndResources();
    } catch (err) {
      alert(err.response?.data?.message || 'Error during check-out');
    }
  };

  // Cancel Booking
  const handleCancelBooking = async (bookingId) => {
    const reason = window.prompt('Please enter a cancellation reason:');
    if (reason === null) return;
    try {
      await resourceBookingAPI.cancel(bookingId, { reason });
      alert('Reservation cancelled.');
      await refreshBookingsAndResources();
    } catch (err) {
      alert(err.response?.data?.message || 'Error cancelling booking');
    }
  };

  // Open Approval Modal (Supervisor/Admin)
  const handleOpenApproval = (booking, status) => {
    setTargetBooking(booking);
    setApprovalDecision({
      status,
      notes: status === 'approved' ? 'Approved for laboratory research experiment. Follow standard lab safety protocols.' : 'Slot unavailable due to conflicting laboratory maintenance or department priority.'
    });
    setShowApprovalModal(true);
  };

  // Submit Approval / Rejection
  const handleApprovalSubmit = async (e) => {
    e.preventDefault();
    try {
      await resourceBookingAPI.respond(targetBooking._id, {
        status: approvalDecision.status,
        reviewNotes: approvalDecision.notes
      });
      alert(`Booking ${approvalDecision.status} successfully!`);
      setShowApprovalModal(false);
      await refreshBookingsAndResources();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating booking status');
    }
  };

  // Create or Update Lab Resource
  const handleSaveResource = async (e) => {
    e.preventDefault();
    try {
      let parsedSpecs = {};
      if (resourceForm.specs) {
        try {
          parsedSpecs = JSON.parse(resourceForm.specs);
        } catch {
          // parse key: value lines
          resourceForm.specs.split('\n').forEach(line => {
            const parts = line.split(':');
            if (parts.length >= 2) {
              parsedSpecs[parts[0].trim()] = parts.slice(1).join(':').trim();
            }
          });
        }
      }

      const payload = {
        ...resourceForm,
        specs: parsedSpecs,
        safetyGuidelines: resourceForm.safetyGuidelines
          ? resourceForm.safetyGuidelines.split('\n').filter(Boolean)
          : []
      };

      if (resourceForm._id) {
        await labResourceAPI.update(resourceForm._id, payload);
        alert('Lab equipment updated successfully!');
      } else {
        await labResourceAPI.create(payload);
        alert('New lab equipment registered successfully!');
      }

      setShowAddResourceModal(false);
      setResourceForm({
        name: '', category: 'computing_gpu', resourceType: 'equipment',
        labName: 'AI & High-Performance Computing Lab', labRoom: '', modelNumber: '',
        assetTag: '', description: '', specs: '', imageUrl: '', status: 'available',
        isRequiresApproval: true, maxBookingHours: 8, capacity: 1, safetyGuidelines: ''
      });
      await refreshBookingsAndResources();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving lab equipment');
    }
  };

  // Toggle Maintenance Status for a Resource
  const handleToggleMaintenance = async (resource) => {
    const nextStatus = resource.status === 'maintenance' ? 'available' : 'maintenance';
    if (!window.confirm(`Set status of "${resource.name}" to ${nextStatus.toUpperCase()}?`)) return;
    try {
      await labResourceAPI.update(resource._id, { status: nextStatus });
      await refreshBookingsAndResources();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  // Filtered Resources
  const filteredResources = resources.filter(res => {
    const matchCat = selectedCategory === 'all' || res.category === selectedCategory;
    const matchLab = selectedLab === 'all' || res.labName === selectedLab;
    const matchStat = selectedStatus === 'all' || res.status === selectedStatus;
    const matchQuery = !searchQuery || [res.name, res.labName, res.labRoom, res.modelNumber, res.assetTag, res.description]
      .filter(Boolean)
      .some(field => field.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchLab && matchStat && matchQuery;
  });

  // Unique Lab Names for filter dropdown
  const labNames = Array.from(new Set(resources.map(r => r.labName))).filter(Boolean);

  // Pending Approvals count for supervisor/admin
  const pendingApprovals = bookings.filter(b => b.status === 'pending');
  const myBookingsList = currentUser?.role === 'student'
    ? bookings.filter(b => b.user?._id === currentUser._id || b.user === currentUser._id)
    : bookings;

  const isFacultyOrAdmin = currentUser?.role === 'supervisor' || currentUser?.role === 'admin';

  if (loading) {
    return (
      <div className="flex justify-center items-center py-28">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-500">Loading Laboratory & Equipment Booking Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="w-10 h-1 bg-blue-600 mb-3" />
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🔬</span>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Equipment & Laboratory Resource Booking Hub
              </h1>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Browse specialized research instruments, view real-time laboratory slot schedules, reserve workstations, and manage experimental research facilities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isFacultyOrAdmin && (
              <button
                onClick={() => {
                  setResourceForm({
                    name: '', category: 'computing_gpu', resourceType: 'equipment',
                    labName: 'AI & High-Performance Computing Lab', labRoom: 'UB20401',
                    modelNumber: '', assetTag: `BRACU-EQ-${Math.floor(100 + Math.random() * 900)}`,
                    description: '', specs: 'GPU: 4x RTX 4090\nRAM: 128GB\nStorage: 4TB NVMe',
                    imageUrl: '', status: 'available', isRequiresApproval: true, maxBookingHours: 8,
                    capacity: 1, safetyGuidelines: 'Standard lab safety orientation required'
                  });
                  setShowAddResourceModal(true);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 transition flex items-center gap-1.5 shadow-sm"
              >
                <IconPlus className="w-4 h-4" />
                Register New Equipment
              </button>
            )}
            <button
              onClick={refreshBookingsAndResources}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 transition"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Quick Analytics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-100 text-left">
          <div className="bg-slate-50 border border-slate-200/80 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Instruments</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{resources.length}</p>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-200/70 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Available Now</p>
            <p className="text-xl font-black text-emerald-800 mt-0.5">
              {resources.filter(r => r.status === 'available').length}
            </p>
          </div>
          <div className="bg-blue-50/70 border border-blue-200/70 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">In Active Session</p>
            <p className="text-xl font-black text-blue-800 mt-0.5">
              {resources.filter(r => r.status === 'in_use').length}
            </p>
          </div>
          <div className="bg-amber-50/70 border border-amber-200/70 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Maintenance</p>
            <p className="text-xl font-black text-amber-800 mt-0.5">
              {resources.filter(r => r.status === 'maintenance').length}
            </p>
          </div>
          <div className="bg-purple-50/70 border border-purple-200/70 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-purple-700">My Reservations</p>
            <p className="text-xl font-black text-purple-800 mt-0.5">
              {myBookingsList.filter(b => ['pending', 'approved', 'in_use'].includes(b.status)).length}
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Review</p>
            <p className="text-xl font-black text-amber-600 mt-0.5">{pendingApprovals.length}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition whitespace-nowrap ${
            activeTab === 'catalog'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          🔍 Equipment Catalog ({filteredResources.length})
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition whitespace-nowrap ${
            activeTab === 'schedule'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          📅 Schedule & Slot Timeline
        </button>

        <button
          onClick={() => setActiveTab('my_bookings')}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition whitespace-nowrap ${
            activeTab === 'my_bookings'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          📋 {currentUser?.role === 'student' ? 'My Reservations' : 'All Reservations'} ({myBookingsList.length})
        </button>

        {isFacultyOrAdmin && (
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'approvals'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            🛡️ Supervisor Approvals
            {pendingApprovals.length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {pendingApprovals.length}
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          📊 Lab Utilization Analytics
        </button>

        {isFacultyOrAdmin && (
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition whitespace-nowrap ${
              activeTab === 'manage'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            ⚙️ Inventory & Maintenance
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EQUIPMENT CATALOG                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Search Catalog
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, model, specs, tag..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 focus:outline-none focus:border-blue-600 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 focus:outline-none focus:border-blue-600 bg-slate-50 font-medium"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(CATEGORY_MAP).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.icon} {cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Lab Facility
                </label>
                <select
                  value={selectedLab}
                  onChange={(e) => setSelectedLab(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 focus:outline-none focus:border-blue-600 bg-slate-50 font-medium"
                >
                  <option value="all">All Laboratories</option>
                  {labNames.map(lab => (
                    <option key={lab} value={lab}>{lab}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Operational Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 focus:outline-none focus:border-blue-600 bg-slate-50 font-medium"
                >
                  <option value="all">All Statuses</option>
                  <option value="available">🟢 Available Now</option>
                  <option value="in_use">🔵 In Use</option>
                  <option value="maintenance">🟠 Under Maintenance</option>
                </select>
              </div>
            </div>

            {/* Quick Lab Filter Chips */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 overflow-x-auto text-[11px]">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] mr-1 shrink-0">Quick Lab:</span>
              <button
                onClick={() => setSelectedLab('all')}
                className={`px-2.5 py-1 font-semibold transition shrink-0 border ${
                  selectedLab === 'all'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                All Labs
              </button>
              <button
                onClick={() => setSelectedLab('Robotics & Autonomous Systems Lab')}
                className={`px-2.5 py-1 font-bold transition shrink-0 border flex items-center gap-1 ${
                  selectedLab === 'Robotics & Autonomous Systems Lab'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                }`}
              >
                🤖 Robotics & Autonomous Systems Lab
              </button>
              <button
                onClick={() => setSelectedLab('AI & High-Performance Computing Lab')}
                className={`px-2.5 py-1 font-semibold transition shrink-0 border ${
                  selectedLab === 'AI & High-Performance Computing Lab'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                ⚡ AI & HPC Lab
              </button>
              <button
                onClick={() => setSelectedLab('VLSI & Electronics Design Lab')}
                className={`px-2.5 py-1 font-semibold transition shrink-0 border ${
                  selectedLab === 'VLSI & Electronics Design Lab'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                }`}
              >
                🔌 VLSI Lab
              </button>
              <button
                onClick={() => setSelectedLab('Bio-Medical & Neural Signal Lab')}
                className={`px-2.5 py-1 font-semibold transition shrink-0 border ${
                  selectedLab === 'Bio-Medical & Neural Signal Lab'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                🩺 Bio-Medical Lab
              </button>
              <button
                onClick={() => setSelectedLab('Makerspace & Prototyping Workshop')}
                className={`px-2.5 py-1 font-semibold transition shrink-0 border ${
                  selectedLab === 'Makerspace & Prototyping Workshop'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                }`}
              >
                🖨️ Makerspace
              </button>
            </div>
          </div>

          {/* Equipment Grid */}
          {filteredResources.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 p-12 text-center">
              <span className="text-3xl">🔍</span>
              <h3 className="text-base font-bold text-slate-800 mt-2">No Lab Equipment Found</h3>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your category, laboratory filter, or search keywords.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredResources.map((resource) => {
                const catInfo = CATEGORY_MAP[resource.category] || CATEGORY_MAP.specialized_tool;
                const statusInfo = STATUS_BADGE[resource.status] || STATUS_BADGE.available;

                return (
                  <div
                    key={resource._id}
                    className="bg-white border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-400 transition"
                  >
                    <div>
                      {/* Card Image Banner */}
                      <div className="relative h-40 w-full bg-slate-100 overflow-hidden border-b border-slate-200">
                        {resource.imageUrl ? (
                          <img
                            src={resource.imageUrl}
                            alt={resource.name}
                            className="w-full h-full object-cover object-center"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-4xl text-slate-400">
                            {catInfo.icon}
                          </div>
                        )}
                        {/* Status Badge */}
                        <div className="absolute top-2.5 right-2.5">
                          <span className={`px-2.5 py-1 text-[10px] font-bold border shadow-xs ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        {/* Asset Tag */}
                        {resource.assetTag && (
                          <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-mono px-2 py-0.5 font-bold">
                            TAG: {resource.assetTag}
                          </div>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 border ${catInfo.color}`}>
                            {catInfo.icon} {catInfo.label}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                            {resource.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1">
                            <span>📍</span> {resource.labName} · <strong className="text-slate-700">{resource.labRoom}</strong>
                          </p>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {resource.description || 'Specialized university laboratory hardware for academic and thesis research.'}
                        </p>

                        {/* Specs Highlights */}
                        {resource.specs && Object.keys(resource.specs).length > 0 && (
                          <div className="bg-slate-50 border border-slate-200/80 p-2.5 text-[11px] space-y-1">
                            {Object.entries(resource.specs).slice(0, 2).map(([key, val]) => (
                              <div key={key} className="flex justify-between text-slate-600">
                                <span className="font-semibold text-slate-700">{key}:</span>
                                <span className="font-mono text-slate-800 truncate max-w-[140px] text-right">{val}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          <span>Max Session: <strong>{resource.maxBookingHours || 8}h</strong></span>
                          <span>Approval: <strong>{resource.isRequiresApproval ? 'Required' : 'Instant'}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="p-4 pt-0 flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedResource(resource);
                          setShowSpecsModal(true);
                        }}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 transition border border-slate-200"
                      >
                        Specs & Schedule
                      </button>
                      <button
                        onClick={() => handleOpenReserve(resource)}
                        disabled={resource.status === 'maintenance' || resource.status === 'decommissioned'}
                        className={`flex-1 text-xs font-bold py-2 transition shadow-xs ${
                          resource.status === 'maintenance'
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {resource.status === 'maintenance' ? 'Unavailable' : 'Book Slot →'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SCHEDULE & SLOT TIMELINE MATRIX                                    */}
      {/* ========================================================================= */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Select Equipment
                </label>
                <select
                  value={scheduleResourceFilter}
                  onChange={(e) => setScheduleResourceFilter(e.target.value)}
                  className="text-xs px-3 py-2 border border-slate-300 focus:outline-none focus:border-blue-600 bg-slate-50 font-semibold max-w-xs"
                >
                  {resources.map(res => (
                    <option key={res._id} value={res._id}>
                      {res.name} ({res.labRoom})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Schedule Date
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="text-xs px-3 py-2 border border-slate-300 focus:outline-none focus:border-blue-600 bg-slate-50 font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 bg-emerald-500 inline-block rounded-xs" /> Open Slot
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 bg-blue-600 inline-block rounded-xs" /> Reserved / In Use
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 bg-amber-500 inline-block rounded-xs" /> Pending Review
              </span>
            </div>
          </div>

          {/* Timeline Grid */}
          {(() => {
            const currentRes = resources.find(r => r._id === scheduleResourceFilter);
            if (!currentRes) {
              return (
                <div className="bg-white border border-slate-200 p-8 text-center text-slate-500 text-xs">
                  Please select an equipment above to view its timetable.
                </div>
              );
            }

            // Filter bookings for this resource on scheduleDate
            const dayBookings = bookings.filter(b => {
              const resId = b.resource?._id || b.resource;
              if (resId !== currentRes._id) return false;
              if (['rejected', 'cancelled'].includes(b.status)) return false;
              const bStart = new Date(b.startTime);
              const bDateStr = bStart.toISOString().split('T')[0];
              return bDateStr === scheduleDate;
            });

            return (
              <div className="bg-white border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-200">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{currentRes.name}</h2>
                    <p className="text-xs text-slate-500">
                      📍 {currentRes.labName} ({currentRes.labRoom}) · Max Duration: {currentRes.maxBookingHours} hrs/session
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenReserve(currentRes)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 transition shadow-xs"
                  >
                    Reserve on {scheduleDate} →
                  </button>
                </div>

                {/* Hourly Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
                  {TIME_SLOTS.map(slot => {
                    const slotHour = parseInt(slot.split(':')[0], 10);
                    // Check if any booking covers this hour
                    const matchingBooking = dayBookings.find(b => {
                      const startH = new Date(b.startTime).getHours();
                      const endH = new Date(b.endTime).getHours();
                      return slotHour >= startH && slotHour < endH;
                    });

                    const isTaken = !!matchingBooking;
                    const isPending = matchingBooking?.status === 'pending';

                    return (
                      <div
                        key={slot}
                        className={`p-3 border transition flex flex-col justify-between ${
                          isTaken
                            ? isPending
                              ? 'bg-amber-50 border-amber-300 text-amber-900'
                              : 'bg-blue-50 border-blue-300 text-blue-900'
                            : 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-100 text-emerald-900 cursor-pointer'
                        }`}
                        onClick={() => {
                          if (!isTaken) {
                            setSelectedResource(currentRes);
                            setReserveForm(prev => ({
                              ...prev,
                              resourceId: currentRes._id,
                              bookingDate: scheduleDate,
                              startTime: slot,
                              endTime: `${String(slotHour + 2).padStart(2, '0')}:00`
                            }));
                            setShowReserveModal(true);
                          }
                        }}
                      >
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span>{slot} - {String(slotHour + 1).padStart(2, '0')}:00</span>
                          <span className={`w-2 h-2 rounded-full ${isTaken ? (isPending ? 'bg-amber-500' : 'bg-blue-600') : 'bg-emerald-500'}`} />
                        </div>

                        <div className="mt-2 text-[11px]">
                          {isTaken ? (
                            <div>
                              <p className="font-bold truncate">{matchingBooking.user?.name || 'Reserved'}</p>
                              <p className="text-[10px] text-slate-500 font-mono truncate">{matchingBooking.bookingReference}</p>
                              <span className="text-[9px] uppercase font-bold tracking-wider opacity-80">
                                [{matchingBooking.status}]
                              </span>
                            </div>
                          ) : (
                            <span className="text-emerald-700 font-semibold text-[11px]">+ Click to Book</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Day Bookings Detailed List */}
                <div className="pt-4 border-t border-slate-200 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Confirmed Reservations on {scheduleDate} ({dayBookings.length})
                  </h3>
                  {dayBookings.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No bookings scheduled for this date. The entire timeline is open!</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {dayBookings.map(b => (
                        <div key={b._id} className="py-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                          <div>
                            <span className="font-mono font-bold text-slate-900 mr-2">{b.bookingReference}</span>
                            <span className="font-semibold text-slate-700">{b.user?.name} ({b.user?.studentId || b.user?.role})</span>
                            <p className="text-slate-500 text-[11px] mt-0.5">
                              Purpose: {b.purpose}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-700">
                              {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({b.durationHours}h)
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] font-bold border ${BOOKING_STATUS_BADGE[b.status]?.color}`}>
                              {BOOKING_STATUS_BADGE[b.status]?.label}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MY RESERVATIONS / ALL RESERVATIONS                                 */}
      {/* ========================================================================= */}
      {activeTab === 'my_bookings' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 p-6 shadow-sm overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {currentUser?.role === 'student' ? 'My Laboratory Reservations' : 'All University Laboratory Bookings'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track booking approvals, start active laboratory sessions, check-out upon experiment completion, and generate booking passes.
                </p>
              </div>
            </div>

            {myBookingsList.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-300">
                <span className="text-3xl">📋</span>
                <p className="text-xs font-semibold text-slate-600 mt-2">No reservations found.</p>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 transition"
                >
                  Explore Catalog & Book Equipment
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead className="bg-slate-50 uppercase text-[10px] tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Ref & Equipment</th>
                    <th className="px-4 py-3">Booked By / Project</th>
                    <th className="px-4 py-3">Scheduled Window</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {myBookingsList.map((b) => {
                    const statusInfo = BOOKING_STATUS_BADGE[b.status] || BOOKING_STATUS_BADGE.pending;
                    const canCheckIn = b.status === 'approved';
                    const canCheckOut = b.status === 'in_use';
                    const canCancel = ['pending', 'approved'].includes(b.status);

                    return (
                      <tr key={b._id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3.5">
                          <span className="font-mono font-bold text-blue-700 block text-[11px]">
                            {b.bookingReference}
                          </span>
                          <span className="font-bold text-slate-900 block text-xs mt-0.5">
                            {b.resource?.name || 'Equipment'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            📍 {b.resource?.labName} · {b.resource?.labRoom}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-900">{b.user?.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {b.user?.studentId ? `ID: ${b.user.studentId}` : b.user?.role}
                          </p>
                          {b.proposal && (
                            <span className="inline-block bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 font-medium mt-1 truncate max-w-[200px]">
                              🎓 {b.proposal.title}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-medium text-slate-900">
                            {new Date(b.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            <span className="ml-1 text-slate-700 font-semibold">({b.durationHours} hrs)</span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className={`px-2.5 py-1 text-[10px] font-bold border inline-block ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          {b.reviewNotes && (
                            <p className="text-[10px] text-slate-500 mt-1 max-w-xs italic">
                              "{b.reviewNotes}"
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                          {/* Receipt / Pass button */}
                          <button
                            onClick={() => {
                              setTargetBooking(b);
                              setShowReceiptModal(true);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] px-2.5 py-1.5 border border-slate-200 transition"
                            title="View Lab Booking Pass"
                          >
                            🎫 Pass
                          </button>

                          {/* Check-in button */}
                          {canCheckIn && (
                            <button
                              onClick={() => handleCheckIn(b._id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-2.5 py-1.5 transition shadow-xs"
                            >
                              ▶ Check-In
                            </button>
                          )}

                          {/* Check-out button */}
                          {canCheckOut && (
                            <button
                              onClick={() => handleOpenCheckOut(b)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] px-2.5 py-1.5 transition shadow-xs"
                            >
                              ⏹ Complete & Return
                            </button>
                          )}

                          {/* Cancel button */}
                          {canCancel && (
                            <button
                              onClick={() => handleCancelBooking(b._id)}
                              className="bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-[11px] px-2.5 py-1.5 border border-red-200 transition"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SUPERVISOR APPROVALS QUEUE                                         */}
      {/* ========================================================================= */}
      {activeTab === 'approvals' && isFacultyOrAdmin && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Student Equipment Booking Requests ({pendingApprovals.length} Pending)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review student laboratory experiment proposals, verify equipment safety requirements, and approve or reject reservation slots.
                </p>
              </div>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 p-8 text-center text-emerald-800">
                <span className="text-3xl">🎉</span>
                <h3 className="text-sm font-bold mt-2">All Caught Up!</h3>
                <p className="text-xs text-emerald-600 mt-0.5">There are no pending equipment booking requests requiring approval at this time.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.map((b) => (
                  <div
                    key={b._id}
                    className="border border-slate-200 bg-white p-5 shadow-xs flex flex-col lg:flex-row justify-between gap-4 items-start lg:items-center"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-200">
                          {b.bookingReference}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{b.resource?.name}</span>
                        <span className="text-xs text-slate-500">📍 {b.resource?.labRoom}</span>
                      </div>

                      <div className="text-xs text-slate-700">
                        <strong>Student:</strong> {b.user?.name} ({b.user?.email}) · ID: {b.user?.studentId || 'N/A'}
                      </div>

                      <div className="bg-slate-50 border border-slate-200 p-3 text-xs space-y-1">
                        <p className="font-semibold text-slate-800">Experiment Purpose & Methodology:</p>
                        <p className="text-slate-600 italic leading-relaxed">{b.purpose}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                        <span>📅 Slot: <strong>{new Date(b.startTime).toLocaleString()}</strong> to <strong>{new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                        <span>⏱️ Duration: <strong>{b.durationHours} Hours</strong></span>
                        <span className="text-emerald-700 font-semibold">✓ Safety Agreement Confirmed</span>
                      </div>
                    </div>

                    <div className="flex sm:flex-row lg:flex-col gap-2 w-full lg:w-auto">
                      <button
                        onClick={() => handleOpenApproval(b, 'approved')}
                        className="flex-1 lg:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 transition shadow-xs"
                      >
                        ✓ Approve Booking
                      </button>
                      <button
                        onClick={() => handleOpenApproval(b, 'rejected')}
                        className="flex-1 lg:flex-initial bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold px-4 py-2 transition"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: LAB UTILIZATION & ANALYTICS                                       */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Utilization Rate</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-blue-600">{analytics.summary.utilizationRate}%</span>
                <span className="text-xs text-slate-500">active usage</span>
              </div>
              <div className="w-full bg-slate-100 h-2 mt-3 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, analytics.summary.utilizationRate)}%` }}
                />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Bookings Processed</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-slate-900">{analytics.summary.totalBookings}</span>
                <span className="text-xs text-slate-500">sessions</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-3">
                ✓ {analytics.summary.completedBookings} successfully completed
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Available Hardware</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-emerald-700">{analytics.summary.availableResources}</span>
                <span className="text-xs text-slate-500">of {analytics.summary.totalResources} instruments</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-3">
                {analytics.summary.maintenanceResources} units under maintenance
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Review</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-amber-600">{analytics.summary.pendingBookings}</span>
                <span className="text-xs text-slate-500">requests</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-3">
                {analytics.summary.approvedBookings} approved & scheduled
              </p>
            </div>
          </div>

          {/* Breakdown Charts & Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Utilized Equipment */}
            <div className="bg-white border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                🏆 Top Utilized Lab Instruments
              </h3>
              <div className="divide-y divide-slate-100">
                {analytics.topEquipment.map((eq, idx) => (
                  <div key={eq._id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">{eq.name}</p>
                        <p className="text-slate-500 text-[11px]">{eq.labName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-blue-700">{eq.totalBookingsCount} bookings</span>
                      <p className="text-[11px] text-slate-500">{eq.totalUsageHours} usage hrs</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lab Facility Breakdown */}
            <div className="bg-white border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                🏛️ Usage by Laboratory Facility
              </h3>
              <div className="space-y-3">
                {analytics.labStats.map((lab) => (
                  <div key={lab._id} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800">{lab._id}</span>
                      <span className="text-slate-600 font-mono">{lab.totalBookings} bookings ({lab.count} units)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(15, (lab.totalBookings / (analytics.summary.totalBookings || 1)) * 100))}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: INVENTORY & MAINTENANCE MANAGEMENT (SUPERVISOR/ADMIN)               */}
      {/* ========================================================================= */}
      {activeTab === 'manage' && isFacultyOrAdmin && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 p-6 shadow-sm overflow-x-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Lab Equipment & Resource Management</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update hardware operational status, toggle scheduled maintenance mode, configure specifications, or decommission assets.
                </p>
              </div>
              <button
                onClick={() => {
                  setResourceForm({
                    name: '', category: 'computing_gpu', resourceType: 'equipment',
                    labName: 'AI & High-Performance Computing Lab', labRoom: 'UB20401',
                    modelNumber: '', assetTag: `BRACU-EQ-${Math.floor(100 + Math.random() * 900)}`,
                    description: '', specs: '', imageUrl: '', status: 'available',
                    isRequiresApproval: true, maxBookingHours: 8, capacity: 1, safetyGuidelines: ''
                  });
                  setShowAddResourceModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 transition flex items-center gap-1.5 shadow-sm"
              >
                <IconPlus className="w-4 h-4" />
                Add Equipment
              </button>
            </div>

            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 uppercase text-[10px] tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Equipment & Model</th>
                  <th className="px-4 py-3">Laboratory & Location</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Operational Status</th>
                  <th className="px-4 py-3">Usage Stats</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {resources.map((res) => (
                  <tr key={res._id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <p>{res.name}</p>
                      <p className="text-[11px] font-mono text-slate-500 font-normal">
                        Tag: {res.assetTag || 'N/A'} · Model: {res.modelNumber || 'N/A'}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{res.labName}</p>
                      <p className="text-[11px] text-slate-500">{res.labRoom}</p>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-[11px] font-medium text-slate-700">
                        {CATEGORY_MAP[res.category]?.label || res.category}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold border ${STATUS_BADGE[res.status]?.color}`}>
                        {STATUS_BADGE[res.status]?.label}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                      {res.totalBookingsCount} bookings · {res.totalUsageHours}h
                    </td>

                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleMaintenance(res)}
                        className={`text-[11px] font-semibold px-2.5 py-1 border transition ${
                          res.status === 'maintenance'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {res.status === 'maintenance' ? 'Set Available' : 'Set Maintenance'}
                      </button>

                      <button
                        onClick={() => {
                          setResourceForm({
                            _id: res._id,
                            name: res.name,
                            category: res.category,
                            resourceType: res.resourceType,
                            labName: res.labName,
                            labRoom: res.labRoom,
                            modelNumber: res.modelNumber,
                            assetTag: res.assetTag,
                            description: res.description,
                            specs: res.specs ? Object.entries(res.specs).map(([k, v]) => `${k}: ${v}`).join('\n') : '',
                            imageUrl: res.imageUrl || '',
                            status: res.status,
                            isRequiresApproval: res.isRequiresApproval,
                            maxBookingHours: res.maxBookingHours,
                            capacity: res.capacity,
                            safetyGuidelines: Array.isArray(res.safetyGuidelines) ? res.safetyGuidelines.join('\n') : ''
                          });
                          setShowAddResourceModal(true);
                        }}
                        className="text-[11px] font-semibold px-2.5 py-1 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: RESERVE EQUIPMENT MODAL                                          */}
      {/* ========================================================================= */}
      {showReserveModal && selectedResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowReserveModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 font-bold text-lg"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🔬</span>
              <h2 className="text-lg font-bold text-slate-900">Reserve Laboratory Equipment</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Submit your experimental session request. Conflicts will be automatically checked.
            </p>

            {/* Selected Resource Card */}
            <div className="bg-slate-50 border border-slate-200 p-3.5 mb-4 flex items-start gap-3">
              <div className="w-12 h-12 bg-blue-100 flex items-center justify-center text-xl shrink-0">
                {CATEGORY_MAP[selectedResource.category]?.icon || '🔬'}
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-900">{selectedResource.name}</p>
                <p className="text-slate-500 font-medium">📍 {selectedResource.labName} ({selectedResource.labRoom})</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Max Booking Limit: <strong>{selectedResource.maxBookingHours} Hours</strong> ·
                  Approval: <strong>{selectedResource.isRequiresApproval ? 'Supervisor Review Required' : 'Instant Auto-Approve'}</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleReserveSubmit} className="space-y-4 text-xs">
              {/* Linked Thesis Project */}
              {userProposals.length > 0 && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Link to Thesis / Research Project
                  </label>
                  <select
                    value={reserveForm.proposalId}
                    onChange={(e) => setReserveForm({ ...reserveForm, proposalId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-blue-600 bg-white font-medium"
                  >
                    <option value="">-- Standalone Experiment / Independent Research --</option>
                    {userProposals.map(p => (
                      <option key={p._id} value={p._id}>🎓 {p.title} ({p.status})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date & Time Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Reservation Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={reserveForm.bookingDate}
                    onChange={(e) => setReserveForm({ ...reserveForm, bookingDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-blue-600 bg-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={reserveForm.startTime}
                    onChange={(e) => setReserveForm({ ...reserveForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-blue-600 bg-white font-semibold"
                  >
                    {TIME_SLOTS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={reserveForm.endTime}
                    onChange={(e) => setReserveForm({ ...reserveForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-blue-600 bg-white font-semibold"
                  >
                    {TIME_SLOTS.concat(['22:00']).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Purpose & Experiment Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Experiment Objective & Purpose <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={reserveForm.purpose}
                  onChange={(e) => setReserveForm({ ...reserveForm, purpose: e.target.value })}
                  placeholder="Describe your research experiment, dataset size, software tools, or hardware requirements..."
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
                />
              </div>

              {/* Safety Guidelines Acceptance */}
              {selectedResource.safetyGuidelines?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-3 space-y-1.5">
                  <p className="font-bold text-amber-900">⚠️ Mandatory Lab Safety Protocols:</p>
                  <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5">
                    {selectedResource.safetyGuidelines.map((guideline, idx) => (
                      <li key={idx}>{guideline}</li>
                    ))}
                  </ul>
                  <label className="flex items-center gap-2 pt-1 font-semibold text-amber-950 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={reserveForm.safetyAccepted}
                      onChange={(e) => setReserveForm({ ...reserveForm, safetyAccepted: e.target.checked })}
                      className="accent-blue-600"
                    />
                    I acknowledge that I have completed the safety orientation and will follow all lab protocols.
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowReserveModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 shadow-sm"
                >
                  Confirm Reservation Request →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TECHNICAL SPECS MODAL                                            */}
      {/* ========================================================================= */}
      {showSpecsModal && selectedResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto space-y-4">
            <button
              onClick={() => setShowSpecsModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 font-bold text-lg"
            >
              ✕
            </button>

            <div className="flex items-start gap-4">
              {selectedResource.imageUrl && (
                <img
                  src={selectedResource.imageUrl}
                  alt={selectedResource.name}
                  className="w-24 h-24 object-cover border border-slate-200 shrink-0"
                />
              )}
              <div>
                <span className={`text-[10px] font-bold px-2 py-0.5 border ${CATEGORY_MAP[selectedResource.category]?.color}`}>
                  {CATEGORY_MAP[selectedResource.category]?.icon} {CATEGORY_MAP[selectedResource.category]?.label}
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-1">{selectedResource.name}</h2>
                <p className="text-xs text-slate-500 font-medium">
                  📍 {selectedResource.labName} ({selectedResource.labRoom}) · Asset Tag: <strong className="font-mono text-slate-700">{selectedResource.assetTag}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 border border-slate-200">
              {selectedResource.description || 'University research instrument supporting graduate and undergraduate research experiments.'}
            </p>

            {/* Specifications Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">Technical Specifications</h4>
              {selectedResource.specs && Object.keys(selectedResource.specs).length > 0 ? (
                <div className="border border-slate-200 divide-y divide-slate-100 text-xs">
                  {Object.entries(selectedResource.specs).map(([key, val]) => (
                    <div key={key} className="flex py-2 px-3 justify-between bg-white hover:bg-slate-50">
                      <span className="font-semibold text-slate-700">{key}</span>
                      <span className="font-mono text-slate-900">{val}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No detailed specifications listed.</p>
              )}
            </div>

            {/* Safety Guidelines */}
            {selectedResource.safetyGuidelines?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">Safety Protocols & Guidelines</h4>
                <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 bg-amber-50/60 border border-amber-200 p-3">
                  {selectedResource.safetyGuidelines.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <span className="text-xs text-slate-500 font-mono">
                Total usage: {selectedResource.totalUsageHours || 0} hrs across {selectedResource.totalBookingsCount || 0} reservations
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSpecsModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowSpecsModal(false);
                    handleOpenReserve(selectedResource);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 shadow-xs"
                >
                  Book This Equipment →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CHECK-OUT / RETURN CONDITION MODAL                               */}
      {/* ========================================================================= */}
      {showCheckInOutModal && targetBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md shadow-2xl p-6 relative">
            <button
              onClick={() => setShowCheckInOutModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 font-bold text-lg"
            >
              ✕
            </button>

            <h2 className="text-base font-bold text-slate-900 mb-1">Equipment Return & Check-Out</h2>
            <p className="text-xs text-slate-500 mb-4">
              Log equipment physical condition and conclude laboratory reservation session.
            </p>

            <form onSubmit={handleCheckOutSubmit} className="space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 p-3">
                <p className="font-bold text-slate-900">{targetBooking.resource?.name}</p>
                <p className="text-slate-500 font-mono text-[11px]">Ref: {targetBooking.bookingReference}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Condition on Return / Handover Notes
                </label>
                <textarea
                  rows={3}
                  required
                  value={checkOutCondition}
                  onChange={(e) => setCheckOutCondition(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCheckInOutModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 shadow-xs"
                >
                  Confirm Check-Out & Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: SUPERVISOR APPROVAL DECISION MODAL                               */}
      {/* ========================================================================= */}
      {showApprovalModal && targetBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md shadow-2xl p-6 relative">
            <button
              onClick={() => setShowApprovalModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 font-bold text-lg"
            >
              ✕
            </button>

            <h2 className="text-base font-bold text-slate-900 mb-1">
              {approvalDecision.status === 'approved' ? '✓ Approve Equipment Booking' : '✕ Reject Equipment Booking'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Provide feedback or operational guidelines for the student.
            </p>

            <form onSubmit={handleApprovalSubmit} className="space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 p-3 space-y-1">
                <p className="font-bold text-slate-900">{targetBooking.resource?.name}</p>
                <p className="text-slate-600">Student: <strong>{targetBooking.user?.name}</strong></p>
                <p className="text-slate-500 font-mono text-[11px]">
                  {new Date(targetBooking.startTime).toLocaleString()} ({targetBooking.durationHours}h)
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reviewer Notes / Instructions for Student
                </label>
                <textarea
                  rows={3}
                  value={approvalDecision.notes}
                  onChange={(e) => setApprovalDecision({ ...approvalDecision, notes: e.target.value })}
                  placeholder="Enter approval guidelines or reason for rejection..."
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`font-bold px-4 py-2 text-white shadow-xs ${
                    approvalDecision.status === 'approved'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Submit Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: DIGITAL BOOKING RECEIPT / LAB PASS                                */}
      {/* ========================================================================= */}
      {showReceiptModal && targetBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border-2 border-slate-900 w-full max-w-lg shadow-2xl p-6 relative">
            <button
              onClick={() => setShowReceiptModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 font-bold text-lg print:hidden"
            >
              ✕
            </button>

            {/* Pass Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                  BRAC University ResearchHub
                </span>
                <h2 className="text-lg font-black text-slate-900">LABORATORY ACCESS PASS</h2>
              </div>
              <div className="text-right font-mono text-xs">
                <span className="bg-slate-900 text-white px-2.5 py-1 font-bold">
                  {targetBooking.bookingReference}
                </span>
              </div>
            </div>

            {/* Pass Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-200 pb-4 mb-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Authorized Researcher</p>
                <p className="font-bold text-slate-900 mt-0.5">{targetBooking.user?.name}</p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {targetBooking.user?.studentId ? `ID: ${targetBooking.user.studentId}` : targetBooking.user?.email}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Supervising Faculty</p>
                <p className="font-bold text-slate-900 mt-0.5">
                  {targetBooking.supervisor?.name || 'Department Academic Committee'}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Equipment / Facility</p>
                <p className="font-bold text-slate-900 mt-0.5">{targetBooking.resource?.name}</p>
                <p className="text-[11px] text-slate-500">
                  📍 {targetBooking.resource?.labName} ({targetBooking.resource?.labRoom})
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Authorization Status</p>
                <span className={`inline-block mt-0.5 px-2 py-0.5 font-bold text-[10px] border ${BOOKING_STATUS_BADGE[targetBooking.status]?.color}`}>
                  {BOOKING_STATUS_BADGE[targetBooking.status]?.label}
                </span>
              </div>
            </div>

            {/* Time Slot Window */}
            <div className="bg-slate-50 border border-slate-200 p-3 mb-4 text-xs font-mono">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Scheduled Access Window</p>
              <div className="flex justify-between text-slate-900 font-bold">
                <span>Start: {new Date(targetBooking.startTime).toLocaleString()}</span>
                <span>End: {new Date(targetBooking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-slate-500 text-[11px] mt-1 font-sans">
                Purpose: {targetBooking.purpose}
              </p>
            </div>

            {/* Pass Actions Footer */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-[10px] text-slate-400 font-mono">Valid on photo ID verification</span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 transition"
                >
                  🖨️ Print Pass
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="border border-slate-300 text-slate-700 font-semibold text-xs px-4 py-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: REGISTER / EDIT LAB EQUIPMENT                                    */}
      {/* ========================================================================= */}
      {showAddResourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddResourceModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 font-bold text-lg"
            >
              ✕
            </button>

            <h2 className="text-base font-bold text-slate-900 mb-1">
              {resourceForm._id ? 'Edit Lab Equipment' : 'Register New Lab Equipment'}
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Add specialized university hardware, robotics workstations, or test instruments.
            </p>

            {/* Quick Presets */}
            {!resourceForm._id && (
              <div className="bg-slate-50 border border-slate-200 p-2.5 mb-3 text-[11px]">
                <p className="font-bold text-slate-600 mb-1.5 uppercase tracking-wider text-[10px]">✨ Quick Fill Presets:</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setResourceForm({
                        name: 'Universal Robots UR5e 6-DOF Collaborative Robotic Arm',
                        category: 'robotics_automation',
                        resourceType: 'equipment',
                        labName: 'Robotics & Autonomous Systems Lab',
                        labRoom: 'CSE 5th Floor - Robotics Bay A',
                        modelNumber: 'UR5e-CB5',
                        assetTag: `BRACU-ROB-${Math.floor(100 + Math.random() * 900)}`,
                        description: 'Collaborative robot arm for trajectory planning, pick-and-place, and MoveIt research.',
                        specs: 'Degrees of Freedom: 6 Rotating Joints\nPayload: 5 kg\nReach Radius: 850 mm\nRepeatability: ±0.03 mm\nStack: ROS 2 Humble / MoveIt 2',
                        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
                        status: 'available',
                        isRequiresApproval: true,
                        maxBookingHours: 6,
                        capacity: 1,
                        safetyGuidelines: 'Hold e-stop pendant during first trajectory\nStay clear of 850mm reach radius'
                      });
                    }}
                    className="bg-white border border-purple-300 text-purple-700 px-2 py-0.5 font-semibold hover:bg-purple-50 transition"
                  >
                    🤖 UR5e Robotic Arm
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResourceForm({
                        name: 'TurtleBot 4 Autonomous Mobile Robot (SLAM & Nav2)',
                        category: 'robotics_automation',
                        resourceType: 'equipment',
                        labName: 'Robotics & Autonomous Systems Lab',
                        labRoom: 'CSE 5th Floor - Autonomous Rover Arena',
                        modelNumber: 'TB4-PRO',
                        assetTag: `BRACU-ROB-${Math.floor(100 + Math.random() * 900)}`,
                        description: 'Mobile robot with RPLIDAR and OAK-D camera for SLAM navigation.',
                        specs: 'Base: iRobot Create 3\nSensors: 2D LiDAR, OAK-D-PRO AI Camera\nCompute: Raspberry Pi 4B\nRuntime: 3 hours',
                        imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
                        status: 'available',
                        isRequiresApproval: false,
                        maxBookingHours: 4,
                        capacity: 2,
                        safetyGuidelines: 'Operate within designated robotics bay perimeter'
                      });
                    }}
                    className="bg-white border border-blue-300 text-blue-700 px-2 py-0.5 font-semibold hover:bg-blue-50 transition"
                  >
                    🚗 TurtleBot 4 Rover
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResourceForm({
                        name: 'Vicon 8-Camera Optical Motion Capture & Drone Arena',
                        category: 'lab_space',
                        resourceType: 'lab_space',
                        labName: 'Robotics & Autonomous Systems Lab',
                        labRoom: 'CSE 5th Floor - MoCap Flight Arena',
                        modelNumber: 'VICON-V5',
                        assetTag: `BRACU-ROB-${Math.floor(100 + Math.random() * 900)}`,
                        description: 'Enclosed 6m x 6m netted flight cage for millimeter drone and ground robot tracking.',
                        specs: 'Cameras: 8x Vicon Vantage V5 (420 FPS)\nAccuracy: < 0.1 mm Sub-Millimeter\nVolume: 6m x 6m x 3.5m flight cage\nBridge: ROS 2 Vicon Bridge',
                        imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&auto=format&fit=crop&q=80',
                        status: 'available',
                        isRequiresApproval: true,
                        maxBookingHours: 4,
                        capacity: 1,
                        safetyGuidelines: 'Latch safety netting before arming drone motors\nWear protective safety glasses'
                      });
                    }}
                    className="bg-white border border-emerald-300 text-emerald-700 px-2 py-0.5 font-semibold hover:bg-emerald-50 transition"
                  >
                    🎥 MoCap Flight Arena
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveResource} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Equipment / Resource Name *</label>
                <input
                  type="text"
                  required
                  value={resourceForm.name}
                  onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
                  placeholder="e.g., NVIDIA DGX A100 High-Performance GPU Cluster"
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={resourceForm.category}
                    onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-blue-600 bg-white font-medium"
                  >
                    {Object.entries(CATEGORY_MAP).map(([key, cat]) => (
                      <option key={key} value={key}>{cat.icon} {cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Operational Status</label>
                  <select
                    value={resourceForm.status}
                    onChange={(e) => setResourceForm({ ...resourceForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-blue-600 bg-white font-medium"
                  >
                    <option value="available">🟢 Available Now</option>
                    <option value="maintenance">🟠 Under Maintenance</option>
                    <option value="in_use">🔵 In Use</option>
                    <option value="decommissioned">⚪ Decommissioned</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lab Facility Name *</label>
                  <input
                    type="text"
                    required
                    value={resourceForm.labName}
                    onChange={(e) => setResourceForm({ ...resourceForm, labName: e.target.value })}
                    placeholder="e.g., AI & HPC Lab"
                    className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Room / Location *</label>
                  <input
                    type="text"
                    required
                    value={resourceForm.labRoom}
                    onChange={(e) => setResourceForm({ ...resourceForm, labRoom: e.target.value })}
                    placeholder="e.g., UB20401 - Room A"
                    className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Asset Tag</label>
                  <input
                    type="text"
                    value={resourceForm.assetTag}
                    onChange={(e) => setResourceForm({ ...resourceForm, assetTag: e.target.value })}
                    placeholder="e.g., BRACU-HPC-001"
                    className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-blue-600 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Duration (Hours)</label>
                  <input
                    type="number"
                    min={1}
                    max={72}
                    value={resourceForm.maxBookingHours}
                    onChange={(e) => setResourceForm({ ...resourceForm, maxBookingHours: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-blue-600 bg-white font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={resourceForm.description}
                  onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                  placeholder="Overview of research capabilities and thesis applications..."
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Specifications (Key: Value pairs, one per line)
                </label>
                <textarea
                  rows={3}
                  value={resourceForm.specs}
                  onChange={(e) => setResourceForm({ ...resourceForm, specs: e.target.value })}
                  placeholder="GPUs: 4x A100 80GB&#10;CPU: AMD EPYC 7742&#10;RAM: 512GB DDR4"
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-blue-600 bg-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  value={resourceForm.imageUrl}
                  onChange={(e) => setResourceForm({ ...resourceForm, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="requiresApproval"
                  checked={resourceForm.isRequiresApproval}
                  onChange={(e) => setResourceForm({ ...resourceForm, isRequiresApproval: e.target.checked })}
                  className="accent-blue-600"
                />
                <label htmlFor="requiresApproval" className="font-semibold text-slate-700 cursor-pointer">
                  Requires supervisor/manager approval prior to slot confirmation
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddResourceModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 shadow-xs"
                >
                  {resourceForm._id ? 'Save Changes' : 'Register Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentBooking;
