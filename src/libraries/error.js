export class AppError extends Error {
	constructor(status, message,  deleteFile = false, code = "UNKNOWN") {
		super(message);

		this.status = status;
		this.code = code;
		this.deleteFile = deleteFile;
		
		Error.captureStackTrace(this, this.constructor);
	}
}