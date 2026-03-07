interface MailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
export declare function sendCampusMail(options: MailOptions): Promise<boolean>;
export {};
//# sourceMappingURL=mailer.d.ts.map