import React, { useEffect, useState } from 'react';
import { Activity, Lock, Mail, Save, Shield, User, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { changePassword, getProfileMe, updateProfile } from '../../services/api';

const formatTime = (value?: string | Date) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString();
};

const AdminProfilePanel: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);
    const [loginHistory, setLoginHistory] = useState<any[]>([]);
    const [actionHistory, setActionHistory] = useState<any[]>([]);

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    useEffect(() => {
        void fetchAdminProfile();
    }, []);

    const fetchAdminProfile = async () => {
        setLoading(true);
        try {
            const res = await getProfileMe();
            setProfileData(res.data.user?.profile || null);
            setLoginHistory(res.data.loginHistory || []);
            setActionHistory(res.data.actionHistory || []);
        } catch {
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateProfile({
                admin_name: profileData?.admin_name || '',
                profile_photo: profileData?.profile_photo || '',
            });
            toast.success('Profile updated successfully');
            await refreshUser();
            await fetchAdminProfile();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setSaving(true);
        try {
            await changePassword(passwordData.currentPassword, passwordData.newPassword);
            toast.success('Password changed successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6">
            <header>
                <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
                <p className="text-gray-500">Manage your administrative profile and security</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                        <div className="w-24 h-24 rounded-full mx-auto bg-primary/10 flex items-center justify-center">
                            <User className="w-10 h-10 text-primary" />
                        </div>
                        <h3 className="mt-4 font-bold text-lg text-gray-800">{profileData?.admin_name || user?.fullName || user?.username}</h3>
                        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold uppercase">
                            <Shield className="w-3 h-3" />
                            {user?.role}
                        </div>
                        <p className="mt-2 text-sm text-gray-500">{user?.email}</p>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <form onSubmit={handleUpdateProfile} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <User className="w-4 h-4 text-primary" />
                                Basic Information
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={profileData?.admin_name || ''}
                                    onChange={(e) => setProfileData({ ...(profileData || {}), admin_name: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo URL</label>
                                <input
                                    type="text"
                                    value={profileData?.profile_photo || ''}
                                    onChange={(e) => setProfileData({ ...(profileData || {}), profile_photo: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500">
                                    <Mail className="w-4 h-4" />
                                    {user?.email}
                                </div>
                            </div>
                            <div className="pt-2 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </form>

                    <form onSubmit={handleChangePassword} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Lock className="w-4 h-4 text-primary" />
                                Security Settings
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                <input
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    />
                                </div>
                            </div>
                            <div className="pt-2 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                    Update Password
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-gray-800">Login Activity</h3>
                    </div>
                    <div className="p-4 max-h-80 overflow-y-auto">
                        {loginHistory.length === 0 ? (
                            <p className="text-sm text-gray-500">No login activity found.</p>
                        ) : (
                            <div className="space-y-2">
                                {loginHistory.slice(0, 20).map((item, idx) => (
                                    <div key={idx} className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-sm">
                                        <p className="text-gray-800 font-medium">{item.ip_address || 'Unknown IP'} | {item.device_info || 'Unknown device'}</p>
                                        <p className="text-gray-500 text-xs">{formatTime(item.createdAt)} | {item.success ? 'success' : 'failed'} {item.suspicious ? '| suspicious' : ''}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-gray-800">Admin Action History</h3>
                    </div>
                    <div className="p-4 max-h-80 overflow-y-auto">
                        {actionHistory.length === 0 ? (
                            <p className="text-sm text-gray-500">No action history found.</p>
                        ) : (
                            <div className="space-y-2">
                                {actionHistory.slice(0, 20).map((item, idx) => (
                                    <div key={idx} className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-sm">
                                        <p className="text-gray-800 font-medium">{item.action || 'action'}</p>
                                        <p className="text-gray-500 text-xs">{formatTime(item.timestamp)} | target: {item.target_type || '-'} {item.target_id || ''}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AdminProfilePanel;
