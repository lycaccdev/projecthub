import db from "./db";

// Shared SELECT for project cards (owner name plus member and comment counts).
export const PROJECT_CARD_SQL = `
  SELECT p.id, p.title, p.description, p.category, p.join_policy, p.created_at, u.name AS owner,
    (SELECT COUNT(*) FROM project_members m WHERE m.project_id = p.id) AS members,
    (SELECT COUNT(*) FROM comments c WHERE c.project_id = p.id) AS comments
  FROM projects p JOIN users u ON u.id = p.owner_id`;

export function searchProjects({ q = "", category = "" }) {
  const where = [];
  const args = [];
  if (q) {
    where.push("(p.title LIKE ? ESCAPE '\\' OR p.description LIKE ? ESCAPE '\\')");
    const like = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
    args.push(like, like);
  }
  if (category) {
    where.push("p.category = ?");
    args.push(category);
  }
  const sql = `${PROJECT_CARD_SQL} ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY p.created_at DESC, p.id DESC`;
  return db.prepare(sql).all(...args);
}
