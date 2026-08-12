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
			await pause(15000)
			continue
		}

		// let shouldDeleteOriginalFile = file.type.includes('image')
		let shouldDeleteOriginalFile = false

		let ogFilePath = path.join(__dirname, 'public', 'files', file.path)
		let thumbFilePath = path.join(__dirname, 'public', 'thumbnails', file.path)
		let tempFilePath = path.join(__dirname, 'public', 'files', "temp" + file.path)

		try {

			if (file.type.startsWith('video')) {

				const thumbnailArgs = [
					'-i', ogFilePath,
					'-vf', "scale='min(100,iw)':-1",
					'-frames:v', '1',
					'-map_metadata', '-1',
					'-compression_level', '5',
					'-quality', '100',
					thumbFilePath + '.webp'
				];

				await ffmpegProcess(ffmpegPath, thumbnailArgs) //create thumbnail and strip its metadata
				await setHeightAndWidth(thumbFilePath + ".webp", file.id) //set height and width of thumbnai
				await pause(1000)
				await removeVideoMetaData(ogFilePath, tempFilePath)
			}
			else if (file.type.includes('gif')) {

				const inputBuffer = await fs.readFile(ogFilePath);

				await sharp(inputBuffer, { animated: true, pages: -1 })
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
					.toFile(thumbFilePath);

				await setHeightAndWidth(thumbFilePath, file.id)
				await removeImageMetaData(ogFilePath, tempFilePath, { animated: true, pages: -1 }, inputBuffer)

			} else if (file.type.startsWith('image')) {

				await sharp(ogFilePath)
					.rotate()
					.resize({
						width: 100,
						withoutEnlargement: true // CRITICAL: Prevents images smaller than 100px from stretching up
					})
					.webp({ quality: 100, effort: 5 })
					.toFile(thumbFilePath);

				await setHeightAndWidth(thumbFilePath, file.id)
				await removeImageMetaData(ogFilePath, tempFilePath, {})
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
						fs.unlink(thumbFilePath + ".webp")
						fs.unlink(ogFilePath)
					} else {
						fs.unlink(thumbFilePath)
						fs.unlink(ogFilePath)
					}
				} catch (err) {
					console.error(err)
				}
			}

		}

		//pause for few seconds
		await pause(1000)
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

async function removeVideoMetaData(ogFilePath, tempFilePath) {
	const stripMetadataArgs = [
		'-y',
		'-i', ogFilePath,
		'-map_metadata', '-1',
		'-map_chapters', '-1',
		'-c', 'copy',
		tempFilePath
	];

	//strip meta data from original
	await ffmpegProcess(ffmpegPath, stripMetadataArgs)
	await fs.unlink(ogFilePath);
	await fs.rename(tempFilePath, ogFilePath);
}

async function removeImageMetaData(ogFilePath, tempFilePath, config, buffer = undefined) {
    // Sharp now works from memory instead of keeping the source file open.
    await sharp(buffer ?? ogFilePath, config).rotate().toFile(tempFilePath);
	// await sharp(ogFilePath, config).toFile(tempFilePath);
	await fs.unlink(ogFilePath);
	await fs.rename(tempFilePath, ogFilePath);
}

async function setHeightAndWidth(path, id) {
	const { width = 0, height = 0 } = await sharp(path).metadata();
	instance.queries.updateFileHeightAndWidth.run(height, width, id);
}

function pause(time) {
	return new Promise((resolve, reject) => {
		setTimeout(() => resolve(), time)
	})
}