import { getSession } from "@auth/express";
import { NextFunction, Request, Response } from "express";
import { expressAuthConfig } from "../routes/auth.route";

export async function authenticatedUser(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const session = res.locals.session ?? (await getSession(req, expressAuthConfig))
    if (!session?.user) {
      res.status(403).send("User not authenticated");
    } else {
      next();
    }
  }