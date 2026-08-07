import instance from "./db.js";
import sharp from "sharp";
import path from "path";
import fs from "fs"
import { __dirname } from "../path.js";


(async () => {
  const files = instance.db.prepare(`
    SELECT id, path, type
    FROM files
  `).all();

  const updateStmt = instance.db.prepare(`
    UPDATE files
    SET height = ?, width = ?
    WHERE id = ?
  `);

  for (const file of files) {
    const imagePath = file.type.includes("video") ?  path.join(
      __dirname,
      "public",
      "thumbnails",
      file.path + ".webp"
    ) : path.join(
      __dirname,
      "public",
      "thumbnails",
      file.path 
    ) 

    try {
      if (!fs.existsSync(imagePath)) {
        console.warn(`Missing: ${imagePath}`);
        continue;
      }

      const { width = 0, height = 0 } = await sharp(imagePath).metadata();

      updateStmt.run(height, width, file.id);

      console.log(`${file.id}: ${width}x${height}`);
    } catch (err) {
      console.error(`${file.path}: ${err.message}`);
    }
  }

  console.log("Finished updating dimensions.");
})();