// ReminderModal — lets a user set a reminder for an event they've RSVPed to.
// Only sends a PUT /reminders/:eventId request; all validation happens on the server.

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { upsertReminderApi } from '../api/reminder.api.js';

// Allowed reminder lead-times (must match server-side allowed values)
const REMINDER_OPTIONS = [
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before',     value: 60 },
  { label: '1 day before',      value: 1440 },
  { label: '2 days before',     value: 2880 },
  { label: '1 week before',     value: 10080 },
];

const ReminderModal = ({ event, onClose, onSaved }) => {
  const [remindBefore, setRemindBefore] = useState(60);
  const [enabled, setEnabled]           = useState(true);
  const [saving, setSaving]             = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertReminderApi(event.tmId, { remindBefore, enabled });
      toast.success('Reminder saved!');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save reminder');
    } finally {
      setSaving(false);
    }
  };

  return (
    // Backdrop — clicking outside closes the modal
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reminder-modal-title"
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()} // prevent backdrop click when clicking inside
      >
        <h2 id="reminder-modal-title" className="text-base font-semibold text-gray-800">
          🔔 Set Reminder
        </h2>
        <p className="text-sm text-gray-500 -mt-2 line-clamp-1">{event.title}</p>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* Lead-time selector */}
          <div>
            <label htmlFor="remindBefore" className="block text-xs font-medium text-gray-600 mb-1">
              Remind me
            </label>
            <select
              id="remindBefore"
              value={remindBefore}
              onChange={(e) => setRemindBefore(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {REMINDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Enable / disable toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-4 h-4 accent-brand-600"
            />
            <span className="text-sm text-gray-700">Enable this reminder</span>
          </label>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-60 transition"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReminderModal;
