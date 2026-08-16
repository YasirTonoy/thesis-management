const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ API ROUTES ============

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Thesis Management API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/proposals', require('./routes/proposalRoutes'));
app.use('/api/supervisions', require('./routes/supervisionRoutes'));
app.use('/api/milestones', require('./routes/milestoneRoutes'));

// ============ ERROR HANDLING ============

// 404 handler - Route not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// ============ DATABASE CONNECTION & SEEDING ============

const PORT = process.env.PORT || 5000;

const autoSeed = async () => {
  try {
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Seeding default users and initial data...');
      const bcrypt = require('bcryptjs');
      const Proposal = require('./models/Proposal');
      const Supervision = require('./models/Supervision');
      const Milestone = require('./models/Milestone');

      const salt = await bcrypt.genSalt(10);
      const password = await bcrypt.hash('password123', salt);

      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@test.com',
        password,
        role: 'admin',
        department: 'Computer Science'
      });

      const supervisor = await User.create({
        name: 'Dr. Sarah Connor',
        email: 'supervisor@test.com',
        password,
        role: 'supervisor',
        department: 'Computer Science'
      });

      const student = await User.create({
        name: 'John Doe',
        email: 'student@test.com',
        password,
        role: 'student',
        department: 'Computer Science'
      });

      const proposal = await Proposal.create({
        student: student._id,
        title: 'AI-Based Thesis Management System',
        abstract: 'A comprehensive management system leveraging machine learning to match supervisors and automate milestone tracking.',
        keywords: ['AI', 'Management', 'Thesis', 'Web Dev'],
        status: 'approved',
        approvedBy: supervisor._id
      });

      const supervision = await Supervision.create({
        student: student._id,
        supervisor: supervisor._id,
        assignedBy: admin._id,
        isActive: true,
        reassignmentReason: ''
      });

      await Milestone.create([
        {
          supervision: supervision._id,
          student: student._id,
          supervisor: supervisor._id,
          title: 'Sprint 1 - System Architecture & Proposal Submission',
          description: 'Complete database models, backend API routes, and basic frontend pages.',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'pending'
        },
        {
          supervision: supervision._id,
          student: student._id,
          supervisor: supervisor._id,
          title: 'Sprint 2 - Frontend Integration & Feedback System',
          description: 'Connect UI components with backend REST API and test user authentication.',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          status: 'pending'
        }
      ]);
      console.log('✨ Seeded default accounts: admin@test.com, supervisor@test.com, student@test.com (password: password123)');
    }
  } catch (err) {
    console.error('Seed warning:', err.message);
  }
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/thesis_management';
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log(`✅ MongoDB connected successfully: ${conn.connection.host}`);
    await autoSeed();
  } catch (error) {
    console.log('⚠️ Local MongoDB connection failed or timeout. Initializing MongoMemoryServer...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create({
        binary: { version: '4.4.26' }
      });
      const memUri = mongod.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(`✅ In-Memory MongoDB connected successfully: ${conn.connection.host}`);
      await autoSeed();
    } catch (memErr) {
      console.error('❌ Failed to connect to MongoDB:', memErr.message);
      process.exit(1);
    }
  }
};

// ============ START SERVER ============

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API URL: http://localhost:${PORT}/api`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
  });
});

module.exports = app;