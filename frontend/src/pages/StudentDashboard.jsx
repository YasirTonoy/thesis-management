import React, { useState, useEffect } from 'react';
import { proposalAPI, milestoneAPI, supervisionAPI } from '../api';
import ProposalForm from '../components/ProposalForm';
import ProposalList from '../components/ProposalList';
import MilestoneList from '../components/MilestoneList';

const StudentDashboard = () => {
  const [user, setUser] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [supervision, setSupervision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('proposals');

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
      setSupervision(supervisionRes.data.data?.[0] || null);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const handleProposalSubmit = async (data) => {
    try {
      await proposalAPI.submit(data);
      await fetchData();
      alert('✅ Proposal submitted successfully!');
    } catch (error) {
      alert(error.response?.data?.message || '❌ Error submitting proposal');
    }
  };

  const handleProposalUpdate = async (id, data) => {
    try {
      await proposalAPI.update(id, data);
      await fetchData();
      alert('✅ Proposal updated successfully!');
    } catch (error) {
      alert(error.response?.data?.message || '❌ Error updating proposal');
    }
  };

  const handleMilestoneSubmit = async (milestoneId, comment) => {
    try {
      await milestoneAPI.submit(milestoneId, { submissionComment: comment });
      await fetchData();
      alert('✅ Milestone submitted for review!');
    } catch (error) {
      alert(error.response?.data?.message || '❌ Error submitting milestone');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500/20 border-t-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Greeting Banner */}
      <div className="backdrop-blur-xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-slate-800/80 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-2xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome back, {user?.name || 'Student'} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">Student Academic Portal & Milestone Tracker</p>
        </div>
        {supervision ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 rounded-2xl flex items-center space-x-2 text-xs font-semibold">
            <span>👨‍🏫 Assigned Supervisor:</span>
            <span className="text-white font-bold">{supervision.supervisor?.name}</span>
          </div>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-2.5 rounded-2xl flex items-center space-x-2 text-xs font-semibold">
            <span>⏳ Status:</span>
            <span>Awaiting Supervisor Assignment</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-3 border-b border-slate-800/80 pb-3">
        <button
          onClick={() => setActiveTab('proposals')}
          className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition duration-200 flex items-center space-x-2 ${
            activeTab === 'proposals'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/60'
          }`}
        >
          <span>📝 Thesis Proposals</span>
          <span className="bg-slate-950/60 px-2 py-0.5 rounded-md text-[10px]">{proposals.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('milestones')}
          className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition duration-200 flex items-center space-x-2 ${
            activeTab === 'milestones'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/60'
          }`}
        >
          <span>🎯 Project Milestones</span>
          <span className="bg-slate-950/60 px-2 py-0.5 rounded-md text-[10px]">{milestones.length}</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'proposals' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-bold text-slate-200 mb-3 flex items-center space-x-2">
              <span>✍️ Submit Proposal</span>
            </h2>
            <ProposalForm onSubmit={handleProposalSubmit} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-200 mb-3 flex items-center space-x-2">
              <span>📚 My Submissions</span>
            </h2>
            <ProposalList 
              proposals={proposals} 
              onUpdate={handleProposalUpdate}
              role="student"
            />
          </div>
        </div>
      )}

      {activeTab === 'milestones' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-200 flex items-center space-x-2">
            <span>🎯 Assigned Project Milestones</span>
          </h2>
          <MilestoneList 
            milestones={milestones} 
            onMilestoneSubmit={handleMilestoneSubmit}
            role="student"
          />
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;