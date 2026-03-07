"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addHomeStreamClient = addHomeStreamClient;
exports.broadcastHomeStreamEvent = broadcastHomeStreamEvent;
var clients = new Set();
function writeEvent(res, event) {
    res.write("event: ".concat(event.type, "\n"));
    res.write("data: ".concat(JSON.stringify(event), "\n\n"));
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
    var heartbeat = setInterval(function () {
        if (res.writableEnded) {
            clearInterval(heartbeat);
            clients.delete(res);
            return;
        }
        res.write('event: ping\n');
        res.write("data: {\"ts\":\"".concat(new Date().toISOString(), "\"}\n\n"));
    }, 20000);
    res.on('close', function () {
        clearInterval(heartbeat);
        clients.delete(res);
    });
}
function broadcastHomeStreamEvent(event) {
    var payload = __assign(__assign({}, event), { timestamp: new Date().toISOString() });
    clients.forEach(function (client) {
        if (client.writableEnded) {
            clients.delete(client);
            return;
        }
        writeEvent(client, payload);
    });
}
