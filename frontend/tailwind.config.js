/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#0D5FDB',
                    50: '#EDF5FF',
                    100: '#D9E9FF',
                    200: '#B7D4FF',
                    300: '#87B7FF',
                    400: '#5599FF',
                    500: '#2D7CF2',
                    600: '#0D5FDB',
                    700: '#094CB8',
                    800: '#073A8D',
                    900: '#052960',
                },
                accent: {
                    DEFAULT: '#08B8A9',
                    50: '#E8FCFA',
                    100: '#C6F7F2',
                    200: '#94EEE6',
                    300: '#5FE1D6',
                    400: '#2DCEC2',
                    500: '#08B8A9',
                    600: '#06988C',
                    700: '#057A72',
                    800: '#035E58',
                    900: '#024340',
                },
                surface: '#FFFFFF',
                background: '#F6FBFF',
                'card-border': '#D7E8F7',
                text: {
                    DEFAULT: '#0F2740',
                    muted: '#58708A',
                },
                success: '#16A34A',
                warning: '#F59E0B',
                danger: '#EF4444',
                dark: {
                    bg: '#061226',
                    surface: '#0B1A30',
                    text: '#D6E7FF',
                    border: '#18314D',
                },
            },
            fontFamily: {
                sans: ['Manrope', 'Segoe UI', 'sans-serif'],
                heading: ['Sora', 'Manrope', 'Segoe UI', 'sans-serif'],
            },
            boxShadow: {
                'card': '0 8px 30px -16px rgba(13, 95, 219, 0.26)',
                'card-hover': '0 22px 45px -22px rgba(13, 95, 219, 0.38)',
                'elevated': '0 26px 60px -24px rgba(7, 58, 141, 0.42)',
            },
            borderRadius: {
                'xl': '0.75rem',
                '2xl': '1rem',
                '3xl': '1.5rem',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'pulse-slow': 'pulse 3s ease-in-out infinite',
                'marquee': 'marquee 24s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                marquee: {
                    '0%': { transform: 'translateX(0%)' },
                    '100%': { transform: 'translateX(-50%)' },
                },
            },
        },
    },
    plugins: [],
};
