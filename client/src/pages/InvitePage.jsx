// InvitePage — public landing page for share links.
// Route: /invite/:token (no auth required)
//
// Flow:
//   1. Calls GET /invites/token/:token → server records a click (deduplicated)
//      and returns the event details.
//   2. Shows event info with a prompt to sign in and RSVP.
//   3. If the user is already logged in, they can RSVP directly.

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { resolveInviteApi } from '../api/invite.api.js';
import { createRsvpApi } from '../api/rsvp.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from '../components/Loader.jsx';

// Formats "YYYY-MM-DD" + "HH:MM:SS" into a readable string
const formatDateTime = (localDate, localTime) => {
  if (!localDate) return 'Date TBA';
  const [y, m, d] = localDate.split('-');
  const dateStr = new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
  const timeStr = localTime ? localTime.slice(0, 5) : '';
  return timeStr ? `${dateStr} at ${timeStr}` : dateStr;
};

const InvitePage = () => {
  const { token }    = useParams();
  const { isAuth }   = useAuth();

  const [event, setEvent]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [rsvping, setRsvping] = useState(false);
  const [rsvpDone, setRsvpDone] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        // GET /invites/token/:token — records the click server-side
        const { data } = await resolveInviteApi(token);
        setEvent(data.event);
      } catch (err) {
        setError(err.response?.data?.message || 'This invite link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [token]);

  const handleRsvp = async () => {
    setRsvping(true);
    try {
      await createRsvpApi(event.tmId);
      setRsvpDone(true);
      toast.success("You're going! 🎉");
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not RSVP');
    } finally {
      setRsvping(false);
    }
  };

  if (loading) return <div className="py-20"><Loader /></div>;

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <p className="text-5xl mb-4">🔗</p>
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Link not found</h2>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <Link to="/" className="text-sm text-brand-600 hover:underline">
          Browse all events →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      {/* Invite header */}
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-1">You've been invited to an event 🎉</p>
        <h1 className="text-2xl font-bold text-gray-800">Join your friends!</h1>
      </div>

      {/* Event card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {event?.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-52 object-cover"
          />
        ) : (
          <div className="w-full h-52 bg-brand-50 flex items-center justify-center text-brand-200 text-6xl">
            🎟
          </div>
        )}

        <div className="p-6 flex flex-col gap-3">
          {/* Category */}
          {event?.category && (
            <span className="text-xs font-medium text-brand-600 uppercase tracking-wide">
              {event.category}
            </span>
          )}

          {/* Title */}
          <h2 className="text-xl font-semibold text-gray-800">{event?.title}</h2>

          {/* Venue */}
          {event?.venueName && (
            <p className="text-sm text-gray-500">📍 {event.venueName}, {event.city}</p>
          )}

          {/* Date/time */}
          <p className="text-sm text-gray-500">
            🗓 {formatDateTime(event?.localDate, event?.localTime)}
          </p>

          {/* Friends attending */}
          <p className="text-sm font-medium text-indigo-600">
            👥 {event?.friendsAttendingCount || 0} friends attending
          </p>

          {/* CTA */}
          <div className="pt-2 border-t border-gray-100">
            {rsvpDone ? (
              <div className="text-center py-3">
                <p className="text-brand-600 font-semibold text-sm">✓ You're going!</p>
                <Link to="/dashboard" className="text-xs text-gray-400 hover:text-brand-500 mt-1 inline-block">
                  View in My RSVPs →
                </Link>
              </div>
            ) : isAuth ? (
              <button
                onClick={handleRsvp}
                disabled={rsvping}
                className="w-full py-3 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 disabled:opacity-60 transition text-sm"
              >
                {rsvping ? 'Saving…' : "I'm Interested — Count me in!"}
              </button>
            ) : (
              <div className="flex flex-col gap-2 text-center">
                <p className="text-sm text-gray-500">Sign in to RSVP for this event</p>
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-brand-200 text-brand-600 hover:bg-brand-50 transition text-center"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition text-center"
                  >
                    Register
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Back link */}
      <p className="text-center text-xs text-gray-400">
        <Link to="/" className="hover:text-brand-500">Browse all events →</Link>
      </p>
    </div>
  );
};

export default InvitePage;
