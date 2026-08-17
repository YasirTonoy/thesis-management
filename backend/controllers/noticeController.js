const Notice = require('../models/Notice');
const User = require('../models/User');

const createNotice = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }
    const notice = await Notice.create({ title, content, postedBy: req.user.id });
    res.status(201).json({ success: true, data: notice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyNotices = async (req, res) => {
  try {
    const notices = await Notice.find({ postedBy: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: notices.length, data: notices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getNoticesBySupervisor = async (req, res) => {
  try {
    const supervisor = await User.findOne({ _id: req.params.supervisorId, role: 'supervisor' }).select('name department');
    if (!supervisor) return res.status(404).json({ success: false, message: 'Supervisor not found' });

    const notices = await Notice.find({ postedBy: req.params.supervisorId }).sort({ createdAt: -1 });
    res.json({ success: true, supervisor, count: notices.length, data: notices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createNotice, getMyNotices, getNoticesBySupervisor };
