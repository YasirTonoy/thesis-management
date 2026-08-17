import React, { useState, useEffect } from 'react';
import { proposalAPI, milestoneAPI, supervisionAPI, progressReportAPI, literatureReviewAPI, thesisMaterialAPI, meetingAPI } from '../api';
import ProposalList from '../components/ProposalList';
import MilestoneList from '../components/MilestoneList';

const SupervisorDashboard = () => {
  const [user, setUser] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [students, setStudents] = useState([]);
  const [reports, setReports] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('proposals');

  // Evaluation modal states
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportMarks, setReportMarks] = useState('');
  const [reportFeedback, setReportFeedback] = useState('');

  const [selectedReview, setSelectedReview] = useState(null);
  const [reviewFeedback, setReviewFeedback] = useState('');

  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    supervisionId: '',
    title: '',
    description: '',
    dueDate: ''
  });

  // Meeting respond modal
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [meetingRespondForm, setMeetingRespondForm] = useState({
    status: 'confirmed',
    confirmedDateTime: '',
    location: '',
    meetingLink: '',
    rejectionReason: '',
    supervisorNotes: ''
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
      const [proposalsRes, milestonesRes, supervisionRes, reportsRes, reviewsRes, materialsRes, meetingsRes] = await Promise.all([
        proposalAPI.getAll(),
        milestoneAPI.getAll(),
        supervisionAPI.getAll({ active: true }),
        progressReportAPI.getAll(),
        literatureReviewAPI.getAll(),
        thesisMaterialAPI.getAll(),
        meetingAPI.getAll()
      ]);
      
      setProposals(proposalsRes.data.data || []);
      setMilestones(milestonesRes.data.data || []);
      setStudents(supervisionRes.data.data || []);
      setReports(reportsRes.data.data || []);
      setReviews(reviewsRes.data.data || []);
      setMaterials(materialsRes.data.data || []);
      setMeetings(meetingsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const handleProposalReview = async (proposalId, status, feedback) => {
    try {
      await proposalAPI.review(proposalId, { status, feedback });
      await fetchData();
      alert(`Proposal ${status} successfully!`);
    } catch (error) {
      alert(error.response?.data?.message || 'Error reviewing proposal');
    }
  };

  const handleMilestoneReview = async (milestoneId, status, feedback) => {
    try {
      await milestoneAPI.review(milestoneId, { status, feedback });
      await fetchData();
      alert(`Milestone ${status} successfully!`);
    } catch (error) {
      alert(error.response?.data?.message || 'Error reviewing milestone');
    }
  };

  const handleEvaluateReport = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;
    try {
      await progressReportAPI.review(selectedReport._id, {
        marks: Number(reportMarks),
        supervisorFeedback: reportFeedback
      });
      alert('Progress Report evaluated & marks saved!');
      setSelectedReport(null);
      setReportMarks('');
      setReportFeedback('');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error evaluating report');
    }
  };

  const handleSaveReviewFeedback = async (e) => {
    e.preventDefault();
    if (!selectedReview) return;
    try {
      await literatureReviewAPI.feedback(selectedReview._id, { supervisorFeedback: reviewFeedback });
      alert('Feedback saved for literature review!');
      setSelectedReview(null);
      setReviewFeedback('');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving feedback');
    }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    try {
      await milestoneAPI.create(newMilestone);
      await fetchData();
      setShowMilestoneModal(false);
      setNewMilestone({ supervisionId: '', title: '', description: '', dueDate: '' });
      alert('Milestone created successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating milestone');
    }
  };

  const handleRespondToMeeting = async (e) => {
    e.preventDefault();
    if (!selectedMeeting) return;
    try {
      await meetingAPI.respond(selectedMeeting._id, meetingRespondForm);
      alert(`Meeting ${meetingRespondForm.status === 'confirmed' ? 'confirmed' : 'rejected'} successfully!`);
      setSelectedMeeting(null);
      setMeetingRespondForm({ status: 'confirmed', confirmedDateTime: '', location: '', meetingLink: '', rejectionReason: '', supervisorNotes: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error responding to meeting');
    }
  };

  const handleCancelMeeting = async (meetingId) => {
    if (!window.confirm('Cancel this meeting?')) return;
    try {
      await meetingAPI.cancel(meetingId);
      alert('Meeting cancelled.');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error cancelling meeting');
    }
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Welcome, {user?.name || 'Supervisor'}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Faculty Thesis Supervision & Milestone Control Center</p>
          </div>
          <button
            onClick={() => setShowMilestoneModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 text-xs transition shadow-sm"
          >
            + Create Milestone
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-px">
        {[
          { id: 'proposals', label: 'Proposals', count: proposals.filter(p => p.status === 'pending').length },
          { id: 'milestones', label: 'Milestones', count: milestones.filter(m => m.status === 'submitted').length },
          { id: 'reports', label: 'Progress Reports', count: reports.length },
          { id: 'lit_reviews', label: 'Literature Reviews', count: reviews.length },
          { id: 'materials', label: 'Datasets & Versions', count: materials.length },
          { id: 'meetings', label: 'Meetings', count: meetings.filter(m => m.status === 'pending').length },
          { id: 'students', label: 'Supervised Roster', count: students.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wide border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded text-[10px] text-slate-600">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: PROPOSALS */}
      {activeTab === 'proposals' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Proposals Awaiting Evaluation</h2>
          <ProposalList 
            proposals={proposals.filter(p => p.status === 'pending')} 
            onReview={handleProposalReview}
            role="supervisor"
          />
        </div>
      )}

      {/* TAB 2: MILESTONES */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Milestones Under Review</h2>
          <MilestoneList 
            milestones={milestones} 
            onMilestoneReview={handleMilestoneReview}
            role="supervisor"
          />
        </div>
      )}

      {/* TAB 3: PROGRESS REPORTS & MARKING */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Student Progress Reports & Phase Grading</h2>
          {reports.length === 0 ? (
            <p className="text-slate-500 text-sm italic">No progress reports submitted by supervised students yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reports.map((rep) => (
                <div key={rep._id} className="bg-white border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-2 py-0.5 uppercase">
                        {rep.phaseName || rep.phase}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{rep.student?.name}</h3>
                      <p className="text-xs text-slate-500">{rep.student?.email} ({rep.student?.department || 'CSE'})</p>
                      <p className="text-xs text-blue-700 font-mono mt-1">Thesis: {rep.thesisTitle}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-0.5 border ${
                      rep.marks !== null ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {rep.marks !== null ? `Score: ${rep.marks}/100` : 'Pending Evaluation'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3.5 border border-slate-200 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Student Progress Description:</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{rep.description}</p>
                  </div>

                  {rep.supportingDocuments && (
                    <div className="text-xs">
                      <span className="text-slate-500 font-semibold">Supporting Doc: </span>
                      <a href={rep.supportingDocuments} target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-700 break-all">
                        {rep.supportingDocuments}
                      </a>
                    </div>
                  )}

                  {rep.supervisorFeedback && (
                    <div className="bg-green-50 border border-green-200 p-3.5 space-y-1">
                      <p className="text-xs uppercase font-bold text-green-800">Supervisor Notes:</p>
                      <p className="text-xs text-slate-800">{rep.supervisorFeedback}</p>
                    </div>
                  )}

                  <button
                    onClick={() => { setSelectedReport(rep); setReportMarks(rep.marks || ''); setReportFeedback(rep.supervisorFeedback || ''); }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 transition-colors shadow-sm"
                  >
                    {rep.marks !== null ? '✏️ Update Phase Marks & Feedback' : '⭐ Evaluate & Assign Phase Marks'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LITERATURE REVIEWS */}
      {activeTab === 'lit_reviews' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Supervised Student Literature Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-slate-500 text-sm italic">No literature reviews logged by students yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((rev) => (
                <div key={rev._id} className="bg-white border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                      Student: {rev.student?.name} ({rev.journalName}, {rev.publicationYear})
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{rev.paperName}</h3>
                    <p className="text-xs text-slate-500">Authors: {rev.authors}</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 border border-slate-200 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Student Analysis:</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{rev.reviewText}</p>
                  </div>

                  {rev.supervisorFeedback && (
                    <div className="bg-blue-50 border border-blue-200 p-3.5 space-y-1">
                      <p className="text-xs uppercase font-bold text-blue-800">Supervisor Feedback:</p>
                      <p className="text-xs text-slate-800">{rev.supervisorFeedback}</p>
                    </div>
                  )}

                  <button
                    onClick={() => { setSelectedReview(rev); setReviewFeedback(rev.supervisorFeedback || ''); }}
                    className="w-full border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold text-xs py-2 transition"
                  >
                    💬 {rev.supervisorFeedback ? 'Edit Feedback' : 'Add Feedback to Literature Review'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: DATASETS & MATERIALS VERSION AUDIT */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Thesis Materials & Dataset Version History Audit</h2>
          {materials.length === 0 ? (
            <p className="text-slate-500 text-sm italic">No datasets or supporting materials uploaded yet.</p>
          ) : (
            <div className="space-y-6">
              {materials.map((mat) => (
                <div key={mat._id} className="bg-white border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-2 py-0.5 uppercase">
                          {mat.category}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">
                          Student: {mat.student?.name} ({mat.student?.email})
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{mat.title}</h3>
                    </div>
                    <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-2.5 py-1">
                      Current Version: v{mat.currentVersion}
                    </span>
                  </div>

                  {/* Version Audit Log */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Version Audit Trail ({mat.history?.length || 0} revisions)
                    </h4>
                    <div className="space-y-2">
                      {(mat.history || []).slice().reverse().map((ver, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="bg-blue-600 text-white font-mono text-xs font-bold px-1.5 py-0.5">
                                v{ver.version}
                              </span>
                              <span className="text-xs font-semibold text-slate-800">
                                Updated by <strong>{ver.updatedByName}</strong> ({ver.updatedByRole || 'User'})
                              </span>
                              <span className="text-xs text-slate-400">
                                {new Date(ver.updatedAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">Notes: {ver.changeNotes}</p>
                          </div>

                          <a
                            href={ver.documentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-white hover:bg-slate-100 border border-slate-300 text-xs text-blue-600 font-semibold px-3 py-1 transition shrink-0"
                          >
                            🔗 Access File (v{ver.version})
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: STUDENTS */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Assigned Student Roster</h2>
          {students.length === 0 ? (
            <p className="text-slate-500 text-sm italic">No students currently assigned under your supervision.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((s) => (
                <div key={s._id} className="bg-white border border-slate-200 p-5 shadow-sm space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                      {s.student?.name ? s.student.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{s.student?.name}</h3>
                      <p className="text-xs text-slate-500">{s.student?.email}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
                    <span>Dept: {s.student?.department || 'CSE'}</span>
                    <span>Assigned: {new Date(s.assignmentDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: MEETINGS */}
      {activeTab === 'meetings' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Student Meeting Requests</h2>
          {meetings.length === 0 ? (
            <p className="text-slate-500 text-sm italic">No meeting requests from students yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {meetings.map((mtg) => {
                const statusStyles = {
                  pending:   { bg: 'bg-amber-50 text-amber-700 border-amber-200',  label: 'Awaiting Your Response' },
                  confirmed: { bg: 'bg-green-50 text-green-700 border-green-200', label: 'Confirmed' },
                  rejected:  { bg: 'bg-red-50 text-red-700 border-red-200',    label: 'Rejected' },
                  cancelled: { bg: 'bg-slate-100 text-slate-500 border-slate-200',  label: 'Cancelled' },
                  completed: { bg: 'bg-blue-50 text-blue-700 border-blue-200',   label: 'Completed' }
                };
                const s = statusStyles[mtg.status] || statusStyles.pending;
                return (
                  <div key={mtg._id} className="bg-white border border-slate-200 p-5 shadow-sm space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <span className={`inline-flex text-xs font-bold px-2 py-0.5 border ${s.bg}`}>
                          {s.label}
                        </span>
                        <h3 className="text-base font-bold text-slate-900">{mtg.title}</h3>
                        <p className="text-xs text-slate-500">Student: <strong className="text-slate-700">{mtg.student?.name}</strong> ({mtg.student?.email})</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 border border-slate-200 space-y-1 text-xs">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Proposed Time</p>
                      <p className="text-slate-800 font-semibold">
                        {new Date(mtg.proposedDateTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>

                    {mtg.agenda && (
                      <div className="bg-slate-50 p-3 border border-slate-200 text-xs">
                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Agenda</p>
                        <p className="text-slate-700 leading-relaxed">{mtg.agenda}</p>
                      </div>
                    )}

                    {mtg.status === 'confirmed' && (mtg.location || mtg.meetingLink) && (
                      <div className="flex flex-wrap gap-2 text-xs">
                        {mtg.location && <span className="bg-slate-100 border border-slate-200 text-slate-700 font-semibold px-2.5 py-1">📍 {mtg.location}</span>}
                        {mtg.meetingLink && <a href={mtg.meetingLink} target="_blank" rel="noreferrer" className="bg-blue-50 border border-blue-200 text-blue-700 font-semibold px-2.5 py-1 hover:bg-blue-100 transition">🔗 Meeting Link</a>}
                      </div>
                    )}

                    {mtg.rejectionReason && (
                      <div className="bg-red-50 border border-red-200 p-3 text-xs">
                        <p className="uppercase font-bold text-red-800 mb-1">Rejection Reason</p>
                        <p className="text-slate-700">{mtg.rejectionReason}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      {mtg.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedMeeting(mtg);
                            setMeetingRespondForm({ status: 'confirmed', confirmedDateTime: mtg.proposedDateTime ? new Date(mtg.proposedDateTime).toISOString().slice(0,16) : '', location: '', meetingLink: '', rejectionReason: '', supervisorNotes: '' });
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 transition shadow-sm"
                        >
                          Respond to Request
                        </button>
                      )}
                      {['pending', 'confirmed'].includes(mtg.status) && (
                        <button
                          onClick={() => handleCancelMeeting(mtg._id)}
                          className="border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold px-3 py-2 transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: EVALUATE PROGRESS REPORT */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReport(null)}>
          <div className="bg-white border border-slate-200 max-w-md w-full shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="h-1 bg-blue-600 mb-2" />
            <h2 className="text-lg font-bold text-slate-900">Evaluate Progress Report ({selectedReport.phaseName || selectedReport.phase})</h2>
            <p className="text-xs text-slate-500">Student: {selectedReport.student?.name}</p>

            <form onSubmit={handleEvaluateReport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Phase Marks (0 - 100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={reportMarks}
                  onChange={(e) => setReportMarks(e.target.value)}
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                  placeholder="e.g. 85"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Supervisor Comments & Feedback</label>
                <textarea
                  value={reportFeedback}
                  onChange={(e) => setReportFeedback(e.target.value)}
                  rows="4"
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 resize-none"
                  placeholder="Feedback, strengths, and areas to improve..."
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 transition">
                  Save Evaluation
                </button>
                <button type="button" onClick={() => setSelectedReport(null)} className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LITERATURE REVIEW FEEDBACK */}
      {selectedReview && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReview(null)}>
          <div className="bg-white border border-slate-200 max-w-md w-full shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="h-1 bg-blue-600 mb-2" />
            <h2 className="text-lg font-bold text-slate-900">Add Feedback to Literature Review</h2>
            <p className="text-xs text-slate-500">Paper: {selectedReview.paperName}</p>

            <form onSubmit={handleSaveReviewFeedback} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Supervisor Notes / Feedback</label>
                <textarea
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  rows="4"
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 resize-none"
                  placeholder="Feedback on synthesis and paper choice..."
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 transition">
                  Save Feedback
                </button>
                <button type="button" onClick={() => setSelectedReview(null)} className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE MILESTONE */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4" onClick={() => setShowMilestoneModal(false)}>
          <div className="bg-white border border-slate-200 max-w-md w-full shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="h-1 bg-blue-600 mb-2" />
            <h2 className="text-lg font-bold text-slate-900">Create Student Milestone</h2>
            <form onSubmit={handleCreateMilestone} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Select Student</label>
                <select
                  value={newMilestone.supervisionId}
                  onChange={(e) => setNewMilestone({ ...newMilestone, supervisionId: e.target.value })}
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
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
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Milestone Title</label>
                <input
                  type="text"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                  placeholder="e.g., Sprint 1 Progress Report"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Description</label>
                <textarea
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                  rows="3"
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 resize-none"
                  placeholder="Deliverables and expectations..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Due Date</label>
                <input
                  type="datetime-local"
                  value={newMilestone.dueDate}
                  onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 transition"
                >
                  Create Milestone
                </button>
                <button
                  type="button"
                  onClick={() => setShowMilestoneModal(false)}
                  className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2.5 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESPOND TO MEETING */}
      {selectedMeeting && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4" onClick={() => setSelectedMeeting(null)}>
          <div className="bg-white border border-slate-200 max-w-lg w-full shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="h-1 bg-blue-600 mb-2" />
            <h2 className="text-lg font-bold text-slate-900">Respond to Meeting Request</h2>
            <p className="text-xs text-slate-500">Student: <strong>{selectedMeeting.student?.name}</strong> &mdash; <span>{selectedMeeting.title}</span></p>

            <form onSubmit={handleRespondToMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Your Decision</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setMeetingRespondForm({ ...meetingRespondForm, status: 'confirmed' })}
                    className={`flex-1 text-xs font-semibold py-2.5 border transition ${
                      meetingRespondForm.status === 'confirmed'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Confirm Meeting
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeetingRespondForm({ ...meetingRespondForm, status: 'rejected' })}
                    className={`flex-1 text-xs font-semibold py-2.5 border transition ${
                      meetingRespondForm.status === 'rejected'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Reject Request
                  </button>
                </div>
              </div>

              {meetingRespondForm.status === 'confirmed' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Confirmed Date & Time</label>
                    <input
                      type="datetime-local"
                      value={meetingRespondForm.confirmedDateTime}
                      onChange={(e) => setMeetingRespondForm({ ...meetingRespondForm, confirmedDateTime: e.target.value })}
                      className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Location (Optional)</label>
                    <input
                      type="text"
                      value={meetingRespondForm.location}
                      onChange={(e) => setMeetingRespondForm({ ...meetingRespondForm, location: e.target.value })}
                      className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                      placeholder="e.g. Faculty Office Room 302 or Online"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Meeting Link (Optional)</label>
                    <input
                      type="url"
                      value={meetingRespondForm.meetingLink}
                      onChange={(e) => setMeetingRespondForm({ ...meetingRespondForm, meetingLink: e.target.value })}
                      className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                      placeholder="https://meet.google.com/..."
                    />
                  </div>
                </>
              )}

              {meetingRespondForm.status === 'rejected' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Rejection Reason</label>
                  <textarea
                    value={meetingRespondForm.rejectionReason}
                    onChange={(e) => setMeetingRespondForm({ ...meetingRespondForm, rejectionReason: e.target.value })}
                    rows="2"
                    className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-red-600 resize-none"
                    placeholder="Explain why you are declining this time..."
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Notes for Student (Optional)</label>
                <textarea
                  value={meetingRespondForm.supervisorNotes}
                  onChange={(e) => setMeetingRespondForm({ ...meetingRespondForm, supervisorNotes: e.target.value })}
                  rows="2"
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 resize-none"
                  placeholder="Any prep notes or instructions for the student..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className={`flex-1 text-white font-semibold text-xs py-2.5 transition ${
                  meetingRespondForm.status === 'confirmed' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}>
                  {meetingRespondForm.status === 'confirmed' ? 'Confirm Meeting' : 'Reject Request'}
                </button>
                <button type="button" onClick={() => setSelectedMeeting(null)} className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 transition">
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