"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addHomeStreamClient = addHomeStreamClient;
exports.broadcastHomeStreamEvent = broadcastHomeStreamEvent;
const clients = new Set();
function writeEvent(res, event) {
    res.write(`event: ${event.type}\n`);
    res.write(`data: ${JSON.stringify(event)}\n\n`);
}
function addHomeStreamClient(res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    clients.add(res);
    writeEvent(res, {
        type: 'home-updated',
        timestamp: new Date().toISOString(),
        meta: { message: 'connected' },
    });
    const heartbeat = setInterval(() => {
        if (res.writableEnded) {
            clearInterval(heartbeat);
            clients.delete(res);
            return;
        }
        res.write('event: ping\n');
        res.write(`data: {"ts":"${new Date().toISOString()}"}\n\n`);
    }, 20000);
    res.on('close', () => {
        clearInterval(heartbeat);
        clients.delete(res);
    });
}
function broadcastHomeStreamEvent(event) {
    const payload = {
        ...event,
        timestamp: new Date().toISOString(),
    };
    clients.forEach((client) => {
        if (client.writableEnded) {
            clients.delete(client);
            return;
        }
        writeEvent(client, payload);
    });
}
//# sourceMappingURL=homeStream.js.map