import { __dirname } from '../../../path.js';
import { burstLimiter, quotaLimiter } from '../../libraries/ratelimit.js';
import upload from "../../libraries/multer.js"
import fs from "node:fs/promises"
import instance from '../../../db/db.js';
import { escapeHTML } from '../../libraries/sanitize.js';
// import activeBoardsList from '../../libraries/activeBoards.js';
import { AppError } from '../../libraries/error.js';
import path from 'node:path';
import { configuration } from '../../../env.js';


export const getBoardData = async (req, res, next) => {

	const getBoardData = instance.db.transaction(() => {

		const newPosts = instance.queries.getNewParentPosts.all();

		const hotPosts = instance.queries.getHotParentPosts.all();

		return { newPosts, hotPosts }
	});

	const data = getBoardData();

	return res.render('v1/board.html', {
		board : true,
		newPosts: data.newPosts.slice(0, 5),
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
	})

	try {
		createThread()
		return res.status(201).send("सफल")
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

		const newPosts = instance.queries.getNewParentPosts.all();

		return { currentThread, currentPosts, newPosts };
	});

	const { currentThread, currentPosts, newPosts } = getThreadData(req.params.threadId);

	return res.render('v1/thread.html', {
		board : true,
		posts: [currentThread, ...currentPosts],
		newPosts: newPosts.slice(0, 5)
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
		const newPost = instance.queries.insertChildPost.run( currentThread.id, escapeHTML(req.body.name).trim(), escapeHTML(req.body.content).trim(), newFile?.lastInsertRowid ?? null, req.ip, new Date().toISOString())
		instance.queries.updateParentPostTimeAndReplies.run(new Date().toISOString(), currentThread.id)
		return newPost.lastInsertRowid
	})



	try {
		let newPostId = setThreadData(req)
		return res.status(201).send("सफल")
	} catch (error) {
		throw new AppError(400, error.message || "Error in sent data for thread", true)
	}

}

export const deleteImage = (req, res, next) => {
	if(configuration.PASSWORD == null) return res.status(500).send("Set password")
	if(configuration.PASSWORD != req.params.password) return res.status(500).send("Wrong password")
	// req : /delete/postId/password
	let changeFilePath = instance.db.transaction((req) => {
		const fileRes = instance.queries.getFileIdByPostId.get(req.params.postId)
		const result = instance.queries.updateFileStatus.run("failed", fileRes.file_id)
		const fileDetails = instance.queries.getFile.get(fileRes.file_id)
		return fileDetails
	})
	try {
		const fileDetails = changeFilePath(req)
		console.log(fileDetails)
		//delete image
		const isVideo = fileDetails.type.includes("video") ? ".webp"  : ""
		fs.unlink(path.join(__dirname, 'public', 'files', fileDetails.path))
		fs.unlink(path.join(__dirname, 'public', 'thumbnails', fileDetails.path) + + isVideo)
		return res.status(200).send("Complete")
	} catch (error) {
		console.error(error)
	}
}