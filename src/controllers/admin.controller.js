import { __dirname } from '../../path.js';
import instance from '../../models/db.js';
import { generateSecret } from '../libraries/common.js';

export const renderAdminLogin = async (req, res, next) => {
	return res.render("admin.login.html")
}

export const handleAdminLogin = async (req, res, next) => {
	if (process.env.PASSWORD == req.body.password) { 
		res.cookie('secret', generateSecret(), {
			maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
			httpOnly: true,              // Prevents client-side JS access (mitigates XSS)
			secure: process.env.NODE_ENV === 'production', // Use true in HTTPS production
			sameSite: 'strict',
		});
	}
	return res.end("complete")
}

export const renderAdminBoards = async (req, res, next) => {
	const result = instance.queries.getBoards.all()
	// console.log(result)
	return res.render("admin.board.html", { boards: result })
}

export const renderAdminPosts = async (req, res, next) => {
	let result = instance.queries.getPosts.all(100)
	// console.log(result)
	// console.log(instance.db.prepare("select * from files").all())
	// console.log(instance.db.prepare("select * from ban").all())
	return res.render("admin.post.html", { posts: result })
}
