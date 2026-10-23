import Link from "next/link";
import { notFound } from "next/navigation";
import db from "@/lib/db";
import Form from "@/components/Form";
import { getCurrentUser } from "@/lib/auth";
import { addComment, deleteComment, deleteProject, joinProject, leaveProject } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }) {
  const id = Number((await params).id);
  const project = db
    .prepare(
      `SELECT p.*, u.name AS owner FROM projects p
       JOIN users u ON u.id = p.owner_id WHERE p.id = ?`
    )
    .get(id);
  if (!project) notFound();

  const user = await getCurrentUser();
  const members = db
    .prepare(
      `SELECT u.id, u.name, m.role FROM project_members m
       JOIN users u ON u.id = m.user_id WHERE m.project_id = ? ORDER BY m.joined_at`
    )
    .all(id);
  const comments = db
    .prepare(
      `SELECT c.id, c.body, c.created_at, c.user_id, u.name FROM comments c
       JOIN users u ON u.id = c.user_id WHERE c.project_id = ? ORDER BY c.created_at, c.id`
    )
    .all(id);

  const isOwner = user?.id === project.owner_id;
  const isMember = members.some((m) => m.id === user?.id);

  return (
    <>
      <p><Link href="/">← All projects</Link></p>
      <div className="row">
        <h1>{project.title}</h1>
        {user && !isMember && (
          <form action={joinProject.bind(null, id)}><button className="btn">Join project</button></form>
        )}
        {isMember && !isOwner && (
          <form action={leaveProject.bind(null, id)}><button className="btn secondary">Leave</button></form>
        )}
        {isOwner && (
          <form action={deleteProject.bind(null, id)}><button className="btn danger">Delete project</button></form>
        )}
      </div>
      <p className="meta">Created by {project.owner} on {project.created_at.slice(0, 10)}</p>
      <p className="description">{project.description || <span className="muted">No description</span>}</p>

      <section>
        <h2>Members ({members.length})</h2>
        <ul className="chips">
          {members.map((m) => (
            <li key={m.id} className="chip">{m.name}{m.role === "owner" && " · owner"}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Comments ({comments.length})</h2>
        {comments.length === 0 && <p className="muted">No comments yet.</p>}
        <ul className="comments">
          {comments.map((c) => (
            <li key={c.id} className="comment">
              <div className="meta">
                <strong>{c.name}</strong> · {c.created_at.slice(0, 16).replace("T", " ")}
                {(c.user_id === user?.id || isOwner) && (
                  <form action={deleteComment.bind(null, c.id)} className="inline">
                    <button className="link">delete</button>
                  </form>
                )}
              </div>
              <p>{c.body}</p>
            </li>
          ))}
        </ul>

        {!user && <p className="muted"><Link href="/login">Log in</Link> to join and comment.</p>}
        {user && !isMember && <p className="muted">Join this project to comment.</p>}
        {isMember && (
          <Form action={addComment.bind(null, id)} submitLabel="Post comment" resetOnSuccess>
            <textarea name="body" rows={3} required maxLength={2000} placeholder="Write a comment…" />
          </Form>
        )}
      </section>
    </>
  );
}
