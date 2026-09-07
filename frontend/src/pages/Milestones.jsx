import React, { useState, useEffect } from 'react';
import { milestoneAPI, supervisionAPI } from '../api';
import MilestoneList from '../components/MilestoneList';

const Milestones = () => {
  const [user, setUser] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [supervisions, setSupervisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create milestone modal (supervisor only)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    supervisionId: '',
    title: '',
    description: '',
    dueDate: ''
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [milestonesRes, supervisionRes] = await Promise.all([
        milestoneAPI.getAll(),
        supervisionAPI.getAll({ active: true })
      ]);
      setMilestones(milestonesRes.data.data || []);
      setSupervisions(supervisionRes.data.data || []);
      if (supervisionRes.data.data?.length > 0) {
        setCreateForm(f => ({ ...f, supervisionId: supervisionRes.data.data[0]._id }));
      }
    } catch (err) {
      console.error('Error fetching milestones:', err);
      setError('Failed to load milestones. Please try again.');
    }
    setLoading(false);
  };

  const handleMilestoneSubmit = async (milestoneId, comment) => {
    try {
      await milestoneAPI.submit(milestoneId, { submissionComment: comment });
      await fetchData();
      alert('Milestone submitted for review!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting milestone');
    }
  };

  const handleMilestoneReview = async (milestoneId, status, feedback) => {
    try {
      await milestoneAPI.review(milestoneId, { status, feedback });
      await fetchData();
      alert(`Milestone ${status} successfully!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Error reviewing milestone');
    }
  };

  const handleMilestoneDelete = async (milestoneId) => {
    try {
      await milestoneAPI.delete(milestoneId);
      await fetchData();
      alert('Milestone deleted successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting milestone');
    }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    if (!createForm.supervisionId || !createForm.title || !createForm.dueDate) {
      alert('Please fill in all required fields.');
      return;
    }
    setCreating(true);
    try {
      await milestoneAPI.create(createForm);
      setShowCreateModal(false);
      setCreateForm({ supervisionId: supervisions[0]?._id || '', title: '', description: '', dueDate: '' });
      await fetchData();
      alert('Milestone created successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating milestone');
    }
    setCreating(false);
  };

  const isSupervisor = user?.role === 'supervisor' || user?.role === 'admin';
  const pendingReview = milestones.filter(m => m.status === 'submitted').length;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-28">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-500">Loading milestones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-red-600 font-semibold mb-4">{error}</p>
        <button onClick={fetchData} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-sm font-semibold transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="w-10 h-1 bg-blue-600 mb-3" />
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🏁</span>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Project Milestones
              </h1>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              {isSupervisor
                ? 'Track student progress, assign new milestones, and review submissions.'
                : 'View your assigned milestones and submit work for supervisor review.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isSupervisor && pendingReview > 0 && (
              <span className="bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold px-3 py-1.5">
                ⏳ {pendingReview} pending review
              </span>
            )}
            {isSupervisor && (
              <button
                onClick={() => {
                  setCreateForm({ supervisionId: supervisions[0]?._id || '', title: '', description: '', dueDate: '' });
                  setShowCreateModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 transition-colors shadow-sm flex items-center gap-1.5"
              >
                + New Milestone
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: milestones.length, color: 'text-slate-900' },
          { label: 'Pending', value: milestones.filter(m => m.status === 'pending').length, color: 'text-amber-600' },
          { label: 'Submitted', value: milestones.filter(m => m.status === 'submitted').length, color: 'text-blue-600' },
          { label: 'Approved', value: milestones.filter(m => m.status === 'approved').length, color: 'text-green-600' }
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-slate-200 p-4 shadow-sm">
            <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Milestone List */}
      <MilestoneList
        milestones={milestones}
        onMilestoneSubmit={handleMilestoneSubmit}
        onMilestoneReview={handleMilestoneReview}
        onMilestoneDelete={handleMilestoneDelete}
        role={user?.role}
      />

      {/* Create Milestone Modal (Supervisor) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h2 className="font-bold text-lg text-slate-900">Create New Milestone</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold leading-none">×</button>
            </div>
            <form onSubmit={handleCreateMilestone} className="p-5 space-y-4">
              {supervisions.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Assign to Student</label>
                  <select
                    value={createForm.supervisionId}
                    onChange={e => setCreateForm(f => ({ ...f, supervisionId: e.target.value }))}
                    className="w-full border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500"
                    required
                  >
                    {supervisions.map(s => (
                      <option key={s._id} value={s._id}>
                        {s.student?.name || 'Student'} — {s.student?.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Milestone Title *</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Literature Review Submission"
                  className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe what needs to be done..."
                  rows={3}
                  className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Due Date *</label>
                <input
                  type="datetime-local"
                  value={createForm.dueDate}
                  onChange={e => setCreateForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 border border-slate-300 text-slate-700 font-semibold text-sm py-2 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2 transition-colors disabled:opacity-60"
                >
                  {creating ? 'Creating...' : 'Create Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Milestones;
