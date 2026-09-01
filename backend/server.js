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
app.use('/api/publications', require('./routes/publicationRoutes'));
app.use('/api/conferences', require('./routes/conferenceRoutes'));
app.use('/api/thesis-versions', require('./routes/thesisVersionRoutes'));
app.use('/api/plagiarism-reports', require('./routes/plagiarismReportRoutes'));
app.use('/api/final-submissions', require('./routes/finalSubmissionRoutes'));
app.use('/api/defenses', require('./routes/defenseRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/research-groups', require('./routes/researchGroupRoutes'));
app.use('/api/meetings', require('./routes/meetingRoutes'));
app.use('/api/lab-resources', require('./routes/labResourceRoutes'));
app.use('/api/resource-bookings', require('./routes/resourceBookingRoutes'));

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
    const LabResource = require('./models/LabResource');
    const ResourceBooking = require('./models/ResourceBooking');

    const userCount = await User.countDocuments();
    let admin, supervisor, student;

    if (userCount === 0) {
      console.log('🌱 Seeding demo accounts and sample data...');
      const bcrypt = require('bcryptjs');
      const Proposal = require('./models/Proposal');
      const Supervision = require('./models/Supervision');
      const Milestone = require('./models/Milestone');
      const ProgressReport = require('./models/ProgressReport');
      const LiteratureReview = require('./models/LiteratureReview');
      const Meeting = require('./models/Meeting');
      const ResearchGroup = require('./models/ResearchGroup');
      const GroupPost = require('./models/GroupPost');

      const salt = await bcrypt.genSalt(10);
      const password = await bcrypt.hash('password123', salt);

      admin = await User.create({ name: 'Admin User', email: 'admin@test.com', password, role: 'admin', department: 'Computer Science & Engineering' });
      supervisor = await User.create({ name: 'Dr. Sarah Connor', email: 'supervisor@test.com', password, role: 'supervisor', department: 'Computer Science & Engineering' });
      student = await User.create({ name: 'John Doe', email: 'student@test.com', password, role: 'student', department: 'Computer Science & Engineering', studentId: 'DEMO001' });

      const proposal = await Proposal.create({
        title: 'AI-Based Thesis Management System',
        description: 'A comprehensive management system leveraging machine learning to match supervisors and automate milestone tracking.',
        supervisor: supervisor._id || supervisor.name,
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
    } else {
      supervisor = await User.findOne({ role: 'supervisor' });
      student = await User.findOne({ role: 'student' });
    }

    // Seed / Sync Lab Resources
    const seedRoboticsAndLabs = async () => {
      const defaultResources = [
        {
          name: 'NVIDIA DGX A100 High-Performance GPU Cluster (4x 80GB)',
          category: 'computing_gpu',
          resourceType: 'equipment',
          labName: 'AI & High-Performance Computing Lab',
          labRoom: 'UB20401 - HPC Server Room',
          modelNumber: 'DGX-A100-80G',
          assetTag: 'BRACU-HPC-001',
          description: 'Dedicated enterprise AI acceleration server for deep learning model training, LLM fine-tuning, and large dataset parallel processing.',
          specs: {
            'GPUs': '4x NVIDIA A100 80GB SXM4 (320GB Total HBM2e)',
            'Processors': 'Dual AMD EPYC 7742 (128 Cores, 256 Threads)',
            'RAM': '512GB DDR4-3200 ECC',
            'Storage': '15TB NVMe Gen4 High-Speed Scratch',
            'Environment': 'CUDA 12.4 / PyTorch 2.4 / TensorFlow 2.16 / JupyterHub'
          },
          imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
          status: 'available',
          isRequiresApproval: true,
          maxBookingHours: 12,
          capacity: 1,
          department: 'Computer Science & Engineering',
          safetyGuidelines: [
            'CUDA environment setup training certificate required prior to first session',
            'Do not execute unauthorized persistent daemon processes or cryptocurrency mining',
            'Monitor GPU junction temperature and report throttling alerts immediately'
          ],
          managedBy: supervisor?._id,
          totalBookingsCount: 14,
          totalUsageHours: 68
        },
        {
          name: 'Universal Robots UR5e 6-DOF Collaborative Robotic Arm with Adaptive Gripper',
          category: 'robotics_automation',
          resourceType: 'equipment',
          labName: 'Robotics & Autonomous Systems Lab',
          labRoom: 'CSE 5th Floor - Robotics Bay A',
          modelNumber: 'UR5e-CB5',
          assetTag: 'BRACU-ROB-007',
          description: 'Industrial collaborative robot arm with sub-millimeter precision for trajectory planning, pick-and-place manipulation, visual servoing, and ROS 2 MoveIt thesis research.',
          specs: {
            'Degrees of Freedom': '6 Rotating Joints with 360° infinite base rotation',
            'Payload Capacity': '5 kg (11 lbs)',
            'Reach Radius': '850 mm (33.5 in)',
            'Pose Repeatability': '± 0.03 mm precision',
            'Software Stack': 'ROS 2 Humble / MoveIt 2 / Python URScript API',
            'End-Effector': 'Robotiq 2F-85 Adaptive Servo Gripper + RealSense D435i Camera'
          },
          imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
          status: 'available',
          isRequiresApproval: true,
          maxBookingHours: 6,
          capacity: 1,
          department: 'Computer Science & Engineering',
          safetyGuidelines: [
            'Keep emergency e-stop pendant in hand during initial motion playback',
            'Never stand within the 850mm maximum arm reach radius during high-speed trajectory execution',
            'Verify trajectory velocities and collision mesh in MoveIt simulation prior to hardware deployment'
          ],
          managedBy: supervisor?._id,
          totalBookingsCount: 18,
          totalUsageHours: 48
        },
        {
          name: 'Clearpath TurtleBot 4 Autonomous Mobile Robot (SLAM & ROS 2 Navigation)',
          category: 'robotics_automation',
          resourceType: 'equipment',
          labName: 'Robotics & Autonomous Systems Lab',
          labRoom: 'CSE 5th Floor - Autonomous Rover Arena',
          modelNumber: 'TURTLEBOT4-PRO',
          assetTag: 'BRACU-ROB-008',
          description: 'Open-source autonomous mobile robot testbed for 2D/3D LiDAR SLAM, visual odometry, multi-robot swarm exploration, and Nav2 path planning.',
          specs: {
            'Drive Base': 'iRobot Create 3 differential drive platform',
            'Onboard Compute': 'Raspberry Pi 4B (4GB) + STM32 Real-Time Microcontroller',
            'Sensors': 'RPLIDAR A1 2D 360° Laser Scanner, OAK-D-PRO Spatial AI 3D Camera, 6x Cliff & Bump Sensors',
            'Payload Capacity': '9 kg (20 lbs)',
            'Runtime': 'Up to 3 hours continuous operation'
          },
          imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
          status: 'available',
          isRequiresApproval: false,
          maxBookingHours: 4,
          capacity: 2,
          department: 'Computer Science & Engineering',
          safetyGuidelines: [
            'Ensure bumper sensor safety threshold is active in ROS 2 node before auto-navigation',
            'Operate only within designated arena boundary on the 5th floor robotics bay',
            'Return to docking charge station immediately if battery drops below 15%'
          ],
          managedBy: supervisor?._id,
          totalBookingsCount: 25,
          totalUsageHours: 62
        },
        {
          name: 'Unitree Go2 Pro Intelligent Quadruped Robot (Robotic Dog)',
          category: 'robotics_automation',
          resourceType: 'equipment',
          labName: 'Robotics & Autonomous Systems Lab',
          labRoom: 'CSE 5th Floor - Robotics Bay B',
          modelNumber: 'GO2-PRO-QUAD',
          assetTag: 'BRACU-ROB-009',
          description: 'Advanced bionic quadruped robot with 4D ultra-wide LiDAR, obstacle avoidance, terrain traversal, and high-dynamic gait reinforcement learning.',
          specs: {
            'Joint Motors': '12 Ultra-High Torque Coreless Joint Actuators',
            'Max Speed': '3.7 m/s (13.3 km/h)',
            'LiDAR System': 'Unitree Self-Developed 4D Ultra-Wide LiDAR (360° x 90° FOV)',
            'Onboard AI Compute': '40 TOPS AI Core for Real-Time Edge Inference',
            'Sensors': 'HD Ultra-Wide Optical Camera, Foot Force Sensors, 9-Axis IMU'
          },
          imageUrl: 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?w=800&auto=format&fit=crop&q=80',
          status: 'available',
          isRequiresApproval: true,
          maxBookingHours: 4,
          capacity: 1,
          department: 'Computer Science & Engineering',
          safetyGuidelines: [
            'Perform zero-point motor calibration before power-stand phase',
            'Maintain 2-meter safety distance when executing gait dynamic tests',
            'Do not test on slick wet surfaces; use the padded test floor'
          ],
          managedBy: supervisor?._id,
          totalBookingsCount: 15,
          totalUsageHours: 38
        },
        {
          name: 'Vicon 8-Camera Sub-Millimeter Optical Motion Capture & Drone Arena',
          category: 'lab_space',
          resourceType: 'lab_space',
          labName: 'Robotics & Autonomous Systems Lab',
          labRoom: 'CSE 5th Floor - MoCap Flight Arena',
          modelNumber: 'VICON-V5-ARENA',
          assetTag: 'BRACU-ROB-010',
          description: 'Dedicated 6m x 6m netted arena equipped with 8 high-speed optical motion capture cameras for ground truth pose tracking of aerial drones, agile rovers, and human kinematics.',
          specs: {
            'Cameras': '8x Vicon Vantage V5 High-Speed Optical Infrared Cameras',
            'Resolution': '5 Megapixels (2432 x 2048) at 420 FPS',
            'Spatial Tracking Accuracy': '< 0.1 mm Sub-Millimeter 6-DOF Ground Truth',
            'Volume': '6m x 6m x 3.5m enclosed flight test cage',
            'Software Bridge': 'Vicon Tracker 3.10 / ROS 2 Vicon Bridge'
          },
          imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&auto=format&fit=crop&q=80',
          status: 'available',
          isRequiresApproval: true,
          maxBookingHours: 4,
          capacity: 1,
          department: 'Computer Science & Engineering',
          safetyGuidelines: [
            'Safety net must be fully latched before arming any drone motors',
            'Wear protective safety glasses inside flight cage',
            'Calibration wand routine must be performed before ground-truth telemetry logging'
          ],
          managedBy: supervisor?._id,
          totalBookingsCount: 20,
          totalUsageHours: 54
        },
        {
          name: 'Stratasys F170 Industrial Rapid Prototyping 3D Printer',
          category: 'rapid_prototyping_3d',
          resourceType: 'equipment',
          labName: 'Makerspace & Prototyping Workshop',
          labRoom: 'Engineering Annex - Room 104',
          modelNumber: 'F170-SYS',
          assetTag: 'BRACU-3DP-002',
          description: 'High-precision industrial FDM printer for custom robotics enclosures, mechanical thesis prototypes, and aerodynamic mockups.',
          specs: {
            'Build Envelope': '254 x 254 x 254 mm (10 x 10 x 10 in)',
            'Layer Thickness': '0.127 mm (0.005 in) to 0.330 mm',
            'Compatible Materials': 'PLA, ABS-M30, ASA, TPU 92A, QSR Support',
            'Dimensional Accuracy': '± 0.200 mm'
          },
          imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
          status: 'available',
          isRequiresApproval: true,
          maxBookingHours: 8,
          capacity: 1,
          department: 'Computer Science & Engineering',
          safetyGuidelines: [
            'Wear heat-resistant gloves and safety goggles when loading filament spools',
            'Do not touch the heated build chamber or extruder nozzle during operation (>260°C)',
            'Clean print bed surface with isopropyl alcohol after each completed job'
          ],
          managedBy: supervisor?._id,
          totalBookingsCount: 8,
          totalUsageHours: 36
        },
        {
          name: 'Keysight InfiniiVision 4-Channel Mixed Signal Oscilloscope (1 GHz)',
          category: 'electronics_hardware',
          resourceType: 'equipment',
          labName: 'VLSI & Electronics Design Lab',
          labRoom: 'CSE Building - Room 502',
          modelNumber: 'DSOX3014T',
          assetTag: 'BRACU-OSC-003',
          description: 'Advanced mixed signal oscilloscope for high-frequency embedded bus decoding, signal integrity analysis, and RF verification.',
          specs: {
            'Bandwidth': '1 GHz with 4 Analog + 16 Digital Channels',
            'Max Sample Rate': '5 GSa/s per channel',
            'Memory Depth': '4 Mpts standard',
            'Waveform Update Rate': '> 1,000,000 waveforms/sec',
            'Protocol Decoding': 'I2C, SPI, UART/RS232, CAN, LIN, USB 2.0'
          },
          imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80',
          status: 'available',
          isRequiresApproval: false,
          maxBookingHours: 6,
          capacity: 2,
          department: 'Computer Science & Engineering',
          safetyGuidelines: [
            'Connect antistatic grounding wrist strap before handling sensitive DUT boards',
            'Never exceed maximum channel input voltage threshold (50V RMS Category I)',
            'Calibrate probe compensation before initiating precision measurements'
          ],
          managedBy: supervisor?._id,
          totalBookingsCount: 19,
          totalUsageHours: 52
        },
        {
          name: 'Biopac MP36 Research Multi-Channel Signal Acquisition Unit',
          category: 'biomedical_sensors',
          resourceType: 'sensor_kit',
          labName: 'Bio-Medical & Neural Signal Lab',
          labRoom: 'Biomedical Wing - Room 301',
          modelNumber: 'MP36-BIOPAC',
          assetTag: 'BRACU-BIO-004',
          description: 'Four-channel physiological signal acquisition system for EEG, ECG, EMG, GSR, and pulse plethysmography thesis research.',
          specs: {
            'Analog Inputs': '4 Universal Differential Amplifier Channels',
            'Resolution': '24-bit A/D Conversion',
            'Aggregate Sample Rate': '100 kHz',
            'Included Sensors': 'Lead-II ECG Cable, EMG Electrodes, EEG Cap, PPG Sensor, Bio-Feedback GSR',
            'Software Suite': 'AcqKnowledge 5.0 Advanced Analysis Suite'
          },
          imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80',
          status: 'available',
          isRequiresApproval: true,
          maxBookingHours: 4,
          capacity: 1,
          department: 'Computer Science & Engineering',
          safetyGuidelines: [
            'Institutional Ethics Review (IRB) approval document required for human subject recordings',
            'Use single-use conductive gel wipes; sanitize all skin contact probes after each session',
            'Battery isolated power pack must remain engaged during subject telemetry'
          ],
          managedBy: supervisor?._id,
          totalBookingsCount: 11,
          totalUsageHours: 29
        },
        {
          name: 'Quanser QUBE-Servo 2 Inverted Pendulum Robotics Platform',
          category: 'robotics_automation',
          resourceType: 'equipment',
          labName: 'Robotics & Autonomous Systems Lab',
          labRoom: 'CSE 5th Floor - Robotics Bay',
          modelNumber: 'QUBE-S2-INV',
          assetTag: 'BRACU-ROB-005',
          description: 'Rotary pendulum experiment for reinforcement learning control algorithms, state-space modeling, and nonlinear stability testing.',
          specs: {
            'Actuator': 'Direct-Drive High-Speed Coreless DC Motor',
            'Optical Encoder': '2048 counts/revolution quadrature encoder',
            'Control Interface': 'MATLAB / Simulink / Python Control Systems Toolbox',
            'Sensors': 'Integrated Motor Current & High-Precision Angular Pos Sensor'
          },
          imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
          status: 'available',
          isRequiresApproval: false,
          maxBookingHours: 6,
          capacity: 1,
          department: 'Computer Science & Engineering',
          safetyGuidelines: [
            'Keep clear 1-meter radius clearance zone around pendulum swing trajectory',
            'Emergency mechanical cut-off button must be kept within operator reach',
            'Simulate PID / LQR controller gains in software before running physical hardware'
          ],
          managedBy: supervisor?._id,
          totalBookingsCount: 16,
          totalUsageHours: 42
        },
        {
          name: 'Meta Quest Pro & RTX 4090 Immersive XR Research Workstation',
          category: 'computing_gpu',
          resourceType: 'workstation',
          labName: 'Human-Computer Interaction & XR Lab',
          labRoom: 'UB20402 - XR Studio',
          modelNumber: 'XR-STATION-01',
          assetTag: 'BRACU-XR-006',
          description: 'High-end spatial computing research station equipped with facial tracking, eye gaze estimation, and spatial audio SDKs.',
          specs: {
            'Headset': 'Meta Quest Pro (Color Passthrough, Eye & Facial Expression Tracking)',
            'GPU': 'NVIDIA GeForce RTX 4090 24GB GDDR6X',
            'Processor': 'Intel Core i9-14900K (24 Cores, up to 6.0 GHz)',
            'RAM': '64GB DDR5-6000 MHz',
            'SDKs Installed': 'Unity 6 LTS, Unreal Engine 5.4, OpenXR, Meta Presence Platform'
          },
          imageUrl: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&auto=format&fit=crop&q=80',
          status: 'available',
          isRequiresApproval: false,
          maxBookingHours: 4,
          capacity: 1,
          department: 'Computer Science & Engineering',
          safetyGuidelines: [
            'Sanitize headset facial interface and controllers with UV sanitizer after each session',
            'Ensure 3m x 3m physical play boundary is unobstructed before putting on HMD',
            'Take mandatory 10-minute visual rest break every 45 minutes of XR immersion'
          ],
          managedBy: supervisor?._id,
          totalBookingsCount: 22,
          totalUsageHours: 58
        }
      ];

      for (const resData of defaultResources) {
        const exists = await LabResource.findOne({ assetTag: resData.assetTag });
        if (!exists) {
          await LabResource.create(resData);
        }
      }
    };

    await seedRoboticsAndLabs();

    // Create a sample approved booking for student if none exist
    const bookingCount = await ResourceBooking.countDocuments();
    if (bookingCount === 0 && student && supervisor) {
      const gpuCluster = await LabResource.findOne({ category: 'computing_gpu' });
      if (gpuCluster) {
        const tomorrowStart = new Date();
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        tomorrowStart.setHours(10, 0, 0, 0);

        const tomorrowEnd = new Date(tomorrowStart);
        tomorrowEnd.setHours(14, 0, 0, 0);

        await ResourceBooking.create({
          resource: gpuCluster._id,
          user: student._id,
          supervisor: supervisor._id,
          bookingReference: `BK-${new Date().getFullYear()}-10429`,
          purpose: 'Training deep neural network Transformer models on thesis benchmark dataset with GPU acceleration.',
          startTime: tomorrowStart,
          endTime: tomorrowEnd,
          durationHours: 4,
          status: 'approved',
          safetyAgreementAccepted: true,
          reviewedBy: supervisor._id,
          reviewedAt: new Date(),
          reviewNotes: 'Approved. Please monitor GPU memory allocations and ensure checkpointing every 5 epochs.'
        });
      }
    }
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
