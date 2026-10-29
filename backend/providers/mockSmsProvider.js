import prisma from "../config/prisma.js";
import { findCost } from "../helpers/smsCounter.js";

export async function sendSMS(route, phone, message) {
  const parts = findCost(message);

  //if the route doesnt have enough balance at first place
  if (route.balance < parts) {
    return {
      success: false,
      reason: "insufficient_balance",
      route: route.name,
      to: phone,
    };
  }

  // fail randomly based on the route's failureRates
  if (Math.random() < route.failureRate) {
    return {
      success: false,
      reason: "sms_provider_error",
      route: route.name,
      to: phone,
    };
  }

  //reduce the route's balance only if it still has enough
  const result = await prisma.route.updateMany({
    where: {
      id: route.id,
      balance: {
        gte: parts,
      },
    },
    data: {
      balance: {
        decrement: parts,
      },
    },
  });

  if (result.count === 0) {
    return {
      success: false,
      reason: "insufficient_balance",
      route: route.name,
      to: phone,
    };
  }

  return {
    success: true,
    route: route.name,
    to: phone,
  };
}

//a method which returns the balance of a route
export async function getBalance(routeId){
    const route = await prisma.route.findUnique({
        where:{
            id:routeId
        },
        select:{
            balance:true
        },
    })

    return route ? route.balance : 0
}