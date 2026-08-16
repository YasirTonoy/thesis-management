import React from 'react';
import { useAuth } from '../context/AuthContext';
import StudentDashboard from './StudentDashboard';
import SupervisorDashboard from './SupervisorDashboard';
import AdminDashboard from './AdminDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  if (user?.role === 'supervisor') {
    return <SupervisorDashboard />;
  }

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  return <StudentDashboard />;
};

export default Dashboard;

