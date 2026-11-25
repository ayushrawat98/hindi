import { __dirname } from '../../path.js';
import instance from '../../models/db.js';
import { escapeHTML } from '../libraries/sanitize.js';
import { AppError } from '../libraries/error.js';

const MAX_THREAD_COUNT = 50
const MAX_THREAD_BUMP_LIMIT = 50

export const renderHome = async (req, res, next) => {
	const boards = instance.queries.getBoards.all()
	const newPosts = instance.queries.getBoardForHome.all(3);
	return res.render('home.html', {
		title: "हिन्दीचान",
		boards: boards,
		board: true,
		newPosts: newPosts,
	});
}

export const getBoardData = async (req, res, next) => {

	const boards = instance.queries.getBoards.all()

	const requestedBoard = boards.find(obj => obj.name === req.params.board)

	if (!requestedBoard) {
		return res.send("बोर्ड अस्तित्व में नहीं है।")
	}

	const newPosts = instance.queries.getBoardDataRight.all(null, 5);

	let hotPosts = instance.queries.getBoardDataLeft.all(requestedBoard.id, MAX_THREAD_COUNT);


	return res.render('board.html', {
		title: "हिन्दी प्रोजेक्ट",
		boards: boards,
		board: requestedBoard,
		newPosts: newPosts,
		hotPosts: hotPosts
	});
}

export const setBoardData = async (req, res, next) => {

	//no file , throw error
	if (!req.file) {
		throw new Error("संचिका आवश्यक है।")
	}

	const boards = instance.queries.getBoards.all()

	const filteredBoard = boards.find(obj => obj.name === req.params.board)

	if (!filteredBoard) {
		throw new AppError(404, "बोर्ड अस्तित्व में नहीं है।", true)
	}

	if (filteredBoard.locked) {
		throw new AppError(405, "बोर्ड बंद है।", true)
	}

	const createThread = instance.db.transaction(() => {

		const newThread = instance.queries.insertParentPost.run(
			filteredBoard.id,
			escapeHTML(req.body.name).trim(),
			escapeHTML(req.body.title).trim(),
			escapeHTML(req.body.content).trim(),
			req.ip,
			new Date().toISOString(),
			new Date().toISOString()
		)

		instance.queries.insertFile.run(
			newThread.lastInsertRowid,
			req.file.filename,
			req.file.mimetype,
			req.file.size,
			'pending',
			new Date().toISOString()
		)

		return newThread.lastInsertRowid
	})

	try {
		const newThreadId = createThread()
		return res.status(201).send(
			{
				message: "सफल",
				createdId: newThreadId
			}
		)
	} catch (error) {
		throw new AppError(400, error.message || "Error in sent data for board", true)
	}
}

export const getThreadData = async (req, res, next) => {

	const boards = instance.queries.getBoards.all()

	const currentThread = instance.queries.getThread.all(req.params.threadId, req.params.threadId, req.params.board)

	if (currentThread.length == 0 || currentThread[0].parent_id != null) {
		throw new Error("चर्चा अस्तित्व में नहीं है।");
	}

	const newPosts = instance.queries.getBoardDataRight.all(null, 5);

	return res.render('thread.html', {
		boards: boards,
		posts: currentThread,
		newPosts: newPosts
	});
}

export const setThreadData = async (req, res, next) => {

	const currentThread = instance.queries.getThread.all(req.params.threadId, req.params.threadId, req.params.board)

	if (currentThread.length == 0 || currentThread[0].parent_id != null) {
		throw new AppError(404, "चर्चा अस्तित्व में नहीं है।", true)
	}


	if (currentThread[0].locked) {
		throw new AppError(405, "चर्चा बंद हो चुकी है।", true)
	}


	const newPost = instance.queries.insertChildPost.run(currentThread[0].board_id, currentThread[0].id, escapeHTML(req.body.name).trim(), escapeHTML(req.body.content).trim(), req.ip, new Date().toISOString(), new Date().toISOString())

	if (req.file) {
		instance.queries.insertFile.run(newPost.lastInsertRowid, req.file.filename, req.file.mimetype, req.file.size, 'pending', new Date().toISOString())
	}

	if (!req.body.sage && currentThread[0].replies < MAX_THREAD_BUMP_LIMIT) {
		instance.queries.updateParentPostTimeAndReplies.run(new Date().toISOString(), currentThread[0].id)
	} else {
		instance.queries.updateReplies.run(currentThread[0].id)
	}

	return res.status(201).send(
		{
			message: "सफल",
			createdId: newPost.lastInsertRowid,
			threadId: req.params.threadId
		}
	)
}
