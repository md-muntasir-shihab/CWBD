import { useState, FormEvent } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, AlertCircle, Facebook, MessageCircle, Youtube } from 'lucide-react';

interface FormData { name: string; email: string; phone: string; subject: string; message: string; }

const SUBJECTS = ['General Inquiry', 'Admission Help', 'Technical Issue', 'Partnership', 'Feedback', 'Other'];

export default function ContactPage() {
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
        await new Promise(r => setTimeout(r, 1500)); // mock API
        setSending(false);
        setSuccess(true);
    };

    const contactCards = [
        { icon: Mail, color: 'bg-primary/10 text-primary dark:bg-primary/20', label: 'Email', value: 'info@campusway.bd', sub: 'Reply within 24 hours' },
        { icon: Phone, color: 'bg-success/10 text-success dark:bg-success/20', label: 'Phone & WhatsApp', value: '+880 1600-000000', sub: 'Sun–Thu, 9 AM – 6 PM' },
        { icon: MapPin, color: 'bg-accent/10 text-accent dark:bg-accent/20', label: 'Office', value: 'Dhaka, Bangladesh', sub: 'Gulshan 2, Block C' },
        { icon: Clock, color: 'bg-warning/10 text-warning dark:bg-warning/20', label: 'Office Hours', value: '9:00 AM – 6:00 PM', sub: 'Saturday closed' },
    ];

    const socialLinks = [
        { icon: Facebook, label: 'Facebook', href: '#', color: 'bg-blue-600 hover:bg-blue-700' },
        { icon: MessageCircle, label: 'WhatsApp', href: '#', color: 'bg-green-500 hover:bg-green-600' },
        { icon: Youtube, label: 'YouTube', href: '#', color: 'bg-red-600 hover:bg-red-700' },
    ];

    if (success) return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="card p-8 sm:p-12 max-w-md w-full text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-success" />
                </div>
                <h2 className="text-xl sm:text-2xl font-heading font-bold dark:text-dark-text mb-3">Message Sent!</h2>
                <p className="text-text-muted dark:text-dark-text/60 text-sm mb-6">
                    Thank you for reaching out. We'll get back to you within 24 hours.
                </p>
                <button onClick={() => { setSuccess(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}
                    className="btn-primary w-full">
                    Send Another Message
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section className="page-hero">
                <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
                    <div className="absolute bottom-0 right-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
                </div>
                <div className="section-container relative py-12 sm:py-16 lg:py-20">
                    <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-4">
                        <Mail className="w-4 h-4 text-accent" aria-hidden />
                        <span className="text-sm text-white/90">We're here to help</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold mb-3">Get In Touch</h1>
                    <p className="text-base sm:text-lg text-white/70 max-w-xl">
                        Have questions about university admissions? We're here to help. Reach out via any of the channels below.
                    </p>
                </div>
            </section>

            <section className="section-container py-8 sm:py-12 lg:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10">
                    {/* Left: Info */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="section-title">Contact Information</h2>
                        <p className="section-subtitle text-sm">Multiple ways to reach us — choose what's most convenient for you.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 mt-5">
                            {contactCards.map(card => (
                                <div key={card.label} className="card-flat p-4 flex items-center gap-4">
                                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${card.color}`}>
                                        <card.icon className="w-5 h-5" aria-hidden />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] text-text-muted dark:text-dark-text/50 uppercase tracking-wide">{card.label}</p>
                                        <p className="font-semibold dark:text-dark-text text-sm truncate">{card.value}</p>
                                        <p className="text-xs text-text-muted dark:text-dark-text/50">{card.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Social */}
                        <div className="pt-2">
                            <p className="text-sm font-semibold dark:text-dark-text mb-3">Follow & Connect</p>
                            <div className="flex items-center gap-2 flex-wrap">
                                {socialLinks.map(s => (
                                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-white text-sm font-medium transition-all duration-200 ${s.color} hover:shadow-md`}>
                                        <s.icon className="w-4 h-4" /> {s.label}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Map placeholder */}
                        <div className="rounded-2xl overflow-hidden border border-card-border dark:border-dark-border h-40 sm:h-48 bg-background dark:bg-dark-bg flex items-center justify-center">
                            <div className="text-center">
                                <MapPin className="w-8 h-8 mx-auto text-text-muted dark:text-dark-text/30 mb-2" />
                                <p className="text-xs text-text-muted dark:text-dark-text/40">Interactive map coming soon</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Form */}
                    <div className="lg:col-span-3">
                        <div className="card p-5 sm:p-7">
                            <h2 className="text-lg sm:text-xl font-heading font-bold dark:text-dark-text mb-5">Send a Message</h2>
                            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium dark:text-dark-text mb-1.5">
                                            Full Name <span className="text-danger">*</span>
                                        </label>
                                        <input id="name" type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                            className={`input-field ${errors.name ? 'border-danger focus:ring-danger/30' : ''}`}
                                            placeholder="Your full name" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-err' : undefined} />
                                        {errors.name && <p id="name-err" className="text-xs text-danger mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium dark:text-dark-text mb-1.5">
                                            Email Address <span className="text-danger">*</span>
                                        </label>
                                        <input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                            className={`input-field ${errors.email ? 'border-danger focus:ring-danger/30' : ''}`}
                                            placeholder="your@email.com" aria-invalid={!!errors.email} />
                                        {errors.email && <p className="text-xs text-danger mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium dark:text-dark-text mb-1.5">Phone (optional)</label>
                                        <input id="phone" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                                            className="input-field" placeholder="+880 ..." />
                                    </div>
                                    <div>
                                        <label htmlFor="subject" className="block text-sm font-medium dark:text-dark-text mb-1.5">
                                            Subject <span className="text-danger">*</span>
                                        </label>
                                        <select id="subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                                            className={`input-field ${errors.subject ? 'border-danger' : ''}`} aria-invalid={!!errors.subject}>
                                            <option value="">Select a subject</option>
                                            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                                        </select>
                                        {errors.subject && <p className="text-xs text-danger mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.subject}</p>}
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium dark:text-dark-text mb-1.5">
                                        Message <span className="text-danger">*</span>
                                        <span className="text-text-muted dark:text-dark-text/50 font-normal text-xs ml-2">(min. 20 chars)</span>
                                    </label>
                                    <textarea id="message" rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                                        className={`input-field resize-none ${errors.message ? 'border-danger focus:ring-danger/30' : ''}`}
                                        placeholder="Describe your query in detail…" aria-invalid={!!errors.message} />
                                    <div className="flex justify-between mt-1">
                                        {errors.message ? <p className="text-xs text-danger flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.message}</p> : <span />}
                                        <span className="text-xs text-text-muted dark:text-dark-text/50">{form.message.length}/500</span>
                                    </div>
                                </div>
                                <button type="submit" disabled={sending} className="btn-primary w-full gap-2 py-3">
                                    {sending ? (
                                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Sending…</span></>
                                    ) : (
                                        <><Send className="w-4 h-4" /><span>Send Message</span></>
                                    )}
                                </button>
                                <p className="text-xs text-text-muted dark:text-dark-text/40 text-center">
                                    Your information is private and will never be shared.
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
