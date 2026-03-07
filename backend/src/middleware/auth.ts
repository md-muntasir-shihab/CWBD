import { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string };
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers["x-user-id"] as string | undefined;
  const role = (req.headers["x-user-role"] as string | undefined) || "student";
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  req.user = { id: userId, role };
  next();
};

export const requireRole = (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
  next();
};
