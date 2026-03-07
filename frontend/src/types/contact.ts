export type PreferredContactMethod = "whatsapp" | "phone" | "email" | "messenger";

export interface ContactCustomLink {
    name: string;
    iconUrl: string;
    url: string;
    enabled: boolean;
}

export interface ContactLinks {
    phone?: string;
    email?: string;
    address?: string;
    whatsappUrl?: string;
    messengerUrl?: string;
    facebookUrl?: string;
    telegramUrl?: string;
    instagramUrl?: string;
    customLinks?: ContactCustomLink[];
}

export interface PublicSettingsContactResponse {
    siteName: string;
    logoUrl: string;
    siteDescription: string;
    contactLinks: ContactLinks;
    footer?: {
        shortNote?: string;
    };
}

export interface ContactMessagePayload {
    name: string;
    phone: string;
    email?: string;
    subject: string;
    message: string;
    preferredContact: PreferredContactMethod;
    consent: boolean;
}

export interface ContactMessageResponse {
    ok: true;
    ticketId?: string;
}

