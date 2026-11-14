import express from "express";
import {  deletePost, getPosts, patchPost } from "../controllers/post.controller.js";
import { adminRoleCheck, setUserRole } from "../libraries/common.js";

const route = express.Router()

route.get("/", getPosts)

route.patch("/:id", express.urlencoded(), adminRoleCheck, patchPost)

route.delete("/:id", setUserRole, deletePost)

export { route }