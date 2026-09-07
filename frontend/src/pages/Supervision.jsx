import React, { useState, useEffect } from 'react';
import { supervisionAPI, meetingAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import AssignSupervisorForm from '../components/AssignSupervisorForm';

const STATUS = {
  pending:   { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-300' },
  confirmed: { label: 'Confirmed', cls: 'bg-green-50 text-green-700 border-green-300' },
  rejected:  { label: 'Rejected', cls: 'bg-red-50 text-red-700 border-red-300' },
  cancelled: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-500 border-slate-300' },
  completed: { label: 'Completed', cls: 'bg-blue-50 text-blue-700 border-blue-300' },
};

const Supervision = () => {
  const { user } = useAuth();
  const [supervisions, setSupervisions] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Meeting request modal (student)
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingForm, setMeetingForm] = useState({ title: '', agenda: '', proposedDateTime: '' });
  const [submittingMeeting, setSubmittingMeeting] = useState(false);

  // Meeting respond modal (supervisor)
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [meetingRespondForm, setMeetingRespondForm] = useState({
    status: 'confirmed',
    confirmedDateTime: '',
    location: '',
    meetingLink: '',
    rejectionReason: '',
    supervisorNotes: ''
  });
  const [submittingRespond, setSubmittingRespond] = useState(false);

  // Assign/Reassign supervisor modal (admin)
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignModalType, setAssignModalType] = useState('assign'); // 'assign' | 'reassign'

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [supRes, meetRes] = await Promise.all([
        supervisionAPI.getAll({ active: true }),
        meetingAPI.getAll()
      ]);
      setSupervisions(supRes.data.data || []);
      setMeetings(meetRes.data.data || []);
    } catch (err) {
      console.error('Error fetching supervision data:', err);
    }
    setLoading(false);
  };

  const handleRequestMeeting = async (e) => {
    e.preventDefault();
    if (!meetingForm.title || !meetingForm.proposedDateTime) {
      alert('Title and proposed date/time are required.');
      return;
    }
    setSubmittingMeeting(true);
    try {
      await meetingAPI.request({
        title: meetingForm.title,
        agenda: meetingForm.agenda,
        proposedDateTime: meetingForm.proposedDateTime
      });
      setShowMeetingModal(false);
      setMeetingForm({ title: '', agenda: '', proposedDateTime: '' });
      await fetchAll();
      alert('Meeting request sent to your supervisor!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error requesting meeting');
    }
    setSubmittingMeeting(false);
  };

  const handleCancelMeeting = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this meeting?\n\nClick OK to confirm cancellation.')) return;
    try {
      await meetingAPI.cancel(id);
      await fetchAll();
      alert('Meeting cancelled successfully.');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to cancel meeting. Please try again.';
      alert('Error: ' + msg);
    }
  };

  const handleRespondMeeting = async (e) => {
    e.preventDefault();
    if (!selectedMeeting) return;
    setSubmittingRespond(true);
    try {
      await meetingAPI.respond(selectedMeeting._id, meetingRespondForm);
      setSelectedMeeting(null);
      await fetchAll();
      alert(`Meeting marked as ${meetingRespondForm.status}!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Error responding to meeting');
    }
    setSubmittingRespond(false);
  };

  const handleAssignSupervisor = async (data) => {
    try {
      await supervisionAPI.assign(data);
      setShowAssignModal(false);
      await fetchAll();
      alert('Supervisor assigned successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error assigning supervisor');
    }
  };

  const handleReassignSupervisor = async (id, data) => {
    try {
      await supervisionAPI.reassign(id, data);
      setShowAssignModal(false);
      await fetchAll();
      alert('Supervisor reassigned successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error reassigning supervisor');
    }
  };

  const currentUser = user;
  const isStudent = currentUser?.role === 'student';
  const isSupervisor = currentUser?.role === 'supervisor';
  const isAdmin = currentUser?.role === 'admin';

  const mySupervisor = isStudent ? supervisions[0]?.supervisor : null;
  const myStudents = isSupervisor ? supervisions : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-28">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-500">Loading supervision records...</p>
        </div>
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
              <span className="text-2xl">👨‍🏫</span>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Supervision & Meetings</h1>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              {isStudent
                ? 'Your assigned supervisor and scheduled meeting requests.'
                : isSupervisor
                ? 'Students under your supervision and their meeting requests.'
                : 'Faculty supervision assignments, pairing history, and department oversight.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {isStudent && mySupervisor && (
              <button
                onClick={() => setShowMeetingModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 transition shadow-sm flex items-center gap-2"
              >
                📅 Request Meeting
              </button>
            )}

            {isAdmin && (
              <>
                <button
                  onClick={() => { setAssignModalType('assign'); setShowAssignModal(true); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 transition shadow-sm flex items-center gap-1.5"
                >
                  + Assign Supervisor
                </button>
                <button
                  onClick={() => { setAssignModalType('reassign'); setShowAssignModal(true); }}
                  className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2.5 transition"
                >
                  🔄 Reassign
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* STUDENT VIEW */}
      {isStudent && (
        <div className="space-y-6">
          {/* Supervisor Card */}
          {mySupervisor ? (
            <div className="bg-white border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                    {mySupervisor.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 border border-blue-200">
                      Your Supervisor
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{mySupervisor.name}</h3>
                    <p className="text-sm text-slate-500">{mySupervisor.email}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{mySupervisor.department || 'Computer Science & Engineering'}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:items-end gap-2">
                  <span className="bg-green-50 border border-green-300 text-green-700 text-xs font-bold px-3 py-1 self-start sm:self-auto">
                    ✅ Active Supervision
                  </span>
                  <p className="text-xs text-slate-400">
                    Assigned: {supervisions[0]?.assignmentDate ? new Date(supervisions[0].assignmentDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 p-6 text-center">
              <p className="text-amber-800 font-semibold text-sm">
                ⏳ No supervisor assigned yet. Once your proposal is reviewed, an academic supervisor will be assigned to guide your thesis.
              </p>
            </div>
          )}

          {/* Meeting Requests History */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                Scheduled Meetings & Requests ({meetings.length})
              </h2>
              {mySupervisor && (
                <button
                  onClick={() => setShowMeetingModal(true)}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  + New Meeting Request
                </button>
              )}
            </div>

            {meetings.length === 0 ? (
              <div className="bg-white border border-slate-200 p-8 text-center text-slate-400 text-sm">
                No meetings requested yet. Click "Request Meeting" above to schedule a discussion with your supervisor.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {meetings.map((mtg) => {
                  const s = STATUS[mtg.status] || STATUS.pending;
                  return (
                    <div key={mtg._id} className="bg-white border border-slate-200 p-5 shadow-sm space-y-3">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 border ${s.cls}`}>{s.label}</span>
                          <h3 className="font-bold text-slate-900 text-sm mt-1">{mtg.title}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Proposed: {new Date(mtg.proposedDateTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                        {['pending', 'confirmed'].includes(mtg.status) && (
                          <button
                            onClick={() => handleCancelMeeting(mtg._id)}
                            className="text-xs text-red-600 border border-red-200 hover:bg-red-50 px-2.5 py-1 font-semibold transition"
                          >
                            Cancel
                          </button>
                        )}
                      </div>

                      {mtg.agenda && (
                        <div className="bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-700">
                          <span className="font-bold text-slate-500">Agenda: </span>{mtg.agenda}
                        </div>
                      )}

                      {mtg.status === 'confirmed' && (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {mtg.confirmedDateTime && (
                            <span className="bg-green-50 border border-green-200 text-green-700 font-semibold px-2 py-1">
                              ⏰ {new Date(mtg.confirmedDateTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          )}
                          {mtg.location && <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-1">📍 {mtg.location}</span>}
                          {mtg.meetingLink && (
                            <a href={mtg.meetingLink} target="_blank" rel="noreferrer" className="bg-blue-50 border border-blue-200 text-blue-700 font-semibold px-2 py-1 hover:bg-blue-100 transition">
                              🔗 Join Meeting
                            </a>
                          )}
                        </div>
                      )}

                      {mtg.rejectionReason && (
                        <div className="bg-red-50 border border-red-200 p-2 text-xs text-red-800">
                          <strong>Note: </strong>{mtg.rejectionReason}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUPERVISOR VIEW */}
      {isSupervisor && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-3">
              Supervised Students ({myStudents.length})
            </h2>
            {myStudents.length === 0 ? (
              <div className="bg-white border border-slate-200 p-8 text-center text-slate-400 text-sm">
                No students currently assigned to you.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myStudents.map((s) => (
                  <div key={s._id} className="bg-white border border-slate-200 p-5 shadow-sm space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-900 text-white flex items-center justify-center text-sm font-bold">
                        {s.student?.name?.charAt(0).toUpperCase() || 'S'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{s.student?.name}</h3>
                        <p className="text-xs text-slate-500">{s.student?.email}</p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 border-t border-slate-100 pt-2 flex justify-between">
                      <span>Dept: {s.student?.department || 'CSE'}</span>
                      <span>Assigned: {new Date(s.assignmentDate).toLocaleDateString()}</span>
                    </div>
                    {s.previousSupervisor && (
                      <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1">
                        ↩ Reassigned student
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Supervisor Meeting Requests */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-3">
              Meeting Requests from Students ({meetings.length})
            </h2>
            {meetings.length === 0 ? (
              <div className="bg-white border border-slate-200 p-8 text-center text-slate-400 text-sm">
                No pending meeting requests.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {meetings.map((mtg) => {
                  const s = STATUS[mtg.status] || STATUS.pending;
                  return (
                    <div key={mtg._id} className="bg-white border border-slate-200 p-5 shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] font-bold px-2 py-0.5 border ${s.cls}`}>{s.label}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(mtg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{mtg.title}</h3>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Student: <strong>{mtg.student?.name}</strong> ({mtg.student?.email})
                        </p>
                        <p className="text-xs text-slate-500">
                          Proposed: {new Date(mtg.proposedDateTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>

                      {mtg.agenda && (
                        <div className="bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-700">
                          <span className="font-bold text-slate-500">Agenda: </span>{mtg.agenda}
                        </div>
                      )}

                      {mtg.status === 'pending' && (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => {
                              setSelectedMeeting(mtg);
                              setMeetingRespondForm({
                                status: 'confirmed',
                                confirmedDateTime: mtg.proposedDateTime ? new Date(mtg.proposedDateTime).toISOString().slice(0, 16) : '',
                                location: 'Faculty Office Room 402',
                                meetingLink: '',
                                rejectionReason: '',
                                supervisorNotes: ''
                              });
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 transition"
                          >
                            Respond / Confirm
                          </button>
                          <button
                            onClick={() => handleCancelMeeting(mtg._id)}
                            className="border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold px-3 py-2 transition"
                          >
                            Decline
                          </button>
                        </div>
                      )}

                      {mtg.status === 'confirmed' && (
                        <div className="pt-2">
                          <button
                            onClick={() => handleCancelMeeting(mtg._id)}
                            className="border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold px-3 py-1.5 transition"
                          >
                            Cancel Meeting
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADMIN VIEW */}
      {isAdmin && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-700">
              All Active Supervision Assignments ({supervisions.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => { setAssignModalType('assign'); setShowAssignModal(true); }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-1.5 transition shadow-sm"
              >
                + Assign New
              </button>
              <button
                onClick={() => { setAssignModalType('reassign'); setShowAssignModal(true); }}
                className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-1.5 transition"
              >
                🔄 Reassign
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supervisions.map((s) => (
              <div key={s._id} className="bg-white border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold px-2 py-0.5">
                    Active Pairing
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(s.assignmentDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="text-slate-900 font-bold">
                    👨‍🎓 Student: <span className="font-semibold text-blue-700">{s.student?.name}</span>
                  </p>
                  <p className="text-slate-500 pl-4">{s.student?.email}</p>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="text-slate-900 font-bold">
                    👨‍🏫 Supervisor: <span className="font-semibold text-slate-800">{s.supervisor?.name}</span>
                  </p>
                  <p className="text-slate-500 pl-4">{s.supervisor?.email}</p>
                </div>

                {s.previousSupervisor && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 p-1.5">
                    ↩ Reassigned from {s.previousSupervisor?.name || 'Previous Supervisor'}
                  </p>
                )}

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => {
                      setAssignModalType('reassign');
                      setShowAssignModal(true);
                    }}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    Change Supervisor →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: STUDENT REQUEST MEETING */}
      {showMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowMeetingModal(false)}>
          <div className="bg-white w-full max-w-lg shadow-2xl border border-slate-200 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="font-bold text-lg text-slate-900">Request Meeting with Supervisor</h2>
              <button onClick={() => setShowMeetingModal(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">×</button>
            </div>
            <form onSubmit={handleRequestMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Meeting Title *</label>
                <input
                  type="text"
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                  placeholder="e.g. Sprint 2 Progress Review, Literature Findings"
                  className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Proposed Date & Time *</label>
                <input
                  type="datetime-local"
                  value={meetingForm.proposedDateTime}
                  onChange={(e) => setMeetingForm({ ...meetingForm, proposedDateTime: e.target.value })}
                  className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Agenda / Discussion Points</label>
                <textarea
                  value={meetingForm.agenda}
                  onChange={(e) => setMeetingForm({ ...meetingForm, agenda: e.target.value })}
                  placeholder="Topics to cover, blockers, questions..."
                  rows={3}
                  className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowMeetingModal(false)} className="flex-1 border border-slate-300 text-slate-700 font-semibold text-sm py-2 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={submittingMeeting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2 transition disabled:opacity-60">
                  {submittingMeeting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUPERVISOR RESPOND TO MEETING */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelectedMeeting(null)}>
          <div className="bg-white w-full max-w-lg shadow-2xl border border-slate-200 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="font-bold text-lg text-slate-900">Respond to Meeting Request</h2>
              <button onClick={() => setSelectedMeeting(null)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">×</button>
            </div>
            <p className="text-xs text-slate-500">Student: <strong>{selectedMeeting.student?.name}</strong> · {selectedMeeting.title}</p>
            <form onSubmit={handleRespondMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Decision *</label>
                <select
                  value={meetingRespondForm.status}
                  onChange={(e) => setMeetingRespondForm({ ...meetingRespondForm, status: e.target.value })}
                  className="w-full border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="confirmed">Confirm Meeting</option>
                  <option value="rejected">Decline / Reschedule Required</option>
                </select>
              </div>

              {meetingRespondForm.status === 'confirmed' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Confirmed Date & Time</label>
                    <input
                      type="datetime-local"
                      value={meetingRespondForm.confirmedDateTime}
                      onChange={(e) => setMeetingRespondForm({ ...meetingRespondForm, confirmedDateTime: e.target.value })}
                      className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Meeting Location / Room</label>
                    <input
                      type="text"
                      value={meetingRespondForm.location}
                      onChange={(e) => setMeetingRespondForm({ ...meetingRespondForm, location: e.target.value })}
                      placeholder="e.g. Faculty Room 502"
                      className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Online Meeting Link (Optional)</label>
                    <input
                      type="url"
                      value={meetingRespondForm.meetingLink}
                      onChange={(e) => setMeetingRespondForm({ ...meetingRespondForm, meetingLink: e.target.value })}
                      placeholder="https://meet.google.com/..."
                      className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Reason for Declining</label>
                  <textarea
                    value={meetingRespondForm.rejectionReason}
                    onChange={(e) => setMeetingRespondForm({ ...meetingRespondForm, rejectionReason: e.target.value })}
                    rows={3}
                    placeholder="Provide reason or request alternative times..."
                    className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                    required
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setSelectedMeeting(null)} className="flex-1 border border-slate-300 text-slate-700 font-semibold text-sm py-2 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={submittingRespond} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2 transition disabled:opacity-60">
                  {submittingRespond ? 'Saving...' : 'Submit Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADMIN ASSIGN / REASSIGN SUPERVISOR */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowAssignModal(false)}>
          <div className="bg-white w-full max-w-lg shadow-2xl border border-slate-200 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="font-bold text-lg text-slate-900">
                {assignModalType === 'reassign' ? 'Reassign Supervisor' : 'Assign Faculty Supervisor'}
              </h2>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">×</button>
            </div>

            <AssignSupervisorForm
              type={assignModalType}
              supervisions={supervisions}
              onSubmit={assignModalType === 'reassign' ? handleReassignSupervisor : handleAssignSupervisor}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Supervision;
