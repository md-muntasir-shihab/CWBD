"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addExamAttemptStreamClient = addExamAttemptStreamClient;
exports.broadcastExamAttemptEvent = broadcastExamAttemptEvent;
exports.broadcastExamAttemptEventByMeta = broadcastExamAttemptEventByMeta;
const clients = new Map();
function getBucket(attemptId) {
    if (!clients.has(attemptId)) {
        clients.set(attemptId, new Set());
    }
    return clients.get(attemptId);
}
function writeEvent(res, eventName, payload) {
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
}
function removeClient(client) {
    const bucket = clients.get(client.meta.attemptId);
    if (!bucket)
        return;
    bucket.delete(client);
    if (bucket.size === 0)
        clients.delete(client.meta.attemptId);
}
function addExamAttemptStreamClient(params) {
    const { attemptId, studentId, examId, res } = params;
    const client = {
        res,
        meta: { attemptId, studentId, examId },
    };
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    const bucket = getBucket(attemptId);
    bucket.add(client);
    writeEvent(res, 'attempt-connected', {
        attemptId,
        studentId,
        examId,
        connectedAt: new Date().toISOString(),
    });
    const heartbeat = setInterval(() => {
        if (res.writableEnded) {
            clearInterval(heartbeat);
            removeClient(client);
            return;
        }
        writeEvent(res, 'ping', { ts: new Date().toISOString(), attemptId });
    }, 20000);
    res.on('close', () => {
        clearInterval(heartbeat);
        removeClient(client);
    });
}
function broadcastExamAttemptEvent(attemptId, eventName, payload) {
    const bucket = clients.get(attemptId);
    if (!bucket || bucket.size === 0)
        return 0;
    let delivered = 0;
    for (const client of Array.from(bucket)) {
        if (client.res.writableEnded) {
            bucket.delete(client);
            continue;
        }
        writeEvent(client.res, eventName, {
            ...payload,
            attemptId,
            timestamp: new Date().toISOString(),
        });
        delivered += 1;
    }
    if (bucket.size === 0)
        clients.delete(attemptId);
    return delivered;
}
function broadcastExamAttemptEventByMeta(filter, eventName, payload) {
    let delivered = 0;
    for (const [attemptId, bucket] of clients.entries()) {
        for (const client of Array.from(bucket)) {
            if (client.res.writableEnded) {
                bucket.delete(client);
                continue;
            }
            if (filter.studentId && String(client.meta.studentId) !== String(filter.studentId))
                continue;
            if (filter.examId && String(client.meta.examId) !== String(filter.examId))
                continue;
            writeEvent(client.res, eventName, {
                ...payload,
                attemptId,
                studentId: client.meta.studentId,
                examId: client.meta.examId,
                timestamp: new Date().toISOString(),
            });
            delivered += 1;
        }
        if (bucket.size === 0)
            clients.delete(attemptId);
    }
    return delivered;
}
//# sourceMappingURL=examAttemptStream.js.map