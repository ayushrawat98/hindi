import instance from "./db.js";

const migrate = instance.db.transaction(() => {






	// 1. Create the new table
	instance.db.exec(`
    CREATE TABLE IF NOT EXISTS posts_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id INTEGER DEFAULT NULL REFERENCES posts(id) ON DELETE CASCADE,
      name TEXT,
      title TEXT,
	content TEXT,
					file_id INTEGER REFERENCES files(id),
					ip TEXT,
					replies INTEGER DEFAULT 0,
					created_at TEXT,
					updated_at TEXT
    );
  `);

	// 2. Copy data from old table
	// height and width are initialized to NULL
	instance.db.exec(`
    INSERT INTO posts_new (
      id,
      parent_id,
      name,
      title,
      content,
	  file_id,
      ip,
	  replies,
      created_at,
	  updated_at
    )
    SELECT
      id,
      parent_id,
      name,
      title,
      content,
	  file_id,
      ip,
	  replies,
      created_at,
	  updated_at
    FROM posts;
  `);

	// 3. Drop the old table
	instance.db.exec(`DROP TABLE posts;`);

	// 4. Rename the new table
	instance.db.exec(`ALTER TABLE posts_new RENAME TO posts;`);


});

try {
	instance.db.exec("PRAGMA foreign_keys = OFF;");
	migrate();
	instance.db.exec("PRAGMA foreign_keys = ON;");
	console.log("Migration completed successfully.");
} catch (err) {
	console.error("Migration failed:", err);
}