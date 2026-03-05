import { FormEvent, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function AdminNewsLogin() {
    const navigate = useNavigate();
    const { login, isAuthenticated, isLoading, user } = useAuth();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isAuthenticated && user && user.role !== 'student') {
            navigate('/admin/news', { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    if (!isLoading && isAuthenticated && user?.role !== 'student') {
        return <Navigate to="/admin/news" replace />;
    }

    async function onSubmit(event: FormEvent) {
        event.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const response = await login(identifier, password);
            if (response?.requires2fa) {
                setError('2FA is enabled. Please use the main login flow to complete verification.');
                return;
            }
            navigate('/admin/news', { replace: true });
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Login failed');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#041229] via-[#061938] to-[#041229] p-4 text-white">
            <div className="w-full max-w-md rounded-2xl border border-cyan-400/20 bg-slate-950/60 p-6 shadow-2xl">
                <h1 className="text-2xl font-bold">Admin News Login</h1>
                <p className="mt-1 text-sm text-slate-300">Use your admin credentials to access News System V2.</p>
                <form onSubmit={onSubmit} className="mt-6 space-y-4">
                    <div>
                        <label className="mb-1 block text-xs uppercase tracking-wider text-slate-400">Username / Email</label>
                        <input
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="input-field"
                            placeholder="admin username"
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs uppercase tracking-wider text-slate-400">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                            placeholder="********"
                            required
                        />
                    </div>
                    {error && <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>}
                    <button type="submit" disabled={submitting} className="btn-primary w-full">
                        {submitting ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
