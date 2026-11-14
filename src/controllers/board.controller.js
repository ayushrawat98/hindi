import { __dirname } from '../../path.js';
import instance from '../../models/db.js';
import { convertIpNew } from "../libraries/ban.js"

export const getBoards = async (req , res, next) => {
	const result = instance.queries.getBoards.all()
	return res.json(result)
}

export const getBoardByName = async (req , res, next) => {
	let result = instance.queries.getBoardByName.get(req.params.name.trim())
	return res.json(result)
}

export const createBoard = async (req , res, next) => {
	let { name, title, rules } = req.body
	let result = instance.queries.createBoard.run(name.trim(), title.trim(), rules.trim(), "ADMIN")
	return res.json(result)
}

export const updateBoard = async (req , res, next) => {
	let { id, name, title, rules, owner_name, locked, order_number } = req.body
	let result = instance.queries.updateBoardById.run(name.trim(), title.trim(), rules.trim(), owner_name.trim(), Number(locked), Number(order_number), Number(id))
	return res.json(result)
}

export const deleteBoard = async (req , res, next) => {
	let result = instance.queries.deleteBoardById.run(req.params.id)
	return res.json(result)
}
