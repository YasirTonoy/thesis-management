const Defense = require('../models/Defense');
const User = require('../models/User');
const FinalSubmission = require('../models/FinalSubmission');
const { getAccessibleProposal } = require('../utils/proposalAccess');

const POPULATE = [
  { path: 'scheduledBy', select: 'name role' },
  { path: 'resultRecordedBy', select: 'name' },
  { path: 'examiners.user', select: 'name email department' },
  { path: 'finalSubmission', select: 'status' }
];

const isExaminer = (defense, user) =>
  (defense.examiners || []).some((e) => String(e.user?._id || e.user) === String(user.id));

/** Supervisors and admins who own the thesis may manage the defense; examiners may only view and respond. */
const canManage = async (proposalId, user) => {
  if (!['supervisor', 'admin'].includes(user.role)) return null;
  return getAccessibleProposal(proposalId, user);
};

const normalizeExaminers = async (rawExaminers, proposal) => {
  if (!Array.isArray(rawExaminers) || rawExaminers.length === 0) {
    return { error: 'At least one examiner must be assigned' };
  }

  const seen = new Set();
  const examiners = [];

  for (const entry of rawExaminers) {
    const userId = entry?.user || entry?.userId;
    if (!userId) return { error: 'Each examiner must reference a user' };
    if (seen.has(String(userId))) return { error: 'The same examiner cannot be assigned twice' };
    seen.add(String(userId));

    const candidate = await User.findById(userId).select('role');
    if (!candidate) return { error: 'One of the selected examiners does not exist' };
    if (!['supervisor', 'admin'].includes(candidate.role)) {
      return { error: 'Only faculty members can be assigned as examiners' };
    }
    if (String(candidate._id) === String(proposal.supervisor?._id || proposal.supervisor)) {
      return { error: 'The thesis supervisor cannot also be an examiner' };
    }

    examiners.push({ user: userId, role: entry.role || 'internal' });
  }

  return { examiners };
};

const scheduleDefense = async (req, res) => {
  try {
    const { proposalId, scheduledAt, durationMinutes, mode, venue, meetingLink, examiners, notes } = req.body;

    if (!proposalId || !scheduledAt) {
      return res.status(400).json({ success: false, message: 'Proposal and defense date/time are required' });
    }
    if (!['supervisor', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only supervisors and admins can schedule a defense' });
    }

    const proposal = await canManage(proposalId, req.user);
    if (!proposal) return res.status(403).json({ success: false, message: 'You do not have access to this thesis, or it is not yet approved' });

    const when = new Date(scheduledAt);
    if (Number.isNaN(when.getTime())) return res.status(400).json({ success: false, message: 'Invalid defense date/time' });
    if (when.getTime() < Date.now()) return res.status(400).json({ success: false, message: 'The defense date must be in the future' });

    const existing = await Defense.findOne({ proposal: proposalId });
    if (existing && existing.status !== 'cancelled') {
      return res.status(400).json({ success: false, message: 'A defense is already scheduled for this thesis' });
    }

    const { examiners: normalized, error } = await normalizeExaminers(examiners, proposal);
    if (error) return res.status(400).json({ success: false, message: error });

    const finalSubmission = await FinalSubmission.findOne({ proposal: proposalId }).select('_id');

    const payload = {
      proposal: proposalId,
      finalSubmission: finalSubmission?._id || null,
      scheduledAt: when,
      durationMinutes: durationMinutes || 60,
      mode: mode === 'online' ? 'online' : 'onsite',
      venue: (venue || '').trim(),
      meetingLink: (meetingLink || '').trim(),
      examiners: normalized,
      scheduledBy: req.user.id,
      status: 'scheduled',
      notes: (notes || '').trim(),
      outcome: 'pending',
      resultComment: ''
    };

    let defense;
    if (existing) {
      existing.set(payload);
      existing.resultRecordedBy = undefined;
      existing.resultRecordedAt = undefined;
      await existing.save();
      defense = existing;
    } else {
      defense = await Defense.create(payload);
    }

    const populated = await defense.populate(POPULATE);
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDefense = async (req, res) => {
  try {
    const { proposalId } = req.query;
    if (!proposalId) return res.status(400).json({ success: false, message: 'proposalId is required' });

    const defense = await Defense.findOne({ proposal: proposalId }).populate(POPULATE);

    const proposal = await getAccessibleProposal(proposalId, req.user);
    if (!proposal && !(defense && isExaminer(defense, req.user))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this thesis' });
    }

    res.json({ success: true, data: defense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyDefenses = async (req, res) => {
  try {
    const defenses = await Defense.find({ 'examiners.user': req.user.id, status: { $ne: 'cancelled' } })
      .populate(POPULATE)
      .populate({ path: 'proposal', select: 'title students' })
      .sort({ scheduledAt: 1 });

    res.json({ success: true, count: defenses.length, data: defenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateDefense = async (req, res) => {
  try {
    const defense = await Defense.findById(req.params.id);
    if (!defense) return res.status(404).json({ success: false, message: 'Defense not found' });

    const proposal = await canManage(defense.proposal, req.user);
    if (!proposal) return res.status(403).json({ success: false, message: 'You do not have access to this thesis' });
    if (defense.status === 'completed') {
      return res.status(400).json({ success: false, message: 'A completed defense cannot be rescheduled' });
    }

    const { scheduledAt, durationMinutes, mode, venue, meetingLink, examiners, notes, status } = req.body;

    if (scheduledAt !== undefined) {
      const when = new Date(scheduledAt);
      if (Number.isNaN(when.getTime())) return res.status(400).json({ success: false, message: 'Invalid defense date/time' });
      if (when.getTime() !== defense.scheduledAt.getTime()) {
        if (when.getTime() < Date.now()) return res.status(400).json({ success: false, message: 'The defense date must be in the future' });
        defense.scheduledAt = when;
        // A new date invalidates the previous acceptances.
        defense.examiners.forEach((e) => {
          e.invitationStatus = 'invited';
          e.responseNote = '';
          e.respondedAt = undefined;
        });
      }
    }

    if (examiners !== undefined) {
      const { examiners: normalized, error } = await normalizeExaminers(examiners, proposal);
      if (error) return res.status(400).json({ success: false, message: error });

      const previous = new Map(defense.examiners.map((e) => [String(e.user), e]));
      defense.examiners = normalized.map((e) => {
        const prior = previous.get(String(e.user));
        if (prior && prior.role === e.role) return prior;
        return e;
      });
    }

    if (durationMinutes !== undefined) defense.durationMinutes = durationMinutes;
    if (mode !== undefined) defense.mode = mode === 'online' ? 'online' : 'onsite';
    if (venue !== undefined) defense.venue = venue.trim();
    if (meetingLink !== undefined) defense.meetingLink = meetingLink.trim();
    if (notes !== undefined) defense.notes = notes.trim();
    if (status === 'cancelled') defense.status = 'cancelled';

    await defense.save();

    const populated = await defense.populate(POPULATE);
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const respondToInvitation = async (req, res) => {
  try {
    const { invitationStatus, responseNote } = req.body;

    if (!['accepted', 'declined'].includes(invitationStatus)) {
      return res.status(400).json({ success: false, message: 'invitationStatus must be accepted or declined' });
    }

    const defense = await Defense.findById(req.params.id);
    if (!defense) return res.status(404).json({ success: false, message: 'Defense not found' });
    if (defense.status !== 'scheduled') {
      return res.status(400).json({ success: false, message: 'This defense is no longer open for responses' });
    }

    const entry = defense.examiners.find((e) => String(e.user) === String(req.user.id));
    if (!entry) return res.status(403).json({ success: false, message: 'You are not an assigned examiner for this defense' });

    entry.invitationStatus = invitationStatus;
    entry.responseNote = responseNote || '';
    entry.respondedAt = new Date();
    await defense.save();

    const populated = await defense.populate(POPULATE);
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const recordResult = async (req, res) => {
  try {
    const { outcome, resultComment } = req.body;

    if (!['pass', 'pass_with_corrections', 'fail'].includes(outcome)) {
      return res.status(400).json({ success: false, message: 'outcome must be pass, pass_with_corrections or fail' });
    }

    const defense = await Defense.findById(req.params.id);
    if (!defense) return res.status(404).json({ success: false, message: 'Defense not found' });

    const proposal = await canManage(defense.proposal, req.user);
    if (!proposal) return res.status(403).json({ success: false, message: 'You do not have access to this thesis' });
    if (defense.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'A cancelled defense has no result to record' });
    }

    defense.outcome = outcome;
    defense.resultComment = resultComment || '';
    defense.status = 'completed';
    defense.resultRecordedBy = req.user.id;
    defense.resultRecordedAt = new Date();
    await defense.save();

    const populated = await defense.populate(POPULATE);
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { scheduleDefense, getDefense, getMyDefenses, updateDefense, respondToInvitation, recordResult };
