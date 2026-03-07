"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionModel = void 0;
const mongoose_1 = require("mongoose");
const subscriptionSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, index: true },
    planId: { type: String, required: true },
    status: { type: String, enum: ["active", "expired", "pending", "suspended"], default: "pending" },
    startAtUTC: Date,
    expiresAtUTC: Date,
    paymentId: String,
    notes: String
}, { timestamps: true });
exports.SubscriptionModel = (0, mongoose_1.model)("user_subscriptions", subscriptionSchema);
//# sourceMappingURL=subscription.model.js.map