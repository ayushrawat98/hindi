import instance from "../../models/db.js"
import fs from "fs/promises"
import { __dirname } from "../../path.js"
import path from "path"

export async function orphanFileDeleter() {

	while (true) {

		let files = instance.queries.getOrphanFiles.all()
		console.log('[orphanFileDeleter] Files' , files)

		//if no file , run after 1 hour
		if (files.length == 0) {
			await pause(1000 * 60 * 60)
			continue
		}

		for(let file of files) {

			const isVideo = file.type?.includes("video") ? ".webp" : ""				
			const filePath = path.join(__dirname, 'public', 'files', file.path)
			const thumbPath = path.join(__dirname, 'public', 'thumbnails', file.path) + isVideo
			
			await fs.unlink(filePath).catch(err => {
				if(err.code != "ENOENT") console.log("[orphanFileDeleter] Unlink original image", err)
			})
			await fs.unlink(thumbPath).catch(err => {
				if(err.code != "ENOENT") console.log("[orphanFileDeleter] Unlink thumbnail image", err)
			})

			//if post_id is null , parent is delete so remove the file too
			if(file.post_id == null) {
				instance.queries.deleteFileById.run(file.id)
			} else { //else update the status to be deleted
				instance.queries.updateFileStatus.run("deleted", file.id)
			}
		}

		await pause(1000 * 60 * 60)
		
	}
}

function pause(time) {
	return new Promise((resolve, reject) => {
		setTimeout(() => resolve(), time)
	})
}