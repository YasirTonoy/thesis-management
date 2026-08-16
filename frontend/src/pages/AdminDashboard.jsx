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
      alert('Supervisor assigned successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error assigning supervisor');
    }
  };

  const handleReassignSupervisor = async (id, data) => {
    try {
      await supervisionAPI.reassign(id, data);
      await fetchData();
      alert('Supervisor reassigned successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error reassigning supervisor');
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
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="w-10 h-1 bg-blue-600 mb-4" />
        <h1 className="text-2xl font-extrabold text-slate-900">
          System Administration
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Supervision Assignments & Academic Oversight</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Total Proposals</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalProposals}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Pending</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{stats.pendingProposals}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Approved</p>
          <p className="text-2xl font-black text-green-600 mt-1">{stats.approvedProposals}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Active Pairing</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{stats.activeSupervisions}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Milestones</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalMilestones}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Completed</p>
          <p className="text-2xl font-black text-green-600 mt-1">{stats.completedMilestones}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveTab('assign')}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wide border-b-2 transition-colors ${
            activeTab === 'assign'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Assign Supervisor
        </button>
        <button
          onClick={() => setActiveTab('reassign')}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wide border-b-2 transition-colors ${
            activeTab === 'reassign'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Reassign Supervisor
        </button>
        <button
          onClick={() => setActiveTab('supervisions')}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wide border-b-2 transition-colors ${
            activeTab === 'supervisions'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          All Supervisions
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'assign' && (
        <div className="bg-white border border-slate-200 p-6 shadow-sm max-w-2xl">
          <h2 className="text-base font-bold text-slate-900 mb-4">Assign Supervisor to Approved Student</h2>
          <AssignSupervisorForm 
            onSubmit={handleAssignSupervisor} 
            type="assign"
            supervisions={supervisions}
          />
        </div>
      )}

      {activeTab === 'reassign' && (
        <div className="bg-white border border-slate-200 p-6 shadow-sm max-w-2xl">
          <h2 className="text-base font-bold text-slate-900 mb-4">Reassign Supervisor</h2>
          <AssignSupervisorForm 
            onSubmit={handleReassignSupervisor} 
            type="reassign"
            supervisions={supervisions.filter(s => s.isActive)}
          />
        </div>
      )}

      {activeTab === 'supervisions' && (
        <div className="bg-white border border-slate-200 p-6 shadow-sm overflow-x-auto space-y-4">
          <h2 className="text-base font-bold text-slate-900">All Supervision Records</h2>
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 uppercase text-[10px] tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Supervisor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {supervisions.map((s) => (
                <tr key={s._id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900">{s.student?.name}</p>
                    <p className="text-xs text-slate-500">{s.student?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900">{s.supervisor?.name}</p>
                    <p className="text-xs text-slate-500">{s.supervisor?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 text-[10px] font-semibold border ${
                      s.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
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