import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "./actions";

export const metadata = { title: "Project Hub", description: "Create projects, join them, and discuss." };

export default async function RootLayout({ children }) {
  const user = await getCurrentUser();
  return (
    <html lang="en">
      <body>
        <header className="nav">
          <Link href="/" className="brand">Project Hub</Link>
          <nav>
            {user ? (
              <>
                <Link href="/projects/new" className="btn small">+ New project</Link>
                <span className="muted">Hi, {user.name}</span>
                <form action={logout}><button className="link">Log out</button></form>
              </>
            ) : (
              <>
                <Link href="/login">Log in</Link>
                <Link href="/register" className="btn small">Sign up</Link>
              </>
            )}
          </nav>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
