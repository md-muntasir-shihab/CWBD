import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { GraduationCap, ArrowRight, Loader2, ArrowLeft, MailCheck } from 'lucide-react';

export default function StudentForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setSuccess(true);
            toast.success('Reset link sent to your email');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to process request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white text-slate-900 dark:bg-[#061226] dark:text-slate-100">
            <div className="mx-auto flex flex-1 flex-col justify-center border-r border-slate-100 bg-white/90 px-4 sm:px-6 lg:mx-0 lg:w-[480px] lg:flex-none lg:px-12 xl:w-[560px] xl:px-24 dark:border-slate-800/70 dark:bg-[#061226]/80">
                <div className="mx-auto w-full max-w-sm">
                    <div className="mb-10 text-center lg:text-left">
                        <Link to="/" className="group mb-8 inline-flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 transition-all group-hover:shadow-indigo-500/40">
                                <GraduationCap className="h-6 w-6" />
                            </div>
                            <span className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-2xl font-bold text-transparent">
                                CampusWay
                            </span>
                        </Link>

                        {!success ? (
                            <>
                                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Forgot Password</h2>
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                                    Enter your registered email address and we'll send you a link to reset your password.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 lg:mx-0 dark:bg-emerald-500/20">
                                    <MailCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-300" />
                                </div>
                                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Check your inbox</h2>
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                                    We've sent a password reset link to <span className="font-medium text-slate-800 dark:text-slate-100">{email}</span>. Please check your spam folder if you don't see it within a few minutes.
                                </p>
                            </>
                        )}
                    </div>

                    {!success ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Email address</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500"
                                    placeholder="student@example.com"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-transparent bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-[#061226]"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                    <>
                                        Send Reset Link <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </button>

                            <div className="mt-4 text-center">
                                <Link
                                    to="/student/login"
                                    className="flex items-center justify-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-cyan-300 dark:hover:text-cyan-200"
                                >
                                    <ArrowLeft className="h-4 w-4" /> Back to Login
                                </Link>
                            </div>
                        </form>
                    ) : (
                        <div className="mt-8 space-y-6">
                            <button
                                onClick={() => setSuccess(false)}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-900 dark:focus:ring-offset-[#061226]"
                            >
                                Did not receive the email? Try again
                            </button>

                            <div className="text-center">
                                <Link
                                    to="/student/login"
                                    className="flex items-center justify-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-cyan-300 dark:hover:text-cyan-200"
                                >
                                    <ArrowLeft className="h-4 w-4" /> Back to login
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-900/40 lg:flex">
                <div className="absolute inset-0 z-0 bg-indigo-600">
                    <img
                        className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-multiply"
                        src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2670&auto=format&fit=crop"
                        alt="Campus View"
                    />
                </div>
                <div className="relative z-10 max-w-3xl p-12 text-white lg:p-24">
                    <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur">
                        <GraduationCap className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="mb-6 text-4xl font-bold leading-tight lg:text-5xl">Secure Account Recovery</h2>
                    <p className="max-w-2xl text-lg font-medium leading-relaxed text-indigo-100 lg:text-xl">
                        We take your security seriously. Verify your email to regain access to your applications and profile.
                    </p>
                </div>
            </div>
        </div>
    );
}
