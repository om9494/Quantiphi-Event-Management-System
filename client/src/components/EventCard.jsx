import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { createRsvpApi, deleteRsvpApi } from '../api/rsvp.api.js';
import { createInviteApi } from '../api/invite.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ReminderModal from './ReminderModal.jsx';

// Formats a localDate string "YYYY-MM-DD" + localTime "HH:MM:SS" nicely
const formatDateTime = (localDate, localTime) => {
  if (!localDate) return 'Date TBA';
  const [y, m, d] = localDate.split('-');
  const dateStr = new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
  const timeStr = localTime ? localTime.slice(0, 5) : '';
  return timeStr ? `${dateStr} at ${timeStr}` : dateStr;
};

const EventCard = ({ event, onRsvpChange }) => {
  const { isAuth } = useAuth();
  const [isRsvped, setIsRsvped] = useState(event.isRsvped);
  const [friendsCount, setFriendsCount] = useState(event.friendsAttendingCount || 0);
  const [hasReminder, setHasReminder] = useState(event.hasReminder || false);
  const [loadingRsvp, setLoadingRsvp] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);

  const handleRsvpToggle = async () => {
    if (!isAuth) { toast.error('Sign in to RSVP'); return; }
    setLoadingRsvp(true);
    try {
      if (isRsvped) {
        await deleteRsvpApi(event.tmId);
        setIsRsvped(false);
        toast.success('RSVP cancelled');
      } else {
        await createRsvpApi(event.tmId);
        setIsRsvped(true);
        toast.success('You\'re going! 🎉');
      }
      onRsvpChange?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoadingRsvp(false);
    }
  };

  const handleShareLink = async () => {
    if (!isAuth) { toast.error('Sign in to share'); return; }
    try {
      const { data } = await createInviteApi(event.tmId);
      await navigator.clipboard.writeText(data.shareUrl);
      toast.success('Share link copied to clipboard!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create share link');
    }
  };

  return (
    <>
      <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
        {/* Event image */}
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-40 object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-40 bg-brand-50 flex items-center justify-center text-brand-200 text-5xl">
            🎟
          </div>
        )}

        <div className="p-4 flex flex-col flex-1 gap-2">
          {/* Category badge */}
          {event.category && event.category !== 'other' && (
            <span className="text-xs font-medium text-brand-600 uppercase tracking-wide">
              {event.category}
            </span>
          )}

          {/* Title */}
          <h2 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight">
            {event.title}
          </h2>

          {/* Venue */}
          {event.venueName && (
            <p className="text-xs text-gray-500 truncate">📍 {event.venueName}, {event.city}</p>
          )}

          {/* Date / time */}
          <p className="text-xs text-gray-500">
            🗓 {formatDateTime(event.localDate, event.localTime)}
          </p>

          {/* Friends attending — this count comes from the server's aggregation */}
          <p className="text-xs font-medium text-indigo-600">
            👥 {friendsCount} {friendsCount === 1 ? 'friend' : 'friends'} attending
          </p>

          {/* Spacer pushes action row to bottom */}
          <div className="flex-1" />

          {/* Action row */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            {/* Interested / Going button */}
            <button
              onClick={handleRsvpToggle}
              disabled={loadingRsvp}
              aria-pressed={isRsvped}
              className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition disabled:opacity-60 ${
                isRsvped
                  ? 'bg-brand-600 text-white hover:bg-red-500'
                  : 'bg-brand-50 text-brand-600 hover:bg-brand-100 border border-brand-200'
              }`}
            >
              {loadingRsvp ? '…' : isRsvped ? '✓ Going' : 'Interested'}
            </button>

            {/* Reminder — only once RSVPed */}
            {isRsvped && (
              <button
                onClick={() => setShowReminderModal(true)}
                aria-label="Set reminder"
                className={`text-xs px-2 py-1.5 rounded-lg border transition ${
                  hasReminder
                    ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                    : 'border-gray-200 text-gray-500 hover:border-brand-300'
                }`}
              >
                🔔
              </button>
            )}

            {/* Share link — only once RSVPed */}
            {isRsvped && (
              <button
                onClick={handleShareLink}
                aria-label="Copy share link"
                className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-brand-300 transition"
              >
                🔗
              </button>
            )}
          </div>
        </div>
      </article>

      {/* Reminder modal */}
      {showReminderModal && (
        <ReminderModal
          event={event}
          onClose={() => setShowReminderModal(false)}
          onSaved={() => setHasReminder(true)}
        />
      )}
    </>
  );
};

export default EventCard;
