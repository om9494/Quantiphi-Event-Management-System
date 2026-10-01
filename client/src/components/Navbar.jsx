// Navbar — top navigation bar.
// Also mounts the real-time notification bell:
//   - On mount (when logged in) it fetches unread notifications via GET /reminders/notifications.
//   - It also listens on the socket for "notification:new" events pushed by the cron job,
//     so the bell updates instantly without a page refresh.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getNotificationsApi } from '../api/reminder.api.js';
import { getSocket } from '../socket.js';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout, isAuth } = useAuth();
  const navigate = useNavigate();

  // ── Notification bell state ─────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);

  // Fetch existing unread notifications once after auth resolves
  const fetchNotifications = useCallback(async () => {
    if (!isAuth) return;
    try {
      const { data } = await getNotificationsApi();
      setNotifications(data.notifications || []);
    } catch {
      // Non-critical — don't show an error toast for this
    }
  }, [isAuth]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Real-time: listen for new notifications pushed by the cron job ──────
  useEffect(() => {
    if (!isAuth) return;

    const socket = getSocket();

    const handleNewNotification = (notif) => {
      // Prepend so newest is first
      setNotifications((prev) => [notif, ...prev]);
      // Also show a toast so the user notices even if bell is closed
      toast(`🔔 ${notif.message}`, { duration: 5000 });
    };

    socket.on('notification:new', handleNewNotification);
    return () => socket.off('notification:new', handleNewNotification);
  }, [isAuth]);

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setNotifications([]);
    setBellOpen(false);
    toast.success('Logged out');
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition ${isActive ? 'text-brand-600' : 'text-gray-600 hover:text-brand-600'}`;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-lg font-bold text-brand-600">
          Quantiphi EMS
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-5">
          <NavLink to="/" className={linkClass} end>
            Events
          </NavLink>
          {isAuth && (
            <>
              <NavLink to="/dashboard" className={linkClass}>
                My RSVPs
              </NavLink>
              <NavLink to="/profile" className={linkClass}>
                Profile
              </NavLink>
            </>
          )}
        </div>

        {/* Auth actions + notification bell */}
        <div className="flex items-center gap-3">
          {isAuth ? (
            <>
              <span className="hidden sm:block text-sm text-gray-600">
                Hi, {user?.name?.split(' ')[0]}
              </span>

              {/* ── Notification bell ──────────────────────────────────── */}
              <div className="relative" ref={bellRef}>
                <button
                  onClick={() => setBellOpen((o) => !o)}
                  aria-label={`Notifications${notifications.length ? ` (${notifications.length} unread)` : ''}`}
                  className="relative p-1.5 rounded-lg text-gray-500 hover:text-brand-600 hover:bg-brand-50 transition"
                >
                  🔔
                  {/* Unread badge */}
                  {notifications.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  )}
                </button>

                {/* Dropdown panel */}
                {bellOpen && (
                  <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-600">Notifications</span>
                      {notifications.length > 0 && (
                        <button
                          onClick={() => setNotifications([])}
                          className="text-xs text-gray-400 hover:text-red-400 transition"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="px-4 py-4 text-xs text-gray-400 text-center">
                        No new notifications
                      </p>
                    ) : (
                      <ul className="max-h-60 overflow-y-auto divide-y divide-gray-50">
                        {notifications.map((n, i) => (
                          <li key={n._id || i} className="px-4 py-2.5">
                            <p className="text-xs text-gray-700">{n.message}</p>
                            {n.createdAt && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {new Date(n.createdAt).toLocaleTimeString(undefined, {
                                  hour: '2-digit', minute: '2-digit',
                                })}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-red-500 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-600 hover:text-brand-600 transition">
                Sign in
              </Link>
              <Link
                to="/register"
                className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg transition"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
