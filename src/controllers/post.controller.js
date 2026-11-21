import { __dirname } from '../../path.js';
import instance from '../../models/db.js';
import { convertIpNew } from "../libraries/ban.js"
import { AppError } from '../libraries/error.js';

export const getPosts = async (req, res, next) => {
	let result = instance.queries.getPosts.all(100)
	// console.log(result)
	return res.json(result)
}

export const patchPost = async (req, res, next) => {
	// console.log(req.body)
	let result
	if (req.body.pinned) {
		result = instance.queries.pinPostById.run(req.params.id)
	} else if (req.body.locked) {
		result = instance.queries.lockPostById.run(req.params.id)
	} else if (req.body.ban) {
		result = banUser(req)
	} else if (req.body.slap) {
		result = slapUser(req)
	}
	return res.json(result)
}

export const deletePost = async (req, res, next) => {
	let result
	if (req.userRole === "ADMIN") {
		result = instance.queries.deletePost.run(req.params.id)
	} else {
		result = deletePostByUser(req)
	}
	return res.json(result)
}

const slapUser = (req) => {
	let id = req.params.id
	let post = instance.queries.getPostById.get(Number(id))
	const convertedPostIP = convertIpNew(post.ip)

	const newBanDate = new Date();
	newBanDate.setUTCHours(newBanDate.getUTCHours() + 1); //slap by hour

	let pastBan = instance.queries.getBanByIp.get(convertedPostIP)
	let result = undefined
	if (pastBan) {
		const lastBanTime = new Date(pastBan.current_ban_date).getTime()
		const currentTime = new Date().getTime()
		if (currentTime > lastBanTime) { //expired past ban
			result = instance.queries.updateBanById.run(newBanDate.toISOString(), 1, convertedPostIP)
		}else{
			return { message : "Already Banned or slapped"}
		}
	} else {
		result = instance.queries.createBan.run(convertedPostIP, newBanDate.toISOString())
	}
	return { message: "Banned : " + convertedPostIP, ...result }
}

const banUser = (req) => {
	let id = req.params.id
	let post = instance.queries.getPostById.get(Number(id))
	const convertedPostIP = convertIpNew(post.ip)

	const newBanDate = new Date();

	let pastBan = instance.queries.getBanByIp.get(convertedPostIP)
	let result = undefined
	if (pastBan) {
		//if user is getting banned within 24 hours of last ban
		const lastBanTime = new Date(pastBan.current_ban_date).getTime()
		const currentTime = new Date().getTime()
		let ban_multiple = pastBan.ban_multiple
		if ((currentTime - lastBanTime) < 86400000) {
			ban_multiple *= 2
		} else {
			ban_multiple = 1
		}
		newBanDate.setUTCDate(newBanDate.getUTCDate() + ban_multiple);
		result = instance.queries.updateBanById.run(newBanDate.toISOString(), ban_multiple, convertedPostIP)
	} else {
		newBanDate.setUTCDate(newBanDate.getUTCDate() + 1);
		result = instance.queries.createBan.run(convertedPostIP, newBanDate.toISOString())
	}
	return { message: "Banned : " + convertedPostIP, ...result }
}

const deletePostByUser = (req) => {
	const id = req.params.id
	const ip = req.ip
	const post = instance.queries.getPostById.get(id)
	if (!post) {
		throw new AppError(404, "पोस्ट अस्तित्व में नहीं है।")
	}
	console.log("[deletePostByUser] ip : ", post.ip, ip)
	if (post.ip != ip) {
		throw new AppError(401, "आपका नहीं है।")
	}
	const currentTime = new Date().getTime()
	const postTime = new Date(post.created_at).getTime()
	const timeDiff = currentTime - postTime //cant delete after 5 minute
	if (timeDiff > (5 * 60 * 1000)) {
		throw new AppError(403, "देर हो गई।")
	}
	console.log(`[deletePostByUser] ip : ${ip} timediff : ${timeDiff}`)
	const result = instance.queries.deletePostByIdAndIp.run(id, ip)
	return { message: "Post has been deleted" }
}