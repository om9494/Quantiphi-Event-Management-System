// RSVP Dashboard — shows the user's confirmed events.
// The server splits them into "upcoming" and "past" — this page just renders them.
// No date-comparison or sorting logic lives here.

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getUserRsvpsApi, deleteRsvpApi } from '../api/rsvp.api.js';
import { createInviteApi, getLinkStatsApi } from '../api/invite.api.js';
import Loader from '../components/Loader.jsx';

// Formats "YYYY-MM-DD" + "HH:MM:SS" into a readable string
const formatDateTime = (localDate, localTime) => {
  if (!localDate) return 'Date TBA';
  const [y, m, d] = localDate.split('-');
  const dateStr = new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
  const timeStr = localTime ? localTime.slice(0, 5) : '';
  return timeStr ? `${dateStr} at ${timeStr}` : dateStr;
};

// ── Single RSVP card ────────────────────────────────────────────────────────
const RsvpCard = ({ rsvp, onCancelled }) => {
  const { event, reminder, shareLink } = rsvp;
  const [cancelling, setCancelling] = useState(false);
  const [copyLoading, setCopyLoading] = useState(false);
  const [friendsCount, setFriendsCount] = useState(event.friendsAttendingCount || 0);

  // Cancel RSVP — hits DELETE /rsvps/:eventId, then removes this card
  const handleCancel = async () => {
    if (!window.confirm('Cancel your RSVP for this event?')) return;
    setCancelling(true);
    try {
      await deleteRsvpApi(event.tmId);
      toast.success('RSVP cancelled');
      onCancelled(event.tmId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel RSVP');
    } finally {
      setCancelling(false);
    }
  };

  // Generate or retrieve share link, copy to clipboard, refresh stats
  const handleShareLink = async () => {
    setCopyLoading(true);
    try {
      const { data } = await createInviteApi(event.tmId);
      await navigator.clipboard.writeText(data.shareUrl);
      toast.success('Share link copied!');
      // Refresh the friends count from the server after generating the link
      const stats = await getLinkStatsApi(event.tmId);
      setFriendsCount(stats.data.uniqueClicks ?? friendsCount);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not copy share link');
    } finally {
      setCopyLoading(false);
    }
  };

  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col sm:flex-row gap-0">
      {/* Thumbnail */}
      {event.imageUrl ? (
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full sm:w-36 h-36 sm:h-auto object-cover shrink-0"
          loading="lazy"
        />
      ) : (
        <div className="w-full sm:w-36 h-24 sm:h-auto bg-brand-50 flex items-center justify-center text-brand-200 text-4xl shrink-0">
          🎟
        </div>
      )}

      {/* Details */}
      <div className="p-4 flex flex-col flex-1 gap-1.5">
        {/* Category */}
        {event.category && (
          <span className="text-xs font-medium text-brand-600 uppercase tracking-wide">
            {event.category}
          </span>
        )}
        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">{event.title}</h3>
        {/* Venue */}
        {event.venueName && (
          <p className="text-xs text-gray-500">📍 {event.venueName}, {event.city}</p>
        )}
        {/* Date/time */}
        <p className="text-xs text-gray-500">
          🗓 {formatDateTime(event.localDate, event.localTime)}
        </p>
        {/* Friends attending */}
        <p className="text-xs font-medium text-indigo-600">
          👥 {friendsCount} {friendsCount === 1 ? 'friend' : 'friends'} attending
        </p>

        {/* Reminder status */}
        {reminder && (
          <p className="text-xs text-yellow-600">
            🔔 Reminder: {reminder.remindBefore === 1440
              ? '1 day before'
              : reminder.remindBefore === 60
              ? '1 hour before'
              : `${reminder.remindBefore} min before`}
            {reminder.sent && ' (sent)'}
          </p>
        )}

        {/* Share link info */}
        {shareLink && (
          <p className="text-xs text-gray-400 truncate">
            🔗 Your link: <span className="text-brand-500">{shareLink.url}</span>
          </p>
        )}

        {/* Action row */}
        <div className="flex flex-wrap gap-2 mt-auto pt-2">
          <button
            onClick={handleShareLink}
            disabled={copyLoading}
            className="text-xs px-3 py-1.5 rounded-lg border border-brand-200 text-brand-600 hover:bg-brand-50 disabled:opacity-60 transition"
          >
            {copyLoading ? '…' : '🔗 Copy Share Link'}
          </button>
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-60 transition"
          >
            {cancelling ? '…' : 'Cancel RSVP'}
          </button>
        </div>
      </div>
    </article>
  );
};

// ── Dashboard page ──────────────────────────────────────────────────────────
const Dashboard = () => {
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('upcoming'); // 'upcoming' | 'past'

  const fetchRsvps = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getUserRsvpsApi();
      // Server already splits into upcoming / past — just store them
      setUpcoming(data.upcoming || []);
      setPast(data.past || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load your RSVPs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRsvps(); }, [fetchRsvps]);

  // Remove a card locally after RSVP cancellation to avoid full re-fetch
  const handleCancelled = (tmId) => {
    setUpcoming((prev) => prev.filter((r) => r.event.tmId !== tmId));
    setPast((prev) => prev.filter((r) => r.event.tmId !== tmId));
  };

  const activeList = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My RSVPs</h1>
        <p className="text-sm text-gray-500 mt-1">Events you've confirmed attendance for.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['upcoming', 'past']).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition capitalize ${
              tab === t
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'upcoming' ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <Loader />
      ) : activeList.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🎟</p>
          <p className="text-sm">
            {tab === 'upcoming'
              ? 'No upcoming events. Browse events and hit "Interested"!'
              : 'No past events yet.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {activeList.map((rsvp) => (
            <RsvpCard
              key={rsvp.event.tmId}
              rsvp={rsvp}
              onCancelled={handleCancelled}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
