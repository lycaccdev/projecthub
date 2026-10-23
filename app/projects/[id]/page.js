import Link from "next/link";
import { notFound } from "next/navigation";
import db from "@/lib/db";
import ConfirmButton from "@/components/ConfirmButton";
import Form from "@/components/Form";
import { getCurrentUser } from "@/lib/auth";
import {
  addComment,
  approveJoinRequest,
  cancelJoinRequest,
  declineJoinRequest,
  deleteComment,
  deleteProject,
  joinProject,
  leaveProject,
  updateComment,
} from "../../actions";

export const dynamic = "force-dynamic";

const fmt = (ts) => ts.slice(0, 16).replace("T", " ");

export default async function ProjectPage({ params, searchParams }) {
  const id = Number((await params).id);
  const editingId = Number((await searchParams).edit) || null; // ?edit=<commentId>
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
      `SELECT c.id, c.body, c.created_at, c.updated_at, c.user_id, u.name FROM comments c
       JOIN users u ON u.id = c.user_id WHERE c.project_id = ? ORDER BY c.created_at, c.id`
    )
    .all(id);

  const isOwner = user?.id === project.owner_id;
  const isMember = members.some((m) => m.id === user?.id);
  const hasRequested =
    user && !isMember &&
    !!db.prepare("SELECT 1 FROM join_requests WHERE project_id = ? AND user_id = ?").get(id, user.id);
  const requests = isOwner
    ? db
        .prepare(
          `SELECT u.id, u.name, r.created_at FROM join_requests r
           JOIN users u ON u.id = r.user_id WHERE r.project_id = ? ORDER BY r.created_at`
        )
        .all(id)
    : [];

  return (
    <>
      <p><Link href="/">← All projects</Link></p>
      <div className="row">
        <h1>{project.title}</h1>
        {user && !isMember && !hasRequested && (
          <form action={joinProject.bind(null, id)}>
            <button className="btn">{project.join_policy === "approval" ? "Request to join" : "Join project"}</button>
          </form>
        )}
        {hasRequested && (
          <form action={cancelJoinRequest.bind(null, id)} className="row">
            <span className="badge">Request pending</span>
            <button className="btn secondary">Cancel request</button>
          </form>
        )}
        {isMember && !isOwner && (
          <form action={leaveProject.bind(null, id)}><button className="btn secondary">Leave</button></form>
        )}
        {isOwner && (
          <>
            <Link href={`/projects/${id}/edit`} className="btn secondary">Edit</Link>
            <form action={deleteProject.bind(null, id)}>
              <ConfirmButton className="btn danger" message="Delete this project and all its comments? This can't be undone.">
                Delete
              </ConfirmButton>
            </form>
          </>
        )}
      </div>
      <p className="meta">
        <Link href={`/?category=${encodeURIComponent(project.category)}`} className="badge">{project.category}</Link>
        {" "}Created by <Link href={`/users/${project.owner_id}`}>{project.owner}</Link> on {project.created_at.slice(0, 10)}
        {project.updated_at && ` · edited ${project.updated_at.slice(0, 10)}`}
        {project.join_policy === "approval" && " · 🔒 approval required to join"}
      </p>
      <p className="description">{project.description || <span className="muted">No description</span>}</p>

      {isOwner && requests.length > 0 && (
        <section className="panel">
          <h2>Join requests ({requests.length})</h2>
          <ul className="list">
            {requests.map((r) => (
              <li key={r.id} className="row">
                <span className="grow">
                  <Link href={`/users/${r.id}`}>{r.name}</Link>{" "}
                  <span className="meta">requested {fmt(r.created_at)}</span>
                </span>
                <form action={approveJoinRequest.bind(null, id, r.id)}><button className="btn small">Approve</button></form>
                <form action={declineJoinRequest.bind(null, id, r.id)}><button className="btn small secondary">Decline</button></form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2>Members ({members.length})</h2>
        <ul className="chips">
          {members.map((m) => (
            <li key={m.id} className="chip">
              <Link href={`/users/${m.id}`}>{m.name}</Link>{m.role === "owner" && " · owner"}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Comments ({comments.length})</h2>
        {comments.length === 0 && <p className="muted">No comments yet.</p>}
        <ul className="comments">
          {comments.map((c) => {
            const isAuthor = c.user_id === user?.id;
            return (
              <li key={c.id} id={`comment-${c.id}`} className="comment">
                <div className="meta">
                  <Link href={`/users/${c.user_id}`}><strong>{c.name}</strong></Link> · {fmt(c.created_at)}
                  {c.updated_at && " (edited)"}
                  {isAuthor && editingId !== c.id && (
                    <Link href={`/projects/${id}?edit=${c.id}#comment-${c.id}`} className="inline">edit</Link>
                  )}
                  {(isAuthor || isOwner) && (
                    <form action={deleteComment.bind(null, c.id)} className="inline">
                      <ConfirmButton className="link" message="Delete this comment?">delete</ConfirmButton>
                    </form>
                  )}
                </div>
                {isAuthor && editingId === c.id ? (
                  <Form
                    action={updateComment.bind(null, c.id)}
                    submitLabel="Save"
                    secondary={<Link href={`/projects/${id}#comment-${c.id}`}>Cancel</Link>}
                  >
                    <textarea name="body" rows={3} required maxLength={2000} defaultValue={c.body} autoFocus />
                  </Form>
                ) : (
                  <p>{c.body}</p>
                )}
              </li>
            );
          })}
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
