# Quantiphi Event Management System

A full-stack MERN application for finding and tracking events powered by the Ticketmaster Discovery API.

## Overview

- Browse events by city and keyword
- Calendar view highlighting dates that have events
- RSVP ("Interested") to events
- Share invite links with friends; track click counts
- Set reminders for upcoming events
- Real-time updates via Socket.io

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Axios, Tailwind CSS |
| Backend | Node.js, Express, Mongoose, JWT, bcrypt |
| Database | MongoDB Atlas |
| External API | Ticketmaster Discovery API v2 |
| Real-time | Socket.io |

## Project Structure

```
/
├── client/          # React frontend (Vite)
├── server/          # Express backend
├── .gitignore
└── README.md
```

## Getting Started

> Full setup instructions will be added in the final docs commit.

### Prerequisites
- Node.js >= 18
- A MongoDB Atlas cluster
- A Ticketmaster API key

### Environment Variables

See `server/.env.example` for all required server-side variables.

## API Documentation

> Will be documented in the final commit.

## Architecture & Design Decisions

> Will be documented in the final commit.
