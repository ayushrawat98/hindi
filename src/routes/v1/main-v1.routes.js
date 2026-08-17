import express from 'express';
import { adminCheck, banPost, deleteImage, deletePost, getBoardData, getThreadData, pruneBoard, setBoardData, setThreadData } from '../../controllers/v1/main-v1.controllers.js';
import { burstLimiter, quotaLimiter } from '../../libraries/ratelimit.js';
import upload from '../../libraries/multer.js';
import { hindiCheck, trimBody } from '../../libraries/sanitize.js';
import { ipBanMiddleware } from '../../libraries/ban.js';

const route = express.Router()

route.get("/", (req, res, next) => {
	return res.redirect(`v1/board/सर्व`);
})

route.get('/board/:boardName', getBoardData)

route.post('/board/:boardName', burstLimiter, quotaLimiter, ipBanMiddleware, upload.single("file"), trimBody, hindiCheck, setBoardData)

route.get('/thread/:threadId', getThreadData)

route.post('/thread/:threadId', burstLimiter, quotaLimiter, ipBanMiddleware, upload.single("file"), trimBody, hindiCheck, setThreadData)

route.get("/di/:postId/:password", adminCheck, deleteImage)

route.get("/dp/:postId/:password", adminCheck, deletePost)

route.get("/ba/:postId/:password", adminCheck, banPost)

route.get("/prune/:password", adminCheck, pruneBoard)



export { route as mainRoutes }