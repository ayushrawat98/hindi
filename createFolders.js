import path from "path";
import fs from "fs"
import { __dirname } from "./path.js";

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