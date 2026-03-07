"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUserStreamClient = addUserStreamClient;
exports.broadcastUserEvent = broadcastUserEvent;
const clients = new Set();
function writeEvent(res, event) {
    res.write(`event: user-event\n`);
    res.write(`data: ${JSON.stringify(event)}\n\n`);
}
function addUserStreamClient(res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    clients.add(res);
    writeEvent(res, {
        type: 'user_updated',
        timestamp: new Date().toISOString(),
        meta: { heartbeat: true, message: 'connected' },
    });
    const heartbeat = setInterval(() => {
        if (res.writableEnded) {
            clearInterval(heartbeat);
            clients.delete(res);
            return;
        }
        res.write(`event: ping\n`);
        res.write(`data: {"ts":"${new Date().toISOString()}"}\n\n`);
    }, 20000);
    res.on('close', () => {
        clearInterval(heartbeat);
        clients.delete(res);
    });
}
function broadcastUserEvent(event) {
    const payload = {
        ...event,
        timestamp: new Date().toISOString(),
    };
    for (const client of clients) {
        if (client.writableEnded) {
            clients.delete(client);
            continue;
        }
        writeEvent(client, payload);
    }
}
//# sourceMappingURL=userStream.js.map