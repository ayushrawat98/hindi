import { __dirname } from '../../../path.js';
import { burstLimiter, quotaLimiter } from '../../libraries/ratelimit.js';
import upload from "../../libraries/multer.js"
import fs from "node:fs/promises"
import instance from '../../../db/db.js';
import { escapeHTML } from '../../libraries/sanitize.js';
import activeBoardsList from '../../libraries/activeBoards.js';
import { AppError } from '../../libraries/error.js';


export const getBoardData = async (req, res, next) => {

	const getBoardData = instance.db.transaction((boardName) => {
		
		let currentBoard = activeBoardsList.find(item => item.name === boardName);

		// if (!currentBoard && boardName != "सर्व") {
		// 	throw new Error("यह मंच अस्तित्व में नहीं है।");
		// }

		const newPosts = currentBoard
			? instance.queries.getNewParentPostsByBoard.all(currentBoard.id)
			: instance.queries.getNewParentPosts.all();

		const hotPosts = currentBoard
			? instance.queries.getHotParentPostsByBoard.all(currentBoard.id)
			: instance.queries.getHotParentPosts.all();
		
		//if no currentBoard just set to whatever frontend sends
		if(!currentBoard){
			currentBoard = {name : boardName}
		}

		return {newPosts, hotPosts, currentBoard}
	});

	const data = getBoardData(req.params.boardName);

	return res.render('v1/board.html', {
		boards: activeBoardsList,
		currentBoard: data.currentBoard,
		newPosts: data.newPosts.slice(0,7),
		hotPosts : data.hotPosts
	});
}

export const setBoardData = async (req, res, next) => {

	//no file , throw error
	if (!req.file) {
		throw new Error("संचिका आवश्यक है।")
	}

	const createThread = instance.db.transaction(() => {
		// no board - delete file , throw error
		const currentBoard = activeBoardsList.find(item => item.name == req.params.boardName)

		if (!currentBoard) {
			throw new Error("यह मंच अस्तित्व में नहीं है।")
		}

		const newFile = instance.queries.insertFile.run(
			req.file.filename,
			req.file.mimetype, 
			req.file.size, 
			'pending', 
			new Date().toISOString()
		)

		// console.log(req.file)

		const newThread = instance.queries.insertParentPost.run(
			currentBoard.id, 
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
		//file can be deleted but thumbnail might stay
		//race issue - no because image loop will find in table only if transaction succeed , if it fails thumbnail never generate
		// fs.unlink(req.file.path) //delete file
		// throw error
		throw new AppError(400, error.message || "Error in sent data for board", true)
	}
}

export const getThreadData = async (req, res, next) => {

	const getThreadData = instance.db.transaction((threadId) => {
		const currentThread = instance.queries.getParentPost.get(threadId);

		if (!currentThread) {
			throw new Error("चर्चा अस्तित्व में नहीं है।");
		}

		const currentPosts = instance.queries.getChildPosts.all(threadId, 0);

		const newPosts = instance.queries.getNewParentPostsByBoard.all(currentThread.board_id);

		return { currentThread, currentPosts, newPosts };
	});

	const { currentThread, currentPosts, newPosts } = getThreadData(req.params.threadId);

	return res.render('v1/thread.html', {
		boards: activeBoardsList,
		posts: [currentThread, ...currentPosts],
		newPosts : newPosts
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
		const newPost = instance.queries.insertChildPost.run(currentThread.board_id, currentThread.id, escapeHTML(req.body.name).trim(), escapeHTML(req.body.content).trim(), newFile?.lastInsertRowid ?? null, req.ip, new Date().toISOString())
		instance.queries.updateParentPostTime.run(new Date().toISOString(), currentThread.id)
		return newPost.lastInsertRowid
	})

	

	try {
		let newPostId = setThreadData(req)
		return res.status(201).send("सफल")
	} catch (error) {
		//file can be deleted but thumbnail might stay
		//race issue - no because image loop will find in table only if transaction succeed , if it fails thumbnail never generate
		// fs.unlink(req.file.path) //delete file
		// throw error
		throw new AppError(400, error.message || "Error in sent data for thread", true)
	}
	
}