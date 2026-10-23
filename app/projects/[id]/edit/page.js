import Link from "next/link";
import { notFound } from "next/navigation";
import db from "@/lib/db";
import Form from "@/components/Form";
import ProjectFields from "@/components/ProjectFields";
import { requireUser } from "@/lib/auth";
import { updateProject } from "../../../actions";

export default async function EditProjectPage({ params }) {
  const user = await requireUser();
  const id = Number((await params).id);
  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
  if (!project || project.owner_id !== user.id) notFound();

  return (
    <div className="narrow">
      <h1>Edit project</h1>
      <Form
        action={updateProject.bind(null, id)}
        submitLabel="Save changes"
        secondary={<Link href={`/projects/${id}`}>Cancel</Link>}
      >
        <ProjectFields project={project} />
      </Form>
    </div>
  );
}
