# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start        # Run the server (port 3000 by default)
```

No test suite or linter is configured yet.

## Environment setup

Copy `.env` (not committed) with these variables:

```
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
REMINDER_TO=destination@email.com
PORT=3000        # optional
```

Gmail requires an App Password (not the account password) when 2FA is enabled.

## Architecture

Three-layer server-side stack with a vanilla JS frontend:

- **`server.js`** — Express app. Defines all REST routes and a `node-cron` job that fires every minute to check if any habit has a `reminder_time` matching the current HH:MM and sends an email for pending (uncompleted) ones.
- **`db.js`** — SQLite via `better-sqlite3` (synchronous API). Opens/creates `habits.db` on startup and exposes named functions. Two tables: `habits` and `completions` (one row per habit per day, unique constraint on `(habit_id, completed_at)`).
- **`email.js`** — Nodemailer wrapper. Single export `sendReminderEmail(habits[])` using Gmail SMTP.
- **`public/`** — Static files served by Express. `app.js` is a plain ES5-style script (no bundler) that fetches the REST API and manipulates the DOM directly.

## Key data model notes

- `completions.completed_at` stores ISO date strings (`YYYY-MM-DD`), not timestamps.
- Streak logic in `db.getStreak()` walks backwards from today; a gap of more than 1 day resets to zero.
- `frequency` field exists (`daily`/`weekly`) but the backend does not yet filter by it — all habits appear every day regardless.
