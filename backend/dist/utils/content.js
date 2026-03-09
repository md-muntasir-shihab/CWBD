"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = exports.hashKey = exports.normalizeTitle = exports.sanitizeNewsHtml = void 0;
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const crypto_1 = require("crypto");
const sanitizeNewsHtml = (input) => (0, sanitize_html_1.default)(input || "", {
    allowedTags: sanitize_html_1.default.defaults.allowedTags.concat(["img", "h1", "h2"]),
    allowedAttributes: {
        a: ["href", "name", "target"],
        img: ["src", "alt"],
        "*": ["class"]
    },
    transformTags: {
        a: sanitize_html_1.default.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" })
    }
});
exports.sanitizeNewsHtml = sanitizeNewsHtml;
const normalizeTitle = (title) => (title || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
exports.normalizeTitle = normalizeTitle;
const hashKey = (value) => (0, crypto_1.createHash)("sha256").update(value).digest("hex");
exports.hashKey = hashKey;
const slugify = (text) => (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
exports.slugify = slugify;
//# sourceMappingURL=content.js.map