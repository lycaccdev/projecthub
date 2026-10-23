import Link from "next/link";
import db from "@/lib/db";
import Form from "@/components/Form";
import { requireUser } from "@/lib/auth";
import { updateProfile } from "../../actions";

export default async function EditProfilePage() {
  const user = await requireUser();
  const { bio } = db.prepare("SELECT bio FROM users WHERE id = ?").get(user.id);
  return (
    <div className="narrow">
      <h1>Edit profile</h1>
      <Form
        action={updateProfile}
        submitLabel="Save profile"
        secondary={<Link href={`/users/${user.id}`}>Cancel</Link>}
      >
        <label>Name<input name="name" required maxLength={80} defaultValue={user.name} /></label>
        <label>
          Bio
          <textarea name="bio" rows={5} maxLength={1000} defaultValue={bio} placeholder="Tell people a bit about yourself" />
        </label>
      </Form>
    </div>
  );
}
