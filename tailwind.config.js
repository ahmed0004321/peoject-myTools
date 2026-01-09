/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./App.tsx"
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Outfit', 'sans-serif'], // For Headings
            },
            colors: {
                background: 'var(--bg-primary)',
                surface: 'var(--bg-secondary)',
                primary: 'var(--text-primary)',
                secondary: 'var(--text-secondary)',
                border: 'var(--border-color)',

                // Brand/Accent Colors from Screenshot
                brand: {
                    green: '#10b981',  // React.gg green
                    cream: '#fef3c7',  // Query.gg / JS cream
                    cyan: '#06b6d4',   // React Router cyan
                    red: '#ef4444',    // Advanced JS red
                    orange: '#f97316', // TypeScript orange
                    pink: '#ec4899',   // React w/ TS pink
                    yellow: '#eab308', // Classic React yellow
                    purple: '#8b5cf6', // Generic accent
                }
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'slide-up': 'slideUp 0.5s ease-out forwards',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
    plugins: [],
}
