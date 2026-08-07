import instance from "./db.js";

const migrate = instance.db.transaction(() => {

	
  // 1. Create the new table
  instance.db.exec(`
    CREATE TABLE IF NOT EXISTS files_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      type TEXT,
      height INTEGER default 0,
      width INTEGER default 0,
	  size INTEGER,
      status TEXT,
      created_at TEXT
    );
  `);

  // 2. Copy data from old table
  // height and width are initialized to NULL
  instance.db.exec(`
    INSERT INTO files_new (
      id,
      path,
      type,
      height,
      width,
	  size,
      status,
      created_at
    )
    SELECT
      id,
      path,
      type,
      0,
      0,
	  size,
      status,
      created_at
    FROM files;
  `);

  // 3. Drop the old table
  instance.db.exec(`DROP TABLE files;`);

  // 4. Rename the new table
  instance.db.exec(`ALTER TABLE files_new RENAME TO files;`);

 
});

try {
	instance.db.exec("PRAGMA foreign_keys = OFF;");
  migrate();
   instance.db.exec("PRAGMA foreign_keys = ON;");
  console.log("Migration completed successfully.");
} catch (err) {
  console.error("Migration failed:", err);
}