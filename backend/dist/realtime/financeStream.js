"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFinanceStreamClient = addFinanceStreamClient;
exports.broadcastFinanceEvent = broadcastFinanceEvent;
const clients = new Set();
function writeEvent(res, eventName, payload) {
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
}
function addFinanceStreamClient(res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    clients.add(res);
    writeEvent(res, 'finance-connected', { connectedAt: new Date().toISOString() });
    const pingInterval = setInterval(() => {
        if (res.writableEnded) {
            clearInterval(pingInterval);
            clients.delete(res);
            return;
        }
        writeEvent(res, 'ping', { ts: new Date().toISOString() });
    }, 20000);
    res.on('close', () => {
        clearInterval(pingInterval);
        clients.delete(res);
    });
}
function broadcastFinanceEvent(eventName, payload) {
    let delivered = 0;
    for (const client of Array.from(clients)) {
        if (client.writableEnded) {
            clients.delete(client);
            continue;
        }
        writeEvent(client, eventName, { ...payload, timestamp: new Date().toISOString() });
        delivered += 1;
    }
    return delivered;
}
//# sourceMappingURL=financeStream.js.map