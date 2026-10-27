import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";

export const registerUsers = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    //check whether user already exists or not

    const existingUser = await prisma.user.findUnique({
      where: {
        email
      },
    });

    if (existingUser) {
      return res.status(409).json({ message: "This email already exists" });
    }

    //hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    //create a user in the database
    const user = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    console.log(error);
  }
};
