
import {
    GraduationCap, BookOpen, Users, TrendingUp, Calendar,
    Activity, Clock, CheckCircle, Server,
} from 'lucide-react';

interface DashboardHomeProps {
    universities: Array<Record<string, any>>;
    exams: Array<Record<string, any>>;
    users: Array<Record<string, any>>;
    onTabChange: (tab: string) => void;
}

export default function DashboardHome({ universities, exams, users, onTabChange }: DashboardHomeProps) {
    const upcomingExams = exams.filter(e => !e.isPublished).length;
    const activeStudents = users.filter(u => String(u.role) === 'student' && u.isActive).length;

    const stats = [
        { label: 'Total Universities', value: universities.length, icon: GraduationCap, gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-500/10' },
        { label: 'Total Exams', value: exams.length, icon: BookOpen, gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-500/10' },
        { label: 'Total Students', value: activeStudents, icon: Users, gradient: 'from-purple-500 to-fuchsia-600', bg: 'bg-purple-500/10' },
        { label: 'Upcoming Exams', value: upcomingExams, icon: Calendar, gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-500/10' },
    ];

    /* Simple bar chart data */
    const chartData = [
        { label: 'Mon', value: Math.floor(Math.random() * 50) + 10 },
        { label: 'Tue', value: Math.floor(Math.random() * 50) + 10 },
        { label: 'Wed', value: Math.floor(Math.random() * 50) + 10 },
        { label: 'Thu', value: Math.floor(Math.random() * 50) + 10 },
        { label: 'Fri', value: Math.floor(Math.random() * 50) + 10 },
        { label: 'Sat', value: Math.floor(Math.random() * 50) + 10 },
        { label: 'Sun', value: Math.floor(Math.random() * 50) + 10 },
    ];
    const maxVal = Math.max(...chartData.map(d => d.value));

    const recentActivities = [
        { text: 'New university added', time: '2 min ago', type: 'success' },
        { text: 'Exam "Physics MCQ" published', time: '15 min ago', type: 'info' },
        { text: 'Student registered', time: '1 hour ago', type: 'default' },
        { text: 'System backup completed', time: '3 hours ago', type: 'success' },
        { text: 'Failed login attempt detected', time: '5 hours ago', type: 'warning' },
    ];

    return (
        <div className="space-y-6">
            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {stats.map(s => (
                    <div
                        key={s.label}
                        className="group relative bg-slate-900/60 backdrop-blur-sm rounded-2xl p-5 border border-indigo-500/10 hover:border-indigo-500/25 transition-all duration-300 overflow-hidden"
                    >
                        {/* Glow effect */}
                        <div className={`absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br ${s.gradient} rounded-full opacity-10 group-hover:opacity-20 blur-xl transition-opacity`} />
                        <div className="flex items-center justify-between mb-3 relative">
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg`}>
                                <s.icon className="w-5 h-5 text-white" />
                            </div>
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                        </div>
                        <p className="text-3xl font-bold text-white relative">{s.value}</p>
                        <p className="text-sm text-slate-400 mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* ── Charts + Activity ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Exam Participation Chart */}
                <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-sm rounded-2xl p-5 border border-indigo-500/10">
                    <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        Exam Participation (This Week)
                    </h3>
                    <div className="flex items-end gap-3 h-40">
                        {chartData.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[10px] text-slate-500">{d.value}</span>
                                <div
                                    className="w-full bg-gradient-to-t from-indigo-600 to-cyan-500 rounded-t-lg transition-all duration-500 hover:opacity-80"
                                    style={{ height: `${(d.value / maxVal) * 100}%`, minHeight: '8px' }}
                                />
                                <span className="text-[10px] text-slate-400">{d.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-5 border border-indigo-500/10">
                    <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        Recent Activity
                    </h3>
                    <div className="space-y-3">
                        {recentActivities.map((a, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${a.type === 'success' ? 'bg-emerald-400' :
                                    a.type === 'warning' ? 'bg-amber-400' :
                                        a.type === 'info' ? 'bg-cyan-400' : 'bg-slate-500'
                                    }`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white">{a.text}</p>
                                    <p className="text-[10px] text-slate-500">{a.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── System Health + Quick Links ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* System Health */}
                <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-5 border border-indigo-500/10">
                    <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                        <Server className="w-4 h-4 text-cyan-400" />
                        System Health
                    </h3>
                    <div className="space-y-3">
                        {[
                            { label: 'API Server', status: 'online', icon: CheckCircle },
                            { label: 'Database (MongoDB)', status: 'online', icon: CheckCircle },
                            { label: 'File Storage', status: 'online', icon: CheckCircle },
                        ].map(s => (
                            <div key={s.label} className="flex items-center justify-between bg-slate-950/65 rounded-xl px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <s.icon className="w-4 h-4 text-emerald-400" />
                                    <span className="text-sm text-white">{s.label}</span>
                                </div>
                                <span className="text-[10px] uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">
                                    {s.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Navigation */}
                <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-5 border border-indigo-500/10">
                    <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                        <TrendingUp className="w-4 h-4 text-cyan-400" />
                        Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Universities', count: universities.length, tab: 'universities', gradient: 'from-blue-500 to-indigo-600' },
                            { label: 'Exams', count: exams.length, tab: 'exams', gradient: 'from-emerald-500 to-teal-600' },
                            { label: 'Users', count: users.length, tab: 'users', gradient: 'from-purple-500 to-fuchsia-600' },
                            { label: 'Banners', count: '—', tab: 'banners', gradient: 'from-amber-500 to-orange-600' },
                        ].map(q => (
                            <button
                                key={q.tab}
                                onClick={() => onTabChange(q.tab)}
                                className="bg-slate-950/65 hover:bg-white/5 rounded-xl p-4 text-left transition-colors group border border-transparent hover:border-indigo-500/15"
                            >
                                <p className="text-2xl font-bold text-white">{q.count}</p>
                                <p className="text-xs text-slate-400 group-hover:text-indigo-300 transition-colors">{q.label} →</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
