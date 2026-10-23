import { CATEGORIES, JOIN_POLICIES } from "@/lib/constants";

// Form inputs shared by the "new project" and "edit project" pages.
export default function ProjectFields({ project = {} }) {
  return (
    <>
      <label>Title<input name="title" required maxLength={120} defaultValue={project.title} /></label>
      <label>
        Category
        <select name="category" required defaultValue={project.category ?? ""}>
          <option value="" disabled>Choose a category…</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>
      <label>
        Description
        <textarea name="description" rows={6} maxLength={5000} defaultValue={project.description} />
      </label>
      <fieldset>
        <legend>Who can join?</legend>
        {Object.entries(JOIN_POLICIES).map(([value, label]) => (
          <label key={value} className="radio">
            <input
              type="radio"
              name="join_policy"
              value={value}
              defaultChecked={(project.join_policy ?? "open") === value}
            />
            {label}
          </label>
        ))}
      </fieldset>
    </>
  );
}
