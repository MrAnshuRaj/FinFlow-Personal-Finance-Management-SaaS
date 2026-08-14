import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../lib/errors";

const accessSecret = () => process.env.JWT_ACCESS_SECRET || "development-access-secret-change-me";
export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return next(new AppError(401, "UNAUTHENTICATED", "Authentication is required"));
  try { req.user = jwt.verify(token, accessSecret()) as Request["user"]; next(); }
  catch { next(new AppError(401, "INVALID_TOKEN", "Your session has expired. Please sign in again.")); }
};
export const signAccessToken = (user: { id: string; email: string }) => jwt.sign({ sub: user.id, email: user.email }, accessSecret(), { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m" } as jwt.SignOptions);
export const signRefreshToken = (user: { id: string; email: string }) => jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_REFRESH_SECRET || "development-refresh-secret-change-me", { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d" } as jwt.SignOptions);
