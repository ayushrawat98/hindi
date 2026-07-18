import { configDotenv } from "dotenv";

configDotenv()

export const configuration = {
	NODE_ENV : process.env.NODE_ENV.trim() || "development",
	PORT : process.env.PORT.trim() || 3000,
	FFMPEG : process.env.FFMPEG.trim() || "ffmpeg"
}