import express from "express";
import { handleAdminLogin, renderAdminBoards, renderAdminLogin, renderAdminPosts } from "../controllers/admin.controller.js";
import { adminRoleCheck } from "../libraries/common.js";

const route = express.Router()

route.get("/", renderAdminLogin)

route.post("/", express.urlencoded(), handleAdminLogin)

route.get("/boards", adminRoleCheck, renderAdminBoards)

route.get("/posts", adminRoleCheck, renderAdminPosts)

export { route }