import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock3, Download, Trophy } from "lucide-react";
import { examPdfUrls } from "../../api/examApi";
import { useExamResult, useExamSolutions, usePdfAvailability } from "../../hooks/useExamQueries";

const lastSessionKey = (examId: string) => `cw_exam_last_session_${examId}`;

function formatDuration(totalSeconds: number): string {
    const safe = Math.max(0, totalSeconds);
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = safe % 60;
    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
}

function formatDateTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "TBA";
    return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export const ExamResultPage = () => {
    const { examId = "" } = useParams();
    const [searchParams] = useSearchParams();
    const [tick, setTick] = useState(Date.now());
    const [serverOffsetMs, setServerOffsetMs] = useState(0);

    const sessionId =
        searchParams.get("sessionId") ||
        (typeof window !== "undefined" ? window.localStorage.getItem(lastSessionKey(examId)) : "") ||
        "";

    const resultQuery = useExamResult(examId, sessionId, Boolean(examId && sessionId));
    const solutionsQuery = useExamSolutions(examId, sessionId, Boolean(examId && sessionId));
    const questionsPdfQuery = usePdfAvailability(examPdfUrls.questions(examId), Boolean(examId));
    const solutionsPdfQuery = usePdfAvailability(examPdfUrls.solutions(examId), Boolean(examId));
    const answersPdfQuery = usePdfAvailability(examPdfUrls.answers(examId, sessionId), Boolean(examId && sessionId));

    useEffect(() => {
        const timer = window.setInterval(() => setTick(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        if (resultQuery.data?.status !== "locked") return;
        const serverNowMs = new Date(resultQuery.data.serverNowUTC).getTime();
        if (!Number.isFinite(serverNowMs)) return;
        setServerOffsetMs(serverNowMs - Date.now());
    }, [resultQuery.data]);

    const countdownLabel = useMemo(() => {
        if (resultQuery.data?.status !== "locked") return null;
        const publishAt = new Date(resultQuery.data.publishAtUTC).getTime();
        const now = tick + serverOffsetMs;
        const remaining = Math.max(0, Math.floor((publishAt - now) / 1000));
        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }, [resultQuery.data, serverOffsetMs, tick]);

    if (!sessionId) {
        return (
            <div className="section-container py-8">
                <div className="card-flat p-6 text-sm text-text-muted dark:text-dark-text/70">
                    No exam session found for this result. Start an exam first from <Link to="/exams" className="text-primary underline">/exams</Link>.
                </div>
            </div>
        );
    }

    if (resultQuery.isLoading) {
        return (
            <div className="section-container py-8">
                <div className="card-flat animate-pulse p-6">
                    <div className="h-6 w-40 rounded bg-slate-200/70 dark:bg-slate-800/70" />
                </div>
            </div>
        );
    }

    if (resultQuery.isError || !resultQuery.data) {
        return (
            <div className="section-container py-8">
                <div className="card-flat p-6 text-sm text-danger">Failed to load exam result.</div>
            </div>
        );
    }

    if (resultQuery.data.status === "locked") {
        return (
            <div className="section-container py-8">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-flat mx-auto max-w-xl p-6">
                    <div className="inline-flex items-center gap-2 rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold text-warning">
                        <Clock3 className="h-3.5 w-3.5" />
                        Result Locked
                    </div>
                    <h1 className="mt-3 text-xl font-semibold text-text dark:text-dark-text">Result not published yet</h1>
                    <p className="mt-2 text-sm text-text-muted dark:text-dark-text/70">
                        Publish time: {formatDateTime(resultQuery.data.publishAtUTC)}
                    </p>
                    <p className="mt-3 text-lg font-mono font-semibold text-text dark:text-dark-text">{countdownLabel}</p>
                </motion.div>
            </div>
        );
    }

    const result = resultQuery.data;
    const solutionsReady = solutionsQuery.data?.status === "available";

    return (
        <div className="section-container py-6 sm:py-8">
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-flat p-5 sm:p-6">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                    <Trophy className="h-3.5 w-3.5" />
                    Result Published
                </div>
                <h1 className="text-2xl font-bold text-text dark:text-dark-text">
                    Score: {result.obtainedMarks}/{result.totalMarks}
                </h1>
                <p className="mt-1 text-sm text-text-muted dark:text-dark-text/70">Percentage: {result.percentage}%</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-card-border p-3 text-sm">Correct: {result.correctCount}</div>
                    <div className="rounded-xl border border-card-border p-3 text-sm">Wrong: {result.wrongCount}</div>
                    <div className="rounded-xl border border-card-border p-3 text-sm">Skipped: {result.skippedCount}</div>
                    <div className="rounded-xl border border-card-border p-3 text-sm">
                        Time Taken: {formatDuration(result.timeTakenSeconds)}
                    </div>
                </div>
                {typeof result.rank === "number" ? (
                    <p className="mt-3 text-sm font-semibold text-primary">Rank: #{result.rank}</p>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-2">
                    <Link to={`/exam/${examId}/solutions?sessionId=${sessionId}`} className="btn-primary">
                        View Solutions
                    </Link>
                    {questionsPdfQuery.data ? (
                        <a href={examPdfUrls.questions(examId)} className="btn-secondary">
                            <Download className="mr-1.5 h-4 w-4" />
                            Questions PDF
                        </a>
                    ) : null}
                    {solutionsPdfQuery.data ? (
                        <a href={examPdfUrls.solutions(examId)} className="btn-secondary">
                            <Download className="mr-1.5 h-4 w-4" />
                            Solutions PDF
                        </a>
                    ) : null}
                    {answersPdfQuery.data ? (
                        <a href={examPdfUrls.answers(examId, sessionId)} className="btn-secondary">
                            <Download className="mr-1.5 h-4 w-4" />
                            My Answers PDF
                        </a>
                    ) : null}
                </div>
                {!solutionsReady ? (
                    <p className="mt-3 text-xs text-text-muted dark:text-dark-text/60">
                        Solutions may remain locked until backend release policy allows it.
                    </p>
                ) : null}
            </motion.section>
        </div>
    );
};
