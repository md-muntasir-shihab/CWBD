# Playwright MCP Full Sweep (20260303091955)

- Base URL: http://127.0.0.1:5263
- Backend Port: 5063
- Frontend Port: 5263
- Mongo DB: campusway_playwright_mcp_20260303091955
- Started: 2026-03-03T09:19:55.451Z
- Ended: 2026-03-03T09:20:22.579Z

## Summary

- Total: 0
- Passed: 0
- Failed: 0
- Critical: 0
- Major: 0
- Minor: 0

## Pass/Fail Table

| ID | Phase | Viewport | Route | Action | Status | Severity | Screenshot |
|---|---|---|---|---|---|---|---|

## Visually Suspicious


## Warnings

- Runner error: e2e:prepare failed

> campusway-backend@1.0.0 e2e:prepare
> tsx src/scripts/e2e_prepare.ts

[db] MongoDB connected successfully
[db] All critical indexes ensured
[e2e_prepare] failed MongoServerError: Plan executor error during findAndModify :: caused by :: E11000 duplicate key error collection: campusway_playwright_mcp_20260303091955.studentprofiles index: phone_number_1 dup key: { phone_number: "01700000000" }
    at Connection.sendCommand (F:\CampusWay\backend\node_modules\mongodb\src\cmap\connection.ts:559:17)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async Connection.command (F:\CampusWay\backend\node_modules\mongodb\src\cmap\connection.ts:633:22)
    at async Server.command (F:\CampusWay\backend\node_modules\mongodb\src\sdam\server.ts:350:21)
    at async tryOperation (F:\CampusWay\backend\node_modules\mongodb\src\operations\execute_operation.ts:289:24)
    at async executeOperation (F:\CampusWay\backend\node_modules\mongodb\src\operations\execute_operation.ts:119:12)
    at async Collection.findOneAndUpdate (F:\CampusWay\backend\node_modules\mongodb\src\collection.ts:1041:12)
    at async model.Query._findOneAndUpdate (F:\CampusWay\backend\node_modules\mongoose\lib\query.js:3536:13)
    at async model.Query.exec (F:\CampusWay\backend\node_modules\mongoose\lib\query.js:4627:63)
    at async upsertSeedUser (F:\CampusWay\backend\src\scripts\e2e_prepare.ts:116:9) {
  errorLabelSet: Set(0) {},
  errorResponse: {
    ok: 0,
    errmsg: 'Plan executor error during findAndModify :: caused by :: E11000 duplicate key error collection: campusway_playwright_mcp_20260303091955.studentprofiles index: phone_number_1 dup key: { phone_number: "01700000000" }',
    code: 11000,
    codeName: 'DuplicateKey',
    keyPattern: { phone_number: 1 },
    keyValue: { phone_number: '01700000000' }
  },
  ok: 0,
  code: 11000,
  codeName: 'DuplicateKey',
  keyPattern: { phone_number: 1 },
  keyValue: { phone_number: '01700000000' }
}
[db] MongoDB disconnected

- Database drop skipped (mongosh unavailable or failed)
