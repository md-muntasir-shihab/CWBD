"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = require("../config/db");
const News_1 = __importDefault(require("../models/News"));
dotenv_1.default.config();
async function run() {
    await (0, db_1.connectDB)();
    const filter = {
        $or: [
            { coverImageSource: 'default' },
            {
                $and: [
                    {
                        $or: [
                            { coverImageSource: { $exists: false } },
                            { coverImageSource: '' },
                            { coverImageSource: null },
                        ],
                    },
                    {
                        $or: [
                            { coverImageUrl: { $exists: false } },
                            { coverImageUrl: '' },
                            { coverImageUrl: null },
                        ],
                    },
                    {
                        $or: [
                            { coverImage: { $exists: false } },
                            { coverImage: '' },
                            { coverImage: null },
                        ],
                    },
                ],
            },
        ],
    };
    const result = await News_1.default.updateMany(filter, {
        $set: {
            coverImageSource: 'default',
            coverImageUrl: '',
            coverImage: '',
            featuredImage: '',
            thumbnailImage: '',
        },
    });
    console.log('[migrate-news-default-banner] matched:', Number(result.matchedCount || 0));
    console.log('[migrate-news-default-banner] modified:', Number(result.modifiedCount || 0));
}
run()
    .catch((error) => {
    console.error('[migrate-news-default-banner] failed:', error);
    process.exitCode = 1;
})
    .finally(async () => {
    if (mongoose_1.default.connection.readyState !== 0) {
        await mongoose_1.default.connection.close();
    }
});
//# sourceMappingURL=migrate-news-default-banner.js.map