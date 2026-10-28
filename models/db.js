import sqlite from "better-sqlite3"
import { __dirname } from "../path.js";
import path from "path"

class DB {
	db;
	queries;
	constructor() {
		this.db = sqlite(path.resolve(__dirname, 'database', 'db'), {})

		this.db.pragma('journal_mode = WAL')
		this.db.pragma("synchronous = NORMAL");
		this.db.pragma("journal_size_limit = 67108864"); // 64 MB
		this.db.pragma("mmap_size = 134217728"); // 128 MB
		this.db.pragma("cache_size = 2000");


		this.db.exec(
			`

				create table if not exists boards (
					id integer primary key autoincrement,
					name text not null unique,
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
      				height INTEGER default 0,
      				width INTEGER default 0,
					size integer,
					status text,
  					created_at text
				);

				CREATE TABLE IF NOT EXISTS ban (
					ip text primary key
				);

				CREATE INDEX IF NOT EXISTS idx_posts_parent_board ON posts(board_id, updated_at DESC) WHERE parent_id IS NULL;

				CREATE INDEX IF NOT EXISTS idx_posts_parent_created
				ON posts(parent_id, created_at DESC);

				CREATE INDEX IF NOT EXISTS idx_posts_parent_updated
				ON posts(parent_id, updated_at DESC);

				CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);

            `
		)

		this.queries = {

			insertFile: this.db.prepare('insert into files (path, type, size, status, created_at) values (?,?,?,?,?)'),
			getFile: this.db.prepare('select * from files where id = ?'),

			getAllBoards : this.db.prepare("select * from boards"),

			insertParentPost: this.db.prepare('insert into posts (board_id, name, title, content, file_id, ip, created_at, updated_at) values (?,?,?,?,?,?,?,?)'),
			
			getNewParentPostsByBoard : this.db.prepare('select t.id, t.name, t.title, t.content, t.created_at, t.replies, f.path as file_path, f.type as file_type, f.status as file_status, f.height as file_height, f.width as file_width from posts t left join files f on t.file_id = f.id where t.parent_id is null and t.board_id = ? order by t.created_at desc limit ?'),
			getHotParentPostsByBoard : this.db.prepare('select t.id, t.title, t.content, t.name, t.created_at, t.replies, f.path as file_path, f.type as file_type, f.status as file_status, f.height as file_height, f.width as file_width from posts t left join files f on t.file_id = f.id where t.parent_id is null and t.board_id = ? order by t.updated_at desc limit ?'),

			insertChildPost: this.db.prepare('insert into posts (board_id, parent_id, name, content, file_id, ip, created_at) values (?,?,?,?,?,?,?)'),
			getParentPost: this.db.prepare('select t.id, t.title, t.content, t.name, t.created_at, t.replies, f.id as file_id, f.path as file_path, f.type as file_type, f.status as file_status, f.height as file_height, f.width as file_width from posts t left join files f on t.file_id = f.id where t.id = ? and t.board_id = ?'),
			getChildPosts: this.db.prepare('select p.id, p.parent_id, p.name, p.content, p.created_at, p.file_id, p.replies, f.id as file_id, f.path as file_path, f.type as file_type, f.status as file_status, f.height as file_height, f.width as file_width  from posts p left join files f on p.file_id = f.id where p.parent_id = ?'),
			updateParentPostTimeAndReplies: this.db.prepare('update posts set updated_at = ?, replies = replies + 1 where id = ?'),


			getFileWithStatus : this.db.prepare('select * from files where status = ?'),
			updateFileStatus : this.db.prepare('update files set status = ? where id = ?'),
			updateFileHeightAndWidth : this.db.prepare("UPDATE files SET height = ?, width = ? WHERE id = ?"),

			getFileIdByPostId : this.db.prepare('select file_id from posts where id = ?'),

			deletePostById : this.db.prepare("DELETE FROM posts WHERE id = ?"),

			banByIp : this.db.prepare("INSERT INTO ban (ip) values (?)"),
			getBanByIp : this.db.prepare("SELECT * from ban where ip = ?"),
			getIpByPostId : this.db.prepare("SELECT ip from posts where id = ?"),

			getOldParentPost : this.db.prepare('select t.id, t.title, t.content, t.name, t.created_at, t.replies, f.path as file_path, f.type as file_type, f.status as file_status, f.height as file_height, f.width as file_width from posts t left join files f on t.file_id = f.id where t.parent_id is null order by t.updated_at desc limit -1 offset ?'),
		}
	}
}

const instance = new DB()
export default instance