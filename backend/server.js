const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Thesis Management API is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/proposals', require('./routes/proposalRoutes'));
app.use('/api/supervisions', require('./routes/supervisionRoutes'));
app.use('/api/milestones', require('./routes/milestoneRoutes'));
app.use('/api/notices', require('./routes/noticeRoutes'));
app.use('/api/progress-reports', require('./routes/progressReportRoutes'));
app.use('/api/literature-reviews', require('./routes/literatureReviewRoutes'));
app.use('/api/materials', require('./routes/materialRoutes'));
app.use('/api/thesis-versions', require('./routes/thesisVersionRoutes'));
app.use('/api/plagiarism-reports', require('./routes/plagiarismReportRoutes'));
app.use('/api/final-submissions', require('./routes/finalSubmissionRoutes'));
app.use('/api/defenses', require('./routes/defenseRoutes'));
app.use('/api/research-groups', require('./routes/researchGroupRoutes'));
app.use('/api/meetings', require('./routes/meetingRoutes'));

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

const PORT = process.env.PORT || 5000;

const autoSeed = async () => {
  try {
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    if (userCount > 0) return;

    console.log('🌱 Seeding demo accounts and sample data...');
    const bcrypt = require('bcryptjs');
    const Proposal = require('./models/Proposal');
    const Supervision = require('./models/Supervision');
    const Milestone = require('./models/Milestone');

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    const admin = await User.create({ name: 'Admin User', email: 'admin@test.com', password, role: 'admin', department: 'Computer Science & Engineering' });
    const supervisor = await User.create({ name: 'Dr. Sarah Connor', email: 'supervisor@test.com', password, role: 'supervisor', department: 'Computer Science & Engineering' });
    const student = await User.create({ name: 'John Doe', email: 'student@test.com', password, role: 'student', department: 'Computer Science & Engineering', studentId: 'DEMO001' });

    await Proposal.create({
      title: 'AI-Based Thesis Management System',
      description: 'A comprehensive management system leveraging machine learning to match supervisors and automate milestone tracking.',
      supervisor: supervisor._id,
      students: [{ name: student.name, studentId: student.studentId }],
      submittedBy: student._id,
      status: 'approved',
      reviewedBy: supervisor._id
    });

    const supervision = await Supervision.create({ student: student._id, supervisor: supervisor._id, assignedBy: admin._id, isActive: true, reassignmentReason: '' });

    await Milestone.create([
      { supervision: supervision._id, student: student._id, supervisor: supervisor._id, title: 'Sprint 1 - System Architecture & Proposal Submission', description: 'Complete database models, backend API routes, and basic frontend pages.', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), status: 'pending' },
      { supervision: supervision._id, student: student._id, supervisor: supervisor._id, title: 'Sprint 2 - Frontend Integration & Feedback System', description: 'Connect UI components with backend REST API and test user authentication.', dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), status: 'pending' }
    ]);
      const Notice = require('./models/Notice');
      await Notice.create({
        title: 'Welcome to the Fall 2026 Thesis Cycle',
        content: 'Please make sure your proposal is submitted before the department deadline. Reach out if you have questions about scope or supervision availability.',
        postedBy: supervisor._id
    });
    console.log('✨ Seeded: admin@test.com / supervisor@test.com / student@test.com (password: password123)');
  } catch (err) {
    console.error('Seed warning:', err.message);
  }
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set. Check your .env file.');
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log(`✅ MongoDB connected successfully: ${conn.connection.host}`);
    await autoSeed();
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
};

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API URL: http://localhost:${PORT}/api`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
  });
});
