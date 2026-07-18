import multer from "multer";

const filefilter = (req, file, cb) => {
	let allowed = ['video/mp4', 'video/webm', 'image/jpg', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
	if (allowed.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb({ message: 'Unsupported File Format' }, false)
	}
};

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'public/files')
	},
	filename: function (req, file, cb) {
		const uniquePrefix = Date.now()
		const correctedName = Buffer.from(file.originalname, 'latin1').toString('utf8').replace(/[\/\\]/g, "").replace(/\.\.+/g, ".") 
		cb(null, uniquePrefix + "-" + correctedName)
	}
})

const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: filefilter })
export default upload;