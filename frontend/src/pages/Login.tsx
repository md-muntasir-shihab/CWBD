import { useState, FormEvent } from 'react';
import { Lock, Eye, EyeOff, GraduationCap, AlertCircle, Loader2, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginPage() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!identifier || !password) {
            setError('Please fill in all fields');
            return;
        }

        setError('');
        setLoading(true);
        try {
            const res = await login(identifier, password);
            if (res.requires2fa) {
                navigate('/otp-verify?from=admin');
                return;
            }

            const target = res.user.role === 'student' ? '/student/dashboard' : '/campusway-secure-admin';
            navigate(target);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#061226] relative overflow-hidden font-sans p-4">
            {/* Animated Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

            <div className="w-full max-w-md relative z-10">
                <Link to="/" className="flex flex-col items-center mb-10 group transition-transform hover:scale-105 duration-300">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0D5FDB] to-[#0EA5E9] flex items-center justify-center shadow-[0_20px_40px_-15px_rgba(13,95,219,0.5)] mb-4">
                        <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-2xl font-heading font-black text-white tracking-tight">CampusWay</span>
                    <span className="text-[10px] font-bold text-primary-300 uppercase tracking-widest mt-1 opacity-80 underline-offset-4 decoration-accent underline decoration-2">Admin Portal Login</span>
                </Link>

                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl p-8 sm:p-10 relative overflow-hidden group/card hover:border-white/20 transition-colors duration-500">
                    {/* Interior Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="text-center mb-8 relative">
                        <h1 className="text-2xl sm:text-3xl font-heading font-black text-white mb-2 leading-tight">Welcome Back</h1>
                        <p className="text-sm text-slate-400 font-medium">Secure access to your management panel</p>
                    </div>

                    {error && (
                        <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 mb-6 text-rose-200 text-sm animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
                            <span className="leading-relaxed font-medium">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="identifier" className="block text-xs font-bold text-slate-300 uppercase tracking-widest ml-1">
                                Email / Username
                            </label>
                            <input
                                id="identifier"
                                type="text"
                                autoComplete="username"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-medium"
                                placeholder="admin@example.com"
                                aria-required="true"
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label htmlFor="password" className="block text-xs font-bold text-slate-300 uppercase tracking-widest">Password</label>
                                <button
                                    type="button"
                                    onClick={() => navigate('/student/forgot-password')}
                                    className="text-[10px] font-bold text-primary-300 hover:text-white transition-colors uppercase tracking-wider underline-offset-4 hover:underline"
                                >
                                    Forgot?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-14 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-medium"
                                    placeholder="••••••••"
                                    aria-required="true"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-white transition-colors"
                                    aria-label={showPassword ? 'Hide' : 'Show'}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-gradient-to-r from-primary to-[#0EA5E9] hover:from-primary-600 hover:to-primary text-white font-black rounded-2xl shadow-[0_10px_30px_-10px_rgba(13,95,219,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 overflow-hidden group/btn"
                        >
                            {loading ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /><span>Verifying Identity...</span></>
                            ) : (
                                <>
                                    <span>Sign in to Dashboard</span>
                                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 flex items-center justify-center gap-4">
                        <div className="h-[1px] flex-1 bg-white/5" />
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex-shrink-0">Security Check</span>
                        <div className="h-[1px] flex-1 bg-white/5" />
                    </div>

                    <p className="text-[11px] text-slate-500 text-center mt-6 leading-relaxed flex items-center justify-center gap-2">
                        <Shield className="w-3 h-3 text-primary-400" />
                        Admin-only access. IPs are currently being logged for security.
                    </p>
                </div>

                <p className="text-center text-sm text-slate-500 mt-10">
                    <Link to="/" className="hover:text-white transition-colors font-bold underline underline-offset-8 decoration-primary/20">Return to Portal</Link>
                </p>
            </div>
        </div>
    );
}
