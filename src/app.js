import express from "express";
import { __dirname } from "../path.js";

import path from "path";
import fs from "fs/promises"
import cookieParser from "cookie-parser";

import { route as RenderRoute } from "./routes/render.route.js";
import { route as BoardRoute } from "./routes/board.route.js";
import { route as PostRoute } from "./routes/post.route.js";
import { route as AdminRoute } from "./routes/admin.route.js";
import { route as FileRoute } from "./routes/file.route.js";

const app = express()

app.use(cookieParser());

if (process.env.NODE_ENV == "production") {
	app.set('trust proxy', 1) // correct IP address when using NGINX
}

if (process.env.NODE_ENV == "development") {
	
	app.use('/public', express.static(
		path.resolve(__dirname, "public"),
		{
			maxAge: '1y',
			setHeaders: (res, path) => {
				res.setHeader('Content-Disposition', 'attachment');
				res.setHeader('X-Content-Type-Options', 'nosniff');
			}
		}
	));

	app.use('/static', express.static(
		path.resolve(__dirname, "static"),
		{
			maxAge: '1y'
		}
	));

}

app.use("/admin", AdminRoute)
app.use("/boards", BoardRoute)
app.use("/posts", PostRoute)
app.use("/files", FileRoute)
app.use("/", RenderRoute)


//global error handling
app.use((err, req, res, next) => {
	console.error(err)
	if (err.deleteFile && req.file) {
		fs.unlink(req.file.path)
	}
	if (err.code && err.code == 'LIMIT_FILE_SIZE') {
		// fs.unlink(req.file?.path) //multer automatically deletes large files.
		return res.status(500).send({ message: "5 MB max size" })
	}
	return res.status(err.status || 500).send({ message: err.message || "Error" })
})


export default app