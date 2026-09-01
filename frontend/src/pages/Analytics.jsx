import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI } from '../api';
import { StatTile, AreaChart, BarList, StackedStatusBar, Meter, ChartCard } from '../components/charts';

const Analytics = () => {
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState('');
  const [showTables, setShowTables] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await analyticsAPI.overview(department || undefined);
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics');
    }
    setLoading(false);
  }, [department]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleExport = async (kind) => {
    setExporting(kind);
    try {
      const res = kind === 'pdf' ? await analyticsAPI.downloadPdf(department) : await analyticsAPI.downloadCsv(department);
      const type = kind === 'pdf' ? 'application/pdf' : 'text/csv';
      const url = window.URL.createObjectURL(new Blob([res.data], { type }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `research-analytics.${kind}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to generate the report');
    }
    setExporting('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return <div className="bg-white border border-red-200 rounded-lg p-6 text-red-600 text-sm">{error || 'No analytics available'}</div>;
  }

  const { kpis, proposalStatus, submissionsByMonth, supervisorLoad, similarityBands, defenseOutcomes, milestones } = data;

  const statusSegments = [
    { label: 'Approved', count: proposalStatus.approved, severity: 'good' },
    { label: 'Pending', count: proposalStatus.pending, severity: 'warning' },
    { label: 'Rejected', count: proposalStatus.rejected, severity: 'critical' }
  ];

  const outcomeItems = [
    { label: 'Pass', value: defenseOutcomes.pass, severity: 'good' },
    { label: 'Pass with corrections', value: defenseOutcomes.pass_with_corrections, severity: 'warning' },
    { label: 'Fail', value: defenseOutcomes.fail, severity: 'critical' }
  ];

  const similarityItems = similarityBands.map((b) => ({
    label: `${b.band} — ${b.label}`,
    value: b.count,
    severity: b.severity
  }));

  const loadItems = supervisorLoad.slice(0, 8).map((s) => ({ label: s.name, value: s.activeStudents }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Research Analytics</h1>
          <p className="text-sm text-slate-500">
            {data.scope.department} · generated {new Date(data.scope.generatedAt).toLocaleString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {data.canChooseDepartment && (
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {data.departmentOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          <button
            onClick={() => setShowTables((s) => !s)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            {showTables ? 'Hide Data Tables' : 'Show Data Tables'}
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting === 'csv'}
            className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {exporting === 'csv' ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting === 'pdf'}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {exporting === 'pdf' ? 'Generating...' : 'Download Report (PDF)'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Total Theses" value={kpis.totalProposals} sub={`${kpis.approvedProposals} approved`} />
        <StatTile label="Active Supervisions" value={kpis.activeSupervisions} sub={`${kpis.supervisors} supervisors`} />
        <StatTile
          label="Milestone Completion"
          value={`${kpis.milestoneCompletionRate}%`}
          sub={kpis.overdueMilestones > 0 ? `${kpis.overdueMilestones} overdue` : 'None overdue'}
          tone={kpis.overdueMilestones > 0 ? 'critical' : 'good'}
        />
        <StatTile
          label="Average Similarity"
          value={kpis.avgSimilarity === null ? '—' : `${kpis.avgSimilarity}%`}
          sub={kpis.avgSimilarity === null ? 'No reports yet' : 'Latest report per thesis'}
        />
      </div>

      <ChartCard title="Theses Submitted per Month" subtitle="Last 12 months">
        <AreaChart data={submissionsByMonth} />
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Theses by Status" subtitle={`${kpis.totalProposals} total`}>
          <StackedStatusBar segments={statusSegments} />
        </ChartCard>

        <ChartCard title="Milestone Progress" subtitle={`${milestones.total} milestones tracked`}>
          <Meter
            value={kpis.milestoneCompletionRate}
            label="approved"
            sub={`${milestones.approved} approved · ${milestones.submitted} awaiting review · ${milestones.pending} pending · ${milestones.overdue} overdue`}
          />
        </ChartCard>

        <ChartCard title="Supervisor Load" subtitle="Active students per supervisor">
          <BarList items={loadItems} emptyText="No supervisors in this department yet." />
        </ChartCard>

        <ChartCard title="Plagiarism Similarity" subtitle="Latest report per thesis">
          <BarList items={similarityItems} tone labelClass="w-52" emptyText="No plagiarism reports yet." />
        </ChartCard>
      </div>

      <ChartCard title="Defense Outcomes" subtitle={`${kpis.defensesCompleted} completed · ${kpis.defensesScheduled} scheduled`}>
        <BarList items={outcomeItems} tone labelClass="w-52" emptyText="No defenses completed yet." />
      </ChartCard>

      <ChartCard title="Departments" subtitle="Across the whole platform">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-2 pr-4">Department</th>
                <th className="py-2 pr-4 text-right">Theses</th>
                <th className="py-2 pr-4 text-right">Approved</th>
                <th className="py-2 pr-4 text-right">Students</th>
                <th className="py-2 text-right">Supervisors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.departments.map((d) => (
                <tr key={d.department}>
                  <td className="py-2.5 pr-4 text-slate-800 font-medium">{d.department}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-slate-700">{d.proposals}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-slate-700">{d.approved}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-slate-700">{d.students}</td>
                  <td className="py-2.5 text-right tabular-nums text-slate-700">{d.supervisors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {data.researchGroups.total > 0 && (
        <ChartCard
          title="Research Groups"
          subtitle={`${data.researchGroups.total} groups · ${data.researchGroups.totalMembers} memberships`}
        >
          <BarList items={data.researchGroups.top.map((g) => ({ label: g.name, value: g.members }))} />
        </ChartCard>
      )}

      {showTables && (
        <ChartCard title="Data Tables" subtitle="The same figures in text form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Theses per Month</h3>
              <table className="w-full">
                <tbody className="divide-y divide-slate-100">
                  {submissionsByMonth.map((m) => (
                    <tr key={m.month}>
                      <td className="py-1.5 text-slate-600">{m.label} {m.year}</td>
                      <td className="py-1.5 text-right tabular-nums text-slate-900 font-medium">{m.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Supervisor Load</h3>
              <table className="w-full">
                <tbody className="divide-y divide-slate-100">
                  {supervisorLoad.map((s) => (
                    <tr key={s.name}>
                      <td className="py-1.5 text-slate-600">{s.name}</td>
                      <td className="py-1.5 text-right tabular-nums text-slate-900 font-medium">
                        {s.activeStudents} active · {s.proposals} theses
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ChartCard>
      )}
    </div>
  );
};

export default Analytics;
