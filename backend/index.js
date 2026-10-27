import express from "express";
import dotenv from "dotenv";
import prisma from "./config/prisma.js";
import userRouter from "./routes/user.routes.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api/users', userRouter)

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", database: "not connected" });
  }
});
app.listen(process.env.PORT, () => {
  console.log(`Server is running at port ${process.env.PORT}`);
});
