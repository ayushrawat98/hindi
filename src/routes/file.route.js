import express from "express";
import { deleteFile } from "../controllers/file.controller.js";
import { adminRoleCheck } from "../libraries/common.js";
const route = express.Router()

route.delete("/:id", adminRoleCheck, deleteFile)

export { route }