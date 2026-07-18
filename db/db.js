import sqlite from "better-sqlite3"
import { __dirname } from "../path.js";
import path from "path"

class DB {
	db;
	queries;
	constructor() {
		this.db = sqlite(path.resolve(__dirname, 'db', 'db'), {})

		this.db.pragma('journal_mode = WAL');
		this.db.pragma('synchronous = NORMAL');
		this.db.pragma('mmap_size = 67108864');
		this.db.pragma('cache_size = -16000');
		this.db.pragma('journal_size_limit = 33554432');
		this.db.pragma('temp_store = MEMORY');
		this.db.pragma('busy_timeout = 5000');


		this.db.exec(
			`
				create table if not exists boards (
					id integer primary key autoincrement,
					name text not null unique,
					description text not null,
					disabled integer default 0
				);

				CREATE TABLE if not exists posts (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
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

				create table if not exists files (
					id integer primary key autoincrement,
					path text not null,
					type text,
					size integer,
					status text,
  					created_at text
				);

				CREATE INDEX IF NOT EXISTS idx_posts_parent_board ON posts(board_id, updated_at DESC) WHERE parent_id IS NULL;

				CREATE INDEX IF NOT EXISTS idx_posts_parent_id ON posts(parent_id) WHERE parent_id IS NOT NULL;

				CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);

            `
		)

		this.queries = {
			getBoards : this.db.prepare('select id, name, description, disabled from boards where disabled = 0'),

			insertFile: this.db.prepare('insert into files (path, type, size, status, created_at) values (?,?,?,?,?)'),
			getFile: this.db.prepare('select * from files where id = ?'),

			insertParentPost: this.db.prepare('insert into posts (board_id, name, title, content, file_id, ip, created_at, updated_at) values (?,?,?,?,?,?,?,?)'),
			getNewParentPosts: this.db.prepare('select t.id, t.title, t.content, t.name, t.created_at, t.replies, f.path as file_path, f.type as file_type, f.status as file_status from posts t left join files f on t.file_id = f.id where t.parent_id is null order by t.created_at desc limit 100'),
			getHotParentPosts: this.db.prepare('select t.id, t.title, t.content, t.name, t.created_at, t.replies, f.path as file_path, f.type as file_type, f.status as file_status from posts t left join files f on t.file_id = f.id where t.parent_id is null order by t.updated_at desc limit 100'),
			getNewParentPostsByBoard : this.db.prepare('select t.id, t.title, t.content, t.name, t.created_at, t.replies, f.path as file_path, f.type as file_type, f.status as file_status from posts t left join files f on t.file_id = f.id where t.parent_id is null and t.board_id = ? order by t.created_at desc limit 100'),
			getHotParentPostsByBoard : this.db.prepare('select t.id, t.title, t.content, t.name, t.created_at, t.replies, f.path as file_path, f.type as file_type, f.status as file_status from posts t left join files f on t.file_id = f.id where t.parent_id is null and t.board_id = ? order by t.updated_at desc limit 100'),


			insertChildPost: this.db.prepare('insert into posts (board_id, parent_id, name, content, file_id, ip, created_at) values (?,?,?,?,?,?,?)'),
			getParentPost: this.db.prepare('select t.id, t.board_id, t.title, t.content, t.name, t.created_at, t.replies, f.id as file_id, f.path as file_path, f.type as file_type, f.status as file_status from posts t left join files f on t.file_id = f.id where t.id = ?'),
			getChildPosts: this.db.prepare('select p.id, p.parent_id, p.name, p.content, p.created_at, p.file_id, p.replies, f.id as file_id, f.path as file_path, f.type as file_type, f.status as file_status  from posts p left join files f on p.file_id = f.id where p.parent_id = ? and p.id > ?'),
			updateParentPostTime: this.db.prepare('update posts set updated_at = ?, replies = replies + 1 where id = ?'),


			getFileWithStatus : this.db.prepare('select * from files where status = ?'),
			updateFileStatus : this.db.prepare('update files set status = ? where id = ?'),

			getHotPosts: this.db.prepare('select t.id, t.title, t.content, t.name, t.created_at, t.replies, f.path as file_path, f.type as file_type, f.status as file_status from posts t left join files f on t.file_id = f.id where t.parent_id is null order by t.updated_at desc limit 100'),
			getNewPosts: this.db.prepare('select t.id, t.title, t.content, t.name, t.created_at, t.replies, f.path as file_path, f.type as file_type, f.status as file_status from posts t left join files f on t.file_id = f.id where t.parent_id is null order by t.created_at desc limit 100'),
		}
	}
}

const instance = new DB()
export default instance