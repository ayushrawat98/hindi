import express from 'express';
import { getBoardData, getThreadData, setBoardData, setThreadData } from '../controllers/main.controllers.js';
import { burstLimiter, quotaLimiter } from '../libraries/ratelimit.js';
import upload from '../libraries/multer.js';
import { hindiCheck, trimBody } from '../libraries/sanitize.js';

const route = express.Router()

route.get("/", (req, res, next) => {
	return res.redirect("/board/सर्व")
})

route.get('/board/:boardName', getBoardData)

route.post('/board/:boardName', burstLimiter, quotaLimiter, upload.single("file"), trimBody, hindiCheck, setBoardData)

route.get('/thread/:threadId', getThreadData)

route.post('/thread/:threadId', burstLimiter, quotaLimiter, upload.single("file"), trimBody, hindiCheck, setThreadData)



export { route as mainRoutes }