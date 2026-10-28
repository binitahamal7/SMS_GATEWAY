import express, { Router } from "express"
import { loginUsers, registerUsers } from "../controllers/user.controller.js"
import { authMiddleware } from "../middleware/auth.middleware.js"

const userRouter = Router()

userRouter.post('/register', registerUsers)
userRouter.post('/login',loginUsers)

//for testing whether the authentication middleware is working properly or not
userRouter.get('/profile',authMiddleware, (req,res)=>{
    res.status(200).json({
        message:"user authenticated successfully",
        user:req.user,
    })
})
export default userRouter