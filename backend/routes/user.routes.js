import express, { Router } from "express"
import { loginUsers, registerUsers } from "../controllers/user.controller.js"

const userRouter = Router()

userRouter.post('/register', registerUsers)
userRouter.post('/login',loginUsers)

export default userRouter