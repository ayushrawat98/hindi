import path from 'path';
import sharp from 'sharp';
import { spawn } from 'child_process';
import instance from '../../db/db.js'
import fs from 'fs'
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

				const args = [
					'-i', ogfilePath,
					'-vf', "scale='min(100,iw)':-1",
					'-frames:v', '1',
					'-compression_level', '5',
					'-quality', '30',
					thumbfilePath + '.webp'
				];

				await ffmpegProcess(ffmpegPath, args)

			}
			else if (file.type.includes('gif')) {

				await sharp(ogfilePath, { animated: true, pages: -1 })
					.rotate()
					.withMetadata(false)
					.resize({
						width: 100,
						withoutEnlargement: true // CRITICAL: Prevents images smaller than 100px from stretching up
					})
					.webp({
						quality: 30,
						effort: 3,
						loop: 0,
						force: true
					})
					.toFile(thumbfilePath);

			} else if (file.type.startsWith('image')) {

				await sharp(ogfilePath)
					.rotate()
					.withMetadata(false)
					.resize({
						width: 100,
						withoutEnlargement: true // CRITICAL: Prevents images smaller than 100px from stretching up
					})
					.webp({ quality: 30, effort: 3 })
					.toFile(thumbfilePath);

			}

			//set status as success
			instance.queries.updateFileStatus.run('success', file.id)

		} catch (error) {

			//set status as failed
			instance.queries.updateFileStatus.run('failed', file.id)
			//set that file has failed
			shouldDeleteOriginalFile = true

		} finally {

			//delete the image after getting thumbnail
			if (shouldDeleteOriginalFile) {
				fs.unlink(ogfilePath, () => { })
			}

		}

		//pause for few seconds
		await new Promise(r => setTimeout(r, 5000));
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