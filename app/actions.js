"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { createSession, destroySession, requireUser } from "@/lib/auth";
import { CATEGORIES, JOIN_POLICIES } from "@/lib/constants";

const str = (formData, key) => String(formData.get(key) ?? "").trim();

// ---------- Auth ----------

export async function register(prevState, formData) {
  const name = str(formData, "name");
  const email = str(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || name.length > 80) return { error: "Please enter your name (max 80 characters)." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter a valid email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const exists = db.prepare("SELECT 1 FROM users WHERE email = ?").get(email);
  if (exists) return { error: "An account with that email already exists." };

  const hash = await bcrypt.hash(password, 12);
  const { lastInsertRowid } = db
    .prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
    .run(name, email, hash);

  await createSession(Number(lastInsertRowid));
  redirect("/");
}

export async function login(prevState, formData) {
  const email = str(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = db.prepare("SELECT id, password_hash FROM users WHERE email = ?").get(email);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

// ---------- Profile ----------

export async function updateProfile(prevState, formData) {
  const user = await requireUser();
  const name = str(formData, "name");
  const bio = str(formData, "bio");

  if (!name || name.length > 80) return { error: "Please enter your name (max 80 characters)." };
  if (bio.length > 1000) return { error: "Bio is too long (max 1000 characters)." };

  db.prepare("UPDATE users SET name = ?, bio = ? WHERE id = ?").run(name, bio, user.id);
  revalidatePath("/", "layout");
  redirect(`/users/${user.id}`);
}

// ---------- Projects ----------

function parseProject(formData) {
  const title = str(formData, "title");
  const description = str(formData, "description");
  const category = str(formData, "category");
  const joinPolicy = str(formData, "join_policy");

  if (!title || title.length > 120) return { error: "Title is required (max 120 characters)." };
  if (description.length > 5000) return { error: "Description is too long (max 5000 characters)." };
  if (!CATEGORIES.includes(category)) return { error: "Please choose a category." };
  if (!(joinPolicy in JOIN_POLICIES)) return { error: "Please choose who can join." };
  return { title, description, category, joinPolicy };
}

function getOwnedProject(projectId, userId) {
  return db.prepare("SELECT * FROM projects WHERE id = ? AND owner_id = ?").get(projectId, userId);
}

export async function createProject(prevState, formData) {
  const user = await requireUser();
  const p = parseProject(formData);
  if (p.error) return p;

  const projectId = db.transaction(() => {
    const { lastInsertRowid } = db
      .prepare(
        "INSERT INTO projects (owner_id, title, description, category, join_policy) VALUES (?, ?, ?, ?, ?)"
      )
      .run(user.id, p.title, p.description, p.category, p.joinPolicy);
    db.prepare("INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, 'owner')").run(
      lastInsertRowid,
      user.id
    );
    return Number(lastInsertRowid);
  })();

  revalidatePath("/");
  redirect(`/projects/${projectId}`);
}

export async function updateProject(projectId, prevState, formData) {
  const user = await requireUser();
  if (!getOwnedProject(projectId, user.id)) return { error: "Only the project owner can edit it." };
  const p = parseProject(formData);
  if (p.error) return p;

  db.prepare(
    `UPDATE projects SET title = ?, description = ?, category = ?, join_policy = ?,
     updated_at = datetime('now') WHERE id = ?`
  ).run(p.title, p.description, p.category, p.joinPolicy, projectId);

  revalidatePath("/");
  redirect(`/projects/${projectId}`);
}

export async function deleteProject(projectId) {
  const user = await requireUser();
  db.prepare("DELETE FROM projects WHERE id = ? AND owner_id = ?").run(projectId, user.id);
  revalidatePath("/");
  redirect("/");
}

// Joins directly for open projects; creates a join request for approval-required ones.
export async function joinProject(projectId) {
  const user = await requireUser();
  const project = db.prepare("SELECT join_policy FROM projects WHERE id = ?").get(projectId);
  if (!project) return;

  if (project.join_policy === "approval") {
    db.prepare("INSERT OR IGNORE INTO join_requests (project_id, user_id) VALUES (?, ?)").run(
      projectId,
      user.id
    );
  } else {
    db.prepare("INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)").run(
      projectId,
      user.id
    );
  }
  revalidatePath(`/projects/${projectId}`);
}

export async function cancelJoinRequest(projectId) {
  const user = await requireUser();
  db.prepare("DELETE FROM join_requests WHERE project_id = ? AND user_id = ?").run(projectId, user.id);
  revalidatePath(`/projects/${projectId}`);
}

export async function approveJoinRequest(projectId, userId) {
  const user = await requireUser();
  if (!getOwnedProject(projectId, user.id)) return;

  db.transaction(() => {
    const { changes } = db
      .prepare("DELETE FROM join_requests WHERE project_id = ? AND user_id = ?")
      .run(projectId, userId);
    if (changes) {
      db.prepare("INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)").run(
        projectId,
        userId
      );
    }
  })();
  revalidatePath(`/projects/${projectId}`);
}

export async function declineJoinRequest(projectId, userId) {
  const user = await requireUser();
  if (!getOwnedProject(projectId, user.id)) return;
  db.prepare("DELETE FROM join_requests WHERE project_id = ? AND user_id = ?").run(projectId, userId);
  revalidatePath(`/projects/${projectId}`);
}

export async function leaveProject(projectId) {
  const user = await requireUser();
  // Owners can't leave their own project (they can delete it instead).
  db.prepare(
    "DELETE FROM project_members WHERE project_id = ? AND user_id = ? AND role != 'owner'"
  ).run(projectId, user.id);
  revalidatePath(`/projects/${projectId}`);
}

// ---------- Comments ----------

function validateComment(body) {
  if (!body) return "Comment can't be empty.";
  if (body.length > 2000) return "Comment is too long (max 2000 characters).";
  return null;
}

export async function addComment(projectId, prevState, formData) {
  const user = await requireUser();
  const body = str(formData, "body");
  const error = validateComment(body);
  if (error) return { error };

  const isMember = db
    .prepare("SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?")
    .get(projectId, user.id);
  if (!isMember) return { error: "Join the project to comment." };

  db.prepare("INSERT INTO comments (project_id, user_id, body) VALUES (?, ?, ?)").run(
    projectId,
    user.id,
    body
  );
  revalidatePath(`/projects/${projectId}`);
  return { error: null, ok: Date.now() };
}

export async function updateComment(commentId, prevState, formData) {
  const user = await requireUser();
  const body = str(formData, "body");
  const error = validateComment(body);
  if (error) return { error };

  const comment = db.prepare("SELECT project_id, user_id FROM comments WHERE id = ?").get(commentId);
  // Only the author can edit their comment.
  if (!comment || comment.user_id !== user.id) return { error: "You can only edit your own comments." };

  db.prepare("UPDATE comments SET body = ?, updated_at = datetime('now') WHERE id = ?").run(
    body,
    commentId
  );
  revalidatePath(`/projects/${comment.project_id}`);
  redirect(`/projects/${comment.project_id}#comment-${commentId}`);
}

export async function deleteComment(commentId) {
  const user = await requireUser();
  const comment = db
    .prepare(
      `SELECT c.project_id, c.user_id, p.owner_id FROM comments c
       JOIN projects p ON p.id = c.project_id WHERE c.id = ?`
    )
    .get(commentId);
  // Only the comment's author or the project owner may delete it.
  if (comment && (comment.user_id === user.id || comment.owner_id === user.id)) {
    db.prepare("DELETE FROM comments WHERE id = ?").run(commentId);
    revalidatePath(`/projects/${comment.project_id}`);
  }
}
