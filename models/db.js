import sqlite from "better-sqlite3"
import { __dirname } from "../path.js";
import path from "path"

class DB {

	db;
	queries;

	constructor() {
		this.db = sqlite(path.resolve(__dirname, 'database', 'db'), {})
		// this.db = sqlite(':memory:', {});
		this.db.pragma('journal_mode = WAL')
		this.db.pragma("synchronous = NORMAL");
		this.db.pragma("journal_size_limit = 67108864"); // 64 MB
		this.db.pragma("mmap_size = 134217728"); // 128 MB
		this.db.pragma("cache_size = 2000");
		this.db.exec(
			`

				CREATE TABLE IF NOT EXISTS boards (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					name TEXT NOT NULL UNIQUE CHECK (length(name) BETWEEN 1 AND 10),
					title TEXT NOT NULL UNIQUE CHECK (length(title) BETWEEN 1 AND 50),
					rules TEXT CHECK (length(rules) <= 500),
					owner_name TEXT NOT NULL,
					locked INTEGER NOT NULL DEFAULT 0 CHECK (locked IN (0, 1)),
					order_number INTEGER DEFAULT 0
				);
				

				CREATE TABLE IF NOT EXISTS posts (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
					parent_id INTEGER DEFAULT NULL REFERENCES posts(id) ON DELETE CASCADE,
					name TEXT CHECK (length(name) <= 50),
					title TEXT CHECK (length(title) <= 50),
					content TEXT CHECK (length(content) BETWEEN 1 AND 1000),
					ip TEXT NOT NULL ,
					replies INTEGER DEFAULT 0,
					pinned INTEGER DEFAULT 0 CHECK (pinned IN (0, 1)),
					locked INTEGER DEFAULT 0 CHECK (locked IN (0, 1)),
					created_at TEXT,
					updated_at TEXT
				);

				 
				create table if not exists files (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					post_id INTEGER REFERENCES posts(id) ON DELETE SET NULL,
					path TEXT NOT NULL,
					type TEXT, 
      				height INTEGER DEFAULT 0,
      				width INTEGER DEFAULT 0,
					size INTEGER,
					status TEXT,
					md5_hash TEXT,
					is_hashed INTEGER DEFAULT 0,
  					created_at TEXT
				);

				CREATE TABLE IF NOT EXISTS ban (
					ip TEXT PRIMARY KEY,
					ban_time TEXT NOT NULL
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

			createBoard : this.db.prepare("INSERT INTO boards (name, title, rules, owner_name) VALUES (?,?,?,?)"),
			getBoardByName : this.db.prepare("SELECT * FROM boards WHERE name = ?"),
			getBoardByOwnerName : this.db.prepare("SELECT * FROM boards WHERE owner_name = ?"),
			getBoards : this.db.prepare("SELECT * FROM boards ORDER BY order_number ASC"),
			updateBoardById : this.db.prepare("UPDATE boards SET name = ?, title = ?, rules = ?, owner_name = ?, locked = ?, order_number = ? WHERE id = ?"),
			deleteBoardById : this.db.prepare("DELETE FROM boards WHERE id = ?"),

			createPost : this.db.prepare('INSERT INTO posts (board_id, parent_id, name, title, content, ip, created_at, updated_at) values (?,?,?,?,?,?,?,?)'),
			getPosts : this.db.prepare("SELECT p.*, f.id as file_id, f.path as file_path,  f.type as file_type, f.status as file_status, f.height as file_height, f.width as file_width FROM posts p LEFT JOIN files f ON f.post_id = p.id order by p.created_at desc LIMIT ?"),
			getPostById : this.db.prepare("SELECT * FROM posts WHERE id = ?"),
			deletePost : this.db.prepare("DELETE FROM posts WHERE id = ?"),

			deleteFileById : this.db.prepare("DELETE FROM files WHERE id = ?"),

			createBan : this.db.prepare("INSERT INTO ban (ip, ban_time) values (?,?)"),
			updateBanById : this.db.prepare("UPDATE ban SET ban_time = ? WHERE ip = ?"),

			//non generic
			deletePostByIdAndIp : this.db.prepare("DELETE FROM posts WHERE id = ? AND ip = ?"),
			pinPostById : this.db.prepare("UPDATE posts SET pinned = 1 - pinned WHERE id = ?"),
			lockPostById : this.db.prepare("UPDATE posts SET locked = 1 - locked WHERE id = ?"),
			getOrphanFiles : this.db.prepare("SELECT * FROM files WHERE post_id IS null OR status = 'orphan'"),
			getBoardDataLeft: this.db.prepare('select p.*, b.name as board_name, f.id as file_id, f.path as file_path, f.type as file_type, f.status as file_status, f.height as file_height, f.width as file_width from posts p left join files f on p.id = f.post_id LEFT JOIN boards b on b.id = p.board_id where p.parent_id is null AND p.board_id is ? ORDER BY p.pinned DESC, p.updated_at DESC LIMIT ?'),
			getBoardDataRight: this.db.prepare('select p.*, b.name as board_name, f.id as file_id, f.path as file_path, f.type as file_type, f.status as file_status, f.height as file_height, f.width as file_width from posts p left join files f on p.id = f.post_id LEFT JOIN boards b on b.id = p.board_id where p.parent_id is ? order by p.created_at desc LIMIT ?'),
			getThread : this.db.prepare("SELECT p.*, b.name as board_name, f.path as file_path, f.type as file_type, f.status as file_status, f.height as file_height, f.width as file_width FROM posts p LEFT JOIN files f ON p.id = f.post_id LEFT JOIN boards b ON p.board_id = b.id WHERE (p.id = ? OR p.parent_id = ?) AND b.name = ? ORDER BY p.created_at"),

			//old
			insertFile: this.db.prepare('insert into files (post_id, path, type, size, status, created_at) values (?,?,?,?,?,?)'),
			getFile: this.db.prepare('select * from files where post_id = ?'),

			insertParentPost: this.db.prepare('insert into posts (board_id, name, title, content, ip, created_at, updated_at) values (?,?,?,?,?,?,?)'),
			
			getNewParentPostsByBoard : this.db.prepare('select t.id, t.name, t.title, t.content, t.created_at, t.replies, f.path as file_path, f.type as file_type, f.status as file_status, f.height as file_height, f.width as file_width from posts t left join files f on t.id = f.post_id where t.parent_id is null and t.board_id = ? order by t.created_at desc limit ?'),
			getHotParentPostsByBoard : this.db.prepare('select t.id, t.title, t.content, t.name, t.created_at, t.replies, f.path as file_path, f.type as file_type, f.status as file_status, f.height as file_height, f.width as file_width from posts t left join files f on t.id = f.post_id where t.parent_id is null and t.board_id = ? order by t.updated_at desc limit ?'),

			insertChildPost: this.db.prepare('insert into posts (board_id, parent_id, name, content, ip, created_at, updated_at) values (?,?,?,?,?,?,?)'),
			getParentPost: this.db.prepare('select t.board_id, t.id, t.title, t.content, t.name, t.created_at, t.replies, f.id as file_id, f.path as file_path, f.type as file_type, f.status as file_status, f.height as file_height, f.width as file_width from posts t left join files f on t.id = f.post_id where t.id = ?'),
			getChildPosts: this.db.prepare('select p.id, p.parent_id, p.name, p.content, p.created_at, p.replies, f.id as file_id, f.path as file_path, f.type as file_type, f.status as file_status, f.height as file_height, f.width as file_width  from posts p left join files f on p.id = f.post_id where p.parent_id = ? order by p.created_at asc'),
			updateParentPostTimeAndReplies: this.db.prepare('update posts set updated_at = ?, replies = replies + 1 where id = ?'),
			updateReplies: this.db.prepare('update posts set replies = replies + 1 where id = ?'),


			getFileWithStatus : this.db.prepare('select * from files where status = ?'),
			updateFileStatus : this.db.prepare('update files set status = ? where id = ?'),
			updateFileHeightAndWidth : this.db.prepare("UPDATE files SET height = ?, width = ? WHERE id = ?"),

			deletePostById : this.db.prepare("DELETE FROM posts WHERE id = ?"),

			banByIp : this.db.prepare("INSERT INTO ban (ip) values (?)"),
			getBanByIp : this.db.prepare("SELECT * from ban where ip = ?"),
			getIpByPostId : this.db.prepare("SELECT ip from posts where id = ?"),

			getOldParentPost : this.db.prepare('select t.id, t.title, t.content, t.name, t.created_at, t.replies, f.path as file_path, f.type as file_type, f.status as file_status, f.height as file_height, f.width as file_width from posts t left join files f on t.id = f.post_id where t.parent_id is null order by t.updated_at desc limit -1 offset ?'),
			
		}
	}
}

const instance = new DB()
export default instance