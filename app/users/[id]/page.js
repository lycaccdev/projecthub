import Link from "next/link";
import { notFound } from "next/navigation";
import db from "@/lib/db";
import ProjectCard from "@/components/ProjectCard";
import { getCurrentUser } from "@/lib/auth";
import { PROJECT_CARD_SQL } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default async function UserPage({ params }) {
  const id = Number((await params).id);
  const profile = db.prepare("SELECT id, name, bio, created_at FROM users WHERE id = ?").get(id);
  if (!profile) notFound();

  const me = await getCurrentUser();
  const owned = db.prepare(`${PROJECT_CARD_SQL} WHERE p.owner_id = ? ORDER BY p.created_at DESC`).all(id);
  const joined = db
    .prepare(
      `${PROJECT_CARD_SQL} JOIN project_members pm ON pm.project_id = p.id
       WHERE pm.user_id = ? AND pm.role != 'owner' ORDER BY pm.joined_at DESC`
    )
    .all(id);

  return (
    <>
      <div className="row">
        <div className="avatar">{profile.name.charAt(0).toUpperCase()}</div>
        <div className="grow">
          <h1>{profile.name}</h1>
          <p className="meta">Member since {profile.created_at.slice(0, 10)}</p>
        </div>
        {me?.id === id && <Link href="/profile/edit" className="btn secondary">Edit profile</Link>}
      </div>
      <p className="description">{profile.bio || <span className="muted">No bio yet.</span>}</p>

      <section>
        <h2>Projects created ({owned.length})</h2>
        {owned.length ? (
          <ul className="cards">{owned.map((p) => <ProjectCard key={p.id} p={p} />)}</ul>
        ) : (
          <p className="muted">None yet.</p>
        )}
      </section>
      <section>
        <h2>Projects joined ({joined.length})</h2>
        {joined.length ? (
          <ul className="cards">{joined.map((p) => <ProjectCard key={p.id} p={p} />)}</ul>
        ) : (
          <p className="muted">None yet.</p>
        )}
      </section>
    </>
  );
}
