# Project Hub

A small app where users can register and log in, create projects, join other people's projects, and comment on them.

**Stack:** Next.js 16 (App Router and Server Actions), SQLite (better-sqlite3), and bcrypt password hashing with cookie sessions.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

The SQLite database is created automatically at `data/app.db`. Set `DATABASE_PATH` to put it somewhere else.

## Structure

| Path | What it does |
|---|---|
| `lib/db.js` | Database connection and schema (users, sessions, projects, project_members, comments) |
| `lib/auth.js` | Session cookies: create, destroy, get the current user, require login |
| `app/actions.js` | All write operations, with validation and permission checks |
| `app/page.js` | Project list |
| `app/register`, `app/login` | Auth pages |
| `app/projects/new` | Create a project |
| `app/projects/[id]` | Project details: join or leave, members, comments |

## Rules
- Only logged-in users can create or join projects.
- Only members can comment.
- A comment can be deleted by its author or by the project owner.
- Only the owner can delete a project. The owner can't leave their own project.
