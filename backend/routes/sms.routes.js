import express, { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { sendSMSController } from "../controllers/sms.controller.js";

const smsRouter = Router();

smsRouter.post("/send", authMiddleware, sendSMSController);

export default smsRouter;
