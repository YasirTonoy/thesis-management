const Notification = require('../models/Notification');
const Milestone = require('../models/Milestone');
const Meeting = require('../models/Meeting');
const Defense = require('../models/Defense');
const Proposal = require('../models/Proposal');

const DAY = 24 * 60 * 60 * 1000;

/** Reminder windows, checked nearest-first so each deadline yields one notification per stage. */
const WINDOWS = [
  { key: 'd1', maxMs: DAY, severity: 'warning', label: 'due within 24 hours' },
  { key: 'd3', maxMs: 3 * DAY, severity: 'info', label: 'due in 3 days' },
  { key: 'd7', maxMs: 7 * DAY, severity: 'info', label: 'due in 7 days' }
];

/** Returns the reminder stage for a deadline, or null when it is too far out to warn about. */
const stageFor = (date) => {
  const msLeft = new Date(date).getTime() - Date.now();
  if (msLeft < 0) return { key: 'overdue', severity: 'critical', label: 'overdue' };
  return WINDOWS.find((w) => msLeft <= w.maxMs) || null;
};

const formatDate = (date) => new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const addUnique = (map, notification) => {
  if (!notification.user) return;
  const id = `${notification.user}|${notification.dedupeKey}`;
  if (!map.has(id)) map.set(id, notification);
};

const buildMilestoneReminders = async (filter, pending) => {
  const milestones = await Milestone.find({ ...filter, status: { $in: ['pending', 'rejected'] } }).select(
    'title dueDate student supervisor status'
  );

  milestones.forEach((m) => {
    const stage = stageFor(m.dueDate);
    if (!stage) return;

    const overdue = stage.key === 'overdue';
    const base = {
      type: overdue ? 'milestone_overdue' : 'milestone_due',
      severity: stage.severity,
      title: overdue ? `Milestone overdue: ${m.title}` : `Milestone ${stage.label}: ${m.title}`,
      message: overdue
        ? `This milestone was due on ${formatDate(m.dueDate)} and has not been submitted.`
        : `This milestone is due on ${formatDate(m.dueDate)}.`,
      link: '/milestones',
      dueAt: m.dueDate,
      dedupeKey: `milestone:${m._id}:${stage.key}`
    };

    [m.student, m.supervisor].forEach((recipient) => addUnique(pending, { ...base, user: recipient }));
  });
};

const buildMeetingReminders = async (filter, pending) => {
  const meetings = await Meeting.find({ ...filter, status: 'confirmed', confirmedDateTime: { $ne: null } }).select(
    'title confirmedDateTime student supervisor location meetingLink'
  );

  meetings.forEach((mt) => {
    const stage = stageFor(mt.confirmedDateTime);
    if (!stage || stage.key !== 'd1') return;

    const base = {
      type: 'meeting_upcoming',
      severity: 'warning',
      title: `Meeting tomorrow: ${mt.title}`,
      message: `Scheduled for ${new Date(mt.confirmedDateTime).toLocaleString()}${mt.location ? ` at ${mt.location}` : ''}.`,
      link: '/dashboard',
      dueAt: mt.confirmedDateTime,
      dedupeKey: `meeting:${mt._id}:d1`
    };

    [mt.student, mt.supervisor].forEach((recipient) => addUnique(pending, { ...base, user: recipient }));
  });
};

const buildDefenseReminders = async (defenseFilter, pending) => {
  const defenses = await Defense.find({ ...defenseFilter, status: 'scheduled' })
    .select('scheduledAt venue mode examiners proposal')
    .populate({ path: 'proposal', select: 'title submittedBy supervisor coSupervisor' });

  defenses.forEach((d) => {
    const stage = stageFor(d.scheduledAt);
    if (!stage || stage.key === 'overdue') return;

    const proposal = d.proposal;
    if (!proposal) return;

    const base = {
      type: 'defense_upcoming',
      severity: stage.key === 'd1' ? 'warning' : 'info',
      title: `Defense ${stage.label}: ${proposal.title}`,
      message: `Scheduled for ${new Date(d.scheduledAt).toLocaleString()}${
        d.mode === 'onsite' && d.venue ? ` at ${d.venue}` : ' (online)'
      }.`,
      link: `/my-thesis/${proposal._id}/defense`,
      dueAt: d.scheduledAt,
      dedupeKey: `defense:${d._id}:${stage.key}`
    };

    const recipients = [proposal.submittedBy, proposal.supervisor, proposal.coSupervisor, ...d.examiners.map((e) => e.user)];
    recipients.forEach((recipient) => addUnique(pending, { ...base, user: recipient }));
  });
};

/** Inserts only reminders that do not already exist, so repeated calls are safe. */
const persist = async (pending) => {
  const notifications = [...pending.values()];
  if (notifications.length === 0) return 0;

  const result = await Notification.bulkWrite(
    notifications.map((n) => ({
      updateOne: {
        filter: { user: n.user, dedupeKey: n.dedupeKey },
        update: { $setOnInsert: n },
        upsert: true
      }
    })),
    { ordered: false }
  ).catch((err) => {
    // A concurrent request may have inserted the same reminder first; that is not an error.
    if (err.code === 11000 || err.writeErrors) return { upsertedCount: 0 };
    throw err;
  });

  return result.upsertedCount || 0;
};

/** Generates any due reminders for one user. Called lazily whenever notifications are read. */
const generateForUser = async (user) => {
  const pending = new Map();
  const userId = user.id || user._id;

  // A defense concerns this user either through the thesis or through the examiner panel.
  const ownThesisIds = await Proposal.find({
    $or: [{ submittedBy: userId }, { supervisor: userId }, { coSupervisor: userId }]
  }).distinct('_id');

  await Promise.all([
    buildMilestoneReminders({ $or: [{ student: userId }, { supervisor: userId }] }, pending),
    buildMeetingReminders({ $or: [{ student: userId }, { supervisor: userId }] }, pending),
    buildDefenseReminders({ $or: [{ 'examiners.user': userId }, { proposal: { $in: ownThesisIds } }] }, pending)
  ]);

  // A defense fans out to the whole panel, so keep only the entries addressed to this user.
  for (const [key, value] of pending) {
    if (String(value.user) !== String(userId)) pending.delete(key);
  }

  return persist(pending);
};

/** Generates reminders for every affected user in one pass. Used by the admin sweep. */
const generateForEveryone = async () => {
  const pending = new Map();

  await Promise.all([
    buildMilestoneReminders({}, pending),
    buildMeetingReminders({}, pending),
    buildDefenseReminders({}, pending)
  ]);

  return persist(pending);
};

module.exports = { generateForUser, generateForEveryone };
