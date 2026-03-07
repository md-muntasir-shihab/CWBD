import { InferSchemaType } from "mongoose";
export declare const NEWS_STATUS: readonly ["pending_review", "duplicate_review", "draft", "published", "scheduled", "rejected"];
declare const newsItemSchema: any;
export type NewsItem = InferSchemaType<typeof newsItemSchema>;
export declare const NewsItemModel: any;
export {};
//# sourceMappingURL=newsItem.model.d.ts.map