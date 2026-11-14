import express from "express";
import { createBoard, deleteBoard, getBoardByName, getBoards, updateBoard } from "../controllers/board.controller.js";
import { adminRoleCheck } from "../libraries/common.js";

const route = express.Router()

route.get("/", getBoards)

route.get("/:name", getBoardByName)

route.post("/", adminRoleCheck, express.urlencoded(), createBoard)

route.put("/:id", adminRoleCheck, express.urlencoded(), updateBoard)

route.delete("/:id", adminRoleCheck, deleteBoard)

export { route }