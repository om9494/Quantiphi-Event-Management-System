import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout, isAuth } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
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

        {/* Auth actions */}
        <div className="flex items-center gap-3">
          {isAuth ? (
            <>
              <span className="hidden sm:block text-sm text-gray-600">
                Hi, {user?.name?.split(' ')[0]}
              </span>
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
