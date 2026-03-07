"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAuth = void 0;
// user type is declared globally in src/types/express-user-augmentation.d.ts
const requireAuth = (req, res, next) => {
    const userId = req.headers["x-user-id"];
    const role = req.headers["x-user-role"] || "student";
    if (!userId)
        return res.status(401).json({ message: "Unauthorized" });
    req.user = { id: userId, _id: userId, role, username: "", email: "", fullName: "" };
    next();
};
exports.requireAuth = requireAuth;
const requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role))
        return res.status(403).json({ message: "Forbidden" });
    next();
};
exports.requireRole = requireRole;
//# sourceMappingURL=auth.js.map