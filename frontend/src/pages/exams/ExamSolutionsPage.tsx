import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock3, Download } from "lucide-react";
import { examPdfUrls } from "../../api/examApi";
import { useExamSolutions, usePdfAvailability } from "../../hooks/useExamQueries";
import type { OptionKey, RunnerCache } from "../../types/exam";

type FilterKey = "All" | "Wrong" | "Correct" | "Skipped" | "Marked";

const filterTabs: FilterKey[] = ["All", "Wrong", "Correct", "Skipped", "Marked"];
const lastSessionKey = (examId: string) => `cw_exam_last_session_${examId}`;
const runnerCacheKey = (examId: string, sessionId: string) => `cw_exam_${examId}_${sessionId}`;

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

export const ExamSolutionsPage = () => {
    const { examId = "" } = useParams();
    const [searchParams] = useSearchParams();
    const [filter, setFilter] = useState<FilterKey>("All");
    const [tick, setTick] = useState(Date.now());
    const [serverOffsetMs, setServerOffsetMs] = useState(0);
    const [markedQuestionIds, setMarkedQuestionIds] = useState<Set<string>>(new Set());

    const sessionId =
        searchParams.get("sessionId") ||
        (typeof window !== "undefined" ? window.localStorage.getItem(lastSessionKey(examId)) : "") ||
        "";

    const query = useExamSolutions(examId, sessionId, Boolean(examId && sessionId));
    const solutionsPdfQuery = usePdfAvailability(examPdfUrls.solutions(examId), Boolean(examId));

    useEffect(() => {
        const timer = window.setInterval(() => setTick(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!examId || !sessionId || typeof window === "undefined") return;
        const raw = window.localStorage.getItem(runnerCacheKey(examId, sessionId));
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw) as RunnerCache;
            setMarkedQuestionIds(new Set(parsed.markedQuestionIds ?? []));
        } catch {
            setMarkedQuestionIds(new Set());
        }
    }, [examId, sessionId]);

    useEffect(() => {
        if (query.data?.status !== "locked") return;
        const serverNowMs = new Date(query.data.serverNowUTC).getTime();
        if (!Number.isFinite(serverNowMs)) return;
        setServerOffsetMs(serverNowMs - Date.now());
    }, [query.data]);

    const filtered = useMemo(() => {
        if (query.data?.status !== "available") return [];
        return query.data.items.filter((item) => {
            const selected = item.selectedKey;
            const correct = item.correctKey;
            if (filter === "All") return true;
            if (filter === "Wrong") return selected !== null && selected !== correct;
            if (filter === "Correct") return selected === correct;
            if (filter === "Skipped") return selected === null;
            return markedQuestionIds.has(item.questionId);
        });
    }, [filter, markedQuestionIds, query.data]);

    const lockedCountdown = useMemo(() => {
        if (query.data?.status !== "locked") return null;
        const publishAtMs = new Date(query.data.publishAtUTC).getTime();
        const nowMs = tick + serverOffsetMs;
        const remaining = Math.max(0, Math.floor((publishAtMs - nowMs) / 1000));
        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }, [query.data, serverOffsetMs, tick]);

    if (!sessionId) {
        return (
            <div className="section-container py-8">
                <div className="card-flat p-6 text-sm text-text-muted dark:text-dark-text/70">
                    No session found for solutions.
                </div>
            </div>
        );
    }

    if (query.isLoading) {
        return (
            <div className="section-container py-8">
                <div className="card-flat animate-pulse p-6">
                    <div className="h-6 w-40 rounded bg-slate-200/70 dark:bg-slate-800/70" />
                </div>
            </div>
        );
    }

    if (query.isError || !query.data) {
        return (
            <div className="section-container py-8">
                <div className="card-flat p-6 text-sm text-danger">Failed to load solutions.</div>
            </div>
        );
    }

    if (query.data.status === "locked") {
        return (
            <div className="section-container py-8">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-flat mx-auto max-w-xl p-6">
                    <div className="inline-flex items-center gap-2 rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold text-warning">
                        <Clock3 className="h-3.5 w-3.5" />
                        Solutions Locked
                    </div>
                    <p className="mt-3 text-sm text-text-muted dark:text-dark-text/70">
                        {query.data.reason} - Release at {formatDateTime(query.data.publishAtUTC)}
                    </p>
                    <p className="mt-2 font-mono text-lg font-semibold text-text dark:text-dark-text">{lockedCountdown}</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="section-container py-6 sm:py-8">
            <div className="mb-4 flex flex-wrap items-center gap-2">
                {filterTabs.map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setFilter(tab)}
                        className={filter === tab ? "tab-pill-active" : "tab-pill-inactive"}
                    >
                        {tab}
                    </button>
                ))}
                {solutionsPdfQuery.data ? (
                    <a href={examPdfUrls.solutions(examId)} className="btn-secondary ml-auto">
                        <Download className="mr-1.5 h-4 w-4" />
                        Solutions PDF
                    </a>
                ) : null}
            </div>

            <div className="space-y-3">
                {filtered.map((item, index) => {
                    const isCorrect = item.selectedKey === item.correctKey;
                    const isSkipped = item.selectedKey === null;
                    const selected = (item.selectedKey ?? "Skipped") as OptionKey | "Skipped";
                    return (
                        <motion.article
                            key={item.questionId}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card-flat p-4 sm:p-5"
                        >
                            <p className="text-sm font-semibold text-text dark:text-dark-text">
                                Q{index + 1}. {item.questionText}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                <span className="badge-primary">Selected: {selected}</span>
                                <span className="badge-success">Correct: {item.correctKey}</span>
                                {!isSkipped && !isCorrect ? <span className="badge-danger">Wrong</span> : null}
                                {isSkipped ? <span className="badge-warning">Skipped</span> : null}
                                {markedQuestionIds.has(item.questionId) ? <span className="badge-warning">Marked</span> : null}
                            </div>
                            {item.explanationText ? (
                                <p className="mt-3 text-sm text-text-muted dark:text-dark-text/75">{item.explanationText}</p>
                            ) : null}
                            {item.questionImageUrl ? (
                                <img
                                    src={item.questionImageUrl}
                                    alt={`Question ${index + 1}`}
                                    className="mt-3 max-h-72 w-full rounded-xl border border-card-border object-contain"
                                    loading="lazy"
                                />
                            ) : null}
                            {item.explanationImageUrl ? (
                                <img
                                    src={item.explanationImageUrl}
                                    alt={`Explanation ${index + 1}`}
                                    className="mt-3 max-h-72 w-full rounded-xl border border-card-border object-contain"
                                    loading="lazy"
                                />
                            ) : null}
                        </motion.article>
                    );
                })}
                {filtered.length === 0 ? (
                    <div className="card-flat p-6 text-sm text-text-muted dark:text-dark-text/70">
                        No items found for the selected filter.
                    </div>
                ) : null}
            </div>
        </div>
    );
};
