import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, noticeAPI } from '../api';

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const NoticeCard = ({ notice }) => (
  <div className="border border-slate-200 p-5">
    <div className="flex items-start justify-between gap-3 mb-2">
      <h3 className="font-bold text-slate-900 text-sm">{notice.title}</h3>
      <span className="text-xs text-slate-400 whitespace-nowrap">{formatDate(notice.createdAt)}</span>
    </div>
    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{notice.content}</p>
  </div>
);

const SupervisorNotices = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await noticeAPI.mine();
      setNotices(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await noticeAPI.create({ title, content });
      setTitle('');
      setContent('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not post notice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="border border-slate-200 mb-10">
        <div className="h-1 bg-blue-600" />
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Post a Notice</h2>
          {error && <div className="border border-red-200 bg-red-50 text-red-700 text-sm px-3.5 py-2.5">{error}</div>}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Proposal deadline extended"
              className="w-full border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Content</label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your notice for students"
              className="w-full border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 text-sm transition-colors"
          >
            {submitting ? 'Posting…' : 'Post Notice'}
          </button>
        </form>
      </div>

      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Your Notices</h2>
      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : notices.length === 0 ? (
        <div className="border border-dashed border-slate-300 py-16 text-center">
          <p className="text-sm text-slate-500">You haven't posted any notices yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => <NoticeCard key={n._id} notice={n} />)}
        </div>
      )}
    </div>
  );
};

const StudentNotices = () => {
  const [supervisors, setSupervisors] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [notices, setNotices] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingNotices, setLoadingNotices] = useState(false);

  useEffect(() => {
    authAPI.getSupervisors()
      .then((res) => setSupervisors(res.data.data))
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return supervisors;
    return supervisors.filter((s) => s.name.toLowerCase().includes(q));
  }, [search, supervisors]);

  const openSupervisor = async (sup) => {
    setSelected(sup);
    setLoadingNotices(true);
    try {
      const res = await noticeAPI.bySupervisor(sup._id);
      setNotices(res.data.data);
    } catch (err) {
      console.error(err);
      setNotices([]);
    } finally {
      setLoadingNotices(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search a supervisor by name…"
          className="w-full border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
        />
      </div>

      {loadingList ? (
        <p className="text-sm text-slate-400">Loading supervisors…</p>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-slate-300 py-16 text-center">
          <p className="text-sm text-slate-500">No supervisors match that search.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200 border border-slate-200 mb-8">
          {filtered.map((s) => (
            <button
              key={s._id}
              onClick={() => openSupervisor(s)}
              className="bg-white p-5 text-left hover:bg-blue-50/50 transition-colors"
            >
              <h3 className="font-bold text-slate-900 text-sm mb-1">{s.name}</h3>
              <p className="text-xs text-slate-400">{s.department}</p>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
          <div className="bg-white border border-slate-200 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="h-1 bg-blue-600" />
            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selected.name}</h2>
                  <p className="text-xs text-slate-400">{selected.department}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
              </div>

              {loadingNotices ? (
                <p className="text-sm text-slate-400">Loading notices…</p>
              ) : notices.length === 0 ? (
                <p className="text-sm text-slate-500">This supervisor hasn't posted any notices yet.</p>
              ) : (
                <div className="space-y-3">
                  {notices.map((n) => <NoticeCard key={n._id} notice={n} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Notices = () => {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <div className="w-10 h-1 bg-blue-600 mb-4" />
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Notice Board</h1>
        <p className="text-slate-500 text-sm">
          {user?.role === 'supervisor' ? 'Post updates for your students.' : 'Find a supervisor and read their notices.'}
        </p>
      </div>

      {user?.role === 'supervisor' ? <SupervisorNotices /> : <StudentNotices />}
    </div>
  );
};

export default Notices;
