import Form from "@/components/Form";
import ProjectFields from "@/components/ProjectFields";
import { requireUser } from "@/lib/auth";
import { createProject } from "../../actions";

export default async function NewProjectPage() {
  await requireUser();
  return (
    <div className="narrow">
      <h1>New project</h1>
      <Form action={createProject} submitLabel="Create project">
        <ProjectFields />
      </Form>
    </div>
  );
}
