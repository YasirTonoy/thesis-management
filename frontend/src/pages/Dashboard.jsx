import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconProposal, IconSupervision, IconMilestone } from '../components/icons';

const FEATURES = [
  { to: '/proposals', icon: IconProposal, name: 'Proposals', desc: 'Submit your thesis proposal and track its review status.' },
  { to: '/supervision', icon: IconSupervision, name: 'Supervision', desc: 'See your assigned supervisor and reassignment history.' },
  { to: '/milestones', icon: IconMilestone, name: 'Milestones', desc: 'Track upcoming deadlines and submission status.' }
];

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-10">
        <div className="w-10 h-1 bg-blue-600 mb-4" />
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Welcome, {user?.name?.split(' ')[0]}</h1>
        <p className="text-slate-500 text-sm">{user?.department} {user?.studentId ? `· ID ${user.studentId}` : ''}</p>
      </div>

      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Your Workspace</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200 border border-slate-200">
        {FEATURES.map(({ to, icon: Icon, name, desc }) => (
          <Link key={to} to={to} className="bg-white p-6 hover:bg-blue-50/50 transition-colors group">
            <Icon className="w-6 h-6 text-blue-600 mb-4" />
            <h3 className="font-bold text-slate-900 mb-1.5 group-hover:text-blue-600 transition-colors">{name}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
