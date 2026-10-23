import Link from "next/link";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export default function Home() {
  const projects = db
    .prepare(
      `SELECT p.id, p.title, p.description, p.created_at, u.name AS owner,
        (SELECT COUNT(*) FROM project_members m WHERE m.project_id = p.id) AS members,
        (SELECT COUNT(*) FROM comments c WHERE c.project_id = p.id) AS comments
       FROM projects p JOIN users u ON u.id = p.owner_id
       ORDER BY p.created_at DESC, p.id DESC`
    )
    .all();

  return (
    <>
      <h1>Projects</h1>
      {projects.length === 0 ? (
        <p className="muted">No projects yet. <Link href="/projects/new">Create the first one.</Link></p>
      ) : (
        <ul className="cards">
          {projects.map((p) => (
            <li key={p.id} className="card">
              <Link href={`/projects/${p.id}`}><h2>{p.title}</h2></Link>
              <p className="clamp">{p.description || <span className="muted">No description</span>}</p>
              <p className="meta">
                by {p.owner} · {p.members} member{p.members === 1 ? "" : "s"} · {p.comments} comment{p.comments === 1 ? "" : "s"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
