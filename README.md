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
| `app/projects/[id]` | Project details: join, leave or request to join; join requests; members; comments with inline editing |
| `app/projects/[id]/edit` | Edit a project (owner only) |
| `app/users/[id]`, `app/profile/edit` | User profile pages and editing your own profile |
| `lib/projects.js` | Project search and category filter queries |
| `lib/constants.js` | The category list and join policies |

Schema changes are applied automatically when the app starts (see `addColumn` in `lib/db.js`), so an existing database is upgraded in place.

## Rules
- Only logged-in users can create or join projects.
- A project is either **open** (anyone joins instantly) or **approval required** (the owner approves or declines join requests).
- Owners can edit their projects. Authors can edit their own comments, which are then marked "(edited)".
- Each user has a profile page with a bio, the projects they created, and the projects they joined.
- Only members can comment.
- A comment can be deleted by its author or by the project owner.
- Only the owner can delete a project. The owner can't leave their own project.
