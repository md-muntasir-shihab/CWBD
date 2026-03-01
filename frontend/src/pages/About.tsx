import { Link } from 'react-router-dom';
import { ArrowLeft, Info, Users, Target, Heart, GraduationCap, BookOpen, Award, Globe } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section className="page-hero relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
                    <div className="absolute bottom-10 right-20 w-96 h-96 rounded-full bg-accent/30 blur-3xl" />
                </div>
                <div className="section-container relative z-10 py-16 sm:py-20 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm mb-4 border border-white/20">
                        <Info className="w-4 h-4" />
                        <span>About CampusWay</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight max-w-3xl mx-auto">
                        Empowering Students Across <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">Bangladesh</span>
                    </h1>
                    <p className="mt-4 text-base sm:text-lg text-white/80 max-w-2xl mx-auto">
                        CampusWay is the #1 university admission guide — helping students navigate admissions, exams, and university life.
                    </p>
                </div>
            </section>

            {/* Content */}
            <div className="section-container py-12 lg:py-16">
                {/* Mission & Vision */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    <div className="card p-6 sm:p-8">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-4">
                            <Target className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-text dark:text-dark-text mb-3">Our Mission</h2>
                        <p className="text-sm text-text-muted dark:text-dark-text/60 leading-relaxed">
                            To provide every student in Bangladesh with equal access to comprehensive, accurate, and
                            up-to-date information about university admissions. We believe that the right information at
                            the right time can transform a student's future.
                        </p>
                    </div>
                    <div className="card p-6 sm:p-8">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mb-4">
                            <Globe className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-text dark:text-dark-text mb-3">Our Vision</h2>
                        <p className="text-sm text-text-muted dark:text-dark-text/60 leading-relaxed">
                            To become the most trusted and comprehensive education platform in South Asia, connecting
                            students with opportunities and empowering them to make informed decisions about their academic future.
                        </p>
                    </div>
                </div>

                {/* What We Offer */}
                <h2 className="section-title text-center mb-8">What We Offer</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                    {[
                        { icon: GraduationCap, title: 'University Database', desc: 'Complete data on 50+ universities', color: 'from-blue-500 to-blue-700' },
                        { icon: BookOpen, title: 'Online Exams', desc: 'Practice with past-year questions', color: 'from-emerald-500 to-emerald-700' },
                        { icon: Users, title: 'Expert Guidance', desc: 'Mentorship from top students', color: 'from-purple-500 to-purple-700' },
                        { icon: Award, title: 'Scholarships', desc: 'Find and apply for financial aid', color: 'from-amber-500 to-amber-700' },
                    ].map(s => (
                        <div key={s.title} className="card p-5 text-center">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-3`}>
                                <s.icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-bold text-sm text-text dark:text-dark-text">{s.title}</h3>
                            <p className="text-xs text-text-muted dark:text-dark-text/50 mt-1">{s.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Team */}
                <div className="card p-6 sm:p-8 text-center mb-12">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-7 h-7 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-text dark:text-dark-text mb-3">Built with ❤️ for Students</h2>
                    <p className="text-sm text-text-muted dark:text-dark-text/60 max-w-2xl mx-auto leading-relaxed">
                        CampusWay was built by students who understood the struggles of the admission season.
                        Our team is dedicated to making this journey smoother for every aspiring university student
                        in Bangladesh.
                    </p>
                </div>

                {/* Back */}
                <div className="text-center">
                    <Link to="/" className="btn-primary inline-flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
