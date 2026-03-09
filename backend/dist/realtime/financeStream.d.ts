import { Response } from 'express';
export type FinanceEventName = 'finance-connected' | 'finance-updated' | 'payment-recorded' | 'expense-recorded' | 'payout-recorded' | 'due-updated' | 'payment-updated' | 'ping';
export declare function addFinanceStreamClient(res: Response): void;
export declare function broadcastFinanceEvent(eventName: FinanceEventName, payload: Record<string, unknown>): number;
//# sourceMappingURL=financeStream.d.ts.map