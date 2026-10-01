// EventCalendar — a custom month-grid calendar component.
//
// Data flow (all logic on the server):
//   1. On month change → GET /events/calendar?year=&month=&city= 
//      The server returns { dates: { "YYYY-MM-DD": count, ... } }
//   2. The grid simply highlights cells whose YYYY-MM-DD key appears in the map.
//   3. Clicking a highlighted date calls onDateSelect(dateStr) so the parent
//      (Home.jsx) can fetch events for that day via GET /events/date/:date.
//
// No date arithmetic for "which events are on day X" runs in this file —
// that question is always answered by the server.

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getCalendarDatesApi } from '../api/events.api.js';

// Short day-of-week headers starting from Sunday
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Build the grid cells for a given year/month (0-indexed month).
// Returns an array of 35 or 42 cells: null = padding cell, else Date object.
const buildGrid = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  // Leading padding
  for (let i = 0; i < firstDay; i++) cells.push(null);
  // Actual days
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  // Trailing padding to complete the last row
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

// Zero-pad a number to 2 digits
const pad = (n) => String(n).padStart(2, '0');

// Convert a Date to "YYYY-MM-DD" in local time (no UTC shift)
const toLocalDateStr = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const EventCalendar = ({ city = '', onDateSelect, selectedDate }) => {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  // Map of "YYYY-MM-DD" -> event count, returned by the server
  const [eventDates, setEventDates] = useState({});
  const [loading, setLoading]       = useState(false);

  // Fetch calendar data whenever year, month, or city changes
  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getCalendarDatesApi({ year, month: month + 1, city });
      // Server returns { success, year, month, city, dates: { "YYYY-MM-DD": count, ... } }
      setEventDates(data.dates || {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load calendar');
    } finally {
      setLoading(false);
    }
  }, [year, month, city]);

  useEffect(() => { fetchCalendar(); }, [fetchCalendar]);

  // Navigation
  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  const grid = buildGrid(year, month);
  const todayStr = toLocalDateStr(today);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 select-none w-full">

      {/* ── Header: month navigation ──────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          aria-label="Previous month"
          className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-500"
        >
          ‹
        </button>
        <h3 className="text-sm font-semibold text-gray-700">
          {MONTH_NAMES[month]} {year}
          {loading && <span className="ml-2 text-xs text-gray-400">…</span>}
        </h3>
        <button
          onClick={nextMonth}
          aria-label="Next month"
          className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-500"
        >
          ›
        </button>
      </div>

      {/* ── Day-of-week labels ────────────────────────────────────────── */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <span key={d} className="text-center text-xs text-gray-400 font-medium py-1">
            {d}
          </span>
        ))}
      </div>

      {/* ── Date cells ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-7 gap-0.5">
        {grid.map((date, idx) => {
          if (!date) {
            // Empty padding cell
            return <div key={`pad-${idx}`} className="h-8" />;
          }

          const dateStr    = toLocalDateStr(date);
          const hasEvents  = Boolean(eventDates[dateStr]);
          const count      = eventDates[dateStr] || 0;
          const isToday    = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;

          return (
            <button
              key={dateStr}
              onClick={() => hasEvents && onDateSelect?.(dateStr)}
              disabled={!hasEvents}
              title={hasEvents ? `${count} event${count !== 1 ? 's' : ''}` : undefined}
              aria-label={`${dateStr}${hasEvents ? `, ${count} events` : ''}`}
              aria-pressed={isSelected}
              className={[
                'h-9 w-full flex flex-col items-center justify-center rounded-lg text-xs font-medium transition relative',
                isSelected
                  ? 'bg-brand-600 text-white'
                  : isToday
                  ? 'ring-2 ring-brand-400 text-brand-700'
                  : hasEvents
                  ? 'bg-brand-50 text-brand-700 hover:bg-brand-100 cursor-pointer'
                  : 'text-gray-300 cursor-default',
              ].join(' ')}
            >
              {date.getDate()}
              {/* Visible dot indicator below day number for event days */}
              {hasEvents && (
                <span
                  aria-hidden="true"
                  className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                    isSelected ? 'bg-white/70' : 'bg-brand-500'
                  }`}
                />
              )}
              {/* Screen-reader count */}
              {hasEvents && <span className="sr-only">{count} events</span>}
            </button>
          );
        })}
      </div>

      {/* ── Legend ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-100 flex-wrap">
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <span className="w-3 h-3 rounded bg-brand-100 inline-block relative">
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-500 inline-block" />
          </span>
          Has events
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <span className="w-3 h-3 rounded bg-brand-600 inline-block" /> Selected
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <span className="w-3 h-3 rounded ring-2 ring-brand-400 inline-block" /> Today
        </span>
      </div>
    </div>
  );
};

export default EventCalendar;
