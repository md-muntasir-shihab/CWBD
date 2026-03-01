import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Shield, AlertTriangle } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section className="page-hero relative overflow-hidden">
                <div className="section-container relative z-10 py-14 sm:py-18 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm mb-4 border border-white/20">
                        <FileText className="w-4 h-4" /> Legal
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold">Terms & Conditions</h1>
                    <p className="mt-3 text-sm text-white/70">Last updated: February 2026</p>
                </div>
            </section>

            <div className="section-container py-10 lg:py-14 max-w-3xl mx-auto">
                <div className="card p-6 sm:p-8 space-y-6 text-sm text-text-muted dark:text-dark-text/70 leading-relaxed">
                    <section>
                        <h2 className="text-lg font-bold text-text dark:text-dark-text mb-2 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" /> 1. Acceptance of Terms
                        </h2>
                        <p>
                            By accessing and using CampusWay, you agree to be bound by these Terms & Conditions
                            and all applicable laws and regulations. If you do not agree with any part of these terms,
                            you may not use the platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-text dark:text-dark-text mb-2">2. Use of Services</h2>
                        <p>
                            CampusWay provides educational information, university admission guides, exam preparation
                            tools, and related services. Users are expected to use the platform for lawful educational
                            purposes only.
                        </p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>You must be at least 13 years old to use this platform</li>
                            <li>You are responsible for maintaining the confidentiality of your account</li>
                            <li>You agree not to share exam content or answers with others</li>
                            <li>Automated scraping or data collection is strictly prohibited</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-text dark:text-dark-text mb-2">3. Content & Accuracy</h2>
                        <p>
                            While we strive to keep all information accurate and up-to-date, CampusWay does not
                            guarantee the accuracy of university data, exam dates, or seat counts. Always verify
                            critical information with the respective university's official website.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-text dark:text-dark-text mb-2">4. Exam Rules</h2>
                        <p>
                            When participating in online exams through CampusWay:
                        </p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Tab switching and screen sharing are monitored for integrity</li>
                            <li>Any form of cheating will result in disqualification</li>
                            <li>Exam results are final once submitted</li>
                            <li>Time limits are strictly enforced</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-text dark:text-dark-text mb-2">5. Intellectual Property</h2>
                        <p>
                            All content on CampusWay, including but not limited to text, graphics, logos, and
                            exam questions, is the property of CampusWay or its content creators and is
                            protected by copyright laws.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-text dark:text-dark-text mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-warning" /> 6. Limitation of Liability
                        </h2>
                        <p>
                            CampusWay shall not be liable for any direct, indirect, incidental, or
                            consequential damages arising from the use of this platform, including but not
                            limited to admission decisions based on information provided herein.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-text dark:text-dark-text mb-2">7. Contact</h2>
                        <p>
                            For any questions regarding these terms, please contact us at{' '}
                            <Link to="/contact" className="text-primary hover:underline">our contact page</Link>.
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
