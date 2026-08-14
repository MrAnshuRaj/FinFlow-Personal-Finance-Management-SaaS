import dotenv from "dotenv";
import path from "node:path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import authRoutes from "./routes/auth";
import coreRoutes from "./routes/core";
import extraRoutes from "./routes/extras";
import { errorHandler } from "./middleware/error";
import { processDueRecurringTransactions } from "./services/recurring.service";

// Workspace commands run with apps/api as the working directory; load the root
// environment file while still allowing host-provided environment variables.
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

const app = express();
app.set("trust proxy", 1); app.use(helmet()); app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true })); app.use(express.json({ limit: "1mb" })); app.use(morgan("tiny"));
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
app.get("/api/health", (_req,res)=>res.json({status:"ok"})); app.use("/api/auth", authLimiter, authRoutes); app.use("/api", coreRoutes); app.use("/api", extraRoutes); app.use(errorHandler);
const runRecurringWorker = () => {
  void processDueRecurringTransactions().catch(error => console.error("Recurring worker skipped", error instanceof Error ? error.message : error));
};
const port = Number(process.env.API_PORT || 4000); app.listen(port, () => { console.log(`FinFlow API listening on :${port}`); runRecurringWorker(); });
setInterval(runRecurringWorker, 5 * 60 * 1000).unref();
