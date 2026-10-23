import Link from "next/link";
import { redirect } from "next/navigation";
import Form from "@/components/Form";
import { getCurrentUser } from "@/lib/auth";
import { login } from "../actions";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <div className="narrow">
      <h1>Log in</h1>
      <Form action={login} submitLabel="Log in">
        <label>Email<input name="email" type="email" required /></label>
        <label>Password<input name="password" type="password" required /></label>
      </Form>
      <p className="muted">New here? <Link href="/register">Create an account</Link></p>
    </div>
  );
}
