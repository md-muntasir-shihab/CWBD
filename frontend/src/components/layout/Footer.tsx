import { Link } from 'react-router-dom';
import {
    Mail,
    Phone,
    MapPin,
    ExternalLink,
    Facebook,
    Youtube,
    MessageCircle,
    Send,
    Instagram,
    Twitter,
} from 'lucide-react';
import { useWebsiteSettings } from '../../hooks/useWebsiteSettings';

const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'News & Updates', path: '/news' },
    { name: 'Online Exams', path: '/exams' },
    { name: 'Student Resources', path: '/resources' },
    { name: 'Contact Us', path: '/contact' },
];

const legalLinks = [
    { name: 'Terms & Conditions', path: '/terms' },
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'About Us', path: '/about' },
];

const iconByPlatform = {
    facebook: Facebook,
    whatsapp: MessageCircle,
    telegram: Send,
    twitter: Twitter,
    youtube: Youtube,
    instagram: Instagram,
} as const;

export default function Footer() {
    const { data: settings } = useWebsiteSettings();

    const orderedPlatforms = settings?.socialUi?.platformOrder?.length
        ? settings.socialUi.platformOrder
        : (Object.keys(iconByPlatform) as Array<keyof typeof iconByPlatform>);

    const socialItems = orderedPlatforms
        .map((platform) => ({ platform, url: settings?.socialLinks?.[platform] || '' }))
        .filter((item) => Boolean(item.url));

    return (
        <footer className="bg-[linear-gradient(135deg,#052960_0%,#073A8D_42%,#0D5FDB_76%,#0EA5E9_100%)] text-white/85 mt-auto border-t border-white/10">
            <div className="section-container py-12 lg:py-16">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
                    <div className="lg:col-span-1">
                        <Link to="/" className="flex items-center gap-2.5 mb-4 group">
                            <img
                                src={settings?.logo || '/logo.png'}
                                alt={settings?.websiteName || 'CampusWay Logo'}
                                className="h-10 w-auto max-w-[140px] object-contain bg-white/10 p-1.5 rounded-xl backdrop-blur-sm transition-colors group-hover:bg-white/20"
                            />
                            <div>
                                <span className="block text-xl font-heading font-bold text-white leading-tight">{settings?.websiteName || 'CampusWay'}</span>
                                <span className="text-xs text-white/50">{settings?.motto || 'From Updates to Upskilling'}</span>
                            </div>
                        </Link>
                        <p className="mt-4 text-sm leading-relaxed text-white/60">
                            Your trusted platform for university admissions, exam updates, and educational resources.
                        </p>
                    </div>

                    <div>
                        <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Quick Links</h4>
                        <ul className="space-y-2.5">
                            {quickLinks.map((link) => (
                                <li key={link.path}>
                                    <Link to={link.path} className="flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-cyan-200">
                                        <ExternalLink className="w-3 h-3" />
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Legal</h4>
                        <ul className="space-y-2.5">
                            {legalLinks.map((link) => (
                                <li key={link.path}>
                                    <Link to={link.path} className="flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-cyan-200">
                                        <ExternalLink className="w-3 h-3" />
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Contact</h4>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 text-sm text-white/60">
                                <MapPin className="mt-0.5 w-4 h-4 text-cyan-200 shrink-0" />
                                <span>Dhaka, Bangladesh</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-white/60">
                                <Phone className="w-4 h-4 text-cyan-200 shrink-0" />
                                <span>{settings?.contactPhone || '+880 1XXX-XXXXXX'}</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-white/60">
                                <Mail className="w-4 h-4 text-cyan-200 shrink-0" />
                                <span>{settings?.contactEmail || 'contact@campusway.com'}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="border-t border-white/10">
                <div className="section-container flex flex-col items-center justify-between gap-4 py-5 sm:flex-row">
                    <p className="text-xs text-white/40">
                        &copy; {new Date().getFullYear()} {settings?.websiteName || 'CampusWay'}. All rights reserved.
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                        {socialItems.map(({ platform, url }) => {
                            const Icon = iconByPlatform[platform];
                            return (
                                <a
                                    key={platform}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={platform}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white/80 transition-all hover:-translate-y-0.5 hover:bg-white/20 hover:text-white"
                                >
                                    <Icon className="h-4 w-4" />
                                </a>
                            );
                        })}
                    </div>
                </div>
            </div>
        </footer>
    );
}
