import React, { useState } from 'react';

const AssignSupervisorForm = ({ onSubmit, type = 'assign', supervisions = [] }) => {
  const [formData, setFormData] = useState({
    studentId: '',
    supervisorId: '',
    reassignmentReason: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({ studentId: '', supervisorId: '', reassignmentReason: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
          {type === 'reassign' ? 'Active Student User ID' : 'Student MongoDB User ID'}
        </label>
        <input
          type="text"
          value={formData.studentId}
          onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
          placeholder="e.g., 60d5ec49f1b2c81234567890"
          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition text-slate-100 placeholder:text-slate-600"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Supervisor MongoDB User ID</label>
        <input
          type="text"
          value={formData.supervisorId}
          onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
          placeholder="e.g., 60d5ec49f1b2c81234567891"
          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition text-slate-100 placeholder:text-slate-600"
          required
        />
      </div>

      {type === 'reassign' && (
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Reassignment Reason</label>
          <textarea
            value={formData.reassignmentReason}
            onChange={(e) => setFormData({ ...formData, reassignmentReason: e.target.value })}
            placeholder="State rationale for supervisor reassignment"
            rows="3"
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition text-slate-100 placeholder:text-slate-600"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 shadow-lg shadow-blue-500/20 disabled:opacity-50"
      >
        {loading ? 'Processing Request...' : type === 'reassign' ? 'Reassign Supervisor 🔄' : 'Assign Supervisor 🤝'}
      </button>
    </form>
  );
};

export default AssignSupervisorForm;
