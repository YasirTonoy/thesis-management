import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconDashboard, IconProposal, IconSupervision, IconMilestone, IconNotice, IconLogout } from './icons';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: IconDashboard },
  { to: '/proposals', label: 'Proposals', icon: IconProposal },
  { to: '/notices', label: 'Notices', icon: IconNotice },
  { to: '/supervision', label: 'Supervision', icon: IconSupervision },
  { to: '/milestones', label: 'Milestones', icon: IconMilestone }
];

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5 mr-8">
          <div className="w-8 h-8 bg-blue-600 flex items-center justify-center text-white font-bold text-sm">BR</div>
          <span className="font-bold text-base tracking-tight hidden sm:block">BRACU ResearchHub</span>
        </div>

        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 text-sm font-semibold transition-colors border-b-2 ${
                  isActive ? 'text-blue-600 border-blue-600' : 'text-slate-600 border-transparent hover:text-blue-600'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 text-sm font-semibold transition-colors ${
                isActive ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'
              }`
            }
          >
            <div className="w-7 h-7 bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="hidden sm:block">{user?.name}</span>
          </NavLink>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-red-600 px-2 py-1.5 transition-colors"
          >
            <IconLogout className="w-4 h-4" />
            <span className="hidden sm:block">Log out</span>
          </button>
        </div>
      </div>

      <nav className="flex md:hidden items-center gap-1 px-4 pb-2 overflow-x-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive ? 'text-blue-600 bg-blue-50' : 'text-slate-600'
              }`
            }
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
};

export default Navbar;
