import { HttpStatusCode } from "@/configs/system/http.config.ts"

import { NextFunction, Request, Response } from "express"
import { ZodType } from "zod"

/**
 * Higher-order middleware factory for schema-based request validation using Zod.
 * Validates and mutates req[target] with the parsed, typed, sanitized value.
 * Passes ZodError directly to next(error) for centralized exception handling.
 *
 * @param schema - Zod validation schema
 * @param target - Property on Express Request to validate ('body', 'query', or 'params'). Defaults to 'body'.
 * @returns Express middleware function
 */
export const validate =
  (schema: ZodType<any, any, any>, target: "body" | "query" | "params" = "body") =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req[target])
      Object.defineProperty(req, target, {
        value: parsed,
        writable: true,
        configurable: true,
        enumerable: true,
      })
      next()
    } catch (error) {
      next(error)
    }
  }
