import { useState, FormEvent, useMemo } from 'react';
import {
    Mail,
    Phone,
    MapPin,
    Clock,
    Send,
    CheckCircle,
    AlertCircle,
    Facebook,
    MessageCircle,
    Youtube,
    Instagram,
    Twitter,
} from 'lucide-react';
import { submitContact } from '../services/api';
import { useWebsiteSettings } from '../hooks/useWebsiteSettings';

interface FormData {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
}

const SUBJECTS = ['General Inquiry', 'Admission Help', 'Technical Issue', 'Partnership', 'Feedback', 'Other'];

const socialIcons = {
    facebook: Facebook,
    whatsapp: MessageCircle,
    telegram: Send,
    twitter: Twitter,
    youtube: Youtube,
    instagram: Instagram,
} as const;

export default function ContactPage() {
    const { data: settings } = useWebsiteSettings();
    const [form, setForm] = useState<FormData>({ name: '', email: '', phone: '', subject: '', message: '' });
    const [errors, setErrors] = useState<Partial<FormData>>({});
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);

    const validate = (): boolean => {
        const e: Partial<FormData> = {};
        if (!form.name.trim()) e.name = 'Name is required';
        if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
        if (!form.subject) e.subject = 'Please select a subject';
        if (form.message.trim().length < 20) e.message = 'Message must be at least 20 characters';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSending(true);
        try {
            await submitContact(form);
            setSuccess(true);
        } catch {
            setErrors((prev) => ({ ...prev, message: 'Failed to send message. Please try again.' }));
        } finally {
            setSending(false);
        }
    };

    const socialItems = useMemo(() => {
        const order = settings?.socialUi?.platformOrder?.length
            ? settings.socialUi.platformOrder
            : (Object.keys(socialIcons) as Array<keyof typeof socialIcons>);
        return order
            .map((platform) => ({ platform, url: settings?.socialLinks?.[platform] || '' }))
            .filter((item) => Boolean(item.url));
    }, [settings]);

    const contactCards = [
        {
            icon: Mail,
            color: 'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20',
            label: 'Email',
            value: settings?.contactEmail || 'info@campusway.com',
            sub: 'Reply within 24 hours',
        },
        {
            icon: Phone,
            color: 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20',
            label: 'Phone',
            value: settings?.contactPhone || '+880 1600-000000',
            sub: 'Sun-Thu, 9 AM - 6 PM',
        },
        {
            icon: MapPin,
            color: 'bg-cyan-500/10 text-cyan-500 dark:bg-cyan-500/20',
            label: 'Office',
            value: 'Dhaka, Bangladesh',
            sub: 'Gulshan 2, Block C',
        },
        {
            icon: Clock,
            color: 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/20',
            label: 'Office Hours',
            value: '9:00 AM - 6:00 PM',
            sub: 'Saturday closed',
        },
    ];

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="card p-8 sm:p-12 max-w-md w-full text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
                        <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-heading font-bold dark:text-dark-text mb-3">Message Sent!</h2>
                    <p className="text-text-muted dark:text-dark-text/60 text-sm mb-6">
                        Thank you for reaching out. We will get back to you soon.
                    </p>
                    <button
                        onClick={() => {
                            setSuccess(false);
                            setForm({ name: '', email: '', phone: '', subject: '', message: '' });
                        }}
                        className="btn-primary w-full"
                    >
                        Send Another Message
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <section className="page-hero">
                <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
                    <div className="absolute bottom-0 right-20 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
                </div>
                <div className="section-container relative py-12 sm:py-16 lg:py-20">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5">
                        <Mail className="h-4 w-4 text-cyan-200" aria-hidden />
                        <span className="text-sm text-white/90">We are here to help</span>
                    </div>
                    <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">Get In Touch</h1>
                    <p className="max-w-xl text-base text-white/70 sm:text-lg">
                        Have questions about admissions, exams, or subscriptions? Contact our team.
                    </p>
                </div>
            </section>

            <section className="section-container py-8 sm:py-12 lg:py-16">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-10">
                    <div className="space-y-4 lg:col-span-2">
                        <h2 className="section-title">Contact Information</h2>
                        <p className="section-subtitle text-sm">Choose the channel that works best for you.</p>

                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            {contactCards.map((card) => (
                                <div key={card.label} className="card-flat p-4 flex items-center gap-4">
                                    <div className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${card.color}`}>
                                        <card.icon className="h-5 w-5" aria-hidden />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] uppercase tracking-wide text-text-muted dark:text-dark-text/50">{card.label}</p>
                                        <p className="truncate text-sm font-semibold dark:text-dark-text">{card.value}</p>
                                        <p className="text-xs text-text-muted dark:text-dark-text/50">{card.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-2">
                            <p className="mb-3 text-sm font-semibold dark:text-dark-text">Follow & Connect</p>
                            <div className="flex flex-wrap items-center gap-2">
                                {socialItems.map(({ platform, url }) => {
                                    const Icon = socialIcons[platform as keyof typeof socialIcons];
                                    return (
                                        <a
                                            key={platform}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm transition-all hover:border-indigo-500 hover:text-indigo-600 dark:border-white/10 dark:hover:border-cyan-400"
                                        >
                                            <Icon className="h-4 w-4" />
                                            <span className="capitalize">{platform}</span>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-3">
                        <div className="card p-5 sm:p-7">
                            <h2 className="mb-5 text-lg font-bold sm:text-xl">Send a Message</h2>
                            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="name" className="mb-1.5 block text-sm font-medium">Full Name <span className="text-rose-500">*</span></label>
                                        <input
                                            id="name"
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            className={`input-field ${errors.name ? 'border-rose-500 focus:ring-rose-500/30' : ''}`}
                                            placeholder="Your full name"
                                            aria-invalid={!!errors.name}
                                        />
                                        {errors.name && <p className="mt-1 flex items-center gap-1 text-xs text-rose-500"><AlertCircle className="h-3 w-3" />{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email Address <span className="text-rose-500">*</span></label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            className={`input-field ${errors.email ? 'border-rose-500 focus:ring-rose-500/30' : ''}`}
                                            placeholder="your@email.com"
                                            aria-invalid={!!errors.email}
                                        />
                                        {errors.email && <p className="mt-1 flex items-center gap-1 text-xs text-rose-500"><AlertCircle className="h-3 w-3" />{errors.email}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">Phone (optional)</label>
                                        <input
                                            id="phone"
                                            type="tel"
                                            value={form.phone}
                                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                            className="input-field"
                                            placeholder="+880 ..."
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="subject" className="mb-1.5 block text-sm font-medium">Subject <span className="text-rose-500">*</span></label>
                                        <select
                                            id="subject"
                                            value={form.subject}
                                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                            className={`input-field ${errors.subject ? 'border-rose-500' : ''}`}
                                            aria-invalid={!!errors.subject}
                                        >
                                            <option value="">Select a subject</option>
                                            {SUBJECTS.map((subject) => <option key={subject}>{subject}</option>)}
                                        </select>
                                        {errors.subject && <p className="mt-1 flex items-center gap-1 text-xs text-rose-500"><AlertCircle className="h-3 w-3" />{errors.subject}</p>}
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="message" className="mb-1.5 block text-sm font-medium">Message <span className="text-rose-500">*</span></label>
                                    <textarea
                                        id="message"
                                        rows={5}
                                        value={form.message}
                                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                                        className={`input-field resize-none ${errors.message ? 'border-rose-500 focus:ring-rose-500/30' : ''}`}
                                        placeholder="Describe your query in detail..."
                                        aria-invalid={!!errors.message}
                                    />
                                    <div className="mt-1 flex justify-between">
                                        {errors.message ? <p className="flex items-center gap-1 text-xs text-rose-500"><AlertCircle className="h-3 w-3" />{errors.message}</p> : <span />}
                                        <span className="text-xs text-text-muted dark:text-dark-text/50">{form.message.length}/500</span>
                                    </div>
                                </div>
                                <button type="submit" disabled={sending} className="btn-primary w-full gap-2 py-3">
                                    {sending ? (
                                        <>
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4" />
                                            <span>Send Message</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
