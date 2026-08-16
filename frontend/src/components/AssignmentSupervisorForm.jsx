import React, { useState, useEffect } from 'react';
import { supervisionAPI } from '../api';

const AssignSupervisorForm = ({ onSubmit, type, supervisions }) => {
  const [students, setStudents] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [formData, setFormData] = useState({
    studentId: '',
    supervisorId: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch all users with roles
      const response = await fetch('http://localhost:5000/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setStudents(data.data.filter(u => u.role === 'student'));
        setSupervisors(data.data.filter(u => u.role === 'supervisor'));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.studentId || !formData.supervisorId) {
      setError('Please select both student and supervisor');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (type === 'reassign') {
        // For reassign, we need the supervision ID
        const supervision = supervisions.find(s => s.student._id === formData.studentId);
        if (supervision) {
          await onSubmit(supervision._id, {
            newSupervisorId: formData.supervisorId,
            reason: formData.reason || 'Reassigned by admin'
          });
        }
      } else {
        await onSubmit({
          studentId: formData.studentId,
          supervisorId: formData.supervisorId,
          reason: formData.reason || 'Initial assignment'
        });
      }
      
      setFormData({ studentId: '', supervisorId: '', reason: '' });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to assign supervisor');
    } finally {
      setLoading(false);
    }
  };

  // Get students without active supervision (for assign)
  const availableStudents = type === 'assign' 
    ? students.filter(s => !supervisions?.some(sup => sup.student._id === s._id && sup.isActive))
    : students;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Student <span className="text-red-500">*</span>
        </label>
        <select
          name="studentId"
          value={formData.studentId}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select a student</option>
          {availableStudents.map((student) => (
            <option key={student._id} value={student._id}>
              {student.name} - {student.email}
            </option>
          ))}
        </select>
        {type === 'assign' && availableStudents.length === 0 && (
          <p className="text-sm text-yellow-600 mt-1">All students already have supervisors</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Supervisor <span className="text-red-500">*</span>
        </label>
        <select
          name="supervisorId"
          value={formData.supervisorId}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select a supervisor</option>
          {supervisors.map((supervisor) => (
            <option key={supervisor._id} value={supervisor._id}>
              {supervisor.name} - {supervisor.email}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Reason
        </label>
        <input
          type="text"
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          placeholder={type === 'reassign' ? 'Why are you reassigning?' : 'Initial assignment'}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : type === 'reassign' ? 'Reassign Supervisor' : 'Assign Supervisor'}
      </button>
    </form>
  );
};

export default AssignSupervisorForm;