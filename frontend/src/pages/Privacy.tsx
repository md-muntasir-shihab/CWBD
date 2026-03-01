import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Database, Lock, Bell, Trash2 } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section className="page-hero relative overflow-hidden">
                <div className="section-container relative z-10 py-14 sm:py-18 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm mb-4 border border-white/20">
                        <Shield className="w-4 h-4" /> Legal
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold">Privacy Policy</h1>
                    <p className="mt-3 text-sm text-white/70">Last updated: February 2026</p>
                </div>
            </section>

            <div className="section-container py-10 lg:py-14 max-w-3xl mx-auto">
                <div className="card p-6 sm:p-8 space-y-6 text-sm text-text-muted dark:text-dark-text/70 leading-relaxed">
                    <section>
                        <h2 className="text-lg font-bold text-text dark:text-dark-text mb-2 flex items-center gap-2">
                            <Eye className="w-5 h-5 text-primary" /> 1. Information We Collect
                        </h2>
                        <p>We collect the following types of information:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li><strong>Account Information:</strong> Name, email, phone number when you register</li>
                            <li><strong>Usage Data:</strong> Pages visited, features used, exam participation data</li>
                            <li><strong>Device Information:</strong> Browser type, OS, screen resolution for compatibility</li>
                            <li><strong>Exam Data:</strong> Answers, scores, completion times for exam analytics</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-text dark:text-dark-text mb-2 flex items-center gap-2">
                            <Database className="w-5 h-5 text-primary" /> 2. How We Use Your Data
                        </h2>
                        <ul className="list-disc list-inside space-y-1">
                            <li>To provide and improve our educational services</li>
                            <li>To personalize your experience and recommendations</li>
                            <li>To generate aggregate analytics and insights</li>
                            <li>To communicate important updates about universities and exams</li>
                            <li>To maintain platform security and prevent fraud</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-text dark:text-dark-text mb-2 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-primary" /> 3. Data Security
                        </h2>
                        <p>
                            We implement industry-standard security measures to protect your personal information:
                        </p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>All data is encrypted in transit using TLS/SSL</li>
                            <li>Passwords are hashed using bcrypt with salt rounds</li>
                            <li>JWT tokens are used for secure authentication</li>
                            <li>Admin access is restricted with role-based permissions</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-text dark:text-dark-text mb-2 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-primary" /> 4. Cookies & Tracking
                        </h2>
                        <p>
                            CampusWay uses essential cookies for authentication and user preferences
                            (such as dark mode). We do not use third-party advertising cookies.
                            Analytics cookies may be used to improve the platform experience.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-text dark:text-dark-text mb-2">5. Third-Party Sharing</h2>
                        <p>
                            We do not sell or share your personal information with third parties.
                            Data may be shared only in the following cases:
                        </p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>When required by law or legal proceedings</li>
                            <li>With service providers who assist in platform operations (under strict agreements)</li>
                            <li>In anonymized, aggregate form for research and analytics</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-text dark:text-dark-text mb-2 flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-danger" /> 6. Your Rights
                        </h2>
                        <p>You have the right to:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Access your personal data stored on our platform</li>
                            <li>Request correction of inaccurate information</li>
                            <li>Request deletion of your account and associated data</li>
                            <li>Opt out of non-essential communications</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-text dark:text-dark-text mb-2">7. Contact</h2>
                        <p>
                            For privacy inquiries or data requests, please contact us at{' '}
                            <Link to="/contact" className="text-primary hover:underline">our contact page</Link> or
                            email us at privacy@campusway.com.
                        </p>
                    </section>
                </div>

                <div className="text-center mt-8">
                    <Link to="/" className="btn-primary inline-flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
