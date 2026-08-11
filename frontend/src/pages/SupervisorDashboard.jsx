import React, { useState, useEffect } from 'react';
import { proposalAPI, milestoneAPI, supervisionAPI } from '../api';
import ProposalList from '../components/ProposalList';
import MilestoneList from '../components/MilestoneList';

const SupervisorDashboard = () => {
  const [user, setUser] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('proposals');
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    supervisionId: '',
    title: '',
    description: '',
    dueDate: ''
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [proposalsRes, milestonesRes, supervisionRes] = await Promise.all([
        proposalAPI.getAll(),
        milestoneAPI.getAll(),
        supervisionAPI.getAll({ active: true })
      ]);
      
      setProposals(proposalsRes.data.data || []);
      setMilestones(milestonesRes.data.data || []);
      setStudents(supervisionRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const handleProposalReview = async (proposalId, status, feedback) => {
    try {
      await proposalAPI.review(proposalId, { status, feedback });
      await fetchData();
      alert(`✅ Proposal ${status} successfully!`);
    } catch (error) {
      alert(error.response?.data?.message || '❌ Error reviewing proposal');
    }
  };

  const handleMilestoneReview = async (milestoneId, status, feedback) => {
    try {
      await milestoneAPI.review(milestoneId, { status, feedback });
      await fetchData();
      alert(`✅ Milestone ${status} successfully!`);
    } catch (error) {
      alert(error.response?.data?.message || '❌ Error reviewing milestone');
    }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    try {
      await milestoneAPI.create(newMilestone);
      await fetchData();
      setShowMilestoneModal(false);
      setNewMilestone({ supervisionId: '', title: '', description: '', dueDate: '' });
      alert('✅ Milestone created successfully!');
    } catch (error) {
      alert(error.response?.data?.message || '❌ Error creating milestone');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500/20 border-t-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="backdrop-blur-xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-slate-800/80 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-2xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome back, {user?.name || 'Supervisor'} 👨‍🏫
          </h1>
          <p className="text-slate-400 text-sm mt-1">Supervisor Supervision & Milestone Control Center</p>
        </div>
        <button
          onClick={() => setShowMilestoneModal(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl transition duration-200 shadow-lg shadow-blue-500/20 text-xs flex items-center space-x-2"
        >
          <span>+ Create Milestone</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-3 border-b border-slate-800/80 pb-3">
        <button
          onClick={() => setActiveTab('proposals')}
          className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition duration-200 flex items-center space-x-2 ${
            activeTab === 'proposals'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/60'
          }`}
        >
          <span>📝 Proposal Requests</span>
          <span className="bg-slate-950/60 px-2 py-0.5 rounded-md text-[10px]">
            {proposals.filter(p => p.status === 'pending').length} pending
          </span>
        </button>
        <button
          onClick={() => setActiveTab('milestones')}
          className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition duration-200 flex items-center space-x-2 ${
            activeTab === 'milestones'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/60'
          }`}
        >
          <span>🎯 Student Milestones</span>
          <span className="bg-slate-950/60 px-2 py-0.5 rounded-md text-[10px]">
            {milestones.filter(m => m.status === 'submitted').length} pending
          </span>
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition duration-200 flex items-center space-x-2 ${
            activeTab === 'students'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/60'
          }`}
        >
          <span>👨‍🎓 Supervised Students</span>
          <span className="bg-slate-950/60 px-2 py-0.5 rounded-md text-[10px]">{students.length}</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'proposals' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-200">Proposals Awaiting Evaluation</h2>
          <ProposalList 
            proposals={proposals.filter(p => p.status === 'pending')} 
            onReview={handleProposalReview}
            role="supervisor"
          />
        </div>
      )}

      {activeTab === 'milestones' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-200">Milestones Under Review</h2>
          <MilestoneList 
            milestones={milestones} 
            onMilestoneReview={handleMilestoneReview}
            role="supervisor"
          />
        </div>
      )}

      {activeTab === 'students' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-200">Assigned Student Roster</h2>
          {students.length === 0 ? (
            <p className="text-slate-400 text-sm italic">No students currently assigned under your supervision.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((s) => (
                <div key={s._id} className="backdrop-blur-xl bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-lg space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white">
                      {s.student?.name ? s.student.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100">{s.student?.name}</h3>
                      <p className="text-xs text-slate-400">{s.student?.email}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex justify-between">
                    <span>Department: {s.student?.department || 'CSE'}</span>
                    <span>Assigned: {new Date(s.assignmentDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-white">Create Student Milestone</h2>
            <form onSubmit={handleCreateMilestone} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Select Student</label>
                <select
                  value={newMilestone.supervisionId}
                  onChange={(e) => setNewMilestone({ ...newMilestone, supervisionId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="">Select student...</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.student?.name} ({s.student?.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Milestone Title</label>
                <input
                  type="text"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g., Sprint 1 Progress Report"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                  rows="3"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="Deliverables and expectations..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Due Date</label>
                <input
                  type="datetime-local"
                  value={newMilestone.dueDate}
                  onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 rounded-xl transition"
                >
                  Create Milestone
                </button>
                <button
                  type="button"
                  onClick={() => setShowMilestoneModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2.5 rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorDashboard;