import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GraduationCap, ArrowRight, Loader2 } from 'lucide-react';
import api from '../../services/api';

export default function StudentRegister() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        fullName: ''
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/register', {
                ...formData,
                role: 'student'
            });
            toast.success(res.data.message || 'Registration successful! Please check your email.');
            navigate('/student/login');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Registration failed');
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
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Create an account</h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Already have an account?{' '}
                            <Link to="/student/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                                Sign in here
                            </Link>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                            <input type="text" name="fullName" required value={formData.fullName} onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                placeholder="John Doe" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
                            <input type="text" name="username" required value={formData.username} onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                placeholder="johndoe123" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                            <input type="email" name="email" required value={formData.email} onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                placeholder="john@example.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                            <input type="password" name="password" required value={formData.password} onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                placeholder="••••••••" />
                        </div>

                        <button
                            type="submit" disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 mt-6 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>Create Account <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            <div className="hidden lg:flex flex-1 items-center justify-center bg-slate-50 relative overflow-hidden">
                <div className="absolute inset-0 bg-cyan-600 z-0">
                    <img className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-multiply" src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2670&auto=format&fit=crop" alt="Campus Library" />
                </div>
                <div className="relative z-10 p-12 lg:p-24 text-white max-w-3xl">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center mb-8">
                        <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">Start shaping your tomorrow.</h2>
                    <p className="text-lg lg:text-xl text-cyan-100 font-medium max-w-2xl leading-relaxed">
                        Access hundreds of university programs, manage your applications, and track your progress all in one secure portal.
                    </p>
                </div>
            </div>
        </div>
    );
}
