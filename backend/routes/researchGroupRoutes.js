const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createGroup, getGroups, getGroupById, joinGroup, leaveGroup,
  createPost, getPosts, addReply
} = require('../controllers/researchGroupController');

// Group routes
router.post('/', protect, createGroup);
router.get('/', protect, getGroups);
router.get('/:id', protect, getGroupById);
router.post('/:id/join', protect, joinGroup);
router.post('/:id/leave', protect, leaveGroup);

// Post routes (within a group)
router.post('/:id/posts', protect, createPost);
router.get('/:id/posts', protect, getPosts);

// Reply routes
router.post('/:id/posts/:postId/replies', protect, addReply);

module.exports = router;
