import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { proposalAPI, progressReportAPI, materialAPI } from '../api';

const PHASES = [
  { value: 'p1', label: 'Pre Thesis 1' },
  { value: 'p2', label: 'Pre Thesis 2' },
  { value: 'defense', label: 'Defense' }
];

const phaseLabel = (v) => PHASES.find((p) => p.value === v)?.label || v;

const MyThesis = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const isStudent = user?.role === 'student';

  const [proposal, setProposal] = useState(null);
  const [reports, setReports] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportFile, setReportFile] = useState(null);
  const [submittingReport, setSubmittingReport] = useState(false);

  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [matTitle, setMatTitle] = useState('');
  const [matDescription, setMatDescription] = useState('');
  const [matFile, setMatFile] = useState(null);
  const [submittingMaterial, setSubmittingMaterial] = useState(false);

  const [versionFormOpenId, setVersionFormOpenId] = useState(null);
  const [versionNote, setVersionNote] = useState('');
  const [versionFile, setVersionFile] = useState(null);

  const API_ORIGIN = (import.meta.env?.VITE_API_URL || 'http://localhost:5001/api').replace('/api', '');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [proposalRes, reportsRes, materialsRes] = await Promise.all([
        proposalAPI.getById(id),
        progressReportAPI.getAll(id),
        materialAPI.getAll(id)
      ]);
      setProposal(proposalRes.data.data);
      setReports(reportsRes.data.data || []);
      setMaterials(materialsRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load thesis details');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!selectedPhase || !reportDescription.trim()) return;
    setSubmittingReport(true);
    try {
      const fd = new FormData();
      fd.append('proposalId', id);
      fd.append('phase', selectedPhase);
      fd.append('description', reportDescription.trim());
      if (reportFile) fd.append('document', reportFile);
      await progressReportAPI.submit(fd);
      setSelectedPhase('');
      setReportDescription('');
      setReportFile(null);
      setShowReportForm(false);
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit progress report');
    }
    setSubmittingReport(false);
  };

  const handleCreateMaterial = async (e) => {
    e.preventDefault();
    if (!matTitle.trim() || !matFile) return;
    setSubmittingMaterial(true);
    try {
      const fd = new FormData();
      fd.append('proposalId', id);
      fd.append('title', matTitle.trim());
      fd.append('description', matDescription.trim());
      fd.append('file', matFile);
      await materialAPI.create(fd);
      setMatTitle('');
      setMatDescription('');
      setMatFile(null);
      setShowMaterialForm(false);
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload material');
    }
    setSubmittingMaterial(false);
  };

  const handleAddVersion = async (materialId) => {
    if (!versionFile) return;
    try {
      const fd = new FormData();
      fd.append('note', versionNote.trim());
      fd.append('file', versionFile);
      await materialAPI.addVersion(materialId, fd);
      setVersionFormOpenId(null);
      setVersionNote('');
      setVersionFile(null);
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add new version');
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

  return (
    <div className="space-y-8">
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">My Thesis</p>
        <h1 className="text-2xl font-bold text-slate-900">{proposal.title}</h1>
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-slate-500">
          <span>Thesis ID: <span className="font-mono text-slate-700">{proposal._id}</span></span>
          <span>Supervisor: <span className="text-slate-700 font-medium">{proposal.supervisor?.name}</span></span>
          {proposal.coSupervisor && (
            <span>Co-Supervisor: <span className="text-slate-700 font-medium">{proposal.coSupervisor.name}</span></span>
          )}
          <span className="capitalize">Status: <span className="text-emerald-600 font-medium">{proposal.status}</span></span>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <Link
            to={`/my-thesis/${id}/literature-review`}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            Literature Review →
          </Link>
          <Link
            to={`/my-thesis/${id}/versions`}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            Thesis Versions →
          </Link>
          <Link
            to={`/my-thesis/${id}/plagiarism`}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            Plagiarism Reports →
          </Link>
          <Link
            to={`/my-thesis/${id}/final-submission`}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            Final Submission →
          </Link>
          <Link
            to={`/my-thesis/${id}/defense`}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            Defense Schedule →
          </Link>
          <Link
  to={`/my-thesis/${id}/publications`}
  className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
>
  Publications →
</Link>
<Link
  to={`/my-thesis/${id}/conferences`}
  className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
>
  Conference Participation →
</Link>
        </div>
      </div>

      <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Progress Reports</h2>
          {isStudent && (
            <button
              onClick={() => setShowReportForm((s) => !s)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              {showReportForm ? 'Cancel' : 'Submit Progress Report'}
            </button>
          )}
        </div>

        {showReportForm && (
          <form onSubmit={handleSubmitReport} className="border border-slate-200 rounded-lg p-4 mb-6 space-y-4 bg-slate-50">
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-600">
              <div><span className="font-semibold text-slate-800">Thesis Name:</span> {proposal.title}</div>
              <div><span className="font-semibold text-slate-800">Thesis ID:</span> {proposal._id}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Select Phase <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedPhase}
                onChange={(e) => setSelectedPhase(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Select a phase --</option>
                {PHASES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {selectedPhase && (
              <React.Fragment>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Progress Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    rows={4}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Describe what you have completed for this phase..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Supporting Document (optional)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setReportFile(e.target.files[0] || null)}
                    className="w-full text-sm text-slate-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  {submittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </React.Fragment>
            )}
          </form>
        )}

        {reports.length === 0 ? (
          <p className="text-sm text-slate-400">No progress reports submitted yet.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => {
              const docHref = r.document && r.document.url ? (API_ORIGIN + r.document.url) : null;
              return (
                <div key={r._id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                      {phaseLabel(r.phase)}
                    </span>
                    <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-slate-700 mt-2">{r.description}</p>
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-400">By {r.submittedBy?.name}</span>
                    {docHref && (
                      <a href={docHref} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline font-medium">
                        View Document
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Supporting Documents & Datasets</h2>
          {isStudent && (
            <button
              onClick={() => setShowMaterialForm((s) => !s)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              {showMaterialForm ? 'Cancel' : 'Upload Material'}
            </button>
          )}
        </div>

        {showMaterialForm && (
          <form onSubmit={handleCreateMaterial} className="border border-slate-200 rounded-lg p-4 mb-6 space-y-4 bg-slate-50">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={matTitle}
                onChange={(e) => setMatTitle(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Training Dataset v1"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Description</label>
              <textarea
                value={matDescription}
                onChange={(e) => setMatDescription(e.target.value)}
                rows={2}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                File <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                onChange={(e) => setMatFile(e.target.files[0] || null)}
                className="w-full text-sm text-slate-600"
              />
            </div>
            <button
              type="submit"
              disabled={submittingMaterial}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              {submittingMaterial ? 'Uploading...' : 'Upload'}
            </button>
          </form>
        )}

        {materials.length === 0 ? (
          <p className="text-sm text-slate-400">No materials uploaded yet.</p>
        ) : (
          <div className="space-y-4">
            {materials.map((m) => (
              <div key={m._id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{m.title}</h3>
                    {m.description && <p className="text-sm text-slate-500 mt-0.5">{m.description}</p>}
                  </div>
                  {isStudent && (
                    <button
                      onClick={() => setVersionFormOpenId(versionFormOpenId === m._id ? null : m._id)}
                      className="text-xs font-semibold text-blue-600 hover:underline whitespace-nowrap"
                    >
                      + Add New Version
                    </button>
                  )}
                </div>

                {versionFormOpenId === m._id && (
                  <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                    <input
                      type="file"
                      onChange={(e) => setVersionFile(e.target.files[0] || null)}
                      className="w-full text-sm text-slate-600"
                    />
                    <input
                      type="text"
                      value={versionNote}
                      onChange={(e) => setVersionNote(e.target.value)}
                      placeholder="What changed in this update?"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleAddVersion(m._id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      Save Version
                    </button>
                  </div>
                )}

                <div className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
                  {m.versions.slice().reverse().map((v, idx) => (
                    <div key={idx} className="py-2 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-medium text-slate-700">{v.originalName}</span>
                        {v.note && <span className="text-slate-400"> - {v.note}</span>}
                      </div>
                      <div className="flex items-center gap-3 text-slate-400">
                        <span>{v.uploadedBy && v.uploadedBy.name}</span>
                        <span>{new Date(v.uploadedAt).toLocaleDateString()}</span>
                        <a href={API_ORIGIN + v.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium">
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default MyThesis;
