import instance from "./db.js";

const db = instance.db;

try {
  console.log("Running posts migration sanity check...\n");

  // 1. Check table exists
  const table = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
    AND name = 'posts'
  `).get();

  if (!table) {
    throw new Error("posts table does not exist");
  }

  console.log("✅ posts table exists");


  // 2. Check columns
  const columns = db.prepare(`
    PRAGMA table_info(posts)
  `).all();

  const columnNames = columns.map(c => c.name);

  const requiredColumns = [
    "id",
    "parent_id",
    "name",
    "title",
    "content",
    "file_id",
    "ip",
    "replies",
    "created_at",
    "updated_at"
  ];

  for (const col of requiredColumns) {
    if (!columnNames.includes(col)) {
      throw new Error(`Missing column: ${col}`);
    }
  }

  console.log("✅ All required columns exist");


  // 3. Check duplicate IDs
  const duplicateIds = db.prepare(`
    SELECT id, COUNT(*) AS count
    FROM posts
    GROUP BY id
    HAVING COUNT(*) > 1
  `).all();

  if (duplicateIds.length) {
    throw new Error(
      `Duplicate post IDs: ${JSON.stringify(duplicateIds)}`
    );
  }

  console.log("✅ No duplicate IDs");


  // 4. Check NULL IDs
  const nullIds = db.prepare(`
    SELECT COUNT(*) AS count
    FROM posts
    WHERE id IS NULL
  `).get();

  if (nullIds.count > 0) {
    throw new Error("Posts with NULL IDs found");
  }

  console.log("✅ All posts have IDs");


  // 5. Check parent_id integrity
  const badParents = db.prepare(`
    SELECT p.id, p.parent_id
    FROM posts p
    LEFT JOIN posts parent
      ON p.parent_id = parent.id
    WHERE p.parent_id IS NOT NULL
    AND parent.id IS NULL
  `).all();

  if (badParents.length) {
    console.table(badParents);
    throw new Error("Broken parent_id references");
  }

  console.log("✅ parent_id relationships valid");


  // 6. Check file_id integrity
  const badFiles = db.prepare(`
    SELECT p.id, p.file_id
    FROM posts p
    LEFT JOIN files f
      ON p.file_id = f.id
    WHERE p.file_id IS NOT NULL
    AND f.id IS NULL
  `).all();

  if (badFiles.length) {
    console.table(badFiles);
    throw new Error("Broken file_id references");
  }

  console.log("✅ file_id relationships valid");


  // 7. Foreign key check
  const fkErrors = db.prepare(`
    PRAGMA foreign_key_check(posts)
  `).all();

  if (fkErrors.length) {
    console.table(fkErrors);
    throw new Error("Foreign key check failed");
  }

  console.log("✅ Foreign key check passed");


  // 8. Check row statistics
  const stats = db.prepare(`
    SELECT
      COUNT(*) AS total,
      MIN(id) AS min_id,
      MAX(id) AS max_id
    FROM posts
  `).get();

  console.log("\nPosts statistics:");
  console.table(stats);


  // 9. Check sample rows
  const sample = db.prepare(`
    SELECT
      id,
      parent_id,
      title,
	  content,
	  ip,
      file_id,
      replies,
      created_at
    FROM posts
    ORDER BY id
    LIMIT 5
  `).all();

  console.log("Sample posts:");
  console.table(sample);


  console.log("\n✅ Migration sanity check passed.");

} catch (err) {
  console.error("\n❌ Sanity check failed:");
  console.error(err.message);
}