import Link from "next/link";

// Expects a row with: id, title, description, category, join_policy, owner, members, comments.
export default function ProjectCard({ p }) {
  return (
    <li className="card">
      <div className="row">
        <Link href={`/projects/${p.id}`} className="grow"><h2>{p.title}</h2></Link>
        <span className="badge">{p.category}</span>
      </div>
      <p className="clamp">{p.description || <span className="muted">No description</span>}</p>
      <p className="meta">
        by {p.owner} · {p.members} member{p.members === 1 ? "" : "s"} · {p.comments} comment
        {p.comments === 1 ? "" : "s"}
        {p.join_policy === "approval" && " · 🔒 approval required"}
      </p>
    </li>
  );
}
