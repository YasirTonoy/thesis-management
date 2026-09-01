const PDFDocument = require('pdfkit');

const COLORS = {
  heading: '#0f172a',
  label: '#64748b',
  body: '#334155',
  accent: '#2a78d6',
  rule: '#e2e8f0',
  good: '#0ca30c',
  warning: '#fab219',
  critical: '#d03b3b'
};

const sectionTitle = (doc, text) => {
  doc.moveDown(1.1);
  // Reset x and width explicitly — pdfkit otherwise inherits the last right-aligned column.
  const left = doc.page.margins.left;
  const width = doc.page.width - left - doc.page.margins.right;
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(COLORS.accent)
    .text(text.toUpperCase(), left, doc.y, { width, align: 'left', characterSpacing: 1 });
  doc.moveDown(0.35);
  const y = doc.y;
  doc.strokeColor(COLORS.rule).lineWidth(1).moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y).stroke();
  doc.moveDown(0.55);
};

const twoColumnRows = (doc, rows) => {
  const left = doc.page.margins.left;
  const width = doc.page.width - left - doc.page.margins.right;

  rows.forEach(([label, value]) => {
    const y = doc.y;
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.body).text(label, left, y, { width: width * 0.65 });
    doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.heading).text(String(value), left + width * 0.65, y, {
      width: width * 0.35,
      align: 'right'
    });
    doc.moveDown(0.25);
  });
};

/** A labelled proportional bar — the PDF's stand-in for the dashboard's charts. */
const barRow = (doc, label, value, max, color) => {
  const left = doc.page.margins.left;
  const width = doc.page.width - left - doc.page.margins.right;
  const labelWidth = width * 0.42;
  const trackWidth = width * 0.4;
  const y = doc.y;

  doc.font('Helvetica').fontSize(9.5).fillColor(COLORS.body).text(label, left, y, { width: labelWidth, ellipsis: true });

  const trackX = left + labelWidth + 8;
  const barY = y + 1.5;
  doc.roundedRect(trackX, barY, trackWidth, 8, 4).fillColor('#eef2f7').fill();
  if (max > 0 && value > 0) {
    doc.roundedRect(trackX, barY, Math.max((value / max) * trackWidth, 4), 8, 4).fillColor(color || COLORS.accent).fill();
  }

  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLORS.heading).text(String(value), trackX + trackWidth + 8, y, {
    width: width - labelWidth - trackWidth - 16,
    align: 'right'
  });
  doc.moveDown(0.45);
};

const buildAnalyticsPdf = (data, user, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 56 });
  doc.pipe(res);

  const { kpis } = data;

  doc.font('Helvetica-Bold').fontSize(20).fillColor(COLORS.heading).text('ResearchHub');
  doc.font('Helvetica').fontSize(10).fillColor(COLORS.label).text('University Thesis & Research Collaboration Platform');
  doc.moveDown(1);
  doc.font('Helvetica-Bold').fontSize(15).fillColor(COLORS.heading).text('Department Research Analytics Report');
  doc.font('Helvetica').fontSize(10).fillColor(COLORS.label).text(
    `${data.scope.department} · generated ${new Date(data.scope.generatedAt).toLocaleString()} by ${user.name}`
  );

  sectionTitle(doc, 'Key Figures');
  twoColumnRows(doc, [
    ['Total theses', kpis.totalProposals],
    ['Approved theses', kpis.approvedProposals],
    ['Students', kpis.students],
    ['Supervisors', kpis.supervisors],
    ['Active supervisions', kpis.activeSupervisions],
    ['Milestone completion rate', `${kpis.milestoneCompletionRate}%`],
    ['Overdue milestones', kpis.overdueMilestones],
    ['Average similarity', kpis.avgSimilarity === null ? 'No reports yet' : `${kpis.avgSimilarity}%`],
    ['Defenses scheduled', kpis.defensesScheduled],
    ['Defenses completed', kpis.defensesCompleted]
  ]);

  sectionTitle(doc, 'Theses by Status');
  const statusMax = Math.max(...Object.values(data.proposalStatus), 1);
  barRow(doc, 'Approved', data.proposalStatus.approved, statusMax, COLORS.good);
  barRow(doc, 'Pending', data.proposalStatus.pending, statusMax, COLORS.warning);
  barRow(doc, 'Rejected', data.proposalStatus.rejected, statusMax, COLORS.critical);

  sectionTitle(doc, 'Theses Submitted per Month');
  const monthMax = Math.max(...data.submissionsByMonth.map((m) => m.count), 1);
  data.submissionsByMonth.forEach((m) => barRow(doc, `${m.label} ${m.year}`, m.count, monthMax));

  if (doc.y > doc.page.height - 260) doc.addPage();

  sectionTitle(doc, 'Supervisor Load (active students)');
  if (data.supervisorLoad.length === 0) {
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.label).text('No supervisors in scope.');
  } else {
    const loadMax = Math.max(...data.supervisorLoad.map((s) => s.activeStudents), 1);
    data.supervisorLoad.slice(0, 10).forEach((s) => barRow(doc, s.name, s.activeStudents, loadMax));
  }

  sectionTitle(doc, 'Plagiarism Similarity Distribution');
  const bandMax = Math.max(...data.similarityBands.map((b) => b.count), 1);
  data.similarityBands.forEach((b) => barRow(doc, `${b.band} — ${b.label}`, b.count, bandMax, COLORS[b.severity]));

  sectionTitle(doc, 'Defense Outcomes');
  twoColumnRows(doc, [
    ['Pass', data.defenseOutcomes.pass],
    ['Pass with corrections', data.defenseOutcomes.pass_with_corrections],
    ['Fail', data.defenseOutcomes.fail]
  ]);

  if (doc.y > doc.page.height - 200) doc.addPage();

  sectionTitle(doc, 'Departments');
  twoColumnRows(
    doc,
    data.departments.map((d) => [d.department, `${d.proposals} theses · ${d.students} students · ${d.supervisors} supervisors`])
  );

  if (data.researchGroups.total > 0) {
    sectionTitle(doc, 'Research Groups');
    twoColumnRows(doc, [
      ['Total groups', data.researchGroups.total],
      ['Total memberships', data.researchGroups.totalMembers],
      ...data.researchGroups.top.map((g) => [`  ${g.name}`, `${g.members} members`])
    ]);
  }

  doc.font('Helvetica').fontSize(8).fillColor(COLORS.label).text(
    `Generated by ResearchHub on ${new Date().toLocaleString()}`,
    doc.page.margins.left,
    doc.page.height - doc.page.margins.bottom - 12,
    { width: doc.page.width - doc.page.margins.left - doc.page.margins.right, align: 'center' }
  );

  doc.end();
};

module.exports = { buildAnalyticsPdf };
