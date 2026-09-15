import { useState, useEffect } from 'react';

const GUIDE_TEXT = "Halo! Selamat datang di Toko Cia. Yuk, unggah fotomu, seleksi detail wajah dan pilih palet warna yang kamu suka. Setelah itu klik konfirmasi pesanan apabila sudah sesuai.";

export default function GuideCard({ startTyping }: { startTyping: boolean }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!startTyping) return;
    
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(GUIDE_TEXT.substring(0, i));
      i++;
      if (i > GUIDE_TEXT.length) clearInterval(interval);
    }, 50);
    
    return () => clearInterval(interval);
  }, [startTyping]);

  useEffect(() => {
    if (!startTyping) return;

    const handleInteraction = () => {
      setIsVisible(false);
    };
    
    const timer = setTimeout(() => {
      window.addEventListener('pointerdown', handleInteraction, { once: true });
      window.addEventListener('keydown', handleInteraction, { once: true });
      window.addEventListener('wheel', handleInteraction, { once: true });
    }, 1500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('wheel', handleInteraction);
    };
  }, [startTyping]);

  if (!isVisible) return null;

  return (
    <div className={`absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 z-[150] w-[90%] max-w-lg pointer-events-none transition-all duration-700 ${startTyping ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="bg-[#4A2810]/70 backdrop-blur-md border-2 border-dashed border-[#D2B48C] rounded-2xl p-4 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <p style={{ fontFamily: '"VT323", monospace' }} className="text-[#FFE3D0] text-[1.2rem] sm:text-[1.4rem] leading-[1.3] drop-shadow-md">
          {displayedText}
          <span className="animate-pulse text-[#D2B48C]">_</span>
        </p>
      </div>
    </div>
  );
}
