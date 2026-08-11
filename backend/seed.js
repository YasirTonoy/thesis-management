const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Proposal = require('./models/Proposal');
const Supervision = require('./models/Supervision');
const Milestone = require('./models/Milestone');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thesis_management');
    console.log('✅ Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Proposal.deleteMany({});
    await Supervision.deleteMany({});
    await Milestone.deleteMany({});
    console.log('🗑️ Cleared existing database collections.');

    // Create password hash
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    // Create Users
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

    console.log('👤 Created Users: Admin, Supervisor, Student (password: password123)');

    // Create a Proposal
    const proposal = await Proposal.create({
      student: student._id,
      title: 'AI-Based Thesis Management System',
      abstract: 'A comprehensive management system leveraging machine learning to match supervisors and automate milestone tracking.',
      keywords: ['AI', 'Management', 'Thesis', 'Web Dev'],
      status: 'approved',
      approvedBy: supervisor._id
    });

    console.log('📄 Created Sample Proposal');

    // Create Supervision Assignment
    const supervision = await Supervision.create({
      student: student._id,
      supervisor: supervisor._id,
      assignedBy: admin._id,
      isActive: true,
      reassignmentReason: ''
    });

    console.log('🤝 Created Supervision Assignment');

    // Create Milestones
    await Milestone.create([
      {
        supervision: supervision._id,
        student: student._id,
        supervisor: supervisor._id,
        title: 'Sprint 1 - System Architecture & Proposal Submission',
        description: 'Complete database models, backend API routes, and basic frontend pages.',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'pending'
      },
      {
        supervision: supervision._id,
        student: student._id,
        supervisor: supervisor._id,
        title: 'Sprint 2 - Frontend Integration & Feedback System',
        description: 'Connect UI components with backend REST API and test user authentication.',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        status: 'pending'
      }
    ]);

    console.log('🎯 Created Sample Milestones');

    console.log('\n✨ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
