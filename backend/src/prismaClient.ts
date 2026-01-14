// src/prismaClient.ts

import { PrismaClient } from "@prisma/client";

// Cria uma única instância do Prisma Client
const prisma = new PrismaClient();

// Exporta a instância
export default prisma;