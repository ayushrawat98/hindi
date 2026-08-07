import instance from "./db.js";

try {
  // Row count
  const { count } = instance.db.prepare("SELECT COUNT(*) AS count FROM files")
    .get();

  console.log(`Rows: ${count}`);

  // Duplicate IDs
  const duplicateIds = instance.db.prepare(`
    SELECT id
    FROM files
    GROUP BY id
    HAVING COUNT(*) > 1
  `).all();

  if (duplicateIds.length) {
    throw new Error(`Duplicate IDs found: ${JSON.stringify(duplicateIds)}`);
  }

  // NULL paths
  const { nullPaths } = instance.db.prepare(`
    SELECT COUNT(*) AS nullPaths
    FROM files
    WHERE path IS NULL
  `).get();

  if (nullPaths > 0) {
    throw new Error(`${nullPaths} rows have NULL path.`);
  }

  // Height/width check
  const { missingDimensions } = instance.db.prepare(`
    SELECT COUNT(*) AS missingDimensions
    FROM files
    WHERE height IS NULL
       OR width IS NULL
  `).get();

  console.log(`Rows with missing dimensions: ${missingDimensions}`);

  // Foreign key check
  const fkErrors = instance.db.prepare("PRAGMA foreign_key_check").all();

  if (fkErrors.length) {
    console.error("Foreign key errors:");
    console.table(fkErrors);
    throw new Error("Foreign key check failed.");
  }

  // Indexes
  const indexes = instance.db.prepare("PRAGMA index_list(files)").all();
  console.log("Indexes:");
  console.table(indexes);

  // Sample rows
  const sample = instance.db.prepare(`
    SELECT *
    FROM files
    ORDER BY id
    LIMIT 8
  `).all();

  console.log("Sample rows:");
  console.table(sample);

  console.log("✅ Sanity check passed.");
} catch (err) {
  console.error("❌ Sanity check failed:", err.message);
}