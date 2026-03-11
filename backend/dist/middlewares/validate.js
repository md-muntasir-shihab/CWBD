"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
exports.validateQuery = validateQuery;
const zod_1 = require("zod");
/**
 * Express middleware that validates req.body against a Zod schema.
 * Returns 400 with structured error messages on validation failure.
 */
function validate(schema) {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                const issues = err.issues ?? [];
                const errors = issues.map((e) => ({
                    path: e.path.join('.'),
                    message: e.message,
                }));
                res.status(400).json({ message: 'Validation failed', errors });
                return;
            }
            next(err);
        }
    };
}
/**
 * Validates req.query against a Zod schema.
 */
function validateQuery(schema) {
    return (req, res, next) => {
        try {
            req.query = schema.parse(req.query);
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                const issues = err.issues ?? [];
                const errors = issues.map((e) => ({
                    path: e.path.join('.'),
                    message: e.message,
                }));
                res.status(400).json({ message: 'Validation failed', errors });
                return;
            }
            next(err);
        }
    };
}
//# sourceMappingURL=validate.js.map