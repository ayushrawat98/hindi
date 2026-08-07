import path from 'path';
import sharp from 'sharp';
import { spawn } from 'child_process';
import instance from '../../db/db.js'
import fs from "fs/promises"
import { configuration } from '../../env.js';
import { __dirname } from '../../path.js';

// sharp.concurrency(1)
// sharp.cache(false)
const ffmpegPath = configuration.FFMPEG

export async function imageProcessor() {

	while (true) {
		let file = instance.queries.getFileWithStatus.get("pending")

		//if no file in queue , wait for 30 seconds and then start again
		if (!file) {
			await new Promise((resolve, reject) => {
				setTimeout(() => resolve(), 30000)
			})
			continue
		}

		// let shouldDeleteOriginalFile = file.type.includes('image')
		let shouldDeleteOriginalFile = false

		let ogfilePath = path.join(__dirname, 'public', 'files', file.path)
		let thumbfilePath = path.join(__dirname, 'public', 'thumbnails', file.path)

		try {

			if (file.type.startsWith('video')) {

				const thumbnailArgs = [
					'-i', ogfilePath,
					'-vf', "scale='min(100,iw)':-1",
					'-frames:v', '1',
					'-compression_level', '5',
					'-quality', '100',
					thumbfilePath + '.webp'
				];

				const stripMetadataArgs = [
					'-y',
					'-i', ogfilePath,
					'-map_metadata', '-1',
					'-map_chapters', '-1',
					'-c', 'copy',
					ogfilePath + ".mp4"
				];

				await ffmpegProcess(ffmpegPath, thumbnailArgs)
				await ffmpegProcess(ffmpegPath, stripMetadataArgs)
				await removeMetaData(ogfilePath, false, ".mp4")
				await setHeightAndWidth(thumbfilePath + ".webp", file.id)

			}
			else if (file.type.includes('gif')) {

				await sharp(ogfilePath, { animated: true, pages: -1 })
					.rotate()
					.resize({
						width: 100,
						withoutEnlargement: true // CRITICAL: Prevents images smaller than 100px from stretching up
					})
					.webp({
						quality: 100,
						effort: 5,
						loop: 0,
						force: true
					})
					.toFile(thumbfilePath);
				
				await setHeightAndWidth(thumbfilePath, file.id)

			} else if (file.type.startsWith('image')) {

				await sharp(ogfilePath)
					.rotate()
					.resize({
						width: 100,
						withoutEnlargement: true // CRITICAL: Prevents images smaller than 100px from stretching up
					})
					.webp({ quality: 100, effort: 5 })
					.toFile(thumbfilePath);

				//remove metadata info
				await removeMetaData(ogfilePath, true, ".temp")
				await setHeightAndWidth(thumbfilePath, file.id)

			}

			//set status as success
			instance.queries.updateFileStatus.run('success', file.id)

		} catch (error) {
			console.log(error)
			//set status as failed
			instance.queries.updateFileStatus.run('failed', file.id)
			//set that file has failed
			shouldDeleteOriginalFile = true

		} finally {

			//delete the image / thumbnail on failing
			if (shouldDeleteOriginalFile) {
				try {
					if (file.type.startsWith('video')) {
						fs.unlink(thumbfilePath + ".webp")
						fs.unlink(ogfilePath)
					} else {
						fs.unlink(thumbfilePath)
						fs.unlink(ogfilePath)
					}
				} catch (err) {
					console.error(err)
				}
			}

		}

		//pause for few seconds
		await new Promise(r => setTimeout(r, 1000));
	}
}

function ffmpegProcess(ffmpegPath, args) {
	return new Promise((resolve, reject) => {
		const ffmpegProcess = spawn(ffmpegPath, args, { stdio: 'ignore' });

		ffmpegProcess.on('error', (err) => {
			reject(new Error(`FFmpeg spawn error: ${err.message}`));
		});

		ffmpegProcess.on('close', (code) => {
			if (code !== 0) {
				reject(new Error(`FFmpeg exited with code ${code}`));
			} else {
				resolve();
			}
		});
	});
}

async function removeMetaData(ogfilePath, isImage, ext) {
	const tempName = ogfilePath + ext
	if (isImage) await sharp(ogfilePath).toFile(tempName);
	await fs.rename(ogfilePath, ogfilePath + ".delete");
	await fs.rename(tempName, ogfilePath);
	await fs.unlink(ogfilePath + ".delete");
}

async function setHeightAndWidth(path, id){
	const { width = 0, height = 0 } = await sharp(path).metadata();
	instance.queries.updateFileHeightAndWidth.run(height, width, id);
}