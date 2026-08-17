import fs from "fs/promises"
import path from "path"
import { __dirname } from "../../path.js"

export function deletePostFiles(postList) {
	if (!postList || postList.length <= 0) {
		return
	}
	try {
		for (let post of postList) {
			if(!post) continue;
			if (post.file_path && post.file_status != "deleted" && post.file_status != "failed") {
				const isVideo = post.file_type.includes("video") ? ".webp" : ""
				const path1 = path.join(__dirname, 'public', 'files', post.file_path)
				const path2 = path.join(__dirname, 'public', 'thumbnails', post.file_path + isVideo)
				fs.unlink(path1)
				fs.unlink(path2)
			}
		}
	} catch (error) {
	console.error(error)
}
}