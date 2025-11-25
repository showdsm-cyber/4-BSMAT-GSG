/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./App.tsx",
        "./index.tsx",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./src/**/*.{js,ts,jsx,tsx}"
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            colors: {
                military: {
                    950: 'var(--bg-950)',
                    900: 'var(--bg-900)',
                    800: 'var(--bg-800)',
                    700: 'var(--bg-700)',
                    600: 'var(--bg-600)',
                    500: '#71717a',
                    accent: '#eab308',
                    danger: '#ef4444',
                    success: '#22c55e',
                },
                slate: {
                    100: 'var(--text-100)',
                    200: 'var(--text-200)',
                    300: 'var(--text-300)',
                    400: 'var(--text-400)',
                    500: 'var(--text-500)',
                }
            },
            borderRadius: {
                DEFAULT: '0.25rem',
                'sm': '0.125rem',
            }
        }
    },
    plugins: [],
}
