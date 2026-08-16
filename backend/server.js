const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Thesis Management API is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/proposals', require('./routes/proposalRoutes'));
app.use('/api/supervisions', require('./routes/supervisionRoutes'));
app.use('/api/milestones', require('./routes/milestoneRoutes'));
app.use('/api/progress-reports', require('./routes/progressReportRoutes'));
app.use('/api/literature-reviews', require('./routes/literatureReviewRoutes'));
app.use('/api/thesis-materials', require('./routes/thesisMaterialRoutes'));
app.use('/api/meetings', require('./routes/meetingRoutes'));
app.use('/api/research-groups', require('./routes/researchGroupRoutes'));

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
    const ProgressReport = require('./models/ProgressReport');
    const LiteratureReview = require('./models/LiteratureReview');
    const ThesisMaterial = require('./models/ThesisMaterial');
    const Meeting = require('./models/Meeting');
    const ResearchGroup = require('./models/ResearchGroup');
    const GroupPost = require('./models/GroupPost');

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    const admin = await User.create({ name: 'Admin User', email: 'admin@test.com', password, role: 'admin', department: 'Computer Science & Engineering' });
    const supervisor = await User.create({ name: 'Dr. Sarah Connor', email: 'supervisor@test.com', password, role: 'supervisor', department: 'Computer Science & Engineering' });
    const student = await User.create({ name: 'John Doe', email: 'student@test.com', password, role: 'student', department: 'Computer Science & Engineering', studentId: 'DEMO001' });

    const proposal = await Proposal.create({
      title: 'AI-Based Thesis Management System',
      description: 'A comprehensive management system leveraging machine learning to match supervisors and automate milestone tracking.',
      supervisor: supervisor.name,
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

    // Seed sample Progress Report (P1)
    await ProgressReport.create({
      student: student._id,
      proposal: proposal._id,
      supervisor: supervisor._id,
      thesisId: 'THESIS-2026-001',
      thesisTitle: proposal.title,
      phase: 'p1',
      phaseName: 'Pre-Thesis 1 (P1)',
      description: 'Completed literature survey of 15 papers, finalized system requirements, and created ER diagram for thesis management portal.',
      supportingDocuments: 'https://github.com/YasirTonoy/thesis-management/blob/main/docs/p1_architecture.pdf',
      marks: 88,
      supervisorFeedback: 'Excellent work on system modeling and DB schema. Approved for P2 phase.',
      status: 'evaluated',
      reviewedBy: supervisor._id,
      reviewedAt: new Date()
    });

    // Seed sample Literature Review
    await LiteratureReview.create({
      student: student._id,
      proposal: proposal._id,
      paperName: 'Deep Learning Approaches for Academic Advisor Recommendation Systems',
      authors: 'Smith, A., Johnson, R., & Patel, K.',
      publicationYear: 2024,
      journalName: 'IEEE Transactions on Education & AI',
      paperLink: 'https://doi.org/10.1109/TE.2024.1049281',
      reviewText: 'This paper proposes a collaborative filtering neural network that maps student research keywords to faculty interest vectors. We adapt their matrix factorization approach for our supervisor matching module.',
      supervisorFeedback: 'Great synthesis! Ensure you benchmark this against standard cosine similarity.'
    });

    // Seed sample Thesis Material with version history
    await ThesisMaterial.create({
      student: student._id,
      proposal: proposal._id,
      title: 'Primary Benchmark Dataset (Thesis Research)',
      category: 'dataset',
      description: 'Anonymized dataset of 500 thesis proposal abstracts and matching advisor ratings.',
      currentVersion: 2,
      history: [
        {
          version: 1,
          documentUrl: 'https://github.com/YasirTonoy/thesis-management/raw/main/data/dataset_v1.csv',
          changeNotes: 'Initial raw dataset upload (300 records).',
          updatedBy: student._id,
          updatedByName: student.name,
          updatedByRole: 'student',
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        },
        {
          version: 2,
          documentUrl: 'https://github.com/YasirTonoy/thesis-management/raw/main/data/dataset_v2_cleaned.csv',
          changeNotes: 'Cleaned null entries and expanded to 500 records with normalized TF-IDF vectors.',
          updatedBy: student._id,
          updatedByName: student.name,
          updatedByRole: 'student',
          updatedAt: new Date()
        }
      ]
    });

    // Seed sample Meeting
    const meetingDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    await Meeting.create({
      student: student._id,
      supervisor: supervisor._id,
      requestedBy: student._id,
      title: 'P1 Progress Review & Research Direction Discussion',
      agenda: 'Review the completed literature survey, discuss system architecture decisions, and plan milestones for the next sprint.',
      proposedDateTime: meetingDate,
      confirmedDateTime: meetingDate,
      location: 'Faculty Office – Room 302, CSE Building',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      status: 'confirmed',
      supervisorNotes: 'Please bring your ER diagram and DB schema printout for review.'
    });

    // Seed sample Research Group with a post
    const group = await ResearchGroup.create({
      name: 'AI & Machine Learning Research Collective',
      description: 'A collaborative group for students and faculty working on AI, ML, and NLP research projects. We share papers, datasets, and discuss methodologies.',
      researchArea: 'Artificial Intelligence & Machine Learning',
      department: 'Computer Science & Engineering',
      createdBy: supervisor._id,
      isOpen: true,
      maxMembers: 20,
      members: [
        { user: supervisor._id, role: 'admin', joinedAt: new Date() },
        { user: student._id, role: 'member', joinedAt: new Date() }
      ]
    });

    await GroupPost.create({
      group: group._id,
      author: supervisor._id,
      authorName: supervisor.name,
      authorRole: 'supervisor',
      title: 'Welcome to the AI & ML Research Collective!',
      content: 'Welcome everyone! This group is a space to share research papers, datasets, and have discussions about your thesis work. Please introduce yourself and share your research topic. I will be posting weekly reading suggestions every Monday.',
      category: 'announcement',
      isPinned: true,
      replies: [
        {
          author: student._id,
          authorName: student.name,
          authorRole: 'student',
          content: 'Thank you for setting this up! I am currently working on AI-based thesis management systems. Looking forward to collaborating with everyone here.',
          createdAt: new Date()
        }
      ]
    });

    console.log('✨ Seeded: admin@test.com / supervisor@test.com / student@test.com (password: password123)');
  } catch (err) {
    console.error('Seed warning:', err.message);
  }
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/thesis_management';
  console.log(`🔌 Connecting to MongoDB (${uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')})...`);
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ MongoDB connected successfully: ${conn.connection.host}`);
    await autoSeed();
  } catch (error) {
    console.warn(`⚠️ Could not connect to primary MongoDB (${error.message}). Trying in-memory MongoDB fallback...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create({ binary: { version: '4.4.26' } });
      const memUri = mongod.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(`✅ In-Memory MongoDB connected successfully: ${conn.connection.host}`);
      await autoSeed();
    } catch (memErr) {
      console.error('❌ Failed to connect to MongoDB:', error.message);
      process.exit(1);
    }
  }
};

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API URL: http://localhost:${PORT}/api`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
  });
});
