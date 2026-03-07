"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = exports.buildApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const publicNewsRoutes_1 = require("./routes/publicNewsRoutes");
const adminNewsRoutes_1 = require("./routes/adminNewsRoutes");
const adminRateLimit_1 = require("./middleware/adminRateLimit");
const rssWorker_1 = require("./jobs/rssWorker");
const scheduledPublisher_1 = require("./jobs/scheduledPublisher");
const studentExamRoutes_1 = require("./routes/exams/studentExamRoutes");
const adminExamRoutes_1 = require("./routes/exams/adminExamRoutes");
const examAutoSubmitJob_1 = require("./jobs/examAutoSubmitJob");
const buildApp = () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json({ limit: "5mb" }));
    app.use((0, cors_1.default)({ origin: [/localhost/, /campusway/], credentials: true }));
    app.use("/api", publicNewsRoutes_1.publicNewsRoutes);
    app.use("/api", studentExamRoutes_1.studentExamRoutes);
    app.use("/api/admin", adminRateLimit_1.adminRateLimit, adminNewsRoutes_1.adminNewsRoutes);
    app.use("/api/admin", adminRateLimit_1.adminRateLimit, adminExamRoutes_1.adminExamRoutes);
    return app;
};
exports.buildApp = buildApp;
const startServer = async () => {
    await mongoose_1.default.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/cwbd");
    const app = (0, exports.buildApp)();
    (0, rssWorker_1.startRssWorker)();
    (0, scheduledPublisher_1.startScheduledPublisher)();
    (0, examAutoSubmitJob_1.startExamAutoSubmitJob)();
    const port = Number(process.env.PORT || 4000);
    app.listen(port, () => {
        console.log(`campusway api running on ${port}`);
    });
};
exports.startServer = startServer;
//# sourceMappingURL=app.js.map