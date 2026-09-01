import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../api';
import { IconDashboard, IconProposal, IconSupervision, IconMilestone, IconNotice, IconLogout, IconAlarm, IconChart, IconEquipment } from './icons';

const UNREAD_POLL_MS = 60000;

/** Department analytics is faculty-only, matching the API's own access rule. */
const FACULTY_NAV_ITEMS = [{ to: '/analytics', label: 'Analytics', icon: IconChart, roles: ['supervisor', 'admin'] }];

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: IconDashboard },
  { to: '/equipment-booking', label: '🔬 Lab & Equipment', icon: IconEquipment },
  { to: '/proposals', label: 'Proposals', icon: IconProposal },
  { to: '/research-groups', label: 'Research Groups', icon: IconSupervision },
  { to: '/notices', label: 'Notices', icon: IconNotice },
  { to: '/supervision', label: 'Supervision', icon: IconSupervision },
  { to: '/milestones', label: 'Milestones', icon: IconMilestone }
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = [...NAV_ITEMS, ...FACULTY_NAV_ITEMS.filter((item) => item.roles.includes(user?.role))];

  useEffect(() => {
    if (!user) return undefined;

    let active = true;
    const load = async () => {
      try {
        const res = await notificationAPI.unreadCount();
        if (active) setUnreadCount(res.data.unreadCount || 0);
      } catch {
        // A failed poll should never break the navbar.
      }
    };

    load();
    const timer = setInterval(load, UNREAD_POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [user, location.pathname]);

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5 mr-8">
          <div className="w-8 h-8 bg-blue-600 flex items-center justify-center text-white font-bold text-sm">BR</div>
          <span className="font-bold text-base tracking-tight hidden sm:block">BRACU ResearchHub</span>
        </div>

        <nav className="hidden md:flex items-center gap-1 flex-1">
          {navItems.map(({ to, label, icon: Icon }) => (
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
            to="/notifications"
            title="Deadline reminders"
            className={({ isActive }) =>
              `relative flex items-center p-2 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'}`
            }
          >
            <IconAlarm className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
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
        {navItems.map(({ to, label, icon: Icon }) => (
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
