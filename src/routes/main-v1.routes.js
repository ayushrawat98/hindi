import express from 'express';
import { adminCheck, banPost, deleteImage, deletePost, getBoardData, getThreadData, pruneBoard, setBoardData, setThreadData} from "../controllers/main-v1.controllers.js"
import { burstLimiter, quotaLimiter, threadLimiter } from '../libraries/ratelimit.js';
import upload from '../libraries/multer.js';
import { trimBody } from '../libraries/sanitize.js';
import { ipBanMiddleware } from '../libraries/ban.js';

const route = express.Router()

route.get("/", (req, res, next) => {
	return res.redirect(`/gen`);
})

route.get('/:board', getBoardData)

route.post('/:board', threadLimiter, ipBanMiddleware, upload.single("file"), trimBody, setBoardData)

route.get('/:board/thread/:threadId', getThreadData)

route.post('/:board/thread/:threadId', burstLimiter, quotaLimiter, ipBanMiddleware, upload.single("file"), trimBody, setThreadData)

route.get("/di/:board/thread/:threadId/:password", adminCheck, deleteImage)

route.get("/dp/:board/thread/:threadId/:password", adminCheck, deletePost)

route.get("/ba/:board/thread/:threadId/:password", adminCheck, banPost)

route.get("/prune/:password", adminCheck, pruneBoard)



export { route as mainRoutes }