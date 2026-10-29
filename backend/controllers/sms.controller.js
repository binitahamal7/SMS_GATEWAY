import prisma from "../config/prisma.js";
import { phoneValidator } from "../helpers/phoneValidator.js";
import { findCost } from "../helpers/smsCounter.js";
import { sendSMS } from "../providers/mockSmsProvider.js";

export async function sendSMSController(req, res) {
  try {
    console.log("req.user is:", req.user);
    const {to,message} = req.body

    const userId = req.user.id

    // 1. check the request body
    if (!Array.isArray(to) || to.length === 0) {
      return res.status(400).json({ error: "'to' must be a non-empty array" });
    }
    if (typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({ error: "'message' is required" });
    }

    // 2. validate every phone number
    const validNumbers = [];
    const invalidNumbers = [];

    for (const num of to) {
      const phoneNumber = phoneValidator(num);
      if (phoneNumber) {
        validNumbers.push(phoneNumber);
      } else {
        invalidNumbers.push(num);
      }
    }

    if (invalidNumbers.length > 0) {
      return res
        .status(400)
        .json({ error: "Invalid phone numbers", invalidNumbers });
    }

    // 3. calculate the cost
    const parts = findCost(message);
    const totalCost = parts * validNumbers.length;

    // 4. take the credits and create the messages, in one transaction
    const messages = await prisma.$transaction(async (tx) => {
      const wallet = await tx.user.updateMany({
        where: { id: userId, credits: { gte: totalCost } },
        data: { credits: { decrement: totalCost } },
      });

      if (wallet.count === 0) {
        return null;
      }

      return tx.message.createManyAndReturn({
        data: validNumbers.map((number) => ({
          userId,
          to: number,
          body: message,
          parts,
        })),
      });
    });

    if (!messages) {
      return res.status(402).json({ error: "Not enough credits" });
    }

    // 5. send each message, trying routes in priority order
    const routes = await prisma.route.findMany({
      orderBy: { priority: "asc" },
    });

    const results = [];
    for (const msg of messages) {
      results.push(await deliverMessage(msg, routes, userId));
    }

    return res.status(200).json({ totalCost, results });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

// tries every route for one message and refunds if all of them fail
async function deliverMessage(msg, routes, userId) {
  const tried = [];

  for (const route of routes) {
    const result = await sendSMS(route, msg.to, msg.body);
    tried.push(route.name);

    if (result.success) {
      await prisma.message.update({
        where: { id: msg.id },
        data: { status: "SENT" },
      });
      return { to: msg.to, status: "SENT", tried };
    }
  }

  // every route failed (mark failed and refund), together
  await prisma.$transaction([
    prisma.message.update({
      where: { id: msg.id },
      data: { status: "FAILED" },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: msg.parts } },
    }),
  ]);

  return { to: msg.to, status: "FAILED", tried, refunded: msg.parts };
}
