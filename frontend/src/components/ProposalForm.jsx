import React, { useState } from 'react';

const ProposalForm = ({ onSubmit, initialData = null }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || initialData?.abstract || '',
    supervisor: initialData?.supervisor || '',
    coSupervisor: initialData?.coSupervisor || ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    try {
      await onSubmit({ 
        title: formData.title.trim(), 
        description: formData.description.trim(),
        supervisor: formData.supervisor.trim(),
        coSupervisor: formData.coSupervisor.trim()
      });
      
      if (!initialData) {
        setFormData({ title: '', description: '', supervisor: '', coSupervisor: '' });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="h-1 bg-blue-600 mb-2" />
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3">
          {error}
        </div>
      )}
      
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
          Thesis Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
          placeholder="e.g., Deep Learning Framework for Medical Imaging"
          disabled={isSubmitting}
          required
        />
      </div>
      
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
          Abstract / Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="4"
          className="w-full border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition resize-none"
          placeholder="Provide a comprehensive summary of your research objectives..."
          disabled={isSubmitting}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
            Supervisor Name
          </label>
          <input
            type="text"
            name="supervisor"
            value={formData.supervisor}
            onChange={handleChange}
            className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
            placeholder="Dr. Sarah Connor"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
            Co-Supervisor (Optional)
          </label>
          <input
            type="text"
            name="coSupervisor"
            value={formData.coSupervisor}
            onChange={handleChange}
            className="w-full border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
            placeholder="Optional"
            disabled={isSubmitting}
          />
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 transition-colors disabled:opacity-50 text-sm shadow-sm"
      >
        {isSubmitting ? 'Submitting…' : initialData ? 'Update Proposal' : 'Submit Proposal'}
      </button>
    </form>
  );
};

export default ProposalForm;