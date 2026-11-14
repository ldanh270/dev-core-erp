import { CustomQueryController } from "@/controllers/custom-query.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { PrismaCustomQueryRepository } from "@/repositories/custom-query.repository.ts"
import { CustomQueryService } from "@/services/custom-query.service.ts"

import express from "express"

const customQueryRoutes = express.Router()

const repository = new PrismaCustomQueryRepository(prisma)
const service = new CustomQueryService(repository)
const controller = new CustomQueryController(service)

customQueryRoutes.use(authenticate)

customQueryRoutes.get("/", controller.list)
customQueryRoutes.post("/", controller.create)
customQueryRoutes.delete("/:id", controller.delete)

export default customQueryRoutes
