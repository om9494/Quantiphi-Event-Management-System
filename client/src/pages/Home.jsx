// Home / Events feed page.
// Responsibilities (presentation only — NO business logic):
//   1. Collect search inputs (keyword + city) and pass them to the server.
//   2. Render the paged list of EventCards returned by /api/events.
//   3. The EventCalendar lives here too (added in feat 11); for now a placeholder keeps the layout stable.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { getEventsApi } from '../api/events.api.js';
import EventCard from '../components/EventCard.jsx';
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

  // ── data ─────────────────────────────────────────────────────────────────
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [fromCache, setFromCache] = useState(false);

  // Keep a stable reference to abort controller so we can cancel on re-fetch
  const abortRef = useRef(null);

  // ── fetch events from server ──────────────────────────────────────────────
  const fetchEvents = useCallback(async (q, p) => {
    // Cancel any in-flight request
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
      if (err.name === 'CanceledError') return; // ignore aborted requests
      toast.error(err.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch whenever query or page changes
  useEffect(() => {
    fetchEvents(query, page);
  }, [query, page, fetchEvents]);

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);                        // reset to first page on new search
    setQuery({ keyword, city, category });
  };

  const handleRsvpChange = () => {
    // Re-fetch so friendsAttendingCount and isRsvped stay accurate
    fetchEvents(query, page);
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

      {/* ── Event grid ───────────────────────────────────────────────────── */}
      {loading ? (
        <Loader />
      ) : events.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🎟</p>
          <p className="text-sm">No events found. Try a different city or keyword.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {events.map((event) => (
            <EventCard
              key={event.tmId}
              event={event}
              onRsvpChange={handleRsvpChange}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {!loading && totalPages > 1 && (
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
  );
};

export default Home;
