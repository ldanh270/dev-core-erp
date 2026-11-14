import { ROUTE_MANIFEST } from "@/configs/system/route-manifest.config.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { requirePermission } from "@/middlewares/permission.middleware.ts"

import express from "express"

const debugRoutes = express.Router()

/**
 * @route GET /api/debug/route-manifest
 * @desc Returns the pre-configured route manifest for authorization reconciliation with the Frontend
 * @access Private (requires role.read permission or equivalent admin privileges)
 */
debugRoutes.get("/route-manifest", authenticate, requirePermission("role.read"), (req, res) => {
  res.json({ data: ROUTE_MANIFEST })
})

export default debugRoutes
