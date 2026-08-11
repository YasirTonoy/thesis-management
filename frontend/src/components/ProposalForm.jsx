import React, { useState } from 'react';

const ProposalForm = ({ onSubmit, initialData = null }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    abstract: initialData?.abstract || '',
    keywords: initialData?.keywords?.join(', ') || ''
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
    if (!formData.title.trim() || !formData.abstract.trim()) {
      setError('Title and abstract are required');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    try {
      const keywords = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k);
      
      await onSubmit({ 
        title: formData.title.trim(), 
        abstract: formData.abstract.trim(), 
        keywords 
      });
      
      if (!initialData) {
        setFormData({ title: '', abstract: '', keywords: '' });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="backdrop-blur-xl bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs p-3.5 rounded-xl flex items-center space-x-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
          Thesis Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-slate-100 placeholder:text-slate-600"
          placeholder="e.g., Deep Learning Framework for Medical Imaging"
          disabled={isSubmitting}
        />
      </div>
      
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
          Abstract / Research Summary <span className="text-red-400">*</span>
        </label>
        <textarea
          name="abstract"
          value={formData.abstract}
          onChange={handleChange}
          rows="5"
          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-slate-100 placeholder:text-slate-600"
          placeholder="Provide a comprehensive summary of your research objectives..."
          disabled={isSubmitting}
        />
      </div>
      
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
          Keywords (comma separated)
        </label>
        <input
          type="text"
          name="keywords"
          value={formData.keywords}
          onChange={handleChange}
          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-slate-100 placeholder:text-slate-600"
          placeholder="e.g., AI, Computer Vision, Neural Networks"
          disabled={isSubmitting}
        />
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 shadow-lg shadow-blue-500/20 disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting Proposal...' : initialData ? 'Update Proposal' : 'Submit Thesis Proposal 🚀'}
      </button>
    </form>
  );
};

export default ProposalForm;