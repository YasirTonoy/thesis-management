import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { proposalAPI } from '../api';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200'
};

const StatusBadge = ({ status }) => (
  <span className={`inline-block text-xs font-bold uppercase tracking-wide px-2.5 py-1 border ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
    {status === 'pending' ? 'Yet to be decided' : status}
  </span>
);

const emptyStudentRow = (name = '', studentId = '') => ({ name, studentId });

const ProposalForm = ({ onSubmitted }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [coSupervisor, setCoSupervisor] = useState('');
  const [students, setStudents] = useState([emptyStudentRow(user?.name, user?.studentId)]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateStudent = (index, field, value) => {
    const next = [...students];
    next[index] = { ...next[index], [field]: value };
    setStudents(next);
  };

  const addStudent = () => {
    if (students.length < 5) setStudents([...students, emptyStudentRow()]);
  };

  const removeStudent = (index) => {
    if (students.length > 1) setStudents(students.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    for (const s of students) {
      if (!s.name.trim() || !s.studentId.trim()) {
        setError('Every student row needs a name and a Student ID');
        return;
      }
    }

    setSubmitting(true);
    try {
      await proposalAPI.submit({ title, description, supervisor, coSupervisor, students });
      setTitle('');
      setDescription('');
      setSupervisor('');
      setCoSupervisor('');
      setStudents([emptyStudentRow(user?.name, user?.studentId)]);
      onSubmitted();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit proposal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-slate-200 mb-10">
      <div className="h-1 bg-blue-600" />
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <h2 className="text-lg font-bold text-slate-900">Submit a Proposal</h2>

        {error && <div className="border border-red-200 bg-red-50 text-red-700 text-sm px-3.5 py-2.5">{error}</div>}

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Thesis Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Federated Learning for Low-Resource NLP"
            className="w-full border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
            Description <span className="normal-case font-medium text-slate-400">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Briefly describe the scope and goals of this thesis"
            className="w-full border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Supervisor</label>
            <input
              type="text"
              required
              value={supervisor}
              onChange={(e) => setSupervisor(e.target.value)}
              placeholder="Dr. Jane Doe"
              className="w-full border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
              Co-Supervisor <span className="normal-case font-medium text-slate-400">(if any)</span>
            </label>
            <input
              type="text"
              value={coSupervisor}
              onChange={(e) => setCoSupervisor(e.target.value)}
              placeholder="Optional"
              className="w-full border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
              Group Members <span className="normal-case font-medium text-slate-400">(1–5 students)</span>
            </label>
            {students.length < 5 && (
              <button type="button" onClick={addStudent} className="text-xs font-bold text-blue-600 hover:text-blue-700">
                + Add Student
              </button>
            )}
          </div>

          <div className="space-y-2">
            {students.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={s.name}
                  onChange={(e) => updateStudent(i, 'name', e.target.value)}
                  placeholder="Student name"
                  className="flex-1 border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
                <input
                  type="text"
                  required
                  value={s.studentId}
                  onChange={(e) => updateStudent(i, 'studentId', e.target.value)}
                  placeholder="Student ID"
                  className="w-36 border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
                {students.length > 1 && (
                  <button type="button" onClick={() => removeStudent(i)} className="px-3 text-slate-400 hover:text-red-600 font-bold text-sm" aria-label="Remove student">
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 text-sm transition-colors"
        >
          {submitting ? 'Submitting…' : 'Submit Proposal'}
        </button>
      </form>
    </div>
  );
};

const ProposalDetailModal = ({ proposal, onClose, onReviewed, canReview }) => {
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const decide = async (status) => {
    setBusy(true);
    setError('');
    try {
      await proposalAPI.review(proposal._id, { status, feedback });
      onReviewed();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update proposal');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white border border-slate-200 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="h-1 bg-blue-600" />
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1.5">{proposal.title}</h2>
              <StatusBadge status={proposal.status} />
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
          </div>

          {proposal.description && <p className="text-sm text-slate-600 leading-relaxed mb-5">{proposal.description}</p>}

          <dl className="grid grid-cols-2 gap-4 text-sm mb-5">
            <div>
              <dt className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Supervisor</dt>
              <dd className="text-slate-800">{proposal.supervisor}</dd>
            </div>
            {proposal.coSupervisor && (
              <div>
                <dt className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Co-Supervisor</dt>
                <dd className="text-slate-800">{proposal.coSupervisor}</dd>
              </div>
            )}
          </dl>

          <div className="mb-5">
            <dt className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
              Group Members ({proposal.students.length})
            </dt>
            <ul className="border border-slate-200 divide-y divide-slate-200">
              {proposal.students.map((s, i) => (
                <li key={i} className="px-3.5 py-2 flex justify-between text-sm">
                  <span className="text-slate-800">{s.name}</span>
                  <span className="text-slate-400">{s.studentId}</span>
                </li>
              ))}
            </ul>
          </div>

          {proposal.status !== 'pending' && proposal.feedback && (
            <div className="mb-5">
              <dt className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Feedback</dt>
              <p className="text-sm text-slate-600 border-l-2 border-slate-200 pl-3">{proposal.feedback}</p>
            </div>
          )}

          {canReview && proposal.status === 'pending' && (
            <div className="border-t border-slate-200 pt-5 mt-5">
              {error && <div className="border border-red-200 bg-red-50 text-red-700 text-sm px-3.5 py-2.5 mb-3">{error}</div>}
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Feedback</label>
              <textarea
                rows={2}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Optional note for the group"
                className="w-full border border-slate-300 px-3.5 py-2.5 text-sm mb-3 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
              />
              <div className="flex gap-3">
                <button disabled={busy} onClick={() => decide('approved')} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 text-sm transition-colors">
                  Approve
                </button>
                <button disabled={busy} onClick={() => decide('rejected')} className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-2.5 text-sm transition-colors">
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Proposals = () => {
  const { user } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const isReviewer = user?.role === 'supervisor' || user?.role === 'admin';

  const load = async () => {
    setLoading(true);
    try {
      const res = await proposalAPI.getAll();
      setProposals(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleClose = () => setSelected(null);
  const handleReviewed = () => { setSelected(null); load(); };

  return (
    <div>
      <div className="mb-8">
        <div className="w-10 h-1 bg-blue-600 mb-4" />
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Proposals</h1>
        <p className="text-slate-500 text-sm">
          {isReviewer ? 'Review submitted thesis proposals.' : 'Submit a proposal and track its status.'}
        </p>
      </div>

      {!isReviewer && <ProposalForm onSubmitted={load} />}

      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
        {isReviewer ? 'All Proposals' : 'Your Proposal Status'}
      </h2>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : proposals.length === 0 ? (
        <div className="border border-dashed border-slate-300 py-16 text-center">
          <p className="text-sm text-slate-500">
            {isReviewer ? 'No proposals submitted yet.' : "You're not part of any thesis group yet — submit a proposal above."}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200 border border-slate-200">
          {proposals.map((p) => (
            <button key={p._id} onClick={() => setSelected(p)} className="bg-white p-5 text-left hover:bg-blue-50/50 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-bold text-slate-900 text-sm leading-snug">{p.title}</h3>
              </div>
              <StatusBadge status={p.status} />
              <p className="text-xs text-slate-400 mt-3">
                {p.students.length} student{p.students.length > 1 ? 's' : ''} · {p.supervisor}
              </p>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <ProposalDetailModal proposal={selected} onClose={handleClose} onReviewed={handleReviewed} canReview={isReviewer} />
      )}
    </div>
  );
};

export default Proposals;
