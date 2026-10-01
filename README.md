# Quantiphi Event Management System

A full-stack MERN application for finding, tracking, and sharing events powered by the **Ticketmaster Discovery API v2**.

---

## Features

- **Event Feed** — search events by keyword, city, and category; results fetched from Ticketmaster and cached in MongoDB
- **Event Calendar** — month-grid calendar that highlights dates with events; clicking a date loads that day's events (all driven by server data)
- **RSVP (Interested)** — one-click RSVP with idempotent toggle; stored in MongoDB with duplicate-prevention index
- **RSVP Dashboard** — dedicated page showing upcoming / past confirmed events with reminder status and share links
- **Friend Invite System** — generate a unique share link after RSVPing; backend tracks unique clicks (deduplicated by visitor hash); "Friends Attending" count shown on every event card
- **Reminders** — set in-app reminders (30 min / 1 hr / 1 day / etc.); a `node-cron` job fires every minute and pushes notifications
- **Real-time updates** — Socket.io pushes live friends-count updates and reminder notifications to the browser without refresh
- **Auth** — JWT-based register/login; bcrypt password hashing; protected routes on client and server

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite), React Router v6, Axios, Tailwind CSS |
| Backend | Node.js, Express (ES modules), Mongoose |
| Auth | JWT + bcrypt |
| Database | MongoDB Atlas |
| External API | Ticketmaster Discovery API v2 |
| Real-time | Socket.io (server + client) |
| Scheduling | node-cron |
| Security | helmet, cors, express-rate-limit, express-validator |

---

## Project Structure

```
/
├── client/                     # React frontend (Vite)
│   └── src/
│       ├── api/                # Axios instance + per-resource API modules
│       ├── components/         # EventCard, EventCalendar, Navbar, ReminderModal, Loader
│       ├── context/            # AuthContext (JWT state)
│       ├── pages/              # Home, Login, Register, Dashboard, Profile, InvitePage
│       ├── routes/             # ProtectedRoute
│       └── socket.js           # Socket.io client singleton
│
├── server/                     # Express API
│   └── src/
│       ├── config/             # db.js (MongoDB), env.js (validated env vars)
│       ├── controllers/        # Thin HTTP handlers
│       ├── services/           # Business logic (ticketmaster, rsvp, invite, reminder)
│       ├── models/             # Mongoose schemas (User, Event, Rsvp, ReminderSetting, ShareLink, LinkClick, Notification)
│       ├── routes/             # Express routers
│       ├── middleware/         # auth (JWT), validate, errorHandler, rateLimiter
│       ├── jobs/               # reminderCron.js
│       ├── utils/              # friendsCount aggregation helper
│       ├── socket.js           # Socket.io singleton (init + getIo)
│       ├── app.js              # Express app
│       └── server.js           # HTTP server entry point
│
├── .gitignore
└── README.md
```

---

## Architecture

The codebase follows a strict **layered pattern**: `routes → controllers → services → models`.

- **Routes** declare HTTP paths and apply middleware (auth, validation, rate limiting).
- **Controllers** are thin — they call one service function and send the response.
- **Services** own all business logic: Ticketmaster normalisation, RSVP rules, click deduplication, reminder scheduling, friends-count aggregation.
- **The React frontend has zero business logic.** It calls APIs, receives computed data, and renders it. Filtering, sorting, date grouping, validation, and counting all happen on the server.

### Friends Attending Count

> Defined as: the number of **unique visitor clicks** across all share links for a given event. A click is deduplicated by hashing `IP + User-Agent` (stored as `visitorHash` in `LinkClick`). The link owner's own clicks are excluded at insert time. The count is computed server-side with a `countDocuments` query and injected into every event payload.

### Real-time (Socket.io)

- Server maintains an `io` singleton in `server/src/socket.js`.
- Clients join room `event:<tmId>` to receive `friends:update` broadcasts.
- Authenticated clients are placed in room `user:<userId>` to receive `notification:new` pushes from the cron job.
- Socket errors are always swallowed with `try/catch` so they never break HTTP responses or the cron job.

---

## Getting Started

### Prerequisites

- Node.js >= 18
- A MongoDB Atlas cluster (free M0 tier works)
- A [Ticketmaster API key](https://developer.ticketmaster.com/) (free)

### 1 — Clone and install

```bash
git clone https://github.com/om9494/Quantiphi-Event-Management-System.git
cd Quantiphi-Event-Management-System

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2 — Configure environment variables

Copy `.env.example` to `.env` in both directories and fill in your values.

**`server/.env`**
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<db>?retryWrites=true&w=majority
JWT_SECRET=<long-random-string>
JWT_EXPIRES_IN=7d
TICKETMASTER_API_KEY=<your-key>
CLIENT_URL=http://localhost:5173
```

**`client/.env`**
```
VITE_API_URL=http://localhost:5000/api
```

### 3 — Run locally

```bash
# Terminal 1 — backend (from /server)
npm run dev

# Terminal 2 — frontend (from /client)
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:5000/api  
Health check: http://localhost:5000/api/health

---

## API Reference

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Register a new user |
| POST | `/login` | — | Login, returns JWT |
| GET | `/me` | ✓ | Get current user |

### Events — `/api/events`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | optional | Search events (Ticketmaster + cache). Query: `city`, `keyword`, `category`, `page`, `size` |
| GET | `/calendar` | optional | Dates with events for a month. Query: `year`, `month`, `city` |
| GET | `/date/:date` | optional | Events on a specific day (`YYYY-MM-DD`). Query: `city` |
| GET | `/:id` | optional | Single event detail |

### RSVPs — `/api/rsvps`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | ✓ | RSVP to an event `{ eventId }` (idempotent) |
| DELETE | `/:eventId` | ✓ | Cancel RSVP |
| GET | `/` | ✓ | Get user's RSVPs split into `upcoming` / `past` |

### Reminders — `/api/reminders`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PUT | `/:eventId` | ✓ | Create/update reminder `{ remindBefore, enabled }` |
| GET | `/` | ✓ | Get all reminder settings |
| GET | `/notifications` | ✓ | Get unread in-app notifications |

### Invites — `/api/invites`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/:eventId` | ✓ | Create or retrieve share link (requires RSVP) |
| GET | `/token/:token` | optional | Resolve invite: record click, return event |
| GET | `/:eventId/stats` | ✓ | Unique click count for owner's share link |

### Users — `/api/users`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/profile` | ✓ | Get profile |
| PUT | `/profile` | ✓ | Update profile |

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server health check |

---

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `PORT` | server | HTTP port (default 5000) |
| `NODE_ENV` | server | `development` or `production` |
| `MONGODB_URI` | server | MongoDB Atlas connection string |
| `JWT_SECRET` | server | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | server | Token TTL (e.g. `7d`) |
| `TICKETMASTER_API_KEY` | server | Ticketmaster Discovery API key (server-side only) |
| `CLIENT_URL` | server | Frontend origin for CORS + invite URL generation |
| `VITE_API_URL` | client | Backend base URL (e.g. `http://localhost:5000/api`) |

> ⚠️ Never commit `.env` files. Both are listed in `.gitignore`. Only `.env.example` is committed.

---

## Likely Viva Questions & Answers

**Q: Why does all business logic live on the server?**  
A: Security and correctness. If filtering or counting ran in the browser, any user could manipulate it by editing JavaScript. The server is the single source of truth — it validates, computes, and returns only what the client needs to render.

**Q: How does the "Friends Attending" count work?**  
A: When a user RSVPs, they can generate a unique share link (token stored in `ShareLink`). When someone clicks that link, `GET /invites/token/:token` fires. The server hashes `IP + User-Agent` into a `visitorHash` and attempts to insert a `LinkClick` document with a unique compound index on `(shareLink, visitorHash)`. If the same visitor clicks again, the insert fails with a duplicate-key error (11000) and is silently ignored. The `friendsAttendingCount` for an event is `LinkClick.countDocuments({ tmId })` — every stored document is a unique visitor.

**Q: How is the link owner's own click excluded?**  
A: In `invite.service.js`, before inserting a `LinkClick`, we check `String(link.createdBy) === String(currentUserId)`. If true, we skip the insert entirely. The JWT is optionally read from the `Authorization` header even on the public endpoint via the `optionalAuth` middleware.

**Q: How are reminders delivered?**  
A: A `node-cron` job runs every minute in the same server process. It queries `ReminderSetting` for unsent, enabled reminders, computes `event.startDate - remindBefore * 60s`, and fires any that are due. It bulk-inserts `Notification` documents, marks the settings as `sent: true`, then emits `notification:new` via Socket.io to the user's personal room (`user:<userId>`). The Navbar bell receives this event and updates instantly.

**Q: How does Socket.io know which user to notify?**  
A: The client sends the JWT in the socket handshake (`socket.handshake.auth.token`). The server verifies it on connection and calls `socket.join("user:<id>")`. When the cron emits to `user:<id>`, only that user's socket receives it.

**Q: Why use MongoDB Atlas and not a local database?**  
A: Atlas provides a managed, cloud-hosted cluster with automatic backups, global availability, and a free M0 tier — no local setup needed for collaborators or CI.

**Q: What prevents duplicate RSVPs?**  
A: The `Rsvp` model has a unique compound index on `{ user, tmId }`. Even if the API is called twice, the second `findOneAndUpdate` with `upsert: true` just returns the existing document. The HTTP layer also checks existence before inserting.

**Q: Why is the Ticketmaster API key only on the server?**  
A: API keys in React source code are exposed to anyone who views the browser's network tab or bundle. By keeping it in `server/.env` and proxying all Ticketmaster requests through Express, the key never reaches the browser.

**Q: What is the layered architecture pattern used here?**  
A: Routes → Controllers → Services → Models. Routes handle HTTP binding and middleware. Controllers call exactly one service function and format the response. Services contain all business logic and database queries. Models define the schema and indexes. This makes each layer independently testable and easy to swap.

**Q: How does the Ticketmaster caching work?**  
A: On every `GET /events` call, the server fetches from Ticketmaster and upserts each event into the `Event` collection using `tmId` as the unique key (`findOneAndUpdate` with `upsert: true`). If Ticketmaster returns an error or times out, the server catches the exception and falls back to querying the cached events already in MongoDB, returning a `fromCache: true` flag so the UI can warn the user.
