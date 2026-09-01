import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../api';

const SEVERITY = {
  critical: { label: 'Overdue', className: 'bg-red-50 text-red-700', border: 'border-l-red-500' },
  warning: { label: 'Due Soon', className: 'bg-amber-50 text-amber-700', border: 'border-l-amber-500' },
  info: { label: 'Upcoming', className: 'bg-blue-50 text-blue-700', border: 'border-l-blue-500' }
};

const TYPE_LABELS = {
  milestone_due: 'Milestone',
  milestone_overdue: 'Milestone',
  defense_upcoming: 'Defense',
  meeting_upcoming: 'Meeting',
  submission_returned: 'Submission'
};

const relativeDue = (dueAt) => {
  if (!dueAt) return '';
  const ms = new Date(dueAt).getTime() - Date.now();
  const days = Math.round(Math.abs(ms) / (24 * 60 * 60 * 1000));
  if (ms < 0) return days === 0 ? 'Due today' : `${days} day${days === 1 ? '' : 's'} overdue`;
  if (days === 0) return 'Due today';
  return `in ${days} day${days === 1 ? '' : 's'}`;
};

const Notifications = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sweeping, setSweeping] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await notificationAPI.getAll(unreadOnly ? { unreadOnly: 'true' } : {});
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications');
    }
    setLoading(false);
  }, [unreadOnly]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationAPI.delete(id);
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete notification');
    }
  };

  const handleSweep = async () => {
    setSweeping(true);
    try {
      const res = await notificationAPI.sweep();
      alert(res.data.message);
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to run the reminder sweep');
    }
    setSweeping(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="bg-white border border-red-200 rounded-lg p-6 text-red-600 text-sm">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500">
            {unreadCount > 0 ? `${unreadCount} unread reminder${unreadCount === 1 ? '' : 's'}` : 'You are all caught up.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setUnreadOnly((s) => !s)}
            className={`text-sm font-semibold px-4 py-2 rounded-lg transition ${
              unreadOnly ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {unreadOnly ? 'Showing Unread' : 'Show Unread Only'}
          </button>
          {isAdmin && (
            <button
              onClick={handleSweep}
              disabled={sweeping}
              className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              {sweeping ? 'Running...' : 'Run Reminder Sweep'}
            </button>
          )}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <p className="text-sm text-slate-400">
          {unreadOnly ? 'No unread notifications.' : 'No deadline reminders yet. They appear automatically as due dates approach.'}
        </p>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const sev = SEVERITY[n.severity] || SEVERITY.info;
            return (
              <div
                key={n._id}
                className={`bg-white border border-slate-200 border-l-4 ${sev.border} rounded-lg p-5 shadow-sm ${
                  n.isRead ? 'opacity-60' : ''
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${sev.className}`}>{sev.label}</span>
                    <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-md">
                      {TYPE_LABELS[n.type] || 'Reminder'}
                    </span>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-600" title="Unread"></span>}
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{relativeDue(n.dueAt)}</span>
                </div>

                <h3 className="font-semibold text-slate-900 mt-3">{n.title}</h3>
                {n.message && <p className="text-sm text-slate-600 mt-1 leading-relaxed">{n.message}</p>}

                <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-3">
                    {!n.isRead && (
                      <button onClick={() => handleMarkRead(n._id)} className="text-xs font-semibold text-blue-600 hover:underline">
                        Mark Read
                      </button>
                    )}
                    <button onClick={() => handleDelete(n._id)} className="text-xs font-semibold text-red-600 hover:underline">
                      Dismiss
                    </button>
                    {n.link && (
                      <Link to={n.link} className="text-xs text-blue-600 hover:underline font-medium">
                        View
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
