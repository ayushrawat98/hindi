// import "./env.js" //comment out for production 
import "./createFolders.js"
import "./models/db.js"
import app from "./src/app.js";
import { __dirname } from "./path.js";
import { thumbnailGenerator } from "./src/libraries/thumbnailGenerator.js";
import { configNunjucks } from "./src/libraries/nunjucks.js";
import { orphanFileDeleter } from "./src/libraries/orphanFileDeleter.js";

configNunjucks(app)

//start image processing worker
thumbnailGenerator()
orphanFileDeleter()


app.listen(process.env.PORT, () => {
	console.log("Local Server running on port " + process.env.PORT)
})