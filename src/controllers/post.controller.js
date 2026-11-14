import { __dirname } from '../../path.js';
import instance from '../../models/db.js';
import { convertIpNew } from "../libraries/ban.js"

export const getPosts = async (req , res, next) => {
	let result = instance.queries.getPosts.all(100)
	// console.log(result)
	return res.json(result)
}

export const patchPost = async (req , res, next) => {
	// console.log(req.body)
	let result
	if(req.body.pinned){
		result = instance.queries.pinPostById.run(req.params.id)
	} else if(req.body.locked) {
		result = instance.queries.lockPostById.run(req.params.id)
	} else if(req.body.ban) {
		result = banUser(req)
	}
	return res.json(result)
}

export const deletePost = async (req , res, next) => {
	let result
	if(req.userRole === "ADMIN") {
		result = instance.queries.deletePost.run(req.params.id)
	} else {
		result = deletePostByUser(req)
	}
	return res.json(result)
}

const banUser = (req) => {
	let id  = req.params.id
	let post = instance.queries.getPostById.get(Number(id))
	const convertedPostIP = convertIpNew(post.ip)

	const tomorrowUTC = new Date();
	tomorrowUTC.setUTCDate(tomorrowUTC.getUTCDate() + 1);

	let pastBan = instance.queries.getBanByIp.get(convertedPostIP)
	let result = undefined
	if(pastBan) {
		result = instance.queries.updateBanById.run(tomorrowUTC.toISOString(), convertedPostIP)
	} else {
		result = instance.queries.createBan.run(convertedPostIP, tomorrowUTC.toISOString())
	}
	return result
}

 const deletePostByUser = (req) => {
	const id = req.params.id
	const ip = req.ip
	const post = instance.queries.getPostById.get(id)
	if(!post) {
		throw new AppError(404, "Post does not exist")
	}
	if(post.ip !== ip) {
		throw new AppError(401, "Not your post")
	}
	const currentTime =  new Date().getTime()
	const postTime = new Date(post.created_at).getTime()
	const timeDiff = currentTime - postTime //cant delete after 5 minute
	if(timeDiff > (5 * 60 * 1000)) {
		throw new Error(403, "Too late")
	}
	console.log(`[deletePostByUser] ip : ${ip} timediff : ${timeDiff}`)
	const result = instance.queries.deletePostByIdAndIp.run(id, ip)
	return {message : "Post has been deleted"}
}