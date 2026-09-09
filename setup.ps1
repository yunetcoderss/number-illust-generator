# Setup script to scaffold Vite React TS Tailwind project
Remove-Item -Path "js", "styles.css", "index.html" -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path "src" -Force -ErrorAction SilentlyContinue

@'
{
  "name": "toko-cia",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.10"
  }
}
'@ | Set-Content -Path "package.json" -Encoding UTF8

@'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
'@ | Set-Content -Path "vite.config.ts" -Encoding UTF8

@'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
'@ | Set-Content -Path "postcss.config.js" -Encoding UTF8

@'
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
'@ | Set-Content -Path "tailwind.config.js" -Encoding UTF8

@'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
'@ | Set-Content -Path "tsconfig.json" -Encoding UTF8

@'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
'@ | Set-Content -Path "tsconfig.node.json" -Encoding UTF8

@'
<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Toko Cia — Generator Wajah Vektor</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
'@ | Set-Content -Path "index.html" -Encoding UTF8

@'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
'@ | Set-Content -Path "src\main.tsx" -Encoding UTF8

@'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html, body { height: 100%; margin: 0; }
  body {
    background: radial-gradient(circle at 50% 18%, rgba(255,140,70,0.35), transparent 55%), #1C0F09;
  }
}

@layer components {
  .phone-notch::after {
    content: "";
    position: absolute;
    top: 0; left: 50%;
    transform: translateX(-50%);
    width: 120px; height: 26px;
    background: #120A06;
    border-radius: 0 0 18px 18px;
    z-index: 40;
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .flash-overlay {
    background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35), transparent 45%),
                repeating-conic-gradient(from 0deg, rgba(255,255,255,0.05) 0deg 4deg, transparent 4deg 16deg);
    mix-blend-mode: screen;
  }
}
'@ | Set-Content -Path "src\index.css" -Encoding UTF8

@'
import React, { useState, useRef } from 'react';

const placeholders = [
  'radial-gradient(circle at 50% 38%, #FFE7CC 0 26%, transparent 27%), linear-gradient(160deg,#FFCFA0,#FF9E5E)',
  'radial-gradient(circle at 50% 38%, #E9E1FF 0 26%, transparent 27%), linear-gradient(160deg,#B9A6FF,#6E5AE0)',
  'radial-gradient(circle at 50% 38%, #D2F5EA 0 26%, transparent 27%), linear-gradient(160deg,#7FD9C4,#2E9E86)'
];

const themes = [
  { name: 'Kucing Lucu', bg: 'linear-gradient(135deg,#FF9E5E,#FF6A2B)' },
  { name: 'Anime', bg: 'linear-gradient(135deg,#F6A6FF,#7B6CFF)' },
  { name: 'Cyberpunk', bg: 'linear-gradient(135deg,#5EE0C0,#2FA6C8)' },
  { name: 'Pop Art', bg: 'linear-gradient(135deg,#FFD86B,#FF6B6B)' },
  { name: 'Line Art', bg: 'linear-gradient(135deg,#DADADA,#7A7A7A)' },
  { name: 'Cat Air', bg: 'linear-gradient(135deg,#9AD1FF,#FFE29A)' },
];

export default function App() {
  const [activeTheme, setActiveTheme] = useState('Kucing Lucu');
  const [faceSelected, setFaceSelected] = useState(false);
  const [phIndex, setPhIndex] = useState(0);
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [showToastObj, setShowToastObj] = useState(false);
  const toastTimer = useRef<number | null>(null);

  const [generating, setGenerating] = useState(false);
  const [btnState, setBtnState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [loadingPct, setLoadingPct] = useState(0);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setShowToastObj(true);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setShowToastObj(false), 1800);
  };

  const handleThemeSelect = (name: string) => {
    setActiveTheme(name);
    showToast(Tema "" dipilih);
  };

  const toggleFaceSelect = () => {
    setFaceSelected(!faceSelected);
    showToast(!faceSelected ? 'Area wajah ditandai' : 'Seleksi wajah dilepas');
  };

  const copyStyle = () => showToast('Gaya berhasil disalin');

  const changePhoto = () => {
    setCustomPhoto(null);
    setPhIndex((prev) => (prev + 1) % placeholders.length);
    showToast('Foto diganti');
  };

  const uploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setCustomPhoto(evt.target?.result as string);
      showToast('Foto berhasil diunggah');
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = () => {
    if (generating) return;
    setGenerating(true);
    setBtnState('busy');
    setLoadingPct(0);

    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 14 + 6;
      if (p >= 100) {
        p = 100;
        clearInterval(iv);
        setLoadingPct(100);
        setTimeout(() => {
          setBtnState('done');
          showToast('Gambar vektor siap!');
          setGenerating(false);
        }, 450);
      } else {
        setLoadingPct(p);
      }
    }, 220);
  };

  const currentBg = customPhoto ? center/cover no-repeat url() : placeholders[phIndex];

  return (
    <div className="w-full min-h-screen flex items-center justify-center py-[20px] text-ink relative">
      <div className="phone-notch relative w-[390px] h-[844px] max-h-[96vh] bg-cream rounded-[52px] border-[10px] border-[#120A06] shadow-phone overflow-hidden flex flex-col">
        
        {/* Statusbar */}
        <div className="h-[46px] flex-none flex items-end justify-between px-[26px] pb-[8px] text-[13px] font-bold text-ink tracking-[0.2px]">
          <span>9:41</span>
          <div className="flex gap-[5px] items-center">
            <svg width="16" height="11" viewBox="0 0 16 11" fill="none"><rect x="0" y="6" width="3" height="5" rx="0.8" fill="currentColor"/><rect x="4.5" y="4" width="3" height="7" rx="0.8" fill="currentColor"/><rect x="9" y="2" width="3" height="9" rx="0.8" fill="currentColor"/><rect x="13.5" y="0" width="2.5" height="11" rx="0.8" fill="currentColor" opacity="0.35"/></svg>
            <svg width="22" height="11" viewBox="0 0 22 11" fill="none"><rect x="0.75" y="0.75" width="18.5" height="9.5" rx="2.5" stroke="currentColor" strokeWidth="1.2"/><rect x="2.2" y="2.2" width="14" height="6.6" rx="1.3" fill="currentColor"/><rect x="20" y="3.3" width="1.6" height="4.4" rx="0.8" fill="currentColor"/></svg>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="flex-none px-[22px] pt-[6px] pb-[14px] flex items-center justify-between">
            <div className="flex items-center gap-[10px]">
              <svg className="w-[42px] h-[42px] flex-none" viewBox="0 0 100 100" fill="none">
                <path d="M22 18 C18 8, 30 6, 36 18 L40 34 Z" fill="#fff" stroke="#2B1710" strokeWidth="4" strokeLinejoin="round"/>
                <path d="M22 18 C20 12, 27 11, 30 18 L32 27 Z" fill="#FFB4C6"/>
                <path d="M78 18 C82 8, 70 6, 64 18 L60 34 Z" fill="#fff" stroke="#2B1710" strokeWidth="4" strokeLinejoin="round"/>
                <path d="M78 18 C80 12, 73 11, 70 18 L68 27 Z" fill="#FFB4C6"/>
                <path d="M50 20 C72 20, 86 38, 82 62 C79 82, 65 90, 50 90 C35 90, 21 82, 18 62 C14 38, 28 20, 50 20 Z" fill="#fff" stroke="#2B1710" strokeWidth="4"/>
                <circle cx="38" cy="54" r="10" fill="#2B1710"/>
                <circle cx="41" cy="50" r="3" fill="#fff"/>
                <circle cx="62" cy="54" r="10" fill="#2B1710"/>
                <circle cx="65" cy="50" r="3" fill="#fff"/>
                <path d="M46 66 C48 70, 52 70, 54 66" stroke="#2B1710" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
                <path d="M50 62 L47 66 L53 66 Z" fill="#FF9EB0"/>
              </svg>
              <div className="flex flex-col leading-none">
                <span className="font-baloo font-extrabold text-[19px] text-orange-deep">Toko Cia</span>
                <span className="text-[11px] font-semibold text-ink-soft mt-[3px]">Ubah wajahmu jadi vektor</span>
              </div>
            </div>
            <div className="w-[38px] h-[38px] rounded-[14px] bg-white border border-peach-line flex items-center justify-center text-orange-deep">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2"/><path d="M19.4 13a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.9 2.9l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.6V19a2 2 0 11-4 0v-.2a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.9-2.9l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.6-1H5a2 2 0 110-4h.2a1.7 1.7 0 001.6-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.9-2.9l.1.1a1.7 1.7 0 001.9.3H11a1.7 1.7 0 001-1.6V5a2 2 0 114 0v.2a1.7 1.7 0 001 1.6 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.9 2.9l-.1.1a1.7 1.7 0 00-.3 1.9V11c.6.2 1.6.5 1.6 1.6V13z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
            </div>
          </div>

          {/* Scroll Content */}
          <div className="flex-1 min-h-0 overflow-y-auto px-[22px] pt-[2px] pb-[18px] no-scrollbar">
            
            {/* Preview Card */}
            <div className="relative rounded-[28px] p-[14px] bg-gradient-to-br from-orange-hero to-orange-deep shadow-card">
              <div className="absolute inset-0 rounded-[28px] pointer-events-none opacity-50 flash-overlay"></div>
              
              <svg className="absolute text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.7)] animate-twinkle text-gold top-[-6px] left-[-4px] w-[22px] h-[22px] z-10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z"/></svg>
              <svg className="absolute text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.7)] animate-twinkle top-[6px] right-[16px] w-[14px] h-[14px] z-10" style={{animationDelay: '.6s'}} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z"/></svg>
              <svg className="absolute text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.7)] animate-twinkle text-gold bottom-[26px] left-[-6px] w-[16px] h-[16px] z-10" style={{animationDelay: '1.1s'}} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z"/></svg>

              <div className="relative rounded-[20px] overflow-hidden aspect-square bg-[#FFD9B3] border-[3px] border-white/55">
                <div className="absolute inset-0 transition-all duration-400 ease-in-out" style={{ background: currentBg }}>
                  {!customPhoto && (
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200"><circle cx="100" cy="82" r="46" fill="#7A5B4C" opacity="0.18"/><rect x="55" y="128" width="90" height="70" rx="30" fill="#7A5B4C" opacity="0.18"/></svg>
                  )}
                </div>

                <div className="absolute top-[12px] left-[12px] bg-[#2B1710]/55 backdrop-blur-[3px] text-white text-[11px] font-semibold py-[6px] px-[10px] rounded-full flex items-center gap-[6px] z-10">
                  <span className="w-[6px] h-[6px] rounded-full bg-gold shadow-[0_0_6px_#FFC24B]"></span>Pratinjau
                </div>

                <div className={bsolute top-[26%] left-[24%] w-[52%] h-[46%] transition-all duration-250 ease-in-out pointer-events-none z-10 }>
                  <div className="absolute w-[22px] h-[22px] border-[3px] border-gold top-0 left-0 border-r-0 border-b-0 rounded-tl-[8px]"></div>
                  <div className="absolute w-[22px] h-[22px] border-[3px] border-gold top-0 right-0 border-l-0 border-b-0 rounded-tr-[8px]"></div>
                  <div className="absolute w-[22px] h-[22px] border-[3px] border-gold bottom-0 left-0 border-r-0 border-t-0 rounded-bl-[8px]"></div>
                  <div className="absolute w-[22px] h-[22px] border-[3px] border-gold bottom-0 right-0 border-l-0 border-t-0 rounded-br-[8px]"></div>
                  <div className="absolute bottom-[-30px] left-1/2 -translate-x-1/2 bg-ink text-white text-[10.5px] font-bold py-[4px] px-[9px] rounded-full whitespace-nowrap">Wajah terpilih ✓</div>
                </div>

                <div className={bsolute left-[12px] right-[12px] bottom-[12px] bg-[#180D08]/70 backdrop-blur-[4px] rounded-[16px] p-[10px_12px] flex items-center gap-[10px] pointer-events-none transition-all duration-250 ease-in-out z-20 }>
                  <svg className="w-[22px] h-[22px] flex-none animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#FFC24B" strokeWidth="2" strokeDasharray="5 4"/><circle cx="12" cy="12" r="3" fill="#FFC24B"/></svg>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-[11px] text-[#FFE7CC] font-semibold mb-[5px]">
                      <span>Menggambar vektor…</span><span>{Math.floor(loadingPct)}%</span>
                    </div>
                    <div className="h-[6px] rounded-full bg-white/20 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-gold to-white transition-all duration-150 ease-linear" style={{ width: ${loadingPct}% }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Theme Selection */}
            <div className="font-baloo font-bold text-[16px] text-ink mt-[20px] mb-[10px]">Pilih tema</div>
            <div className="flex gap-[10px] overflow-x-auto pb-[4px] no-scrollbar">
              {themes.map(t => (
                <div 
                  key={t.name}
                  onClick={() => handleThemeSelect(t.name)}
                  className={lex-none flex items-center gap-[8px] rounded-full py-[7px] pr-[14px] pl-[7px] cursor-pointer transition-all duration-150 ease-in-out active:scale-95 border-[1.5px] }
                >
                  <span className={w-[26px] h-[26px] rounded-full border-2 border-white flex-none } style={{ background: t.bg }}></span>
                  <span className="text-[12.5px] font-semibold whitespace-nowrap">{t.name}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="font-baloo font-bold text-[16px] text-ink mt-[20px] mb-[10px]">Kelola foto</div>
            <div className="grid grid-cols-2 gap-[10px]">
              
              <label className="flex items-center gap-[10px] bg-white border-[1.5px] border-peach-line rounded-[18px] p-[12px] cursor-pointer text-left transition-all duration-150 ease-in-out active:scale-95 hover:bg-peach/30">
                <span className="w-[34px] h-[34px] flex-none rounded-[11px] bg-peach flex items-center justify-center text-orange-deep">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 16V4M12 4l-5 5M12 4l5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                </span>
                <span className="flex flex-col leading-[1.15] min-w-0">
                  <span className="text-[13px] font-bold text-ink">Unggah foto</span>
                  <span className="text-[10.5px] text-ink-soft font-medium">Dari galeri</span>
                </span>
                <input type="file" className="hidden" accept="image/*" onChange={uploadPhoto} />
              </label>

              <div onClick={changePhoto} className="flex items-center gap-[10px] bg-white border-[1.5px] border-peach-line rounded-[18px] p-[12px] cursor-pointer text-left transition-all duration-150 ease-in-out active:scale-95 hover:bg-peach/30">
                <span className="w-[34px] h-[34px] flex-none rounded-[11px] bg-peach flex items-center justify-center text-orange-deep">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M20 12a8 8 0 10-2.6 5.9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/><path d="M20 5v5h-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                <span className="flex flex-col leading-[1.15] min-w-0">
                  <span className="text-[13px] font-bold text-ink">Ganti foto</span>
                  <span className="text-[10.5px] text-ink-soft font-medium">Pilih ulang</span>
                </span>
              </div>

              <div onClick={toggleFaceSelect} className={lex items-center gap-[10px] border-[1.5px] rounded-[18px] p-[12px] cursor-pointer text-left transition-all duration-150 ease-in-out active:scale-95 }>
                <span className={w-[34px] h-[34px] flex-none rounded-[11px] flex items-center justify-center transition-colors }>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2.2"/><rect x="14" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2.2"/><rect x="4" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2.2"/><rect x="14" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2.2"/></svg>
                </span>
                <span className="flex flex-col leading-[1.15] min-w-0">
                  <span className="text-[13px] font-bold text-ink">Seleksi wajah</span>
                  <span className="text-[10.5px] text-ink-soft font-medium">Tandai area</span>
                </span>
              </div>

              <div onClick={copyStyle} className="flex items-center gap-[10px] bg-white border-[1.5px] border-peach-line rounded-[18px] p-[12px] cursor-pointer text-left transition-all duration-150 ease-in-out active:scale-95 hover:bg-peach/30">
                <span className="w-[34px] h-[34px] flex-none rounded-[11px] bg-peach flex items-center justify-center text-orange-deep">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2.2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" strokeWidth="2.2"/></svg>
                </span>
                <span className="flex flex-col leading-[1.15] min-w-0">
                  <span className="text-[13px] font-bold text-ink">Salin gaya</span>
                  <span className="text-[10.5px] text-ink-soft font-medium">Simpan preset</span>
                </span>
              </div>

            </div>
          </div>

          {/* Bottom CTA */}
          <div className="flex-none pt-[14px] px-[22px] pb-[calc(18px+env(safe-area-inset-bottom,0px))] bg-gradient-to-b from-cream/0 to-[30%] to-cream">
            <button 
              onClick={handleGenerate}
              className={
elative w-full rounded-full py-[16px] px-[20px] text-white font-baloo font-bold text-[16px] flex items-center justify-center gap-[9px] cursor-pointer overflow-hidden transition-all duration-200 active:translate-y-[1px] }
            >
              {btnState !== 'done' && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z"/></svg>
              )}
              {btnState === 'idle' && 'Buat gambar vektor'}
              {btnState === 'busy' && 'Sedang menggambar…'}
              {btnState === 'done' && 'Selesai — unduh hasil'}
            </button>
          </div>

          {/* Toast */}
          <div className={bsolute left-1/2 bottom-[110px] -translate-x-1/2 bg-ink text-white text-[12.5px] font-semibold py-[10px] px-[16px] rounded-full whitespace-nowrap pointer-events-none transition-all duration-200 z-50 }>
            {toastMsg}
          </div>

        </div>
      </div>
    </div>
  );
}
'@ | Set-Content -Path "src\App.tsx" -Encoding UTF8

Write-Host "Files generated. Installing dependencies..."
npm install
