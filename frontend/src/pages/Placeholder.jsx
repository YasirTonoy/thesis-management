import React from 'react';

const Placeholder = ({ title }) => (
  <div className="flex flex-col items-center justify-center text-center py-24 border border-dashed border-slate-300">
    <div className="w-10 h-1 bg-blue-600 mb-5" />
    <h1 className="text-xl font-bold text-slate-900 mb-2">{title}</h1>
    <p className="text-slate-500 text-sm max-w-sm">This feature is being rebuilt and will be available in an upcoming update.</p>
  </div>
);

export default Placeholder;
