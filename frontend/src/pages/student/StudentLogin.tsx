import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { GraduationCap, ArrowRight, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getOauthProviders, startOauthProvider } from '../../services/api';

export default function StudentLogin() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const oauthQuery = useQuery({
        queryKey: ['oauth-providers'],
        queryFn: async () => (await getOauthProviders()).data,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await login(identifier, password);
            if (res.requires2fa) {
                navigate('/otp-verify?from=student');
                return;
            }

            toast.success('Welcome back!');
            const target = res.user.role === 'student' ? '/student/dashboard' : '/campusway-secure-admin';
            navigate(target);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const handleOauth = async (provider: 'google' | 'apple' | 'twitter') => {
        try {
            const { data } = await startOauthProvider(provider);
            if ((data as any)?.redirectUrl) {
                window.location.href = (data as any).redirectUrl;
                return;
            }
            toast((data as any)?.message || `${provider} sign-in is not available right now`);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || `${provider} sign-in failed`);
        }
    };

    const providers = oauthQuery.data?.providers || [];

    return (
        <div className="min-h-screen flex selection:bg-indigo-500 selection:text-white bg-white dark:bg-[#061226]">
            {/* Left side: Form */}
            <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:flex-none lg:w-[540px] xl:w-[620px] relative z-10 bg-white/80 dark:bg-[#061226]/80 backdrop-blur-xl border-r border-slate-100 dark:border-white/5 shadow-2xl">
                <div className="w-full max-w-md mx-auto">
                    <div className="mb-12">
                        <Link to="/" className="inline-flex items-center gap-3 mb-10 group transition-transform hover:scale-105 duration-300">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-[0_15px_30px_-10px_rgba(79,70,229,0.5)] group-hover:shadow-indigo-500/50 transition-all duration-500">
                                <GraduationCap className="w-6 h-6" />
                            </div>
                            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white font-heading">
                                Campus<span className="text-indigo-600 dark:text-indigo-400">Way</span>
                            </span>
                        </Link>

                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4 animate-in fade-in slide-in-from-left-4">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Student Access Point</span>
                        </div>

                        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2 leading-tight">
                            Elevate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">Future</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            Join the next generation of academic pioneers.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-5">
                            <div className="group">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-indigo-500 transition-colors">Credential ID</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        className="w-full h-14 px-5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold"
                                        placeholder="Email or Application ID"
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <div className="flex items-center justify-between mb-2 ml-1">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest group-focus-within:text-indigo-500 transition-colors">Secure Key</label>
                                    <Link to="/student/forgot-password" title="Forgot Password" className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors uppercase tracking-wider underline-offset-4 hover:underline">
                                        Lost Password?
                                    </Link>
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-14 px-5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold"
                                    placeholder="Enter your password"
                                />
                            </div>
                        </div>

                        <div className="flex items-center">
                            <label className="flex items-center gap-3 cursor-pointer group/check">
                                <div className="relative">
                                    <input type="checkbox" className="sr-only peer" />
                                    <div className="w-5 h-5 border-2 border-slate-200 dark:border-white/10 rounded-md peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all duration-300" />
                                    <svg className="absolute top-1 left-1 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                        <path d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide group-hover/check:text-indigo-500 transition-colors">Keep me signed in</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            aria-label="Sign in"
                            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-[0_20px_40px_-15px_rgba(79,70,229,0.5)] hover:shadow-indigo-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3 overflow-hidden group/btn disabled:opacity-70"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                <>
                                    <span>Sign in & Access Dashboard</span>
                                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1.5 transition-transform duration-300" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                        <p className="text-center text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-300">Social Sign In</p>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                            {(['google', 'apple', 'twitter'] as const).map((provider) => {
                                const providerInfo = providers.find((item) => item.id === provider);
                                const enabled = Boolean(oauthQuery.data?.oauthEnabled && providerInfo?.enabled && providerInfo?.configured);
                                return (
                                    <button
                                        key={provider}
                                        type="button"
                                        disabled={!enabled}
                                        onClick={() => void handleOauth(provider)}
                                        className={`rounded-xl px-2 py-2 text-xs font-bold uppercase tracking-wide transition ${enabled
                                            ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900'
                                            : 'cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                                            }`}
                                        title={enabled ? `Continue with ${provider}` : `${provider} sign-in not configured`}
                                    >
                                        {provider}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <p className="mt-10 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                        Account creation is admin-controlled.{' '}
                        <Link to="/contact" className="font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 underline underline-offset-8 decoration-indigo-500/20 hover:decoration-indigo-500 transition-all">
                            Contact Admin
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right side: Dynamic Visual */}
            <div className="hidden lg:flex flex-1 relative bg-[#061226] overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/90 via-[#061226]/85 to-[#0b1834]/90" />
                    <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_25%_20%,rgba(59,130,246,0.35)_0,transparent_36%),radial-gradient(circle_at_75%_70%,rgba(6,182,212,0.28)_0,transparent_38%)]" />
                </div>

                {/* Abstract UI Elements Overlay */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />

                <div className="relative z-10 w-full flex flex-col justify-end p-20 xl:p-24 max-w-4xl">
                    <div className="w-20 h-20 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center mb-10 shadow-2xl skew-x-[-6deg]">
                        <GraduationCap className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-5xl xl:text-7xl font-black text-white mb-8 leading-[1.1] tracking-tight animate-in fade-in slide-in-from-bottom-8 duration-700">
                        Crafting Your <span className="text-indigo-400">Academic</span> Legacy.
                    </h2>
                    <div className="flex items-center gap-12 border-l-2 border-indigo-500/30 pl-8 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                        <div>
                            <p className="text-3xl font-black text-white">50k+</p>
                            <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mt-1">Successful Applicants</p>
                        </div>
                        <div className="w-px h-10 bg-white/10" />
                        <div>
                            <p className="text-3xl font-black text-white">100%</p>
                            <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mt-1">Digital Processing</p>
                        </div>
                    </div>
                </div>

                {/* Floating "Live" Indicator */}
                <div className="absolute top-10 right-10 flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl animate-bounce duration-[3000ms]">
                    <div className="flex -space-x-2">
                        {['A', 'R', 'S'].map((label) => (
                            <div
                                key={label}
                                className="w-6 h-6 rounded-full border-2 border-[#061226] bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-[9px] font-black text-white"
                                aria-label={`active user ${label}`}
                            >
                                {label}
                            </div>
                        ))}
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">+1.2k Live Now</span>
                </div>
            </div>
        </div>
    );
}
