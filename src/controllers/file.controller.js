import { __dirname } from '../../path.js';
import instance from '../../models/db.js';

export const deleteFile = async (req , res, next) => {
	let result = instance.queries.updateFileStatus.run("orphan", req.params.id)
	return res.json(result)
}