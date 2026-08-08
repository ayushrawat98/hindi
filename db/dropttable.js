import instance from "./db.js";

instance.db.exec(`
    drop table if exists boards;

	drop index if exists idx_posts_parent_board;

	drop index if exists idx_files_status;

	drop index if exists idx_posts_parent_id;
	  `)
console.log("dropped")