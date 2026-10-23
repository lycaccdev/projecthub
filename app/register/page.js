import Link from "next/link";
import { redirect } from "next/navigation";
import Form from "@/components/Form";
import { getCurrentUser } from "@/lib/auth";
import { register } from "../actions";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <div className="narrow">
      <h1>Create an account</h1>
      <Form action={register} submitLabel="Sign up">
        <label>Name<input name="name" required maxLength={80} /></label>
        <label>Email<input name="email" type="email" required /></label>
        <label>Password<input name="password" type="password" required minLength={8} /></label>
      </Form>
      <p className="muted">Already have an account? <Link href="/login">Log in</Link></p>
    </div>
  );
}
