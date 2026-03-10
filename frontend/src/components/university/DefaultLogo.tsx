interface DefaultLogoProps {
    fallbackText: string;
    className?: string;
    /** Override text size class (default: text-xl) */
    textClassName?: string;
}

export default function DefaultLogo({ fallbackText, className = '', textClassName }: DefaultLogoProps) {
    return (
        <div className={`flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/15 ${className}`}>
            <span className={`${textClassName || 'text-xl'} font-black tracking-tight text-primary dark:text-primary/90 select-none`}>
                {fallbackText}
            </span>
        </div>
    );
}
