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
        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
          {type === 'reassign' ? 'Active Student User ID' : 'Student MongoDB User ID'}
        </label>
        <input
          type="text"
          value={formData.studentId}
          onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
          placeholder="e.g., 60d5ec49f1b2c81234567890"
          className="w-full border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition placeholder:text-slate-400"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Supervisor MongoDB User ID</label>
        <input
          type="text"
          value={formData.supervisorId}
          onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
          placeholder="e.g., 60d5ec49f1b2c81234567891"
          className="w-full border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition placeholder:text-slate-400"
          required
        />
      </div>

      {type === 'reassign' && (
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Reassignment Reason</label>
          <textarea
            value={formData.reassignmentReason}
            onChange={(e) => setFormData({ ...formData, reassignmentReason: e.target.value })}
            placeholder="State rationale for supervisor reassignment"
            rows="3"
            className="w-full border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition placeholder:text-slate-400 resize-none"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 transition-colors disabled:opacity-50 text-sm shadow-sm"
      >
        {loading ? 'Processing...' : type === 'reassign' ? 'Reassign Supervisor' : 'Assign Supervisor'}
      </button>
    </form>
  );
};

export default AssignSupervisorForm;

