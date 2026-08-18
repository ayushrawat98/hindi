import express from 'express';
import { adminCheck, banPost, deleteImage, deletePost, getBoardData, getThreadData, pruneBoard, setBoardData, setThreadData} from "../controllers/main-v1.controllers.js"
import { burstLimiter, quotaLimiter } from '../libraries/ratelimit.js';
import upload from '../libraries/multer.js';
import { hindiCheck, trimBody } from '../libraries/sanitize.js';
import { ipBanMiddleware } from '../libraries/ban.js';

const route = express.Router()

route.get("/", (req, res, next) => {
	return res.redirect(`board`);
})

route.get('/board', getBoardData)

route.post('/board', burstLimiter, quotaLimiter, ipBanMiddleware, upload.single("file"), trimBody, hindiCheck, setBoardData)

route.get('/thread/:threadId', getThreadData)

route.post('/thread/:threadId', burstLimiter, quotaLimiter, ipBanMiddleware, upload.single("file"), trimBody, hindiCheck, setThreadData)

route.get("/di/:postId/:password", adminCheck, deleteImage)

route.get("/dp/:postId/:password", adminCheck, deletePost)

route.get("/ba/:postId/:password", adminCheck, banPost)

route.get("/prune/:password", adminCheck, pruneBoard)



export { route as mainRoutes }