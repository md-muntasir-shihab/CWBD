import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ExternalLink, Facebook, Youtube, MessageCircle } from 'lucide-react';
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

export default function Footer() {
    const { data: settings } = useWebsiteSettings();

    return (
        <footer className="bg-[linear-gradient(135deg,#052960_0%,#073A8D_42%,#0D5FDB_76%,#0EA5E9_100%)] dark:bg-[linear-gradient(135deg,#040D1D_0%,#071A34_52%,#0A2850_100%)] text-white/85 mt-auto border-t border-white/10">
            {/* Main footer */}
            <div className="section-container py-12 lg:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {/* Brand */}
                    <div className="lg:col-span-1">
                        <Link to="/" className="flex items-center gap-2.5 mb-4 group">
                            <img
                                src={settings?.logo || '/logo.png'}
                                alt={settings?.websiteName || 'CampusWay Logo'}
                                className="h-10 w-auto max-w-[140px] object-contain bg-white/10 p-1.5 rounded-xl backdrop-blur-sm transition-colors group-hover:bg-white/20"
                            />
                            <div>
                                <span className="text-xl font-heading font-bold text-white block leading-tight">{settings?.websiteName || 'CampusWay'}</span>
                                <span className="text-xs text-white/50">{settings?.motto || 'From Updates to Upskilling'}</span>
                            </div>
                        </Link>
                        <p className="text-sm text-white/60 leading-relaxed mt-4">
                            Your trusted platform for university admissions, exam updates, and educational resources.
                            Stay informed, stay ahead.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
                        <ul className="space-y-2.5">
                            {quickLinks.map((link) => (
                                <li key={link.path}>
                                    <Link
                                        to={link.path}
                                        className="text-sm text-white/60 hover:text-accent transition-colors duration-200 flex items-center gap-1.5"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
                        <ul className="space-y-2.5">
                            {legalLinks.map((link) => (
                                <li key={link.path}>
                                    <Link
                                        to={link.path}
                                        className="text-sm text-white/60 hover:text-accent transition-colors duration-200 flex items-center gap-1.5"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contact</h4>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 text-sm text-white/60">
                                <MapPin className="w-4 h-4 mt-0.5 text-accent shrink-0" />
                                <span>Dhaka, Bangladesh</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-white/60">
                                <Phone className="w-4 h-4 text-accent shrink-0" />
                                <span>{settings?.contactPhone || '+880 1XXX-XXXXXX'}</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-white/60">
                                <Mail className="w-4 h-4 text-accent shrink-0" />
                                <span>{settings?.contactEmail || 'contact@campusway.com'}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-white/10">
                <div className="section-container py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-white/40">
                        © {new Date().getFullYear()} {settings?.websiteName || 'CampusWay'}. All rights reserved.
                    </p>

                    {/* Social links */}
                    <div className="flex items-center gap-3 mt-1 sm:mt-0">
                        {settings?.socialLinks?.facebook && (
                            <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">
                                <Facebook className="w-4 h-4" />
                            </a>
                        )}
                        {settings?.socialLinks?.youtube && (
                            <a href={settings.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">
                                <Youtube className="w-4 h-4" />
                            </a>
                        )}
                        {settings?.socialLinks?.whatsapp && (
                            <a href={settings.socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">
                                <MessageCircle className="w-4 h-4" />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </footer>
    );
}
