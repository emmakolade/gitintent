import { Request, Response, NextFunction } from "express";

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated() && req.user) {
    req.session.userId = String(req.user);
    next();
    return;
  }

  res.redirect("/");
}
