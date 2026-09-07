const Comment = require('../models/Comment');
const Proposal = require('../models/Proposal');
const { getAccessibleProposal } = require('../utils/proposalAccess');

// @desc    Get comments for a proposal
// @route   GET /api/comments
// @access  Protected
const getComments = async (req, res) => {
  try {
    const { proposalId } = req.query;

    if (!proposalId) {
      return res.status(400).json({ success: false, message: 'proposalId query parameter is required' });
    }

    // Verify access to the proposal
    await getAccessibleProposal(proposalId, req.user);

    const comments = await Comment.find({ proposal: proposalId })
      .populate('author', 'name email role department')
      .sort({ createdAt: 1 });

    res.json({ success: true, count: comments.length, data: comments });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// @desc    Post a comment or supervisor feedback
// @route   POST /api/comments
// @access  Protected
const createComment = async (req, res) => {
  try {
    const { proposalId, content, category, attachmentUrl, attachmentName, parentComment } = req.body;

    if (!proposalId || !content) {
      return res.status(400).json({ success: false, message: 'proposalId and content are required' });
    }

    // Verify access to proposal
    await getAccessibleProposal(proposalId, req.user);

    const comment = await Comment.create({
      proposal: proposalId,
      author: req.user.id,
      authorName: req.user.name,
      authorRole: req.user.role,
      content,
      category: category || (req.user.role === 'supervisor' ? 'feedback' : 'general'),
      attachmentUrl: attachmentUrl || '',
      attachmentName: attachmentName || '',
      parentComment: parentComment || null
    });

    const populated = await Comment.findById(comment._id)
      .populate('author', 'name email role department');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Protected (author or supervisor or admin)
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const isAuthor = comment.author.toString() === req.user.id;
    const isStaff = ['supervisor', 'admin'].includes(req.user.role);

    if (!isAuthor && !isStaff) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    await Comment.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getComments, createComment, deleteComment };
