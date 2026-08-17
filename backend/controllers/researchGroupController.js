const ResearchGroup = require('../models/ResearchGroup');
const GroupPost = require('../models/GroupPost');

// ─── GROUPS ────────────────────────────────────────────────────────────────

// @desc    Create a research group
// @route   POST /api/research-groups
// @access  Protected
const createGroup = async (req, res) => {
  try {
    const { name, description, researchArea, department, isOpen, maxMembers } = req.body;

    const group = await ResearchGroup.create({
      name,
      description: description || '',
      researchArea: researchArea || '',
      department: department || 'Computer Science & Engineering',
      isOpen: isOpen !== undefined ? isOpen : true,
      maxMembers: maxMembers || 20,
      createdBy: req.user.id,
      members: [{ user: req.user.id, role: 'admin', joinedAt: new Date() }]
    });

    const populated = await ResearchGroup.findById(group._id)
      .populate('createdBy', 'name email role')
      .populate('members.user', 'name email role');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all research groups
// @route   GET /api/research-groups
// @access  Protected
const getGroups = async (req, res) => {
  try {
    const groups = await ResearchGroup.find()
      .populate('createdBy', 'name email role')
      .populate('members.user', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: groups.length, data: groups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single research group by ID
// @route   GET /api/research-groups/:id
// @access  Protected
const getGroupById = async (req, res) => {
  try {
    const group = await ResearchGroup.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('members.user', 'name email role');

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    res.json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Join a research group
// @route   POST /api/research-groups/:id/join
// @access  Protected
const joinGroup = async (req, res) => {
  try {
    const group = await ResearchGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (!group.isOpen) {
      return res.status(403).json({ success: false, message: 'This group is closed to new members' });
    }

    const alreadyMember = group.members.some(m => m.user.toString() === req.user.id);
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'You are already a member of this group' });
    }

    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ success: false, message: 'Group is at maximum capacity' });
    }

    group.members.push({ user: req.user.id, role: 'member', joinedAt: new Date() });
    await group.save();

    const populated = await ResearchGroup.findById(group._id)
      .populate('createdBy', 'name email role')
      .populate('members.user', 'name email role');

    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Leave a research group
// @route   POST /api/research-groups/:id/leave
// @access  Protected
const leaveGroup = async (req, res) => {
  try {
    const group = await ResearchGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Creator cannot leave (they must delete or transfer)
    if (group.createdBy.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'Group creator cannot leave. Delete the group instead.' });
    }

    group.members = group.members.filter(m => m.user.toString() !== req.user.id);
    await group.save();

    res.json({ success: true, message: 'Left group successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POSTS ─────────────────────────────────────────────────────────────────

// @desc    Create a post in a group
// @route   POST /api/research-groups/:id/posts
// @access  Protected (must be member)
const createPost = async (req, res) => {
  try {
    const group = await ResearchGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = group.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'You must be a group member to post' });
    }

    const { title, content, attachmentUrl, attachmentName, category } = req.body;

    const post = await GroupPost.create({
      group: group._id,
      author: req.user.id,
      authorName: req.user.name,
      authorRole: req.user.role,
      title,
      content,
      attachmentUrl: attachmentUrl || '',
      attachmentName: attachmentName || '',
      category: category || 'general'
    });

    const populated = await GroupPost.findById(post._id)
      .populate('author', 'name email role')
      .populate('replies.author', 'name email role');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get posts for a group
// @route   GET /api/research-groups/:id/posts
// @access  Protected
const getPosts = async (req, res) => {
  try {
    const posts = await GroupPost.find({ group: req.params.id })
      .populate('author', 'name email role')
      .populate('replies.author', 'name email role')
      .sort({ isPinned: -1, createdAt: -1 });

    res.json({ success: true, count: posts.length, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a reply to a post
// @route   POST /api/research-groups/:id/posts/:postId/replies
// @access  Protected (must be member)
const addReply = async (req, res) => {
  try {
    const group = await ResearchGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = group.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'You must be a group member to reply' });
    }

    const post = await GroupPost.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: 'Reply content is required' });
    }

    post.replies.push({
      author: req.user.id,
      authorName: req.user.name,
      authorRole: req.user.role,
      content
    });

    await post.save();

    const populated = await GroupPost.findById(post._id)
      .populate('author', 'name email role')
      .populate('replies.author', 'name email role');

    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createGroup, getGroups, getGroupById, joinGroup, leaveGroup,
  createPost, getPosts, addReply
};
