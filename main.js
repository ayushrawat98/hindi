import { configuration } from "./env.js";
import "./db/db.js"
import "./db/seed.js"
import app from "./src/app.js";
import fs from "fs"
import { __dirname } from "./path.js";
import { imageProcessor } from "./src/libraries/image.js";
import path from "path";
import { configNunjucks } from "./src/libraries/nunjucks.js";

configNunjucks(app)

//create folders if not exists
if(!fs.existsSync(path.join(__dirname, 'public'))){
	fs.mkdirSync(path.join(__dirname, 'public'))
}
if(!fs.existsSync(path.join(__dirname, 'public', 'files'))){
	fs.mkdirSync(path.join(__dirname, 'public', 'files'))
}
if(!fs.existsSync(path.join(__dirname, 'public', 'thumbnails'))){
	fs.mkdirSync(path.join(__dirname, 'public', 'thumbnails'))
}

//start image processing worker
imageProcessor()


app.listen(configuration.PORT, () => {
	console.log("Server started at " + configuration.PORT)
})