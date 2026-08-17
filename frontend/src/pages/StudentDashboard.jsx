import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
      alert('Proposal submitted successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting proposal');
    }
  };

  const handleProposalUpdate = async (id, data) => {
    try {
      await proposalAPI.update(id, data);
      await fetchData();
      alert('Proposal updated successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating proposal');
    }
  };

  const handleMilestoneSubmit = async (milestoneId, comment) => {
    try {
      await milestoneAPI.submit(milestoneId, { submissionComment: comment });
      await fetchData();
      alert('Milestone submitted for review!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting milestone');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const hasApproved = proposals.some(p => p.status === 'approved');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="w-10 h-1 bg-blue-600 mb-4" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Welcome, {user?.name || 'Student'}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {user?.department} {user?.studentId ? `· ID ${user.studentId}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {supervision ? (
              <div className="bg-green-50 border border-green-200 text-green-800 px-3.5 py-2 text-xs font-semibold">
                <span>Supervisor: <strong>{supervision.supervisor?.name}</strong></span>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3.5 py-2 text-xs font-semibold">
                <span>Awaiting Supervisor Assignment</span>
              </div>
            )}

            {hasApproved && (
              <Link
                to="/my-thesis"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 transition-colors shadow-sm"
              >
                🎓 Open My Thesis →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-px">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('proposals')}
            className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wide border-b-2 transition-colors ${
              activeTab === 'proposals'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Thesis Proposals ({proposals.length})
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wide border-b-2 transition-colors ${
              activeTab === 'milestones'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Project Milestones ({milestones.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'proposals' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 mb-3">
              Submit New Proposal
            </h2>
            <ProposalForm onSubmit={handleProposalSubmit} />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 mb-3">
              My Proposal Submissions
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
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
            Assigned Milestones & Deadlines
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