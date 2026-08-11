import React, { useState, useEffect } from 'react';
import { supervisionAPI, proposalAPI, milestoneAPI } from '../api';
import AssignSupervisorForm from '../components/AssignSupervisorForm';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [supervisions, setSupervisions] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assign');

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
      const [supervisionRes, proposalRes, milestoneRes] = await Promise.all([
        supervisionAPI.getAll(),
        proposalAPI.getAll(),
        milestoneAPI.getAll()
      ]);
      
      setSupervisions(supervisionRes.data.data || []);
      setProposals(proposalRes.data.data || []);
      setMilestones(milestoneRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const handleAssignSupervisor = async (data) => {
    try {
      await supervisionAPI.assign(data);
      await fetchData();
      alert('✅ Supervisor assigned successfully!');
    } catch (error) {
      alert(error.response?.data?.message || '❌ Error assigning supervisor');
    }
  };

  const handleReassignSupervisor = async (id, data) => {
    try {
      await supervisionAPI.reassign(id, data);
      await fetchData();
      alert('✅ Supervisor reassigned successfully!');
    } catch (error) {
      alert(error.response?.data?.message || '❌ Error reassigning supervisor');
    }
  };

  const stats = {
    totalProposals: proposals.length,
    pendingProposals: proposals.filter(p => p.status === 'pending').length,
    approvedProposals: proposals.filter(p => p.status === 'approved').length,
    totalMilestones: milestones.length,
    completedMilestones: milestones.filter(m => m.status === 'approved').length,
    activeSupervisions: supervisions.filter(s => s.isActive).length
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500/20 border-t-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="backdrop-blur-xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900 border border-slate-800/80 rounded-3xl p-6 sm:p-8 flex justify-between items-center shadow-2xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            System Administration 👑
          </h1>
          <p className="text-slate-400 text-sm mt-1">Supervision Assignments & Academic Oversight</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="backdrop-blur-xl bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl">
          <p className="text-xs font-semibold text-slate-400">Total Proposals</p>
          <p className="text-2xl font-black text-blue-400 mt-1">{stats.totalProposals}</p>
        </div>
        <div className="backdrop-blur-xl bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl">
          <p className="text-xs font-semibold text-slate-400">Pending</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{stats.pendingProposals}</p>
        </div>
        <div className="backdrop-blur-xl bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl">
          <p className="text-xs font-semibold text-slate-400">Approved</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{stats.approvedProposals}</p>
        </div>
        <div className="backdrop-blur-xl bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl">
          <p className="text-xs font-semibold text-slate-400">Active Pairing</p>
          <p className="text-2xl font-black text-purple-400 mt-1">{stats.activeSupervisions}</p>
        </div>
        <div className="backdrop-blur-xl bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl">
          <p className="text-xs font-semibold text-slate-400">Milestones</p>
          <p className="text-2xl font-black text-cyan-400 mt-1">{stats.totalMilestones}</p>
        </div>
        <div className="backdrop-blur-xl bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl">
          <p className="text-xs font-semibold text-slate-400">Completed</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{stats.completedMilestones}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-3 border-b border-slate-800/80 pb-3">
        <button
          onClick={() => setActiveTab('assign')}
          className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition duration-200 ${
            activeTab === 'assign'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/60'
          }`}
        >
          👤 Assign Supervisor
        </button>
        <button
          onClick={() => setActiveTab('reassign')}
          className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition duration-200 ${
            activeTab === 'reassign'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/60'
          }`}
        >
          🔄 Reassign Supervisor
        </button>
        <button
          onClick={() => setActiveTab('supervisions')}
          className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition duration-200 ${
            activeTab === 'supervisions'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/60'
          }`}
        >
          📋 All Supervisions
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'assign' && (
        <div className="backdrop-blur-xl bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 shadow-xl max-w-2xl">
          <h2 className="text-lg font-bold text-white mb-4">Assign Supervisor to Approved Student</h2>
          <AssignSupervisorForm 
            onSubmit={handleAssignSupervisor} 
            type="assign"
            supervisions={supervisions}
          />
        </div>
      )}

      {activeTab === 'reassign' && (
        <div className="backdrop-blur-xl bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 shadow-xl max-w-2xl">
          <h2 className="text-lg font-bold text-white mb-4">Reassign Supervisor</h2>
          <AssignSupervisorForm 
            onSubmit={handleReassignSupervisor} 
            type="reassign"
            supervisions={supervisions.filter(s => s.isActive)}
          />
        </div>
      )}

      {activeTab === 'supervisions' && (
        <div className="backdrop-blur-xl bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 shadow-xl overflow-x-auto space-y-4">
          <h2 className="text-lg font-bold text-white">All Supervision Records</h2>
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Supervisor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {supervisions.map((s) => (
                <tr key={s._id} className="hover:bg-slate-950/40 transition">
                  <td className="px-4 py-3">
                    <p className="font-bold text-white">{s.student?.name}</p>
                    <p className="text-[11px] text-slate-500">{s.student?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-white">{s.supervisor?.name}</p>
                    <p className="text-[11px] text-slate-500">{s.supervisor?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      s.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(s.assignmentDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;