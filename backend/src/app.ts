import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { publicNewsRoutes } from "./routes/publicNewsRoutes";
import { adminNewsRoutes } from "./routes/adminNewsRoutes";
import { adminRateLimit } from "./middleware/adminRateLimit";
import { startRssWorker } from "./jobs/rssWorker";
import { startScheduledPublisher } from "./jobs/scheduledPublisher";
import { studentExamRoutes } from "./routes/exams/studentExamRoutes";
import { adminExamRoutes } from "./routes/exams/adminExamRoutes";
import { startExamAutoSubmitJob } from "./jobs/examAutoSubmitJob";

export const buildApp = () => {
  const app = express();
  app.use(express.json({ limit: "5mb" }));
  app.use(cors({ origin: [/localhost/, /campusway/], credentials: true }));

  app.use("/api", publicNewsRoutes);
  app.use("/api", studentExamRoutes);
  app.use("/api/admin", adminRateLimit, adminNewsRoutes);
  app.use("/api/admin", adminRateLimit, adminExamRoutes);

  return app;
};

export const startServer = async () => {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/cwbd");
  const app = buildApp();
  startRssWorker();
  startScheduledPublisher();
  startExamAutoSubmitJob();
  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => {
    console.log(`campusway api running on ${port}`);
  });
};
