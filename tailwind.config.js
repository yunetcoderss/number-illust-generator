/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        baloo: ['"Baloo 2"', 'sans-serif'],
      },
      colors: {
        orange: {
          hero: '#FF6A2B',
          deep: '#B8390E',
          mid: '#FF8A4C',
        },
        cream: '#FFF3E4',
        gold: '#FFC24B',
        ink: {
          DEFAULT: '#2B1710',
          soft: '#7A5B4C',
        },
        peach: {
          DEFAULT: '#FFE3C6',
          line: '#FFD3A8',
        }
      },
      animation: {
        twinkle: 'twinkle 2.6s ease-in-out infinite',
        spin: 'spin 1.1s linear infinite',
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: '0.35', transform: 'scale(0.75) rotate(0deg)' },
          '50%': { opacity: '1', transform: 'scale(1.05) rotate(8deg)' },
        }
      },
      boxShadow: {
        'phone': '0 30px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03) inset',
        'card': '0 16px 30px -12px rgba(184,57,14,0.55)',
        'btn': '0 14px 24px -10px rgba(184,57,14,0.6)',
      }
    },
  },
  plugins: [],
}
