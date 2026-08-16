import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { proposalAPI, progressReportAPI, literatureReviewAPI, thesisMaterialAPI, supervisionAPI, milestoneAPI, meetingAPI } from '../api';

const MyThesis = () => {
  const [proposal, setProposal] = useState(null);
  const [supervision, setSupervision] = useState(null);
  const [reports, setReports] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, progress, lit_review, materials, milestones, meetings

  // Modal / Form States
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showUpdateVersionModal, setShowUpdateVersionModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [submitMilestoneModal, setSubmitMilestoneModal] = useState(null);
  const [milestoneComment, setMilestoneComment] = useState('');

  // Form inputs
  const [reportForm, setReportForm] = useState({
    phase: 'p1',
    description: '',
    supportingDocuments: ''
  });

  const [reviewForm, setReviewForm] = useState({
    paperName: '',
    authors: '',
    publicationYear: new Date().getFullYear(),
    journalName: '',
    paperLink: '',
    reviewText: ''
  });

  const [materialForm, setMaterialForm] = useState({
    title: '',
    category: 'dataset',
    description: '',
    documentUrl: '',
    changeNotes: ''
  });

  const [updateVersionForm, setUpdateVersionForm] = useState({
    documentUrl: '',
    changeNotes: ''
  });

  const [meetingForm, setMeetingForm] = useState({
    title: '',
    agenda: '',
    proposedDateTime: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [proposalRes, supervisionRes, reportsRes, reviewsRes, materialsRes, milestonesRes, meetingsRes] = await Promise.all([
        proposalAPI.getAll(),
        supervisionAPI.getAll({ active: true }),
        progressReportAPI.getAll(),
        literatureReviewAPI.getAll(),
        thesisMaterialAPI.getAll(),
        milestoneAPI.getAll(),
        meetingAPI.getAll()
      ]);

      const approved = (proposalRes.data.data || []).find(p => p.status === 'approved');
      setProposal(approved || null);
      setSupervision((supervisionRes.data.data || [])[0] || null);
      setReports(reportsRes.data.data || []);
      setReviews(reviewsRes.data.data || []);
      setMaterials(materialsRes.data.data || []);
      setMilestones(milestonesRes.data.data || []);
      setMeetings(meetingsRes.data.data || []);
    } catch (error) {
      console.error('Error loading thesis workspace data:', error);
    }
    setLoading(false);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      await progressReportAPI.submit({
        ...reportForm,
        thesisTitle: proposal?.title || 'Thesis Project',
        thesisId: proposal ? `THESIS-${proposal._id.substring(0, 8).toUpperCase()}` : 'THESIS-2026-001'
      });
      alert('Progress Report submitted successfully!');
      setShowReportModal(false);
      setReportForm({ phase: 'p1', description: '', supportingDocuments: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting progress report');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await literatureReviewAPI.submit(reviewForm);
      alert('Literature Review saved!');
      setShowReviewModal(false);
      setReviewForm({ paperName: '', authors: '', publicationYear: new Date().getFullYear(), journalName: '', paperLink: '', reviewText: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting literature review');
    }
  };

  const handleMaterialSubmit = async (e) => {
    e.preventDefault();
    try {
      await thesisMaterialAPI.upload(materialForm);
      alert('Thesis material/dataset added successfully!');
      setShowMaterialModal(false);
      setMaterialForm({ title: '', category: 'dataset', description: '', documentUrl: '', changeNotes: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error uploading material');
    }
  };

  const handleUpdateVersionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMaterial) return;
    try {
      await thesisMaterialAPI.updateVersion(selectedMaterial._id, updateVersionForm);
      alert(`Updated material to Version ${selectedMaterial.currentVersion + 1}!`);
      setShowUpdateVersionModal(false);
      setSelectedMaterial(null);
      setUpdateVersionForm({ documentUrl: '', changeNotes: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating material version');
    }
  };

  const handleMeetingRequest = async (e) => {
    e.preventDefault();
    try {
      await meetingAPI.request(meetingForm);
      alert('Meeting request sent to your supervisor!');
      setShowMeetingModal(false);
      setMeetingForm({ title: '', agenda: '', proposedDateTime: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error requesting meeting');
    }
  };

  const handleCancelMeeting = async (meetingId) => {
    if (!window.confirm('Are you sure you want to cancel this meeting?')) return;
    try {
      await meetingAPI.cancel(meetingId);
      alert('Meeting cancelled.');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error cancelling meeting');
    }
  };

  const handleMilestoneSubmit = async (e) => {
    e.preventDefault();
    if (!submitMilestoneModal) return;
    try {
      await milestoneAPI.submit(submitMilestoneModal._id, { submissionComment: milestoneComment });
      alert('Milestone submitted for review!');
      setSubmitMilestoneModal(null);
      setMilestoneComment('');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting milestone');
    }
  };

  // Calculate overall progress stats
  const evaluatedReports = reports.filter(r => r.marks !== null && r.marks !== undefined);
  const avgMarks = evaluatedReports.length > 0
    ? Math.round(evaluatedReports.reduce((acc, curr) => acc + curr.marks, 0) / evaluatedReports.length)
    : 0;

  const p1Report = reports.find(r => r.phase === 'p1');
  const p2Report = reports.find(r => r.phase === 'p2');
  const defenceReport = reports.find(r => r.phase === 'defence');

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="bg-white border border-slate-200 p-10 text-center max-w-2xl mx-auto my-12 shadow-sm space-y-4">
        <div className="w-12 h-12 bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto text-xl font-bold">
          🎓
        </div>
        <h2 className="text-xl font-bold text-slate-900">No Approved Thesis Proposal Found</h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          The <strong>"My Thesis"</strong> workspace becomes available once your thesis proposal has been officially approved by your faculty supervisor.
        </p>
        <div className="pt-2">
          <Link to="/proposals" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 text-xs transition-colors shadow-sm inline-block">
            View My Submissions / Submit Proposal →
          </Link>
        </div>
      </div>
    );
  }

  const thesisId = `THESIS-${proposal._id.substring(0, 8).toUpperCase()}`;

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="w-10 h-1 bg-blue-600 mb-4" />
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="bg-blue-50 border border-blue-200 text-blue-700 font-mono text-xs px-2.5 py-0.5 font-bold">
                ID: {thesisId}
              </span>
              <span className="bg-green-50 border border-green-200 text-green-700 font-semibold text-xs px-2.5 py-0.5">
                Active Thesis
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {proposal.title}
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 max-w-3xl">
              {proposal.description}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 flex items-center space-x-3 shrink-0">
            <div className="w-10 h-10 bg-blue-600 flex items-center justify-center font-bold text-sm text-white">
              {supervision?.supervisor?.name ? supervision.supervisor.name.charAt(0) : 'S'}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assigned Supervisor</p>
              <h4 className="text-sm font-bold text-slate-900">{supervision?.supervisor?.name || proposal.supervisor || 'Dr. Sarah Connor'}</h4>
              <p className="text-xs text-slate-500">{supervision?.supervisor?.email || 'Faculty Advisor'}</p>
            </div>
          </div>
        </div>

        {/* Phase Progress Cards Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 mt-6 border-t border-slate-200">
          <div className="bg-slate-50 border border-slate-200 p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Pre-Thesis 1 (P1)</span>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-900">
                {p1Report ? (p1Report.marks !== null ? `${p1Report.marks} / 100` : 'Submitted (Pending Mark)') : 'Not Submitted'}
              </span>
              <span className={`text-[10px] px-2 py-0.5 font-bold border ${p1Report?.marks ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {p1Report ? (p1Report.marks ? 'Evaluated' : 'Submitted') : 'Pending'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Pre-Thesis 2 (P2)</span>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-900">
                {p2Report ? (p2Report.marks !== null ? `${p2Report.marks} / 100` : 'Submitted (Pending Mark)') : 'Not Submitted'}
              </span>
              <span className={`text-[10px] px-2 py-0.5 font-bold border ${p2Report?.marks ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {p2Report ? (p2Report.marks ? 'Evaluated' : 'Submitted') : 'Pending'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Thesis Defence</span>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-900">
                {defenceReport ? (defenceReport.marks !== null ? `${defenceReport.marks} / 100` : 'Submitted') : 'Not Submitted'}
              </span>
              <span className={`text-[10px] px-2 py-0.5 font-bold border ${defenceReport?.marks ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {defenceReport ? (defenceReport.marks ? 'Evaluated' : 'Submitted') : 'Pending'}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700">Average Performance</span>
            <div className="flex justify-between items-center">
              <span className="text-lg font-black text-blue-900">{avgMarks}%</span>
              <span className="text-xs font-semibold text-blue-700">{reports.length} Reports</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-px">
        {[
          { id: 'overview', label: 'Overview', count: null },
          { id: 'progress', label: 'Progress Reports', count: reports.length },
          { id: 'milestones', label: 'Milestones', count: milestones.length },
          { id: 'meetings', label: 'Meetings', count: meetings.length },
          { id: 'lit_review', label: 'Literature Review', count: reviews.length },
          { id: 'materials', label: 'Datasets & Revisions', count: materials.length }
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

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Proposal Summary
              </h3>
              <div className="space-y-3 text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 border border-slate-200">
                <p><strong>Title:</strong> {proposal.title}</p>
                <p><strong>Description / Scope:</strong> {proposal.description}</p>
                <p><strong>Supervisor:</strong> {proposal.supervisor}</p>
                {proposal.coSupervisor && <p><strong>Co-Supervisor:</strong> {proposal.coSupervisor}</p>}
                <p><strong>Group Members:</strong> {proposal.students?.map(s => `${s.name} (${s.studentId})`).join(', ') || 'Self'}</p>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => { setActiveTab('progress'); setShowReportModal(true); }}
                className="p-5 bg-white border border-slate-200 hover:border-blue-500 transition text-left space-y-2 group shadow-sm"
              >
                <div className="w-8 h-8 bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-sm">
                  ✍️
                </div>
                <h4 className="font-bold text-sm text-slate-900">Submit Progress Report</h4>
                <p className="text-xs text-slate-500">File phase progress for P1, P2, or Defence evaluation.</p>
              </button>

              <button
                onClick={() => { setActiveTab('lit_review'); setShowReviewModal(true); }}
                className="p-5 bg-white border border-slate-200 hover:border-blue-500 transition text-left space-y-2 group shadow-sm"
              >
                <div className="w-8 h-8 bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center font-bold text-sm">
                  📚
                </div>
                <h4 className="font-bold text-sm text-slate-900">Log Literature Review</h4>
                <p className="text-xs text-slate-500">Record research paper synthesis, publication info, and notes.</p>
              </button>

              <button
                onClick={() => { setActiveTab('materials'); setShowMaterialModal(true); }}
                className="p-5 bg-white border border-slate-200 hover:border-blue-500 transition text-left space-y-2 group shadow-sm"
              >
                <div className="w-8 h-8 bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  📦
                </div>
                <h4 className="font-bold text-sm text-slate-900">Upload Dataset / Doc</h4>
                <p className="text-xs text-slate-500">Attach supporting files with automatic version history tracking.</p>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Phase Status Overview
              </h3>
              <div className="space-y-3">
                {['p1', 'p2', 'defence'].map((phaseKey) => {
                  const rep = reports.find(r => r.phase === phaseKey);
                  const names = { p1: 'Pre-Thesis 1 (P1)', p2: 'Pre-Thesis 2 (P2)', defence: 'Thesis Defence' };
                  return (
                    <div key={phaseKey} className="p-3.5 bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{names[phaseKey]}</p>
                        <p className="text-xs text-slate-500">
                          {rep ? (rep.marks !== null ? `Score: ${rep.marks}/100` : 'Awaiting Marks') : 'Not Submitted'}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-bold border ${
                        rep?.marks ? 'bg-green-50 text-green-700 border-green-200' : 
                        rep ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {rep ? (rep.marks ? 'Evaluated' : 'Submitted') : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROGRESS REPORTS */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">
              Submitted Progress Reports
            </h2>
            <button
              onClick={() => setShowReportModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 text-xs transition shadow-sm"
            >
              + Submit Progress Report
            </button>
          </div>

          {reports.length === 0 ? (
            <div className="bg-white border border-slate-200 p-10 text-center text-slate-500 text-sm shadow-sm">
              No progress reports submitted yet. Click <strong>Submit Progress Report</strong> to file P1, P2, or Defence reports.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reports.map((rep) => (
                <div key={rep._id} className="bg-white border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-2 py-0.5 uppercase">
                        {rep.phaseName || rep.phase}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1.5">{rep.thesisTitle}</h3>
                      <p className="text-xs text-slate-400 font-mono">Thesis ID: {rep.thesisId}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-0.5 border ${
                      rep.marks !== null ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {rep.marks !== null ? `Marks: ${rep.marks}/100` : 'Under Review'}
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 bg-slate-50 p-3.5 border border-slate-200 leading-relaxed">
                    {rep.description}
                  </p>

                  {rep.supportingDocuments && (
                    <div className="text-xs">
                      <span className="text-slate-500 font-semibold">Supporting Link: </span>
                      <a href={rep.supportingDocuments} target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-700 break-all">
                        {rep.supportingDocuments}
                      </a>
                    </div>
                  )}

                  {rep.supervisorFeedback ? (
                    <div className="bg-green-50 border border-green-200 p-3.5 space-y-1">
                      <p className="text-xs uppercase font-bold text-green-800">Supervisor Feedback:</p>
                      <p className="text-xs text-slate-800">{rep.supervisorFeedback}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No feedback added by supervisor yet.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LITERATURE REVIEW */}
      {activeTab === 'lit_review' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">
              Literature Review Repository
            </h2>
            <button
              onClick={() => setShowReviewModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 text-xs transition shadow-sm"
            >
              + Add Paper Review
            </button>
          </div>

          {reviews.length === 0 ? (
            <div className="bg-white border border-slate-200 p-10 text-center text-slate-500 text-sm shadow-sm">
              No literature reviews added yet. Click <strong>Add Paper Review</strong> to log research literature.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((rev) => (
                <div key={rev._id} className="bg-white border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                      {rev.journalName} ({rev.publicationYear})
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{rev.paperName}</h3>
                    <p className="text-xs text-slate-500">Authors: {rev.authors}</p>
                  </div>

                  {rev.paperLink && (
                    <a href={rev.paperLink} target="_blank" rel="noreferrer" className="inline-block text-xs text-blue-600 underline hover:text-blue-700">
                      🔗 View Paper / DOI Link
                    </a>
                  )}

                  <div className="bg-slate-50 p-4 border border-slate-200 space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Student Review & Synthesis:</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{rev.reviewText}</p>
                  </div>

                  {rev.supervisorFeedback && (
                    <div className="bg-blue-50 border border-blue-200 p-3.5 space-y-1">
                      <p className="text-xs uppercase font-bold text-blue-800">Supervisor Feedback:</p>
                      <p className="text-xs text-slate-800">{rev.supervisorFeedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DATASETS & DOCUMENTS WITH VERSION HISTORY */}
      {activeTab === 'materials' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">
              Datasets & Material Revision History
            </h2>
            <button
              onClick={() => setShowMaterialModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 text-xs transition shadow-sm"
            >
              + Upload Material / Dataset
            </button>
          </div>

          {materials.length === 0 ? (
            <div className="bg-white border border-slate-200 p-10 text-center text-slate-500 text-sm shadow-sm">
              No datasets or thesis materials uploaded yet.
            </div>
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
                        <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-2 py-0.5">
                          Current Version: v{mat.currentVersion}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{mat.title}</h3>
                      {mat.description && <p className="text-xs text-slate-500">{mat.description}</p>}
                    </div>

                    <button
                      onClick={() => { setSelectedMaterial(mat); setShowUpdateVersionModal(true); }}
                      className="border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-semibold px-3.5 py-1.5 transition-colors"
                    >
                      + Upload New Version (v{mat.currentVersion + 1})
                    </button>
                  </div>

                  {/* Version Audit Log History */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Revision History Audit Log ({mat.history?.length || 0} versions)
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

      {/* TAB 5: MILESTONES */}
      {activeTab === 'milestones' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">
              Assigned Milestones
            </h2>
            <span className="text-xs text-slate-500">
              {milestones.filter(m => m.status === 'pending').length} pending · {milestones.filter(m => m.status === 'approved').length} completed
            </span>
          </div>

          {milestones.length === 0 ? (
            <div className="bg-white border border-slate-200 p-10 text-center text-slate-500 text-sm shadow-sm">
              No milestones have been assigned by your supervisor yet.
            </div>
          ) : (
            <div className="space-y-3">
              {milestones.map((m) => {
                const isOverdue = new Date(m.dueDate) < new Date() && m.status === 'pending';
                const statusColors = {
                  pending: isOverdue ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200',
                  submitted: 'bg-blue-50 text-blue-700 border-blue-200',
                  approved: 'bg-green-50 text-green-700 border-green-200',
                  rejected: 'bg-red-50 text-red-700 border-red-200'
                };
                return (
                  <div key={m._id} className="bg-white border border-slate-200 p-5 shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 border ${statusColors[m.status] || statusColors.pending}`}>
                            {m.status === 'pending' && isOverdue ? 'OVERDUE' : m.status.toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            Due: {new Date(m.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900">{m.title}</h3>
                        {m.description && <p className="text-xs text-slate-600 leading-relaxed">{m.description}</p>}
                      </div>

                      {m.status === 'pending' && (
                        <button
                          onClick={() => { setSubmitMilestoneModal(m); setMilestoneComment(''); }}
                          className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 transition-colors shadow-sm"
                        >
                          ✓ Mark as Done & Submit
                        </button>
                      )}
                    </div>

                    {m.submissionComment && (
                      <div className="bg-slate-50 border border-slate-200 p-3 text-xs">
                        <p className="uppercase font-bold text-slate-600 mb-1">Your Submission Note:</p>
                        <p className="text-slate-700">{m.submissionComment}</p>
                        {m.submissionDate && (
                          <p className="text-[10px] text-slate-400 mt-1">Submitted: {new Date(m.submissionDate).toLocaleString()}</p>
                        )}
                      </div>
                    )}

                    {m.feedback && (
                      <div className={`p-3 border text-xs space-y-1 ${
                        m.status === 'approved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        <p className={`uppercase font-bold ${
                          m.status === 'approved' ? 'text-green-800' : 'text-red-800'
                        }`}>
                          Supervisor Feedback ({m.status === 'approved' ? 'Approved' : 'Rejected'}):
                        </p>
                        <p className="text-slate-800">{m.feedback}</p>
                        {m.feedbackDate && (
                          <p className="text-[10px] text-slate-500">Reviewed: {new Date(m.feedbackDate).toLocaleString()}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: MEETINGS */}
      {activeTab === 'meetings' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">
              Meeting Schedule
            </h2>
            <button
              onClick={() => setShowMeetingModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 text-xs transition shadow-sm"
            >
              + Request Meeting
            </button>
          </div>

          {meetings.length === 0 ? (
            <div className="bg-white border border-slate-200 p-10 text-center text-slate-500 text-sm shadow-sm">
              No meetings scheduled yet. Click <strong>Request Meeting</strong> to send a request to your supervisor.
            </div>
          ) : (
            <div className="space-y-3">
              {meetings.map((mtg) => {
                const statusStyles = {
                  pending:   { bg: 'bg-amber-50 text-amber-700 border-amber-200',  label: 'Pending Confirmation' },
                  confirmed: { bg: 'bg-green-50 text-green-700 border-green-200', label: 'Confirmed' },
                  rejected:  { bg: 'bg-red-50 text-red-700 border-red-200',    label: 'Rejected' },
                  cancelled: { bg: 'bg-slate-100 text-slate-500 border-slate-200',  label: 'Cancelled' },
                  completed: { bg: 'bg-blue-50 text-blue-700 border-blue-200',   label: 'Completed' }
                };
                const s = statusStyles[mtg.status] || statusStyles.pending;
                return (
                  <div key={mtg._id} className="bg-white border border-slate-200 p-5 shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 border ${s.bg}`}>
                          {s.label}
                        </span>
                        <h3 className="text-base font-bold text-slate-900">{mtg.title}</h3>
                        <p className="text-xs text-slate-500">Supervisor: {mtg.supervisor?.name}</p>
                      </div>
                      {['pending', 'confirmed'].includes(mtg.status) && (
                        <button
                          onClick={() => handleCancelMeeting(mtg._id)}
                          className="shrink-0 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold px-3 py-1 transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 p-3 border border-slate-200 space-y-1">
                        <p className="text-[10px] uppercase font-bold text-slate-500">Proposed Date & Time</p>
                        <p className="text-slate-800 font-semibold">
                          {new Date(mtg.proposedDateTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                      {mtg.confirmedDateTime && mtg.status === 'confirmed' && (
                        <div className="bg-green-50 p-3 border border-green-200 space-y-1">
                          <p className="text-[10px] uppercase font-bold text-green-800">Confirmed Time</p>
                          <p className="text-green-900 font-semibold">
                            {new Date(mtg.confirmedDateTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                      )}
                    </div>

                    {mtg.agenda && (
                      <div className="bg-slate-50 p-3 border border-slate-200 text-xs">
                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Agenda</p>
                        <p className="text-slate-700 leading-relaxed">{mtg.agenda}</p>
                      </div>
                    )}

                    {mtg.status === 'confirmed' && (mtg.location || mtg.meetingLink) && (
                      <div className="flex flex-wrap gap-2 text-xs">
                        {mtg.location && (
                          <span className="bg-slate-100 border border-slate-200 text-slate-700 font-semibold px-2.5 py-1">
                            📍 {mtg.location}
                          </span>
                        )}
                        {mtg.meetingLink && (
                          <a href={mtg.meetingLink} target="_blank" rel="noreferrer"
                            className="bg-blue-50 border border-blue-200 text-blue-700 font-semibold px-2.5 py-1 hover:bg-blue-100 transition">
                            🔗 Join Meeting Link
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: SUBMIT PROGRESS REPORT */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4" onClick={() => setShowReportModal(false)}>
          <div className="bg-white border border-slate-200 max-w-lg w-full shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="h-1 bg-blue-600 mb-2" />
            <h2 className="text-lg font-bold text-slate-900">Submit Thesis Progress Report</h2>
            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Thesis Title & ID</label>
                <div className="bg-slate-50 p-3 border border-slate-200 text-xs text-slate-700">
                  <p className="font-bold text-slate-900">{proposal.title}</p>
                  <p className="text-blue-600 font-mono">ID: {thesisId}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Select Thesis Phase</label>
                <select
                  value={reportForm.phase}
                  onChange={(e) => setReportForm({ ...reportForm, phase: e.target.value })}
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  required
                >
                  <option value="p1">Pre-Thesis 1 (P1)</option>
                  <option value="p2">Pre-Thesis 2 (P2)</option>
                  <option value="defence">Thesis Defence Phase</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Progress Description</label>
                <textarea
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  rows="4"
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
                  placeholder="Describe key achievements, deliverables completed, methodology, and blockers..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Supporting Document Link (Optional)</label>
                <input
                  type="url"
                  value={reportForm.supportingDocuments}
                  onChange={(e) => setReportForm({ ...reportForm, supportingDocuments: e.target.value })}
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  placeholder="https://github.com/..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 transition">
                  Submit Report
                </button>
                <button type="button" onClick={() => setShowReportModal(false)} className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT LITERATURE REVIEW */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4" onClick={() => setShowReviewModal(false)}>
          <div className="bg-white border border-slate-200 max-w-lg w-full shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="h-1 bg-blue-600 mb-2" />
            <h2 className="text-lg font-bold text-slate-900">Log Literature Review Entry</h2>
            <form onSubmit={handleReviewSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Paper Name / Title</label>
                <input
                  type="text"
                  value={reviewForm.paperName}
                  onChange={(e) => setReviewForm({ ...reviewForm, paperName: e.target.value })}
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                  placeholder="Paper title..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Authors</label>
                  <input
                    type="text"
                    value={reviewForm.authors}
                    onChange={(e) => setReviewForm({ ...reviewForm, authors: e.target.value })}
                    className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                    placeholder="Author 1, Author 2..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Publication Year</label>
                  <input
                    type="number"
                    value={reviewForm.publicationYear}
                    onChange={(e) => setReviewForm({ ...reviewForm, publicationYear: e.target.value })}
                    className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Journal / Conference Name</label>
                <input
                  type="text"
                  value={reviewForm.journalName}
                  onChange={(e) => setReviewForm({ ...reviewForm, journalName: e.target.value })}
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                  placeholder="e.g. IEEE Transactions on AI"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Paper Link / DOI (Optional)</label>
                <input
                  type="url"
                  value={reviewForm.paperLink}
                  onChange={(e) => setReviewForm({ ...reviewForm, paperLink: e.target.value })}
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                  placeholder="https://doi.org/..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Student Literature Review & Synthesis</label>
                <textarea
                  value={reviewForm.reviewText}
                  onChange={(e) => setReviewForm({ ...reviewForm, reviewText: e.target.value })}
                  rows="3"
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 resize-none"
                  placeholder="Write your analysis of how this paper connects to your thesis..."
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 transition">
                  Save Review
                </button>
                <button type="button" onClick={() => setShowReviewModal(false)} className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD MATERIAL / DATASET */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4" onClick={() => setShowMaterialModal(false)}>
          <div className="bg-white border border-slate-200 max-w-lg w-full shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="h-1 bg-blue-600 mb-2" />
            <h2 className="text-lg font-bold text-slate-900">Upload Thesis Material / Dataset</h2>
            <form onSubmit={handleMaterialSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Title</label>
                <input
                  type="text"
                  value={materialForm.title}
                  onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                  placeholder="e.g. Primary Survey Dataset v1"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Category</label>
                <select
                  value={materialForm.category}
                  onChange={(e) => setMaterialForm({ ...materialForm, category: e.target.value })}
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                >
                  <option value="dataset">Dataset</option>
                  <option value="supporting_doc">Supporting Document</option>
                  <option value="code_repository">Code Repository</option>
                  <option value="manuscript">Thesis Draft / Manuscript</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">File Link / URL</label>
                <input
                  type="url"
                  value={materialForm.documentUrl}
                  onChange={(e) => setMaterialForm({ ...materialForm, documentUrl: e.target.value })}
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                  placeholder="https://github.com/..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Initial Change Notes</label>
                <textarea
                  value={materialForm.changeNotes}
                  onChange={(e) => setMaterialForm({ ...materialForm, changeNotes: e.target.value })}
                  rows="2"
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 resize-none"
                  placeholder="Describe initial version contents..."
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 transition">
                  Upload Material
                </button>
                <button type="button" onClick={() => setShowMaterialModal(false)} className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPDATE MATERIAL VERSION */}
      {showUpdateVersionModal && selectedMaterial && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4" onClick={() => setShowUpdateVersionModal(false)}>
          <div className="bg-white border border-slate-200 max-w-lg w-full shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="h-1 bg-blue-600 mb-2" />
            <h2 className="text-lg font-bold text-slate-900">
              Update Version (v{selectedMaterial.currentVersion + 1})
            </h2>
            <p className="text-xs text-slate-500">
              Updating: <strong>{selectedMaterial.title}</strong>. Changes will be recorded in the audit log.
            </p>

            <form onSubmit={handleUpdateVersionSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Updated File Link</label>
                <input
                  type="url"
                  value={updateVersionForm.documentUrl}
                  onChange={(e) => setUpdateVersionForm({ ...updateVersionForm, documentUrl: e.target.value })}
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                  placeholder="https://github.com/..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">What changed in this version?</label>
                <textarea
                  value={updateVersionForm.changeNotes}
                  onChange={(e) => setUpdateVersionForm({ ...updateVersionForm, changeNotes: e.target.value })}
                  rows="3"
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 resize-none"
                  placeholder="Detail modifications, additions, or cleaning performed..."
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 transition">
                  Save Version v{selectedMaterial.currentVersion + 1}
                </button>
                <button type="button" onClick={() => setShowUpdateVersionModal(false)} className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REQUEST MEETING */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4" onClick={() => setShowMeetingModal(false)}>
          <div className="bg-white border border-slate-200 max-w-lg w-full shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="h-1 bg-blue-600 mb-2" />
            <h2 className="text-lg font-bold text-slate-900">Request a Meeting</h2>
            <p className="text-xs text-slate-500">Send a meeting request to your supervisor to confirm or adjust.</p>
            <form onSubmit={handleMeetingRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Meeting Title</label>
                <input
                  type="text"
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                  placeholder="e.g. P1 Progress Review Discussion"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Proposed Date & Time</label>
                <input
                  type="datetime-local"
                  value={meetingForm.proposedDateTime}
                  onChange={(e) => setMeetingForm({ ...meetingForm, proposedDateTime: e.target.value })}
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Agenda / Topics to Discuss (Optional)</label>
                <textarea
                  value={meetingForm.agenda}
                  onChange={(e) => setMeetingForm({ ...meetingForm, agenda: e.target.value })}
                  rows="3"
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 resize-none"
                  placeholder="Outline discussion points, questions, or materials to review..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 transition">
                  Send Request
                </button>
                <button type="button" onClick={() => setShowMeetingModal(false)} className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT MILESTONE */}
      {submitMilestoneModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4" onClick={() => setSubmitMilestoneModal(null)}>
          <div className="bg-white border border-slate-200 max-w-md w-full shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="h-1 bg-blue-600 mb-2" />
            <h2 className="text-lg font-bold text-slate-900">Submit Milestone for Review</h2>
            <p className="text-xs text-slate-500">Milestone: <strong>{submitMilestoneModal.title}</strong></p>
            <form onSubmit={handleMilestoneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Completion Note (Optional)</label>
                <textarea
                  value={milestoneComment}
                  onChange={(e) => setMilestoneComment(e.target.value)}
                  rows="3"
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 resize-none"
                  placeholder="Describe what you accomplished for this milestone..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 transition">
                  Submit for Review
                </button>
                <button type="button" onClick={() => setSubmitMilestoneModal(null)} className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 transition">
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

export default MyThesis;
