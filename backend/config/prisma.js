//one shared Prisma client file

import { PrismaClient } from "@prisma/client";

const prisma  = new PrismaClient()

export default prisma