import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { proposalAPI, defenseAPI, authAPI } from '../api';

const EXAMINER_ROLES = [
  { value: 'chair', label: 'Chair' },
  { value: 'internal', label: 'Internal Examiner' },
  { value: 'external', label: 'External Examiner' }
];

const STATUS_BADGES = {
  scheduled: { label: 'Scheduled', className: 'bg-blue-50 text-blue-700' },
  completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700' },
  cancelled: { label: 'Cancelled', className: 'bg-slate-100 text-slate-600' }
};

const INVITATION_BADGES = {
  invited: { label: 'Invited', className: 'bg-slate-100 text-slate-600' },
  accepted: { label: 'Accepted', className: 'bg-emerald-50 text-emerald-700' },
  declined: { label: 'Declined', className: 'bg-red-50 text-red-700' }
};

const OUTCOME_BADGES = {
  pass: { label: 'Pass', className: 'bg-emerald-50 text-emerald-700' },
  pass_with_corrections: { label: 'Pass with Corrections', className: 'bg-amber-50 text-amber-700' },
  fail: { label: 'Fail', className: 'bg-red-50 text-red-700' }
};

const roleLabel = (v) => EXAMINER_ROLES.find((r) => r.value === v)?.label || v;

const toLocalInput = (date) => {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const DefenseSchedule = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const canManage = user?.role === 'supervisor' || user?.role === 'admin';

  const [proposal, setProposal] = useState(null);
  const [defense, setDefense] = useState(null);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ scheduledAt: '', durationMinutes: 60, mode: 'onsite', venue: '', meetingLink: '', notes: '' });
  const [examiners, setExaminers] = useState([]);
  const [picker, setPicker] = useState({ user: '', role: 'internal' });
  const [saving, setSaving] = useState(false);

  const [showResultForm, setShowResultForm] = useState(false);
  const [resultComment, setResultComment] = useState('');
  const [responseNote, setResponseNote] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [proposalRes, defenseRes, facultyRes] = await Promise.all([
        proposalAPI.getById(id),
        defenseAPI.get(id),
        authAPI.getSupervisors()
      ]);
      setProposal(proposalRes.data.data);
      setDefense(defenseRes.data.data || null);
      setFaculty(facultyRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load the defense schedule');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openScheduleForm = () => {
    if (defense) {
      setForm({
        scheduledAt: toLocalInput(defense.scheduledAt),
        durationMinutes: defense.durationMinutes,
        mode: defense.mode,
        venue: defense.venue || '',
        meetingLink: defense.meetingLink || '',
        notes: defense.notes || ''
      });
      setExaminers(defense.examiners.map((e) => ({ user: e.user?._id, name: e.user?.name, role: e.role })));
    }
    setShowForm(true);
  };

  const addExaminer = () => {
    if (!picker.user) return;
    if (examiners.some((e) => e.user === picker.user)) return alert('That examiner has already been added');
    const member = faculty.find((f) => f._id === picker.user);
    setExaminers([...examiners, { user: picker.user, name: member?.name, role: picker.role }]);
    setPicker({ user: '', role: 'internal' });
  };

  const removeExaminer = (userId) => setExaminers(examiners.filter((e) => e.user !== userId));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.scheduledAt || examiners.length === 0) return;
    setSaving(true);
    try {
      const payload = {
        scheduledAt: form.scheduledAt,
        durationMinutes: Number(form.durationMinutes),
        mode: form.mode,
        venue: form.venue,
        meetingLink: form.meetingLink,
        notes: form.notes,
        examiners: examiners.map((x) => ({ user: x.user, role: x.role }))
      };
      if (defense && defense.status !== 'cancelled') {
        await defenseAPI.update(defense._id, payload);
      } else {
        await defenseAPI.schedule({ proposalId: id, ...payload });
      }
      setShowForm(false);
      setExaminers([]);
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save the defense schedule');
    }
    setSaving(false);
  };

  const handleRespond = async (invitationStatus) => {
    try {
      await defenseAPI.respond(defense._id, { invitationStatus, responseNote: responseNote.trim() });
      setResponseNote('');
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send your response');
    }
  };

  const handleRecordResult = async (outcome) => {
    try {
      await defenseAPI.recordResult(defense._id, { outcome, resultComment: resultComment.trim() });
      setShowResultForm(false);
      setResultComment('');
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record the defense result');
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this defense? Examiners will no longer see it in their list.')) return;
    try {
      await defenseAPI.update(defense._id, { status: 'cancelled' });
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel the defense');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="bg-white border border-red-200 rounded-lg p-6 text-red-600 text-sm">
        {error || 'Thesis not found'}
      </div>
    );
  }

  const badge = defense ? STATUS_BADGES[defense.status] || STATUS_BADGES.scheduled : null;
  const outcomeBadge = defense && defense.outcome !== 'pending' ? OUTCOME_BADGES[defense.outcome] : null;
  const myInvitation = defense?.examiners?.find((e) => String(e.user?._id) === String(user?.id));
  const availableFaculty = faculty.filter(
    (f) => f._id !== (proposal.supervisor?._id || proposal.supervisor) && !examiners.some((e) => e.user === f._id)
  );

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/my-thesis/${id}`} className="text-sm text-blue-600 hover:underline font-medium">← Back to My Thesis</Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Thesis Defense</h1>
        <p className="text-sm text-slate-500">{proposal.title}</p>
      </div>

      {defense && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-start gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${badge.className}`}>{badge.label}</span>
              <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-md capitalize">{defense.mode}</span>
              {outcomeBadge && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${outcomeBadge.className}`}>{outcomeBadge.label}</span>
              )}
            </div>
          </div>

          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Scheduled For</p>
          <h2 className="text-xl font-bold text-slate-900">
            {new Date(defense.scheduledAt).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {defense.durationMinutes} minutes
            {defense.mode === 'onsite' && defense.venue ? ` · ${defense.venue}` : ''}
          </p>

          {defense.mode === 'online' && defense.meetingLink && (
            <a href={defense.meetingLink} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline font-medium">
              Join meeting link
            </a>
          )}

          {defense.notes && <p className="text-sm text-slate-700 mt-3 leading-relaxed">{defense.notes}</p>}

          <div className="mt-5">
            <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
              Examiner Panel ({defense.examiners.length})
            </p>
            <div className="divide-y divide-slate-100 border-t border-slate-100">
              {defense.examiners.map((e) => {
                const inv = INVITATION_BADGES[e.invitationStatus] || INVITATION_BADGES.invited;
                return (
                  <div key={e.user?._id} className="py-2.5 flex justify-between items-center gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{e.user?.name}</p>
                      <p className="text-xs text-slate-400">
                        {roleLabel(e.role)}{e.user?.department ? ` · ${e.user.department}` : ''}
                      </p>
                      {e.responseNote && <p className="text-xs text-slate-500 mt-0.5 italic">"{e.responseNote}"</p>}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md whitespace-nowrap ${inv.className}`}>{inv.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {defense.resultComment && (
            <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Result Remarks</p>
              <p className="text-sm text-slate-700">{defense.resultComment}</p>
              <p className="text-xs text-slate-400 mt-1.5">
                {defense.resultRecordedBy?.name}
                {defense.resultRecordedAt ? ` — ${new Date(defense.resultRecordedAt).toLocaleDateString()}` : ''}
              </p>
            </div>
          )}

          {myInvitation && defense.status === 'scheduled' && (
            <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Your Invitation</p>
              <input
                type="text"
                value={responseNote}
                onChange={(e) => setResponseNote(e.target.value)}
                placeholder="Optional note for the supervisor..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleRespond('accepted')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                >
                  Accept Invitation
                </button>
                <button
                  onClick={() => handleRespond('declined')}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                >
                  Decline
                </button>
              </div>
            </div>
          )}

          {canManage && showResultForm && (
            <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
              <textarea
                value={resultComment}
                onChange={(e) => setResultComment(e.target.value)}
                rows={3}
                placeholder="Remarks from the examiner panel..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleRecordResult('pass')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
                  Pass
                </button>
                <button onClick={() => handleRecordResult('pass_with_corrections')} className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
                  Pass with Corrections
                </button>
                <button onClick={() => handleRecordResult('fail')} className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
                  Fail
                </button>
              </div>
            </div>
          )}

          {canManage && (
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400 mr-auto">Scheduled by {defense.scheduledBy?.name}</span>
              {defense.status === 'scheduled' && (
                <React.Fragment>
                  <button onClick={openScheduleForm} className="text-xs font-semibold text-blue-600 hover:underline">
                    Reschedule
                  </button>
                  <button onClick={() => setShowResultForm((s) => !s)} className="text-xs font-semibold text-blue-600 hover:underline">
                    {showResultForm ? 'Close' : 'Record Result'}
                  </button>
                  <button onClick={handleCancel} className="text-xs font-semibold text-red-600 hover:underline">
                    Cancel Defense
                  </button>
                </React.Fragment>
              )}
            </div>
          )}
        </div>
      )}

      {canManage && !showForm && (!defense || defense.status === 'cancelled') && (
        <button
          onClick={openScheduleForm}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          Schedule Defense
        </button>
      )}

      {!defense && !canManage && (
        <p className="text-sm text-slate-400">No defense has been scheduled for this thesis yet.</p>
      )}

      {canManage && showForm && (
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900">
            {defense && defense.status !== 'cancelled' ? 'Reschedule Defense' : 'Schedule Defense'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Date &amp; Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local" name="scheduledAt" value={form.scheduledAt} onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Duration (minutes)</label>
              <input
                type="number" name="durationMinutes" min="15" step="15" value={form.durationMinutes} onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Mode</label>
              <select
                name="mode" value={form.mode} onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="onsite">On Campus</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                {form.mode === 'online' ? 'Meeting Link' : 'Venue'}
              </label>
              <input
                type="text"
                name={form.mode === 'online' ? 'meetingLink' : 'venue'}
                value={form.mode === 'online' ? form.meetingLink : form.venue}
                onChange={handleChange}
                placeholder={form.mode === 'online' ? 'https://meet.example.com/...' : 'e.g., Room 09C-15'}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Examiner Panel <span className="text-red-500">*</span>
            </label>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={picker.user} onChange={(e) => setPicker({ ...picker, user: e.target.value })}
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Select a faculty member --</option>
                {availableFaculty.map((f) => (
                  <option key={f._id} value={f._id}>{f.name} — {f.department}</option>
                ))}
              </select>
              <select
                value={picker.role} onChange={(e) => setPicker({ ...picker, role: e.target.value })}
                className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {EXAMINER_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <button
                type="button" onClick={addExaminer}
                className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-lg transition whitespace-nowrap"
              >
                Add Examiner
              </button>
            </div>

            {examiners.length > 0 && (
              <div className="mt-3 divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {examiners.map((e) => (
                  <div key={e.user} className="px-3 py-2.5 flex justify-between items-center gap-3">
                    <div>
                      <span className="text-sm font-medium text-slate-800">{e.name}</span>
                      <span className="text-xs text-slate-400 ml-2">{roleLabel(e.role)}</span>
                    </div>
                    <button
                      type="button" onClick={() => removeExaminer(e.user)}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-400 mt-2">The thesis supervisor cannot be assigned as an examiner.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Notes</label>
            <textarea
              name="notes" value={form.notes} onChange={handleChange} rows={2}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Instructions for the student and panel..."
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit" disabled={saving || examiners.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Schedule'}
            </button>
            <button
              type="button" onClick={() => { setShowForm(false); setExaminers([]); }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DefenseSchedule;
