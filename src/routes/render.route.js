import express from 'express';
import {  getBoardData, getThreadData, renderHome, setBoardData, setThreadData} from "../controllers/render.controller.js"
import { burstLimiter, quotaLimiter, threadLimiter } from '../libraries/ratelimit.js';
import upload from '../libraries/multer.js';
import { trimBody } from '../libraries/sanitize.js';
import { checkBan } from '../libraries/ban.js';
import { generateTripcode } from '../libraries/common.js';
import { torIpBlocker } from '../libraries/torExitIP.js';

const route = express.Router()

route.get('/', renderHome)

route.get('/:board', getBoardData)

route.post('/:board', threadLimiter, torIpBlocker, checkBan, upload.single("file"), trimBody, generateTripcode, setBoardData)

route.get('/:board/thread/:threadId', getThreadData)

route.post('/:board/thread/:threadId', burstLimiter, quotaLimiter, torIpBlocker, checkBan, upload.single("file"), trimBody, generateTripcode, setThreadData)


export { route }