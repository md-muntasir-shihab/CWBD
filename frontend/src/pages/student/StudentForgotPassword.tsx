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
        <div className="min-h-screen flex text-slate-900 bg-white">
            <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:w-[480px] xl:w-[560px] mx-auto lg:mx-0 lg:px-12 xl:px-24 border-r border-slate-100">
                <div className="w-full max-w-sm mx-auto">
                    <div className="mb-10 text-center lg:text-left">
                        <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-all">
                                <GraduationCap className="w-6 h-6" />
                            </div>
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-600">
                                CampusWay
                            </span>
                        </Link>

                        {!success ? (
                            <>
                                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Forgot Password</h2>
                                <p className="mt-2 text-sm text-slate-500">
                                    Enter your registered email address and we'll send you a link to reset your password.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-6">
                                    <MailCheck className="w-8 h-8 text-emerald-600" />
                                </div>
                                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Check your inbox</h2>
                                <p className="mt-2 text-sm text-slate-500">
                                    We've sent a password reset link to <span className="font-medium text-slate-800">{email}</span>. Please check your spam folder if you don't see it within a few minutes.
                                </p>
                            </>
                        )}
                    </div>

                    {!success ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                    placeholder="student@example.com"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>Send Reset Link <ArrowRight className="w-4 h-4" /></>
                                )}
                            </button>

                            <div className="text-center mt-4">
                                <Link to="/student/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center justify-center gap-1">
                                    <ArrowLeft className="w-4 h-4" /> Back to Login
                                </Link>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6 mt-8">
                            <button
                                onClick={() => setSuccess(false)}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all"
                            >
                                Did not receive the email? Try again
                            </button>

                            <div className="text-center">
                                <Link to="/student/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center justify-center gap-1">
                                    <ArrowLeft className="w-4 h-4" /> Back to login
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="hidden lg:flex flex-1 items-center justify-center bg-slate-50 relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-600 z-0">
                    <img className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-multiply" src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2670&auto=format&fit=crop" alt="Campus View" />
                </div>
                <div className="relative z-10 p-12 lg:p-24 text-white max-w-3xl">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center mb-8">
                        <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">Secure Account Recovery</h2>
                    <p className="text-lg lg:text-xl text-indigo-100 font-medium max-w-2xl leading-relaxed">
                        We take your security seriously. Verify your email to regain access to your applications and profile.
                    </p>
                </div>
            </div>
        </div>
    );
}
