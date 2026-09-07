import React, { useState, useEffect } from 'react';
import { authAPI } from '../api';

const AssignSupervisorForm = ({ onSubmit, type = 'assign', supervisions = [] }) => {
  const [students, setStudents] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Assign mode state
  const [studentId, setStudentId] = useState('');
  const [supervisorId, setSupervisorId] = useState('');

  // Reassign mode state
  const [supervisionId, setSupervisionId] = useState('');
  const [newSupervisorId, setNewSupervisorId] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const [studentsRes, supervisorsRes] = await Promise.all([
        authAPI.getStudents(),
        authAPI.getSupervisors()
      ]);
      const stList = studentsRes.data.data || [];
      const supList = supervisorsRes.data.data || [];
      setStudents(stList);
      setSupervisors(supList);

      if (stList.length > 0) setStudentId(stList[0]._id);
      if (supList.length > 0) {
        setSupervisorId(supList[0]._id);
        setNewSupervisorId(supList[0]._id);
      }
      if (supervisions.length > 0) {
        setSupervisionId(supervisions[0]._id);
      }
    } catch (err) {
      console.error('Error fetching users for supervisor assignment:', err);
    }
    setLoadingUsers(false);
  };

  useEffect(() => {
    if (supervisions.length > 0 && !supervisionId) {
      setSupervisionId(supervisions[0]._id);
    }
  }, [supervisions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (type === 'reassign') {
        const targetSupervision = supervisions.find(s => s._id === supervisionId);
        if (!targetSupervision) {
          alert('Please select a supervision record to reassign.');
          setSubmitting(false);
          return;
        }
        await onSubmit(supervisionId, {
          newSupervisorId,
          supervisorId: newSupervisorId,
          reason: reason || 'Reassigned by academic coordinator'
        });
        setReason('');
      } else {
        await onSubmit({
          studentId,
          supervisorId,
          reassignmentReason: reason || 'Initial supervisor assignment'
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingUsers) {
    return (
      <div className="flex items-center gap-2 text-slate-500 text-sm py-8 justify-center">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
        <span>Loading faculty and students...</span>
      </div>
    );
  }

  const selectedSupervision = supervisions.find(s => s._id === supervisionId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {type === 'assign' ? (
        <>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
              Select Student *
            </label>
            {students.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 p-2.5 border border-amber-200">
                No student accounts registered yet.
              </p>
            ) : (
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                required
              >
                {students.map((st) => (
                  <option key={st._id} value={st._id}>
                    {st.name} ({st.email}) {st.studentId ? `— ID: ${st.studentId}` : ''} [{st.department || 'CSE'}]
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
              Assign Supervisor *
            </label>
            {supervisors.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 p-2.5 border border-amber-200">
                No faculty/supervisor accounts registered yet.
              </p>
            ) : (
              <select
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
                className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                required
              >
                {supervisors.map((sup) => (
                  <option key={sup._id} value={sup._id}>
                    {sup.name} ({sup.email}) — {sup.department || 'CSE'}
                  </option>
                ))}
              </select>
            )}
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
              Select Active Supervision Record *
            </label>
            {supervisions.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 p-2.5 border border-amber-200">
                No active supervisions available to reassign.
              </p>
            ) : (
              <select
                value={supervisionId}
                onChange={(e) => setSupervisionId(e.target.value)}
                className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                required
              >
                {supervisions.map((s) => (
                  <option key={s._id} value={s._id}>
                    Student: {s.student?.name || 'Student'} ➔ Current Supervisor: {s.supervisor?.name || 'Supervisor'}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedSupervision && (
            <div className="bg-slate-50 border border-slate-200 p-3 text-xs space-y-1">
              <p className="font-bold text-slate-700">Current Assignment:</p>
              <p className="text-slate-600">Student: <strong>{selectedSupervision.student?.name}</strong> ({selectedSupervision.student?.email})</p>
              <p className="text-slate-600">Current Supervisor: <strong>{selectedSupervision.supervisor?.name}</strong> ({selectedSupervision.supervisor?.email})</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
              New Supervisor *
            </label>
            <select
              value={newSupervisorId}
              onChange={(e) => setNewSupervisorId(e.target.value)}
              className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600"
              required
            >
              {supervisors.map((sup) => (
                <option key={sup._id} value={sup._id}>
                  {sup.name} ({sup.email}) — {sup.department || 'CSE'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
              Reassignment Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Supervisor on academic leave / Research focus realignment / Department rebalancing"
              rows={3}
              className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 resize-none"
              required
            />
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={submitting || (type === 'assign' ? students.length === 0 || supervisors.length === 0 : supervisions.length === 0)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 transition-colors disabled:opacity-50 text-sm shadow-sm"
      >
        {submitting
          ? 'Processing...'
          : type === 'reassign'
          ? 'Confirm Supervisor Reassignment'
          : 'Confirm Supervisor Assignment'}
      </button>
    </form>
  );
};

export default AssignSupervisorForm;
