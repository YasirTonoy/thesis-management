const User = require('../models/User');
const Proposal = require('../models/Proposal');
const Supervision = require('../models/Supervision');
const Milestone = require('../models/Milestone');
const PlagiarismReport = require('../models/PlagiarismReport');
const Defense = require('../models/Defense');
const FinalSubmission = require('../models/FinalSubmission');
const ResearchGroup = require('../models/ResearchGroup');
const { buildAnalyticsPdf } = require('../utils/analyticsPdf');

const MONTHS_BACK = 12;

/** Admins see every department (or one they pick); supervisors see only their own. */
const resolveScope = (req) => {
  if (req.user.role === 'admin') return { department: req.query.department || null, canChoose: true };
  if (req.user.role === 'supervisor') return { department: req.user.department, canChoose: false };
  return null;
};

/** Proposals have no department of their own — they inherit it from the supervising faculty. */
const buildFilters = async (department) => {
  if (!department) return { userFilter: {}, proposalFilter: {}, supervisorIds: null };

  const userFilter = { department };
  const supervisorIds = await User.find({ role: 'supervisor', department }).distinct('_id');
  return { userFilter, proposalFilter: { supervisor: { $in: supervisorIds } }, supervisorIds };
};

const countByKey = (rows, keys) => {
  const map = Object.fromEntries(keys.map((k) => [k, 0]));
  rows.forEach((r) => {
    if (r._id in map) map[r._id] = r.count;
  });
  return map;
};

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const buildMonthSeries = (rows) => {
  const counts = Object.fromEntries(rows.map((r) => [r._id, r.count]));
  const series = [];
  const cursor = new Date();
  cursor.setDate(1);
  cursor.setMonth(cursor.getMonth() - (MONTHS_BACK - 1));

  for (let i = 0; i < MONTHS_BACK; i += 1) {
    const key = monthKey(cursor);
    series.push({
      month: key,
      // Sliced so every axis tick is the same width ("Sept" would otherwise break the rhythm).
      label: cursor.toLocaleDateString('en-GB', { month: 'short' }).slice(0, 3),
      year: cursor.getFullYear(),
      count: counts[key] || 0
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return series;
};

/** Latest report per thesis — a thesis that was re-checked should count once, at its newest score. */
const latestSimilarityPerThesis = async (proposalFilter) => {
  const proposalIds = await Proposal.find(proposalFilter).distinct('_id');
  const rows = await PlagiarismReport.aggregate([
    { $match: { proposal: { $in: proposalIds } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: '$proposal', similarity: { $first: '$similarityPercentage' } } }
  ]);
  return rows.map((r) => r.similarity);
};

const collectAnalytics = async (department) => {
  const { userFilter, proposalFilter } = await buildFilters(department);

  const [
    students,
    supervisors,
    proposalStatusRows,
    proposalMonthRows,
    activeSupervisions,
    milestoneStatusRows,
    overdueMilestones,
    similarities,
    defenseOutcomeRows,
    defensesScheduled,
    finalStatusRows,
    groups,
    departmentNames
  ] = await Promise.all([
    User.countDocuments({ role: 'student', ...userFilter }),
    User.countDocuments({ role: 'supervisor', ...userFilter }),
    Proposal.aggregate([{ $match: proposalFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Proposal.aggregate([
      { $match: proposalFilter },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } }
    ]),
    Supervision.countDocuments({ isActive: true }),
    Milestone.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Milestone.countDocuments({ status: { $in: ['pending', 'rejected'] }, dueDate: { $lt: new Date() } }),
    latestSimilarityPerThesis(proposalFilter),
    Defense.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: '$outcome', count: { $sum: 1 } } }]),
    Defense.countDocuments({ status: 'scheduled' }),
    FinalSubmission.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ResearchGroup.find(department ? { department } : {}).select('name researchArea members'),
    User.distinct('department')
  ]);

  const proposalStatus = countByKey(proposalStatusRows, ['pending', 'approved', 'rejected']);
  const milestoneStatus = countByKey(milestoneStatusRows, ['pending', 'submitted', 'approved', 'rejected']);
  const finalStatus = countByKey(finalStatusRows, ['submitted', 'accepted', 'returned']);
  const defenseOutcomes = countByKey(defenseOutcomeRows, ['pass', 'pass_with_corrections', 'fail']);

  const totalProposals = Object.values(proposalStatus).reduce((a, b) => a + b, 0);
  const totalMilestones = Object.values(milestoneStatus).reduce((a, b) => a + b, 0);

  const avgSimilarity = similarities.length
    ? Math.round((similarities.reduce((a, b) => a + b, 0) / similarities.length) * 10) / 10
    : null;

  const similarityBands = [
    { band: '0–20%', label: 'Within limit', severity: 'good', count: similarities.filter((s) => s <= 20).length },
    { band: '21–40%', label: 'Needs attention', severity: 'warning', count: similarities.filter((s) => s > 20 && s <= 40).length },
    { band: '41–100%', label: 'Above threshold', severity: 'critical', count: similarities.filter((s) => s > 40).length }
  ];

  // Supervisor load: active supervisions plus the proposals each is named on.
  const supervisorDocs = await User.find({ role: 'supervisor', ...userFilter }).select('name department');
  const [loadRows, proposalRows] = await Promise.all([
    Supervision.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$supervisor', count: { $sum: 1 } } }]),
    Proposal.aggregate([{ $match: proposalFilter }, { $group: { _id: '$supervisor', count: { $sum: 1 } } }])
  ]);
  const loadMap = Object.fromEntries(loadRows.map((r) => [String(r._id), r.count]));
  const propMap = Object.fromEntries(proposalRows.map((r) => [String(r._id), r.count]));

  const supervisorLoad = supervisorDocs
    .map((s) => ({
      name: s.name,
      department: s.department,
      activeStudents: loadMap[String(s._id)] || 0,
      proposals: propMap[String(s._id)] || 0
    }))
    .sort((a, b) => b.activeStudents - a.activeStudents || b.proposals - a.proposals);

  // Per-department rollup, always across every department so admins can compare.
  const allDepartments = departmentNames.filter(Boolean);
  const departments = await Promise.all(
    allDepartments.map(async (dept) => {
      const deptSupervisors = await User.find({ role: 'supervisor', department: dept }).distinct('_id');
      const [deptStudents, deptSupCount, deptProposals, deptApproved] = await Promise.all([
        User.countDocuments({ role: 'student', department: dept }),
        User.countDocuments({ role: 'supervisor', department: dept }),
        Proposal.countDocuments({ supervisor: { $in: deptSupervisors } }),
        Proposal.countDocuments({ supervisor: { $in: deptSupervisors }, status: 'approved' })
      ]);
      return { department: dept, students: deptStudents, supervisors: deptSupCount, proposals: deptProposals, approved: deptApproved };
    })
  );

  return {
    scope: { department: department || 'All Departments', generatedAt: new Date() },
    kpis: {
      totalProposals,
      approvedProposals: proposalStatus.approved,
      students,
      supervisors,
      activeSupervisions,
      defensesScheduled,
      defensesCompleted: Object.values(defenseOutcomes).reduce((a, b) => a + b, 0),
      milestoneCompletionRate: totalMilestones ? Math.round((milestoneStatus.approved / totalMilestones) * 100) : 0,
      avgSimilarity,
      overdueMilestones
    },
    proposalStatus,
    submissionsByMonth: buildMonthSeries(proposalMonthRows),
    supervisorLoad,
    milestones: { ...milestoneStatus, total: totalMilestones, overdue: overdueMilestones },
    similarityBands,
    defenseOutcomes,
    finalStatus,
    departments: departments.sort((a, b) => b.proposals - a.proposals),
    researchGroups: {
      total: groups.length,
      totalMembers: groups.reduce((sum, g) => sum + (g.members?.length || 0), 0),
      top: groups
        .map((g) => ({ name: g.name, researchArea: g.researchArea, members: g.members?.length || 0 }))
        .sort((a, b) => b.members - a.members)
        .slice(0, 5)
    }
  };
};

const getOverview = async (req, res) => {
  try {
    const scope = resolveScope(req);
    if (!scope) return res.status(403).json({ success: false, message: 'Only supervisors and admins can view department analytics' });

    const data = await collectAnalytics(scope.department);
    const departmentOptions = scope.canChoose ? (await User.distinct('department')).filter(Boolean).sort() : [];

    res.json({ success: true, data: { ...data, canChooseDepartment: scope.canChoose, departmentOptions } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const escapeCsv = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const downloadCsv = async (req, res) => {
  try {
    const scope = resolveScope(req);
    if (!scope) return res.status(403).json({ success: false, message: 'Only supervisors and admins can export analytics' });

    const data = await collectAnalytics(scope.department);
    const rows = [['Section', 'Metric', 'Value']];

    Object.entries(data.kpis).forEach(([k, v]) => rows.push(['Key Figures', k, v === null ? 'n/a' : v]));
    Object.entries(data.proposalStatus).forEach(([k, v]) => rows.push(['Proposals by Status', k, v]));
    data.submissionsByMonth.forEach((m) => rows.push(['Proposals per Month', `${m.label} ${m.year}`, m.count]));
    data.supervisorLoad.forEach((s) => rows.push(['Supervisor Load', s.name, `${s.activeStudents} active / ${s.proposals} proposals`]));
    data.similarityBands.forEach((b) => rows.push(['Plagiarism Similarity', `${b.band} (${b.label})`, b.count]));
    Object.entries(data.defenseOutcomes).forEach(([k, v]) => rows.push(['Defense Outcomes', k, v]));
    data.departments.forEach((d) =>
      rows.push(['Departments', d.department, `${d.students} students / ${d.supervisors} supervisors / ${d.proposals} proposals`])
    );

    const csv = rows.map((r) => r.map(escapeCsv).join(',')).join('\n');
    const slug = String(data.scope.department).replace(/[^a-z0-9]+/gi, '-').toLowerCase();

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="research-analytics-${slug}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadPdf = async (req, res) => {
  try {
    const scope = resolveScope(req);
    if (!scope) return res.status(403).json({ success: false, message: 'Only supervisors and admins can export analytics' });

    const data = await collectAnalytics(scope.department);
    const slug = String(data.scope.department).replace(/[^a-z0-9]+/gi, '-').toLowerCase();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="research-analytics-${slug}.pdf"`);
    buildAnalyticsPdf(data, req.user, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getOverview, downloadCsv, downloadPdf };
