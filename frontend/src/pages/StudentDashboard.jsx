import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { proposalAPI, milestoneAPI, supervisionAPI, meetingAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import ProposalForm from '../components/ProposalForm';
import ProposalList from '../components/ProposalList';
import MilestoneList from '../components/MilestoneList';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [supervision, setSupervision] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('proposals');

  // Quick meeting request modal
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingAgenda, setMeetingAgenda] = useState('');
  const [submittingMeeting, setSubmittingMeeting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [proposalsRes, milestonesRes, supervisionRes, meetingsRes] = await Promise.all([
        proposalAPI.getAll(),
        milestoneAPI.getAll(),
        supervisionAPI.getAll({ active: true }),
        meetingAPI.getAll()
      ]);
      
      setProposals(proposalsRes.data.data || []);
      setMilestones(milestonesRes.data.data || []);
      setSupervision(supervisionRes.data.data?.[0] || null);
      setMeetings(meetingsRes.data.data || []);
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

  const handleRequestMeeting = async (e) => {
    e.preventDefault();
    if (!meetingTitle.trim() || !meetingDate) return;
    setSubmittingMeeting(true);
    try {
      await meetingAPI.request({
        title: meetingTitle.trim(),
        proposedDateTime: meetingDate,
        agenda: meetingAgenda.trim()
      });
      setShowMeetingModal(false);
      setMeetingTitle('');
      setMeetingDate('');
      setMeetingAgenda('');
      await fetchData();
      alert('Meeting request submitted to your supervisor!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error requesting meeting');
    }
    setSubmittingMeeting(false);
  };

  const handleCancelMeeting = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this meeting?\n\nClick OK to confirm cancellation.')) return;
    try {
      await meetingAPI.cancel(id);
      await fetchData();
      alert('Meeting cancelled successfully.');
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to cancel meeting. Please try again.';
      alert('Error: ' + msg);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const approvedProposal = proposals.find(p => p.status === 'approved');

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

          <div className="flex flex-wrap items-center gap-2.5">
            {supervision ? (
              <div className="bg-green-50 border border-green-200 text-green-800 px-3.5 py-2 text-xs font-semibold">
                <span>Supervisor: <strong>{supervision.supervisor?.name}</strong></span>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3.5 py-2 text-xs font-semibold">
                <span>Awaiting Supervisor Assignment</span>
              </div>
            )}

            <Link
              to="/equipment-booking"
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 py-2 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <span>🔬</span> Lab & Equipment →
            </Link>

            {approvedProposal && (
              <Link
                to={`/my-thesis/${approvedProposal._id}`}
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
          <button
            onClick={() => setActiveTab('meetings')}
            className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wide border-b-2 transition-colors ${
              activeTab === 'meetings'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Supervisor Meetings ({meetings.length})
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

      {activeTab === 'meetings' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              Supervisor Meeting Schedule
            </h2>
            {supervision && (
              <button
                onClick={() => setShowMeetingModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 transition shadow-sm flex items-center gap-1.5"
              >
                📅 Request Meeting
              </button>
            )}
          </div>

          {meetings.length === 0 ? (
            <div className="bg-white border border-slate-200 p-8 text-center text-slate-400 text-sm space-y-3">
              <p>No meeting requests on file.</p>
              {supervision ? (
                <button
                  onClick={() => setShowMeetingModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 transition"
                >
                  Schedule First Meeting
                </button>
              ) : (
                <p className="text-xs text-amber-600">A supervisor will be assigned once your thesis proposal is approved.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meetings.map((mtg) => {
                const badge = {
                  pending: 'bg-amber-50 text-amber-700 border-amber-200',
                  confirmed: 'bg-green-50 text-green-700 border-green-200',
                  rejected: 'bg-red-50 text-red-700 border-red-200',
                  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
                  completed: 'bg-blue-50 text-blue-700 border-blue-200'
                }[mtg.status] || 'bg-slate-100 text-slate-700 border-slate-200';

                return (
                  <div key={mtg._id} className="bg-white border border-slate-200 p-5 shadow-sm space-y-2.5">
                    <div className="flex justify-between items-start">
                      <span className={`text-[10px] font-bold px-2 py-0.5 border ${badge}`}>
                        {mtg.status.toUpperCase()}
                      </span>
                      {['pending', 'confirmed'].includes(mtg.status) && (
                        <button
                          onClick={() => handleCancelMeeting(mtg._id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{mtg.title}</h3>
                    <p className="text-xs text-slate-500">
                      Proposed: {new Date(mtg.proposedDateTime).toLocaleString()}
                    </p>
                    {mtg.status === 'confirmed' && (
                      <div className="bg-green-50 border border-green-200 p-2 text-xs text-green-800 space-y-1">
                        <p><strong>Confirmed Time:</strong> {new Date(mtg.confirmedDateTime).toLocaleString()}</p>
                        {mtg.location && <p><strong>Location:</strong> {mtg.location}</p>}
                        {mtg.meetingLink && (
                          <a href={mtg.meetingLink} target="_blank" rel="noreferrer" className="text-blue-600 font-semibold hover:underline block">
                            Join Link ↗
                          </a>
                        )}
                      </div>
                    )}
                    {mtg.agenda && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 border border-slate-100">
                        {mtg.agenda}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Quick Request Meeting Modal */}
      {showMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowMeetingModal(false)}>
          <div className="bg-white w-full max-w-md shadow-2xl border border-slate-200 p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-base text-slate-900">Request Meeting with Supervisor</h3>
              <button onClick={() => setShowMeetingModal(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">×</button>
            </div>
            <form onSubmit={handleRequestMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Meeting Title *</label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Chapter 3 Review / Experiment Setup"
                  className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Preferred Date & Time *</label>
                <input
                  type="datetime-local"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Discussion Agenda</label>
                <textarea
                  value={meetingAgenda}
                  onChange={(e) => setMeetingAgenda(e.target.value)}
                  placeholder="Points to discuss, questions, updates..."
                  rows={3}
                  className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowMeetingModal(false)} className="flex-1 border border-slate-300 text-slate-700 py-2 text-xs font-semibold hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={submittingMeeting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 text-xs font-semibold transition disabled:opacity-60 shadow-sm">
                  {submittingMeeting ? 'Submitting...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;