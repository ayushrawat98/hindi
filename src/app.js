import express from 'express';
import { configuration } from '../env.js';
import { __dirname } from '../path.js';
import { mainRoutes as v1Routes } from './routes/v1/main-v1.routes.js';
import { mainRoutes as v2Routes} from './routes/v2/main-v2.routes.js';
import path from "path";
import fs from "fs/promises"

const app = express()

//set proxy
app.set('trust proxy', 1);

if(configuration.NODE_ENV === "development"){
	app.use('/public', express.static(path.resolve(__dirname, "public"), {maxAge : 9999999}));
	app.use('/www', express.static(path.resolve(__dirname, "www"), {maxAge : 9999999}));
}

//routes
app.use('/v1', v1Routes)
app.use('/v2', v2Routes)

//global error handling
app.use((err, req, res, next) => {
	console.error(err)
	if(err.deleteFile && req.file) {
		fs.unlink(req.file.path)
	}
	if (err.code && err.code == 'LIMIT_FILE_SIZE') {
		fs.unlink(req.file?.path)
		return res.status(500).send("10 MB max size")
	}
	return res.status(err.status || 500).send(err.message || "Error")
})


export default app