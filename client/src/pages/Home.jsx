// Home / Events feed page.
// Responsibilities (presentation only — NO business logic):
//   1. Collect search inputs (keyword + city) and pass them to the server.
//   2. Render the paged list of EventCards returned by /api/events.
//   3. Hosts EventCalendar; clicking a calendar date loads that day's events
//      from GET /events/date/:date — the server does all the filtering.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { getEventsApi, getEventsByDateApi } from '../api/events.api.js';
import EventCard from '../components/EventCard.jsx';
import EventCalendar from '../components/EventCalendar.jsx';
import Loader from '../components/Loader.jsx';

const PAGE_SIZE = 12;

const Home = () => {
  // ── search / filter state ────────────────────────────────────────────────
  const [keyword, setKeyword]   = useState('');
  const [city, setCity]         = useState('');
  const [category, setCategory] = useState('');

  // Submitted values — only re-fetch when the user actually submits
  const [query, setQuery] = useState({ keyword: '', city: '', category: '' });

  // ── pagination ───────────────────────────────────────────────────────────
  const [page, setPage]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ── calendar date selection ───────────────────────────────────────────────
  // null = showing normal feed; "YYYY-MM-DD" = showing events for that day
  const [selectedDate, setSelectedDate] = useState(null);

  // ── data ─────────────────────────────────────────────────────────────────
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [fromCache, setFromCache] = useState(false);

  // Keep a stable reference to abort controller so we can cancel on re-fetch
  const abortRef = useRef(null);

  // ── fetch events from server (feed mode) ──────────────────────────────────
  const fetchEvents = useCallback(async (q, p) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    try {
      const { data } = await getEventsApi({
        keyword: q.keyword,
        city:    q.city,
        category: q.category,
        page:    p,
        size:    PAGE_SIZE,
      });
      setEvents(data.data || []);
      setTotalPages(data.totalPages || 1);
      setFromCache(data.fromCache || false);
    } catch (err) {
      if (err.name === 'CanceledError') return;
      toast.error(err.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── fetch events for a specific date (calendar drill-down mode) ───────────
  const fetchEventsByDate = useCallback(async (dateStr, cityVal) => {
    setLoading(true);
    try {
      const { data } = await getEventsByDateApi(dateStr, { city: cityVal });
      setEvents(data.data || []);
      setTotalPages(1); // single-day view has no pagination
      setFromCache(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load events for that date');
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch whenever query or page changes (but not when in date-drill-down mode)
  useEffect(() => {
    if (selectedDate) return;   // calendar date selected → fetchEventsByDate handles it
    fetchEvents(query, page);
  }, [query, page, fetchEvents, selectedDate]);

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    setSelectedDate(null);     // clear calendar selection on new search
    setPage(0);
    setQuery({ keyword, city, category });
  };

  // Calendar date click → load that day's events, city from search bar
  const handleDateSelect = (dateStr) => {
    setSelectedDate(dateStr);
    fetchEventsByDate(dateStr, city || query.city);
  };

  // Clear date filter → go back to normal feed
  const clearDateFilter = () => {
    setSelectedDate(null);
    fetchEvents(query, page);
  };

  const handleRsvpChange = () => {
    // Re-fetch so friendsAttendingCount and isRsvped stay accurate after a toggle
    if (selectedDate) fetchEventsByDate(selectedDate, city || query.city);
    else fetchEvents(query, page);
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Discover Events</h1>
        <p className="text-sm text-gray-500 mt-1">
          Find live events in your city, powered by Ticketmaster.
        </p>
      </div>

      {/* ── Search / filter bar ──────────────────────────────────────────── */}
      <form
        onSubmit={handleSearch}
        className="flex flex-wrap gap-3 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
        role="search"
      >
        <input
          type="text"
          placeholder="Search keyword…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="flex-1 min-w-[140px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="Search keyword"
        />
        <input
          type="text"
          placeholder="City…"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-36 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="City"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-36 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="Category"
        >
          <option value="">All categories</option>
          <option value="music">Music</option>
          <option value="sports">Sports</option>
          <option value="arts & theatre">Arts & Theatre</option>
          <option value="film">Film</option>
          <option value="miscellaneous">Miscellaneous</option>
        </select>
        <button
          type="submit"
          className="px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition"
        >
          Search
        </button>
      </form>

      {/* ── Cache warning ────────────────────────────────────────────────── */}
      {fromCache && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          ⚠️ Ticketmaster is currently unavailable — showing cached events.
        </p>
      )}

      {/* ── Two-column layout: calendar (left) + events (right) ──────────── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* Calendar sidebar */}
        <aside className="w-full lg:w-72 shrink-0">
          <EventCalendar
            city={city || query.city}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />
          {selectedDate && (
            <button
              onClick={clearDateFilter}
              className="mt-2 w-full text-xs text-brand-600 hover:underline text-center py-1"
            >
              ✕ Clear date filter — show all events
            </button>
          )}
        </aside>

        {/* Events panel */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Active date heading */}
          {selectedDate && (
            <h2 className="text-sm font-semibold text-gray-600">
              Events on <span className="text-brand-600">{selectedDate}</span>
            </h2>
          )}

          {loading ? (
            <Loader />
          ) : events.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">🎟</p>
              <p className="text-sm">
                {selectedDate
                  ? 'No events on this day. Try another date.'
                  : 'No events found. Try a different city or keyword.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {events.map((event) => (
                <EventCard
                  key={event.tmId}
                  event={event}
                  onRsvpChange={handleRsvpChange}
                />
              ))}
            </div>
          )}

          {/* Pagination — only in feed mode */}
          {!loading && !selectedDate && totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-500">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
