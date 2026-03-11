import fs from 'fs/promises';
import path from 'path';
import net from 'net';
import { spawn } from 'child_process';

const IS_WIN = process.platform === 'win32';
const NPM = IS_WIN ? 'npm.cmd' : 'npm';
const NPX = IS_WIN ? 'npx.cmd' : 'npx';

const RUN_ID = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const START_BACKEND_PORT = Number(process.env.E2E_BACKEND_PORT || 5083);
const START_FRONTEND_PORT = Number(process.env.E2E_FRONTEND_PORT || 5283);
const DB_NAME = process.env.E2E_DB_NAME || `campusway_role_qa_${RUN_ID}`;
const MONGODB_URI = process.env.E2E_MONGODB_URI || `mongodb://127.0.0.1:27017/${DB_NAME}`;
const WORK_DIR = process.cwd();
const BACKEND_DIR = path.resolve(WORK_DIR, '../backend');
const OUT_DIR = path.resolve(WORK_DIR, '../qa-artifacts/role-full-qa', RUN_ID);
const PASSES_ENV = String(process.env.E2E_ROLE_QA_PASSES || '').trim();

const PASS_DEFS = [
    {
        id: 'pass1-viewer',
        title: 'PASS 1 - Viewer/Public',
        role: 'Viewer',
        specs: [
            'e2e/public-smoke.spec.ts',
            'e2e/public-design-visibility.spec.ts',
            'e2e/home-step1.spec.ts',
            'e2e/home-master.spec.ts',
            'e2e/phase3-page-audit.spec.ts',
            'e2e/news-exam-responsive.spec.ts',
        ],
    },
    {
        id: 'pass2-student',
        title: 'PASS 2 - Student',
        role: 'Student',
        specs: [
            'e2e/student-smoke.spec.ts',
            'e2e/exam-flow.spec.ts',
            'e2e/exam-attempt-critical.spec.ts',
        ],
    },
    {
        id: 'pass3-admin',
        title: 'PASS 3 - Admin',
        role: 'Admin',
        specs: [
            'e2e/admin-smoke.spec.ts',
            'e2e/admin-phase2-micro.spec.ts',
            'e2e/finance-support-critical.spec.ts',
            'e2e/news-admin-routes.spec.ts',
            'e2e/qbank-critical.spec.ts',
            'e2e/admin-responsive-all.spec.ts',
            'e2e/import-export-bulk.spec.ts',
            'e2e/settings-propagation.spec.ts',
        ],
    },
    {
        id: 'pass4-cross-role',
        title: 'PASS 4 - Cross-role / Permission / Sync',
        role: 'Cross-role',
        specs: [
            'e2e/phase4-pipelines.spec.ts',
            'e2e/auth-session.spec.ts',
            'e2e/step2-core.spec.ts',
            'e2e/login-unification.spec.ts',
            'e2e/cross-role-permissions.spec.ts',
            'e2e/role-theme-persistence.spec.ts',
        ],
    },
    {
        id: 'pass5-regression',
        title: 'PASS 5 - Regression',
        role: 'Cross-role',
        specs: [
            'e2e/public-smoke.spec.ts',
            'e2e/student-smoke.spec.ts',
            'e2e/admin-smoke.spec.ts',
            'e2e/cross-role-permissions.spec.ts',
            'e2e/settings-propagation.spec.ts',
            'e2e/role-theme-persistence.spec.ts',
        ],
    },
];

function pickPasses() {
    if (!PASSES_ENV) return PASS_DEFS;
    const requested = new Set(
        PASSES_ENV.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean),
    );
    return PASS_DEFS.filter((passDef) => requested.has(passDef.id.toLowerCase()));
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function spawnCmd(cmd, args, options = {}) {
    return spawn(cmd, args, {
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        ...options,
    });
}

async function runCmd(cmd, args, options = {}) {
    return new Promise((resolve) => {
        const child = spawnCmd(cmd, args, options);
        const stdout = [];
        const stderr = [];
        child.stdout?.on('data', (chunk) => stdout.push(chunk));
        child.stderr?.on('data', (chunk) => stderr.push(chunk));
        child.on('close', (code) => {
            resolve({
                code: code ?? 1,
                stdout: Buffer.concat(stdout).toString('utf-8'),
                stderr: Buffer.concat(stderr).toString('utf-8'),
            });
        });
        child.on('error', (error) => {
            resolve({ code: 1, stdout: '', stderr: String(error?.message || error) });
        });
    });
}

async function isPortFree(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', () => resolve(false));
        server.once('listening', () => {
            server.close(() => resolve(true));
        });
        server.listen(port, '127.0.0.1');
    });
}

async function findAvailablePort(startPort, maxAttempts = 80) {
    for (let offset = 0; offset < maxAttempts; offset += 1) {
        const candidate = startPort + offset;
        // eslint-disable-next-line no-await-in-loop
        const free = await isPortFree(candidate);
        if (free) return candidate;
    }
    throw new Error(`No free port found after ${maxAttempts} attempts from ${startPort}`);
}

async function waitForUrl(url, timeoutMs = 140_000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 2_000);
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timer);
            if (response.ok) return true;
        } catch {
            // retry
        }
        // eslint-disable-next-line no-await-in-loop
        await sleep(1_000);
    }
    return false;
}

async function killProcess(child) {
    if (!child || !child.pid || child.killed) return;
    if (IS_WIN) {
        await runCmd('taskkill', ['/pid', String(child.pid), '/T', '/F']);
        return;
    }
    child.kill('SIGTERM');
    await Promise.race([
        new Promise((resolve) => child.once('close', resolve)),
        sleep(5_000),
    ]);
}

function parseJsonFromMixedOutput(raw) {
    const trimmed = String(raw || '').trim();
    if (!trimmed) return null;
    try {
        return JSON.parse(trimmed);
    } catch {
        // continue
    }
    const first = trimmed.indexOf('{');
    const last = trimmed.lastIndexOf('}');
    if (first >= 0 && last > first) {
        const candidate = trimmed.slice(first, last + 1);
        try {
            return JSON.parse(candidate);
        } catch {
            return null;
        }
    }
    return null;
}

function collectTestEntries(playwrightJson) {
    const entries = [];

    function visitSuite(suite, parents) {
        const nextParents = suite?.title ? [...parents, suite.title] : parents;
        const specs = Array.isArray(suite?.specs) ? suite.specs : [];
        for (const spec of specs) {
            const titlePath = [...nextParents, spec.title].filter(Boolean).join(' > ');
            const tests = Array.isArray(spec.tests) ? spec.tests : [];
            for (const testItem of tests) {
                const results = Array.isArray(testItem.results) ? testItem.results : [];
                const lastResult = results[results.length - 1] || {};
                const status = String(lastResult.status || testItem.status || 'unknown');
                const errors = [];
                for (const result of results) {
                    if (Array.isArray(result.errors)) {
                        for (const err of result.errors) {
                            if (err?.message) errors.push(String(err.message));
                        }
                    }
                    if (result?.error?.message) errors.push(String(result.error.message));
                }
                const attachments = [];
                for (const result of results) {
                    if (Array.isArray(result.attachments)) {
                        for (const attachment of result.attachments) {
                            if (attachment?.path) attachments.push(String(attachment.path));
                        }
                    }
                }

                entries.push({
                    file: String(spec.file || suite.file || ''),
                    title: titlePath || String(testItem.title || spec.title || 'Unnamed test'),
                    status,
                    errors,
                    attachments,
                });
            }
        }

        const suites = Array.isArray(suite?.suites) ? suite.suites : [];
        for (const child of suites) {
            visitSuite(child, nextParents);
        }
    }

    const suites = Array.isArray(playwrightJson?.suites) ? playwrightJson.suites : [];
    for (const suite of suites) {
        visitSuite(suite, []);
    }
    return entries;
}

function summarizeEntries(entries) {
    const summary = {
        total: entries.length,
        passed: 0,
        failed: 0,
        skipped: 0,
        other: 0,
    };
    for (const entry of entries) {
        if (entry.status === 'passed') summary.passed += 1;
        else if (entry.status === 'failed' || entry.status === 'timedOut' || entry.status === 'interrupted') summary.failed += 1;
        else if (entry.status === 'skipped') summary.skipped += 1;
        else summary.other += 1;
    }
    return summary;
}

function inferSeverity(entry, passId) {
    const text = `${entry.errors?.join('\n') || ''}`.toLowerCase();
    if (entry.status === 'timedOut' || text.includes('status 500') || text.includes('critical')) return 'Critical';
    if (passId === 'pass4-cross-role' || text.includes('forbidden') || text.includes('unauthorized') || text.includes('permission')) return 'High';
    if (text.includes('overflow') || text.includes('theme') || text.includes('visual')) return 'Medium';
    return 'Low';
}

function inferModule(entry) {
    const f = path.basename(entry.file || '').toLowerCase();
    if (f.includes('public') || f.includes('home')) return 'Public';
    if (f.includes('student') || f.includes('exam')) return 'Student';
    if (f.includes('admin') || f.includes('finance') || f.includes('qbank')) return 'Admin';
    if (f.includes('permission') || f.includes('auth')) return 'Access Control';
    if (f.includes('import') || f.includes('export') || f.includes('bulk')) return 'Data Operations';
    return 'General';
}

function inferRoute(entry) {
    const match = String(entry.title || '').match(/\/[a-z0-9/_-]+/i);
    return match ? match[0] : 'N/A';
}

function makeBugLedger(passReports) {
    const bugs = [];
    const failedByKey = new Map();
    let counter = 1;

    for (const passReport of passReports) {
        for (const entry of passReport.entries) {
            if (!(entry.status === 'failed' || entry.status === 'timedOut' || entry.status === 'interrupted')) continue;
            const key = `${entry.file}::${entry.title}`;
            failedByKey.set(key, entry);
            bugs.push({
                bugId: `CW-BUG-${String(counter).padStart(4, '0')}`,
                key,
                role: passReport.role,
                module: inferModule(entry),
                routeOrPage: inferRoute(entry),
                mcpToolUsed: 'Playwright MCP + Filesystem + Mongo fallback',
                severity: inferSeverity(entry, passReport.id),
                stepsToReproduce: `Run ${passReport.id} and execute test "${entry.title}"`,
                expectedResult: 'Test assertion should pass and flow should remain stable.',
                actualResult: entry.errors?.[0] || `Test failed with status=${entry.status}`,
                screenshotOrTrace: entry.attachments?.[0] || 'N/A',
                dbEvidence: passReport.dbEvidencePath || 'N/A',
                fixed: 'No',
                retested: 'No',
            });
            counter += 1;
        }
    }

    const regression = passReports.find((report) => report.id === 'pass5-regression');
    if (regression) {
        const passedKeys = new Set(
            regression.entries
                .filter((entry) => entry.status === 'passed')
                .map((entry) => `${entry.file}::${entry.title}`),
        );
        for (const bug of bugs) {
            if (passedKeys.has(bug.key)) {
                bug.fixed = 'Yes';
                bug.retested = 'Yes';
            }
        }
    }

    return bugs;
}

function renderBugMarkdown(bugs) {
    if (!bugs.length) {
        return [
            '# CampusWay Role QA Bug Ledger',
            '',
            'No failing tests were detected across executed passes.',
            '',
        ].join('\n');
    }

    const lines = [
        '# CampusWay Role QA Bug Ledger',
        '',
        '| Bug ID | Role | Module | Route/Page | Severity | Fixed | Retested |',
        '|---|---|---|---|---|---|---|',
        ...bugs.map((bug) => `| ${bug.bugId} | ${bug.role} | ${bug.module} | ${bug.routeOrPage} | ${bug.severity} | ${bug.fixed} | ${bug.retested} |`),
        '',
    ];

    for (const bug of bugs) {
        lines.push(`## ${bug.bugId}`);
        lines.push(`- Role: ${bug.role}`);
        lines.push(`- Module: ${bug.module}`);
        lines.push(`- Route/Page: ${bug.routeOrPage}`);
        lines.push(`- MCP tool used: ${bug.mcpToolUsed}`);
        lines.push(`- Severity: ${bug.severity}`);
        lines.push(`- Steps to reproduce: ${bug.stepsToReproduce}`);
        lines.push(`- Expected result: ${bug.expectedResult}`);
        lines.push(`- Actual result: ${bug.actualResult}`);
        lines.push(`- Screenshot / trace: ${bug.screenshotOrTrace}`);
        lines.push(`- DB evidence: ${bug.dbEvidence}`);
        lines.push(`- Fixed?: ${bug.fixed}`);
        lines.push(`- Retested?: ${bug.retested}`);
        lines.push('');
    }
    return lines.join('\n');
}

async function ensureDir(p) {
    await fs.mkdir(p, { recursive: true });
}

async function runPlaywrightPass(passDef, env, passDir) {
    const jsonPath = path.join(passDir, 'playwright.json');
    const logPath = path.join(passDir, 'playwright.log');
    const args = [
        'playwright',
        'test',
        ...passDef.specs,
        '--project=chromium-desktop',
        '--workers=1',
        '--reporter=json',
    ];
    const result = await runCmd(NPX, args, { cwd: WORK_DIR, env });
    const rawCombined = `${result.stdout}\n${result.stderr}`.trim();
    await fs.writeFile(logPath, rawCombined, 'utf-8');

    const parsed = parseJsonFromMixedOutput(result.stdout) || parseJsonFromMixedOutput(rawCombined) || {};
    await fs.writeFile(jsonPath, JSON.stringify(parsed, null, 2), 'utf-8');

    const entries = collectTestEntries(parsed);
    const summary = summarizeEntries(entries);
    return {
        code: result.code,
        entries,
        summary,
        logPath,
        jsonPath,
    };
}

async function runDbEvidence(passDef, env, passDir) {
    const outPath = path.join(passDir, 'db-evidence.json');
    const cmd = await runCmd(
        NPM,
        ['--prefix', BACKEND_DIR, 'run', 'e2e:db-evidence'],
        {
            cwd: WORK_DIR,
            env: {
                ...env,
                E2E_EVIDENCE_LABEL: passDef.id,
                MONGODB_URI: MONGODB_URI,
                MONGO_URI: MONGODB_URI,
            },
        },
    );
    const parsed = parseJsonFromMixedOutput(cmd.stdout) || parseJsonFromMixedOutput(`${cmd.stdout}\n${cmd.stderr}`) || {
        ok: false,
        message: 'Unable to parse DB evidence output',
        stdout: cmd.stdout,
        stderr: cmd.stderr,
    };
    await fs.writeFile(outPath, JSON.stringify(parsed, null, 2), 'utf-8');
    return { path: outPath, code: cmd.code };
}

async function dropIsolatedDatabase(uri) {
    const drop = await runCmd('mongosh', [uri, '--quiet', '--eval', 'db.dropDatabase()'], { cwd: WORK_DIR });
    return drop.code === 0;
}

async function main() {
    await ensureDir(OUT_DIR);
    const passReports = [];
    const warnings = [];
    const selectedPasses = pickPasses();
    if (!selectedPasses.length) {
        throw new Error('No passes selected. Set E2E_ROLE_QA_PASSES with valid pass IDs.');
    }

    const backendPort = await findAvailablePort(START_BACKEND_PORT);
    const frontendPort = await findAvailablePort(START_FRONTEND_PORT);
    const backendOrigin = `http://127.0.0.1:${backendPort}`;
    const baseUrl = `http://127.0.0.1:${frontendPort}`;
    const backendHealthUrl = `${backendOrigin}/api/health`;

    const backendLogChunks = [];
    const frontendLogChunks = [];
    let backendProcess = null;
    let frontendProcess = null;
    let prepareOk = false;

    try {
        backendProcess = spawnCmd(
            NPM,
            ['run', 'dev'],
            {
                cwd: BACKEND_DIR,
                env: {
                    ...process.env,
                    PORT: String(backendPort),
                    MONGODB_URI: MONGODB_URI,
                    MONGO_URI: MONGODB_URI,
                    FRONTEND_URL: baseUrl,
                    CORS_ORIGIN: baseUrl,
                    E2E_DISABLE_RATE_LIMIT: 'true',
                },
            },
        );
        backendProcess.stdout?.on('data', (chunk) => backendLogChunks.push(chunk));
        backendProcess.stderr?.on('data', (chunk) => backendLogChunks.push(chunk));

        const backendReady = await waitForUrl(backendHealthUrl, 180_000);
        if (!backendReady) throw new Error(`Backend did not become healthy: ${backendHealthUrl}`);

        frontendProcess = spawnCmd(
            NPM,
            ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(frontendPort)],
            {
                cwd: WORK_DIR,
                env: {
                    ...process.env,
                    VITE_API_PROXY_TARGET: backendOrigin,
                    VITE_PORT: String(frontendPort),
                },
            },
        );
        frontendProcess.stdout?.on('data', (chunk) => frontendLogChunks.push(chunk));
        frontendProcess.stderr?.on('data', (chunk) => frontendLogChunks.push(chunk));

        const frontendReady = await waitForUrl(baseUrl, 180_000);
        if (!frontendReady) throw new Error(`Frontend did not become healthy: ${baseUrl}`);

        const prepare = await runCmd(
            NPM,
            ['--prefix', BACKEND_DIR, 'run', 'e2e:prepare'],
            {
                cwd: WORK_DIR,
                env: {
                    ...process.env,
                    MONGODB_URI: MONGODB_URI,
                    MONGO_URI: MONGODB_URI,
                    E2E_BASE_URL: baseUrl,
                    E2E_API_BASE_URL: backendOrigin,
                    E2E_DISABLE_RATE_LIMIT: 'true',
                },
            },
        );
        await fs.writeFile(path.join(OUT_DIR, 'e2e-prepare.log'), `${prepare.stdout}\n${prepare.stderr}`, 'utf-8');
        if (prepare.code !== 0) throw new Error('backend e2e:prepare failed');
        prepareOk = true;

        for (const passDef of selectedPasses) {
            const passDir = path.join(OUT_DIR, passDef.id);
            await ensureDir(passDir);

            const env = {
                ...process.env,
                E2E_BASE_URL: baseUrl,
                E2E_API_BASE_URL: backendOrigin,
                E2E_DISABLE_RATE_LIMIT: 'true',
                MONGODB_URI: MONGODB_URI,
                MONGO_URI: MONGODB_URI,
                E2E_RUN_LABEL: passDef.id,
            };

            const play = await runPlaywrightPass(passDef, env, passDir);
            const dbEvidence = await runDbEvidence(passDef, env, passDir);

            const report = {
                id: passDef.id,
                title: passDef.title,
                role: passDef.role,
                summary: play.summary,
                code: play.code,
                entries: play.entries,
                logPath: play.logPath,
                resultPath: play.jsonPath,
                dbEvidencePath: dbEvidence.path,
            };
            passReports.push(report);

            await fs.writeFile(path.join(passDir, 'pass-summary.json'), JSON.stringify(report, null, 2), 'utf-8');
            if (play.code !== 0) {
                warnings.push(`${passDef.id} returned non-zero exit code (${play.code}).`);
            }
        }
    } finally {
        if (prepareOk) {
            const restore = await runCmd(
                NPM,
                ['--prefix', BACKEND_DIR, 'run', 'e2e:restore'],
                {
                    cwd: WORK_DIR,
                    env: {
                        ...process.env,
                        MONGODB_URI: MONGODB_URI,
                        MONGO_URI: MONGODB_URI,
                    },
                },
            );
            await fs.writeFile(path.join(OUT_DIR, 'e2e-restore.log'), `${restore.stdout}\n${restore.stderr}`, 'utf-8');
            if (restore.code !== 0) warnings.push('backend e2e:restore returned non-zero exit code.');
        }

        const dropped = await dropIsolatedDatabase(MONGODB_URI);
        if (!dropped) warnings.push('Isolated DB drop skipped (mongosh unavailable or failed).');

        await killProcess(frontendProcess);
        await killProcess(backendProcess);
        await fs.writeFile(path.join(OUT_DIR, 'backend.log'), Buffer.concat(backendLogChunks).toString('utf-8'), 'utf-8');
        await fs.writeFile(path.join(OUT_DIR, 'frontend.log'), Buffer.concat(frontendLogChunks).toString('utf-8'), 'utf-8');
    }

    const bugs = makeBugLedger(passReports);
    const bugJsonPath = path.join(OUT_DIR, 'bug-ledger.json');
    const bugMdPath = path.join(OUT_DIR, 'bug-ledger.md');
    await fs.writeFile(bugJsonPath, JSON.stringify(bugs, null, 2), 'utf-8');
    await fs.writeFile(bugMdPath, renderBugMarkdown(bugs), 'utf-8');

    const passSummaryRows = passReports.map((report) => ({
        passId: report.id,
        role: report.role,
        total: report.summary.total,
        passed: report.summary.passed,
        failed: report.summary.failed,
        skipped: report.summary.skipped,
        other: report.summary.other,
    }));

    const totals = passSummaryRows.reduce(
        (acc, row) => ({
            total: acc.total + row.total,
            passed: acc.passed + row.passed,
            failed: acc.failed + row.failed,
            skipped: acc.skipped + row.skipped,
            other: acc.other + row.other,
        }),
        { total: 0, passed: 0, failed: 0, skipped: 0, other: 0 },
    );

    const summary = {
        runId: RUN_ID,
        baseUrl: `http://127.0.0.1:${frontendPort}`,
        apiBaseUrl: `http://127.0.0.1:${backendPort}`,
        dbName: DB_NAME,
        outputDir: OUT_DIR,
        passes: passSummaryRows,
        totals,
        bugCount: bugs.length,
        openCriticalOrHigh: bugs.filter((bug) => bug.severity === 'Critical' || bug.severity === 'High').length,
        warnings,
    };

    await fs.writeFile(path.join(OUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2), 'utf-8');
    await fs.writeFile(
        path.join(OUT_DIR, 'summary.md'),
        [
            `# CampusWay Full Role QA Summary (${RUN_ID})`,
            '',
            `- Base URL: ${summary.baseUrl}`,
            `- API Base URL: ${summary.apiBaseUrl}`,
            `- DB Name: ${summary.dbName}`,
            `- Bug Ledger JSON: ${path.relative(OUT_DIR, bugJsonPath).replace(/\\/g, '/')}`,
            `- Bug Ledger MD: ${path.relative(OUT_DIR, bugMdPath).replace(/\\/g, '/')}`,
            '',
            '| Pass | Role | Total | Passed | Failed | Skipped | Other |',
            '|---|---|---:|---:|---:|---:|---:|',
            ...summary.passes.map((row) => `| ${row.passId} | ${row.role} | ${row.total} | ${row.passed} | ${row.failed} | ${row.skipped} | ${row.other} |`),
            '',
            `- Total tests: ${summary.totals.total}`,
            `- Total failed: ${summary.totals.failed}`,
            `- Bugs logged: ${summary.bugCount}`,
            `- Open Critical/High bugs: ${summary.openCriticalOrHigh}`,
            '',
            '## Warnings',
            ...(warnings.length ? warnings.map((warning) => `- ${warning}`) : ['- None']),
            '',
        ].join('\n'),
        'utf-8',
    );

    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    process.exitCode = summary.totals.failed > 0 || summary.openCriticalOrHigh > 0 ? 1 : 0;
}

main().catch((error) => {
    process.stderr.write(`[role-full-qa-run] fatal: ${String(error?.message || error)}\n`);
    process.exitCode = 1;
});

