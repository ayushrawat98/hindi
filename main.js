// import "./env.js" //comment out for production 

import "./models/db.js"
import app from "./src/app.js";
import fs from "fs"
import { __dirname } from "./path.js";
import { thumbnailGenerator } from "./src/libraries/thumbnailGenerator.js";
import path from "path";
import { configNunjucks } from "./src/libraries/nunjucks.js";
import { orphanFileDeleter } from "./src/libraries/orphanFileDeleter.js";

configNunjucks(app)

//create folders if not exists
if (!fs.existsSync(path.join(__dirname, 'database'))) {
	fs.mkdirSync(path.join(__dirname, 'database'))
}
if (!fs.existsSync(path.join(__dirname, 'public'))) {
	fs.mkdirSync(path.join(__dirname, 'public'))
}
if (!fs.existsSync(path.join(__dirname, 'public', 'files'))) {
	fs.mkdirSync(path.join(__dirname, 'public', 'files'))
}
if (!fs.existsSync(path.join(__dirname, 'public', 'thumbnails'))) {
	fs.mkdirSync(path.join(__dirname, 'public', 'thumbnails'))
}

//start image processing worker
thumbnailGenerator()
orphanFileDeleter()


app.listen(process.env.PORT, () => {
	console.log("Local Server running on port " + process.env.PORT)
})