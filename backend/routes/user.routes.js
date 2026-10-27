import express, { Router } from "express"
import { registerUsers } from "../controllers/user.controller.js"

const userRouter = Router()

userRouter.get('/register', registerUsers)

export default userRouter