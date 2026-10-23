import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";
import { CATEGORIES } from "@/lib/constants";
import { searchProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }) {
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();
  const category = CATEGORIES.includes(sp.category) ? sp.category : "";
  const projects = searchProjects({ q, category });

  // Builds a link that keeps the current search but changes the category.
  const categoryHref = (c) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (c) params.set("category", c);
    const s = params.toString();
    return s ? `/?${s}` : "/";
  };

  return (
    <>
      <h1>Projects</h1>
      <form className="search" action="/">
        <input name="q" type="search" placeholder="Search projects…" defaultValue={q} />
        {category && <input type="hidden" name="category" value={category} />}
        <button className="btn">Search</button>
      </form>
      <nav className="chips filters">
        <Link href={categoryHref("")} className={`chip ${!category ? "active" : ""}`}>All</Link>
        {CATEGORIES.map((c) => (
          <Link key={c} href={categoryHref(c)} className={`chip ${category === c ? "active" : ""}`}>{c}</Link>
        ))}
      </nav>

      {projects.length === 0 ? (
        q || category ? (
          <p className="muted">No projects match. <Link href="/">Clear filters</Link></p>
        ) : (
          <p className="muted">No projects yet. <Link href="/projects/new">Create the first one.</Link></p>
        )
      ) : (
        <ul className="cards">
          {projects.map((p) => <ProjectCard key={p.id} p={p} />)}
        </ul>
      )}
    </>
  );
}
