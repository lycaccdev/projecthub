import Form from "@/components/Form";
import { requireUser } from "@/lib/auth";
import { createProject } from "../../actions";

export default async function NewProjectPage() {
  await requireUser();
  return (
    <div className="narrow">
      <h1>New project</h1>
      <Form action={createProject} submitLabel="Create project">
        <label>Title<input name="title" required maxLength={120} /></label>
        <label>Description<textarea name="description" rows={6} maxLength={5000} /></label>
      </Form>
    </div>
  );
}
