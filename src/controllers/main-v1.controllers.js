import { __dirname } from '../../path.js';
import { burstLimiter, quotaLimiter } from '../libraries/ratelimit.js';
import upload from "../libraries/multer.js"
import fs from "node:fs/promises"
import instance from '../../db/db.js';
import { escapeHTML } from '../libraries/sanitize.js';
import { AppError } from '../libraries/error.js';
import path from 'node:path';
import { configuration } from '../../env.js';
import { convertIP } from '../libraries/ban.js';
import { deletePostFiles } from '../libraries/prune.js';

const MAX_THREAD_COUNT = 500 //show all thread , prune when needed (real limit is 100)
const MAX_THREAD_BUMP_LIMIT = 200


export const getBoardData = async (req, res, next) => {

	const getBoardData = instance.db.transaction(() => {

		const newPosts = instance.queries.getNewParentPosts.all(5);

		const hotPosts = instance.queries.getHotParentPosts.all(MAX_THREAD_COUNT);

		return { newPosts, hotPosts }
	});

	const data = getBoardData();

	return res.render('board.html', {
		title : "हिन्दी प्रोजेक्ट",
		board: true,
		newPosts: data.newPosts,
		hotPosts: data.hotPosts
	});
}

export const setBoardData = async (req, res, next) => {

	//no file , throw error
	if (!req.file) {
		throw new Error("संचिका आवश्यक है।")
	}

	const createThread = instance.db.transaction(() => {

		const newFile = instance.queries.insertFile.run(
			req.file.filename,
			req.file.mimetype,
			req.file.size,
			'pending',
			new Date().toISOString()
		)

		const newThread = instance.queries.insertParentPost.run(
			escapeHTML(req.body.name).trim(),
			escapeHTML(req.body.title).trim(),
			escapeHTML(req.body.content).trim(),
			newFile.lastInsertRowid,
			req.ip,
			new Date().toISOString(),
			new Date().toISOString()
		)

		return newThread.lastInsertRowid
	})

	try {
		const newThreadId = createThread()
		return res.status(201).send(
			{
				message: "सफल",
				threadId: newThreadId
			}
		)
	} catch (error) {
		throw new AppError(400, error.message || "Error in sent data for board", true)
	}
}

export const getThreadData = async (req, res, next) => {

	const getThreadData = instance.db.transaction((threadId) => {
		const currentThread = instance.queries.getParentPost.get(threadId);

		if (!currentThread) {
			throw new Error("चर्चा अस्तित्व में नहीं है।");
		}

		const currentPosts = instance.queries.getChildPosts.all(threadId);

		const newPosts = instance.queries.getNewParentPosts.all(5);

		return { currentThread, currentPosts, newPosts };
	});

	const { currentThread, currentPosts, newPosts } = getThreadData(req.params.threadId);

	return res.render('thread.html', {
		board: true,
		posts: [currentThread, ...currentPosts],
		newPosts: newPosts
	});
}

export const setThreadData = async (req, res, next) => {

	let setThreadData = instance.db.transaction((req) => {
		const currentThread = instance.queries.getParentPost.get(req.params.threadId)
		if (!currentThread) {
			throw new Error("चर्चा अस्तित्व में नहीं है।")
		}
		let newFile = undefined
		if (req.file) {
			newFile = instance.queries.insertFile.run(req.file.filename, req.file.mimetype, req.file.size, 'pending', new Date().toISOString())
		}
		const newPost = instance.queries.insertChildPost.run(currentThread.id, escapeHTML(req.body.name).trim(), escapeHTML(req.body.content).trim(), newFile?.lastInsertRowid ?? null, req.ip, new Date().toISOString())

		if(currentThread.replies < MAX_THREAD_BUMP_LIMIT) {
			instance.queries.updateParentPostTimeAndReplies.run(new Date().toISOString(), currentThread.id)
		}
		
		return newPost.lastInsertRowid
	})

	try {
		let newPostId = setThreadData(req)
		return res.status(201).send(
			{
				message: "सफल",
				replyId: newPostId,
				threadId: req.params.threadId
			}
		)
	} catch (error) {
		throw new AppError(400, error.message || "Error in sent data for thread", true)
	}

}

export const adminCheck = (req, res, next) => {
	if (configuration.PASSWORD == null) return res.status(500).send("Set password")
	if (configuration.PASSWORD != req.params.password) return res.status(500).send("Wrong password")
	next()
}

export const deleteImage = (req, res, next) => {

	// req : /delete/postId/password
	let changeFilePath = instance.db.transaction(() => {
		const fileRes = instance.queries.getFileIdByPostId.get(req.params.postId)
		const result = instance.queries.updateFileStatus.run("deleted", fileRes.file_id)
		const fileDetails = instance.queries.getFile.get(fileRes.file_id)
		return fileDetails
	})
	try {
		const fileDetails = changeFilePath()
		// console.log(fileDetails)
		//delete image
		const isVideo = fileDetails.type.includes("video") ? ".webp" : ""
		fs.unlink(path.join(__dirname, 'public', 'files', fileDetails.path))
		fs.unlink(path.join(__dirname, 'public', 'thumbnails', fileDetails.path) + isVideo)
		return res.status(200).send("Complete")
	} catch (error) {
		console.error(error)
	}
}

export const deletePost = (req, res, next) => {
	try {
		let parent = instance.queries.getParentPost.get(req.params.postId)
		let children = instance.queries.getChildPosts.all(req.params.postId)

		const transact = instance.db.transaction(() => {
			//delete parent , will cascade delete child
			instance.queries.deletePostById.run(req.params.postId)
		})

		transact()
		
		//delete all files
		deletePostFiles([parent])
		deletePostFiles(children)

		return res.status(200).send("Complete")
	} catch (error) {
		console.error(error)
		return res.status(500).send(error)
	}
}


export const banPost = (req, res, next) => {
	try {
		const postIp = instance.queries.getIpByPostId.get(req.params.postId)
		const convertedPostIp = convertIP(postIp.ip)
		const done = instance.queries.banByIp.run(convertedPostIp)
		return res.status(200).send({message : "banned : " + convertedPostIp })
	}catch(error) {
		console.error(error)
		return res.status(500).send({message : error.message})
	}
}

export const pruneBoard = (req, res, next) => {
	try {
		const toDeleteParent = instance.queries.getOldParentPost.all()
		for(let parent of toDeleteParent){
			let children = []

			const transact = instance.db.transaction(() => {
				children = instance.queries.getChildPosts.all(parent.id)
				//delete parent , will cascade delete child
				instance.queries.deletePostById.run(req.params.postId)
			})

			transact()

			deletePostFiles([parent])
			deletePostFiles(children)
		}
		return res.status(200).send("pruned")
	}catch(error){
		console.error(error)
		return res.status(500).send({message : error.message})
	}
}