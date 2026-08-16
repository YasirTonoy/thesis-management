import React, { useState, useEffect } from 'react';
import { researchGroupAPI } from '../api';

const categoryColors = {
  general: 'bg-slate-100 text-slate-700 border-slate-200',
  resource: 'bg-blue-50 text-blue-700 border-blue-200',
  question: 'bg-amber-50 text-amber-700 border-amber-200',
  announcement: 'bg-purple-50 text-purple-700 border-purple-200',
  paper: 'bg-green-50 text-green-700 border-green-200'
};

const categoryLabels = {
  general: '💬 General',
  resource: '📎 Resource',
  question: '❓ Question',
  announcement: '📢 Announcement',
  paper: '📄 Paper'
};

const ResearchGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Viewing a specific group
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // Modals
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  // Forms
  const [groupForm, setGroupForm] = useState({
    name: '', description: '', researchArea: '', department: 'Computer Science & Engineering', isOpen: true
  });
  const [postForm, setPostForm] = useState({
    title: '', content: '', category: 'general', attachmentUrl: '', attachmentName: ''
  });

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setCurrentUser(JSON.parse(u));
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await researchGroupAPI.getAll();
      setGroups(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchPosts = async (groupId) => {
    setPostsLoading(true);
    try {
      const res = await researchGroupAPI.getPosts(groupId);
      setPosts(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
    setPostsLoading(false);
  };

  const openGroup = async (group) => {
    setSelectedGroup(group);
    await fetchPosts(group._id);
  };

  const handleJoinLeave = async (group) => {
    const isMember = group.members.some(m => m.user?._id === currentUser?._id || m.user === currentUser?._id);
    try {
      if (isMember) {
        await researchGroupAPI.leave(group._id);
      } else {
        await researchGroupAPI.join(group._id);
      }
      await fetchGroups();
      if (selectedGroup?._id === group._id) {
        const res = await researchGroupAPI.getById(group._id);
        setSelectedGroup(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating membership');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await researchGroupAPI.create(groupForm);
      alert('Research group created successfully!');
      setShowCreateGroup(false);
      setGroupForm({ name: '', description: '', researchArea: '', department: 'Computer Science & Engineering', isOpen: true });
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating group');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      await researchGroupAPI.createPost(selectedGroup._id, postForm);
      alert('Post published!');
      setShowCreatePost(false);
      setPostForm({ title: '', content: '', category: 'general', attachmentUrl: '', attachmentName: '' });
      fetchPosts(selectedGroup._id);
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating post');
    }
  };

  const handleReply = async (postId) => {
    if (!replyContent.trim()) return;
    try {
      await researchGroupAPI.addReply(selectedGroup._id, postId, { content: replyContent });
      setReplyingTo(null);
      setReplyContent('');
      fetchPosts(selectedGroup._id);
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding reply');
    }
  };

  const isMemberOf = (group) => {
    if (!currentUser) return false;
    return group.members.some(m => {
      const uid = m.user?._id || m.user;
      return uid === currentUser._id;
    });
  };

  const isAdminOf = (group) => {
    if (!currentUser) return false;
    return group.members.some(m => {
      const uid = m.user?._id || m.user;
      return uid === currentUser._id && m.role === 'admin';
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // ─── GROUP DETAIL VIEW ───────────────────────────────────────────────────
  if (selectedGroup) {
    const member = isMemberOf(selectedGroup);
    return (
      <div className="space-y-6">
        {/* Group Header */}
        <div className="bg-white border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
          <div className="w-10 h-1 bg-blue-600 mb-4" />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2">
              <button
                onClick={() => { setSelectedGroup(null); setPosts([]); }}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1 transition"
              >
                <span>← Back to All Groups</span>
              </button>
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-bold px-2 py-0.5 border ${selectedGroup.isOpen ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {selectedGroup.isOpen ? 'Open Group' : 'Closed Group'}
                </span>
                <span className="text-xs text-slate-500 font-medium">{selectedGroup.department}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{selectedGroup.name}</h1>
              {selectedGroup.researchArea && (
                <p className="text-blue-700 text-xs font-semibold">🔬 {selectedGroup.researchArea}</p>
              )}
              {selectedGroup.description && (
                <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">{selectedGroup.description}</p>
              )}
            </div>

            <div className="flex flex-col items-end gap-3 shrink-0">
              <div className="bg-slate-50 border border-slate-200 px-4 py-2 text-center">
                <p className="text-xl font-bold text-slate-900">{selectedGroup.members.length}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Members</p>
              </div>
              {!isAdminOf(selectedGroup) && selectedGroup.isOpen && (
                <button
                  onClick={() => handleJoinLeave(selectedGroup)}
                  className={`text-xs font-semibold px-4 py-2 transition shadow-sm ${
                    member
                      ? 'border border-red-300 text-red-600 hover:bg-red-50'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {member ? 'Leave Group' : 'Join Group'}
                </button>
              )}
            </div>
          </div>

          {/* Members */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">Members ({selectedGroup.members.length})</p>
            <div className="flex flex-wrap gap-2">
              {selectedGroup.members.map((m, i) => (
                <div key={i} className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs">
                  <div className={`w-4 h-4 flex items-center justify-center font-bold text-[9px] text-white ${m.role === 'admin' ? 'bg-blue-600' : 'bg-slate-600'}`}>
                    {(m.user?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-slate-700 font-medium">{m.user?.name || 'Unknown'}</span>
                  {m.role === 'admin' && <span className="text-[9px] text-blue-700 font-bold ml-1">ADMIN</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Discussion Forum */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Discussion Forum</h2>
            {member && (
              <button
                onClick={() => setShowCreatePost(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 text-xs transition shadow-sm"
              >
                + New Post
              </button>
            )}
          </div>

          {!member && (
            <div className="bg-white border border-slate-200 p-5 text-center text-slate-500 text-sm shadow-sm">
              Join this group to participate in discussions and post research updates.
            </div>
          )}

          {postsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white border border-slate-200 p-10 text-center text-slate-500 text-sm shadow-sm">
              No posts yet. Be the first to start a discussion!
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post._id} className={`bg-white border p-6 shadow-sm space-y-4 ${post.isPinned ? 'border-blue-400 bg-blue-50/20' : 'border-slate-200'}`}>
                  {/* Post Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {post.isPinned && (
                          <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200">
                            📌 Pinned
                          </span>
                        )}
                        <span className={`text-xs font-bold px-2 py-0.5 border ${categoryColors[post.category] || categoryColors.general}`}>
                          {categoryLabels[post.category] || '💬 General'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{post.title}</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-500">
                          By <strong className="text-slate-800">{post.authorName}</strong> ({post.authorRole})
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">
                      {post.replies?.length || 0} {post.replies?.length === 1 ? 'reply' : 'replies'}
                    </span>
                  </div>

                  {/* Post Body */}
                  <div className="bg-slate-50 p-4 border border-slate-200">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  </div>

                  {/* Attachment */}
                  {post.attachmentUrl && (
                    <a
                      href={post.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-xs text-blue-600 font-semibold px-3 py-1.5 transition shadow-sm"
                    >
                      <span>📎</span>
                      <span>{post.attachmentName || 'View Attachment'}</span>
                    </a>
                  )}

                  {/* Replies */}
                  {post.replies && post.replies.length > 0 && (
                    <div className="space-y-2 pl-4 border-l-2 border-slate-200">
                      {post.replies.map((reply, idx) => (
                        <div key={idx} className="bg-slate-50 p-3 border border-slate-200 space-y-1 text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-800">{reply.authorName}</span>
                            <span className="text-slate-400">({reply.authorRole})</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(reply.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Form */}
                  {member && (
                    <div>
                      {replyingTo === post._id ? (
                        <div className="space-y-2">
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            rows="2"
                            className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 resize-none"
                            placeholder="Write your reply..."
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReply(post._id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-1.5 transition"
                            >
                              Post Reply
                            </button>
                            <button
                              onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                              className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs px-3.5 py-1.5 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setReplyingTo(post._id); setReplyContent(''); }}
                          className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition"
                        >
                          ↩ Reply to post
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL: Create Post */}
        {showCreatePost && (
          <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4" onClick={() => setShowCreatePost(false)}>
            <div className="bg-white border border-slate-200 max-w-lg w-full shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
              <div className="h-1 bg-blue-600 mb-2" />
              <h2 className="text-lg font-bold text-slate-900">Create New Post</h2>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Post Title</label>
                  <input
                    type="text"
                    value={postForm.title}
                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                    className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                    placeholder="Topic title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Category</label>
                  <select
                    value={postForm.category}
                    onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                    className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="general">💬 General</option>
                    <option value="announcement">📢 Announcement</option>
                    <option value="resource">📎 Resource / Tool</option>
                    <option value="paper">📄 Research Paper</option>
                    <option value="question">❓ Question</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Content</label>
                  <textarea
                    value={postForm.content}
                    onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                    rows="5"
                    className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 resize-none"
                    placeholder="Share insights, notes, or questions..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Attachment URL (Optional)</label>
                    <input
                      type="url"
                      value={postForm.attachmentUrl}
                      onChange={(e) => setPostForm({ ...postForm, attachmentUrl: e.target.value })}
                      className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">File Label</label>
                    <input
                      type="text"
                      value={postForm.attachmentName}
                      onChange={(e) => setPostForm({ ...postForm, attachmentName: e.target.value })}
                      className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                      placeholder="e.g. Dataset v2"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 transition">
                    Publish Post
                  </button>
                  <button type="button" onClick={() => setShowCreatePost(false)} className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 transition">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── GROUP LIST VIEW ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="w-10 h-1 bg-blue-600 mb-4" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Research Groups</h1>
            <p className="text-slate-500 text-sm mt-0.5">Collaborate, share literature resources, and discuss research topics.</p>
          </div>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 text-xs transition shadow-sm"
          >
            + Create Group
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Groups', val: groups.length },
          { label: 'Open Groups', val: groups.filter(g => g.isOpen).length },
          { label: 'My Groups', val: groups.filter(g => isMemberOf(g)).length },
          { label: 'Total Members', val: groups.reduce((acc, g) => acc + g.members.length, 0) }
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 p-4 text-center space-y-1 shadow-sm">
            <p className="text-2xl font-black text-slate-900">{s.val}</p>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Group Cards Grid */}
      {groups.length === 0 ? (
        <div className="bg-white border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <div className="text-4xl">🔬</div>
          <h3 className="text-lg font-bold text-slate-900">No Research Groups Yet</h3>
          <p className="text-slate-500 text-sm">Be the first to create a research group for your department!</p>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 text-xs transition shadow-sm"
          >
            + Create the First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((group) => {
            const member = isMemberOf(group);
            const admin = isAdminOf(group);
            return (
              <div
                key={group._id}
                className="bg-white border border-slate-200 p-6 shadow-sm space-y-4 hover:border-blue-500 transition-colors group flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`text-xs font-bold px-2 py-0.5 border ${group.isOpen ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {group.isOpen ? 'Open' : 'Closed'}
                      </span>
                      {member && (
                        <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200">
                          {admin ? '👑 Admin' : '✓ Member'}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{group.members.length} members</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {group.name}
                  </h3>
                  {group.researchArea && (
                    <p className="text-xs text-blue-700 font-semibold">🔬 {group.researchArea}</p>
                  )}
                  {group.description && (
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{group.description}</p>
                  )}
                  <p className="text-[11px] text-slate-400">{group.department}</p>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => openGroup(group)}
                    className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2 transition"
                  >
                    View Forum →
                  </button>
                  {!admin && group.isOpen && (
                    <button
                      onClick={() => handleJoinLeave(group)}
                      className={`text-xs font-semibold px-4 py-2 transition ${
                        member
                          ? 'border border-red-300 text-red-600 hover:bg-red-50'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                      }`}
                    >
                      {member ? 'Leave' : 'Join'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Create Group */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateGroup(false)}>
          <div className="bg-white border border-slate-200 max-w-lg w-full shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="h-1 bg-blue-600 mb-2" />
            <h2 className="text-lg font-bold text-slate-900">Create Research Group</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Group Name</label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                  placeholder="e.g. AI & NLP Research Collective"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Research Area / Focus</label>
                <input
                  type="text"
                  value={groupForm.researchArea}
                  onChange={(e) => setGroupForm({ ...groupForm, researchArea: e.target.value })}
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                  placeholder="e.g. Natural Language Processing"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Department</label>
                <input
                  type="text"
                  value={groupForm.department}
                  onChange={(e) => setGroupForm({ ...groupForm, department: e.target.value })}
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Description</label>
                <textarea
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  rows="3"
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 resize-none"
                  placeholder="What does this group focus on?"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isOpen"
                  checked={groupForm.isOpen}
                  onChange={(e) => setGroupForm({ ...groupForm, isOpen: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300"
                />
                <label htmlFor="isOpen" className="text-xs text-slate-700 font-semibold">Open Group (any department member can join)</label>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 transition">
                  Create Group
                </button>
                <button type="button" onClick={() => setShowCreateGroup(false)} className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 transition">
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

export default ResearchGroups;
