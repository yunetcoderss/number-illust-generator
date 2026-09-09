import React, { useState, useRef, useEffect } from 'react';
import { processImageToLineart } from './lib/image-processor';
import { User, Camera, Moon, Sunset, Coffee, Flower2, ImagePlus, Brush, Download, Loader2, PaintBucket, Hand, ZoomIn, ZoomOut, Undo2, Redo2, Copy } from 'lucide-react';
import Frame3D from './Frame3D';

const themes = [
  { name: 'Natural', icon: User, bg: 'linear-gradient(135deg,#D2B48C,#8B4513)', colors: [[36, 17, 10], [105, 41, 28], [179, 99, 71], [227, 155, 118], [255, 213, 186], [255, 246, 240]] },
  { name: 'Sinematik', icon: Camera, bg: 'linear-gradient(135deg,#234E70,#E08F62)', colors: [[10, 25, 47], [35, 78, 112], [166, 88, 88], [224, 143, 98], [252, 206, 154], [250, 244, 237]] },
  { name: 'Monokrom', icon: Moon, bg: 'linear-gradient(135deg,#A9A9A9,#000000)', colors: [[20, 20, 22], [65, 65, 70], [120, 120, 125], [175, 175, 180], [225, 225, 230], [255, 255, 255]] },
  { name: 'Senja', icon: Sunset, bg: 'linear-gradient(135deg,#FFD86B,#FF6B6B)', colors: [[74, 30, 92], [168, 48, 104], [235, 96, 91], [249, 168, 79], [253, 228, 141], [252, 252, 252]] },
  { name: 'Kopi', icon: Coffee, bg: 'linear-gradient(135deg,#D4A373,#5C3A21)', colors: [[41, 23, 15], [87, 54, 37], [145, 99, 70], [201, 153, 119], [237, 204, 175], [255, 245, 235]] },
  { name: 'Sakura', icon: Flower2, bg: 'linear-gradient(135deg,#FFB4C6,#FF9EB0)', colors: [[43, 19, 26], [115, 52, 69], [184, 108, 123], [227, 163, 175], [250, 212, 220], [255, 245, 247]] },
];

import { saveOrderToFirebase, getOrderFromFirebase } from './lib/firebase';

export default function App() {
  const [activeTheme, setActiveTheme] = useState('Natural');

  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [coloredPhoto, setColoredPhoto] = useState<string | null>(null);
  const [guidePhoto, setGuidePhoto] = useState<string | null>(null);
  const [lineartPhoto, setLineartPhoto] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const [isBrushing, setIsBrushing] = useState(false);
  const [brushSize, setBrushSize] = useState(40);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPortrait, setIsPortrait] = useState(true);
  const [activeTool, setActiveTool] = useState<'brush' | 'pan'>('brush');
  const brushCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const isPanning = useRef(false);
  const lastPanPoint = useRef({ x: 0, y: 0 });

  const handleFrameClick = () => {
    if (!customPhoto && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const [toastMsg, setToastMsg] = useState('');
  const [showToastObj, setShowToastObj] = useState(false);
  const toastTimer = useRef<number | null>(null);

  const [generating, setGenerating] = useState(false);
  const [btnState, setBtnState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [loadingPct, setLoadingPct] = useState(0);
  const [loadingText, setLoadingText] = useState('Menggambar vektor...');

  const [hasSelectedTheme, setHasSelectedTheme] = useState(true);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/unduh/')) {
      const code = path.split('/')[2];
      if (code && code.length > 0) {
        loadOrder(code);
      }
    }
  }, []);

  const loadOrder = async (code: string) => {
    setBtnState('busy');
    setLoadingText('Mencari pesanan...');
    setLoadingPct(30);

    const res = await getOrderFromFirebase(code.toUpperCase());
    if (res.success && res.data) {
      const fixUrl = (url?: string) => {
        if (!url) return null;
        return url.includes('i.ibb.co/') ? url.replace('i.ibb.co/', 'i.ibb.co.com/') : url;
      };

      const finalGuideUrl = fixUrl(res.data.guideUrl) || fixUrl(res.data.coloredUrl);
      const finalLinUrl = fixUrl(res.data.lineartUrl);

      setLoadingPct(100);
      setCustomPhoto(finalGuideUrl); // use guide photo as background for framing
      setGuidePhoto(finalGuideUrl);
      setLineartPhoto(finalLinUrl);
      setColoredPhoto(null);
      setActiveTheme(themes[res.data.paletteNumber - 1]?.name || 'Natural');
      setOrderCode(res.data.orderCode);
      setBtnState('done');
      showToast('Pesanan siap diunduh!');
    } else {
      setBtnState('idle');
      showToast((res.error as string) || 'Pesanan tidak ditemukan');
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setShowToastObj(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setShowToastObj(false), 2500);
  };

  const copyToClipboard = async (text: string) => {
    if (!navigator.clipboard) {
      fallbackCopy(text);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast('Kode disalin ke clipboard!');
    } catch (err) {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) showToast('Kode disalin ke clipboard!');
      else showToast('Gagal menyalin, silakan blok teks manual');
    } catch (err) {
      showToast('Gagal menyalin, silakan blok teks manual');
    }
    document.body.removeChild(textArea);
  };

  const handleThemeSelect = async (name: string) => {
    setActiveTheme(name);
    setHasSelectedTheme(true);
    showToast(`Tema "${name}" dipilih`);
    if (customPhoto && !generating) {
      await generateIllustration(name);
    }
  };

  const toggleBrush = () => {
    if (coloredPhoto) {
      setColoredPhoto(null);
      setLineartPhoto(null);

      setBtnState('idle');
      setIsBrushing(true);
      showToast('Kembali ke mode kuas');
      return;
    }
    setIsBrushing(!isBrushing);
    showToast(!isBrushing ? 'Mode kuas aktif: seleksi area detail' : 'Mode kuas dinonaktifkan');
  };

  const saveHistory = () => {
    if (brushCanvasRef.current) {
      const data = brushCanvasRef.current.toDataURL();
      const newHistory = history.slice(0, historyStep + 1);
      newHistory.push(data);
      setHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
    }
  };

  const restoreCanvas = (dataUrl: string | null) => {
    const canvas = brushCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (dataUrl) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = dataUrl;
    }
  };

  const undo = () => {
    if (historyStep > 0) {
      const step = historyStep - 1;
      setHistoryStep(step);
      restoreCanvas(history[step]);
    } else if (historyStep === 0) {
      setHistoryStep(-1);
      restoreCanvas(null);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const step = historyStep + 1;
      setHistoryStep(step);
      restoreCanvas(history[step]);
    }
  };

  const handlePointerDown = (e: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
    if (!isBrushing || !brushCanvasRef.current) return;
    
    let clientX, clientY;
    if ('touches' in e && (e as any).touches?.length > 0) {
      clientX = (e as any).touches[0].clientX;
      clientY = (e as any).touches[0].clientY;
    } else {
      clientX = (e as any).clientX;
      clientY = (e as any).clientY;
    }

    if (activeTool === 'brush') {
      isDrawing.current = true;
      handlePointerMove(e);
    } else if (activeTool === 'pan') {
      isPanning.current = true;
      lastPanPoint.current = { x: clientX, y: clientY };
    }
  };

  const handlePointerMove = (e: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
    if (!brushCanvasRef.current) return;
    
    let clientX, clientY;
    if ('touches' in e && (e as any).touches?.length > 0) {
      clientX = (e as any).touches[0].clientX;
      clientY = (e as any).touches[0].clientY;
    } else {
      clientX = (e as any).clientX;
      clientY = (e as any).clientY;
    }

    if (activeTool === 'brush' && isDrawing.current) {
      const canvas = brushCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;

      // Scale the native brush size so the visual stroke size remains constant on screen
      ctx.lineWidth = brushSize * scaleX;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(255, 0, 0, 1)';
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else if (activeTool === 'pan' && isPanning.current) {
      const dx = clientX - lastPanPoint.current.x;
      const dy = clientY - lastPanPoint.current.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPanPoint.current = { x: clientX, y: clientY };
    }
  };

  const handlePointerUp = () => {
    if (activeTool === 'brush' && isDrawing.current) {
      isDrawing.current = false;
      if (brushCanvasRef.current) {
        brushCanvasRef.current.getContext('2d')?.beginPath();
        saveHistory();
      }
    } else if (activeTool === 'pan') {
      isPanning.current = false;
    }
  };

  const uploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setGenerating(false);
    setBtnState('idle');
    setColoredPhoto(null);
    setGuidePhoto(null);
    setLineartPhoto(null);
    setHasSelectedTheme(false);
    setIsBrushing(false);

    if (brushCanvasRef.current) {
      const ctx = brushCanvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, brushCanvasRef.current.width, brushCanvasRef.current.height);
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const portrait = img.height > img.width;
        setIsPortrait(portrait);
        const A5_W = portrait ? 1748 : 2480;
        const A5_H = portrait ? 2480 : 1748;
        const MARGIN = 177;
        const INNER_W = A5_W - (MARGIN * 2);
        const INNER_H = A5_H - (MARGIN * 2);
        
        const canvas = document.createElement('canvas');
        canvas.width = A5_W;
        canvas.height = A5_H;
        const ctx = canvas.getContext('2d')!;
        
        // Fill white margin
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, A5_W, A5_H);
        
        // Center crop the image into the inner area
        const imgRatio = img.width / img.height;
        const targetRatio = INNER_W / INNER_H;
        let sWidth = img.width;
        let sHeight = img.height;
        let sx = 0;
        let sy = 0;
        
        if (imgRatio > targetRatio) {
            sWidth = img.height * targetRatio;
            sx = (img.width - sWidth) / 2;
        } else {
            sHeight = img.width / targetRatio;
            sy = (img.height - sHeight) / 2;
        }
        
        ctx.drawImage(img, sx, sy, sWidth, sHeight, MARGIN, MARGIN, INNER_W, INNER_H);
        
        setCustomPhoto(canvas.toDataURL('image/jpeg', 0.95));
        showToast('Foto berhasil diunggah dengan proporsi A5!');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const downloadFiles = () => {
    if (guidePhoto && lineartPhoto) {
      if (guidePhoto.startsWith('http')) {
        showToast('Membuka 2 tab baru untuk mengunduh...');
        window.open(lineartPhoto, '_blank');
        window.open(guidePhoto, '_blank');
      } else {
        const a = document.createElement('a');
        a.href = lineartPhoto;
        a.download = 'vektor-lineart.jpg';
        a.click();
        
        setTimeout(() => {
          const b = document.createElement('a');
          b.href = guidePhoto;
          b.download = 'petunjuk-pewarnaan.jpg';
          b.click();
          showToast('2 File (Petunjuk & Lineart) diunduh!');
        }, 500);
      }
    } else if (guidePhoto) {
      if (guidePhoto.startsWith('http')) {
        showToast('Membuka gambar petunjuk untuk disimpan...');
        window.open(guidePhoto, '_blank');
      } else {
        const a = document.createElement('a');
        a.href = guidePhoto;
        a.download = 'petunjuk-pewarnaan.jpg';
        a.click();
      }
    }
  };

  const handleConfirmOrder = async () => {
    if (!guidePhoto || !lineartPhoto) return;
    setIsConfirming(true);
    showToast('Sedang mengirim pesanan ke Cloud...');
    
    const themeIndex = themes.findIndex(t => t.name === activeTheme) + 1;
    const uploadRes = await saveOrderToFirebase(guidePhoto, lineartPhoto, themeIndex);
    
    setIsConfirming(false);
    if (uploadRes.success) {
      setOrderCode(uploadRes.orderCode!);
      setShowOrderModal(true);
      showToast('Berhasil dikonfirmasi!');
    } else {
      showToast(`Gagal: ${uploadRes.error}`);
    }
  };

  const generateIllustration = async (themeName: string) => {
    if (!customPhoto) {
      showToast('Unggah foto terlebih dahulu!');
      return;
    }

    setGenerating(true);
    setBtnState('busy');
    setLoadingPct(0);

    const themeObj = themes.find(t => t.name === themeName) || themes[0];

    try {
      let maskData = null;
      if (brushCanvasRef.current && brushCanvasRef.current.width > 0) {
        maskData = brushCanvasRef.current.toDataURL('image/webp', 0.5);
      }
      const result = await processImageToLineart(
        customPhoto, 
        themeObj.colors, 
        maskData,
        (pct, msg) => {
          setLoadingPct(pct);
          setLoadingText(msg);
        }
      );

      setCustomPhoto(result.colored);
      setColoredPhoto(result.colored);
      setGuidePhoto(result.guide);
      setLineartPhoto(result.lineart);
      setIsBrushing(false); // Exit brush mode so Frame3D can show
      setBtnState('done');

      showToast('Ilustrasi siap! Silakan konfirmasi pesanan.');
    } catch {
      showToast('Gagal memproses gambar');
      setBtnState('idle');
    }

    setGenerating(false);
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-[#090714] text-ink flex items-center justify-center select-none">
      <div className="relative w-full h-[100dvh]">
        <div className="absolute inset-0 rounded-none sm:rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.5)] bg-black">
          {/* Hidden file input for frame click upload */}
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={uploadPhoto} />

          {/* 3D Frame Presentation (Always shown by default now) */}
          {!isBrushing && (
            <Frame3D 
              imageUrl={coloredPhoto || customPhoto || '/default_photo.jpg'} 
              onFrameClick={handleFrameClick}
            />
          )}

          {/* Always mount customPhoto and brushCanvas to preserve strokes */}
          {customPhoto && (
            <div 
              className={`absolute inset-0 w-full h-full flex items-center justify-center transition-opacity duration-300 ${(coloredPhoto || (!isBrushing && customPhoto)) ? 'opacity-0 pointer-events-none z-0' : 'opacity-100 z-20'}`}
              onWheel={(e) => {
                if (isBrushing) {
                  const delta = e.deltaY < 0 ? 0.15 : -0.15;
                  setZoomLevel(z => Math.max(0.1, Math.min(10, z + (z * delta))));
                }
              }}
            >
              <div 
                className="relative transition-transform duration-75 touch-none"
                style={{ 
                  transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                  aspectRatio: isPortrait ? '1748/2480' : '2480/1748',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  height: isPortrait ? '100%' : 'auto',
                  width: isPortrait ? 'auto' : '100%',
                  cursor: activeTool === 'brush' ? 'crosshair' : 'grab'
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                <img 
                  src={customPhoto} 
                  className="absolute inset-0 w-full h-full pointer-events-none" 
                  draggable={false}
                  onLoad={(e) => {
                    const imgEl = e.currentTarget;
                    if (brushCanvasRef.current && brushCanvasRef.current.width !== imgEl.naturalWidth) {
                      brushCanvasRef.current.width = imgEl.naturalWidth;
                      brushCanvasRef.current.height = imgEl.naturalHeight;
                    }
                  }}
                />
                <canvas 
                  ref={brushCanvasRef}
                  className="absolute inset-0 w-full h-full opacity-60 mix-blend-screen touch-none pointer-events-none z-20"
                />
              </div>
            </div>
          )}

        </div>

        {/* ==== UI CONSTRAINED WRAPPER ==== */}
        <div className="absolute inset-0 mx-auto max-w-5xl w-full h-full pointer-events-none">
          {/* ===== TOP: Logo Bar (floating inside photo) ===== */}
          <div className="absolute top-0 left-0 right-0 z-30 p-3 sm:p-4 flex items-center justify-between bg-gradient-to-b from-black/50 via-black/20 to-transparent pointer-events-none">
            <div className="flex items-center pointer-events-auto">
              <img src="/logo.png" alt="Logo" className="w-16 h-16 sm:w-20 sm:h-20 flex-none drop-shadow-lg object-contain" />
            </div>
            
            {orderCode && (
              <div className="flex items-center gap-2 bg-[#8B5CF6] text-white text-xs font-bold py-1.5 px-3 rounded-xl pointer-events-auto shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                <span className="opacity-80">Pesanan:</span> {orderCode}
              </div>
            )}
          </div>

        {/* ===== LEFT: Icon Theme Selector (floating vertical, inside photo) ===== */}
        <div className="absolute left-1.5 sm:left-3 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1.5 sm:gap-2.5 items-start pointer-events-none">
          
          {/* Tooltip Pilih Warna */}
          {customPhoto && !hasSelectedTheme && (
            <div className="relative mb-2 animate-bounce pointer-events-none drop-shadow-md">
              <div className="bg-[#8B5CF6] animate-pulse text-white text-[10px] sm:text-xs font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 whitespace-nowrap">
                <PaintBucket size={14} strokeWidth={2.5} />
                Pilih Warna
              </div>
            </div>
          )}

          {themes.map((t, index) => (
            <div
              key={t.name}
              onClick={() => handleThemeSelect(t.name)}
              className={`group relative w-10 h-10 sm:w-12 sm:h-12 cursor-pointer transition-all duration-200 ease-in-out active:scale-95 border-2 flex items-center justify-center rounded-2xl pointer-events-auto ${
                activeTheme === t.name
                  ? 'border-white shadow-[0_0_12px_rgba(255,255,255,0.5)] scale-110'
                  : 'border-white/30 hover:border-white/60 hover:scale-105'
              }`}
              style={{ background: t.bg }}
            >
              <span className={`text-xl font-black drop-shadow-md transition-all duration-200 ${activeTheme === t.name ? 'text-white scale-110' : 'text-white/80'}`}>
                {index + 1}
              </span>
              
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-sm text-white text-[11px] font-semibold py-1 px-2.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150">
                {t.name}
              </div>
            </div>
          ))}
        </div>

        {/* ===== RIGHT: Action Buttons (floating vertical, inside photo) ===== */}
        <div className="absolute right-1.5 sm:right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1.5 sm:gap-2.5 items-end pointer-events-none">

          {!customPhoto && (
            <label
              title="Unggah / Ganti Foto"
              className="group relative w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-black/40 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white cursor-pointer transition-all duration-150 active:scale-90 hover:bg-black/60 pointer-events-auto"
            >
              <ImagePlus size={18} strokeWidth={2} />
              {/* Keep this file input attached to the floating button, but we also have the hidden one in root */}
              <input type="file" className="hidden" accept="image/*" onChange={uploadPhoto} />
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-sm text-white text-[11px] font-semibold py-1 px-2.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150">Unggah Foto</div>
            </label>
          )}

          {/* Brush Tool Group */}
          {customPhoto && (
            <div className="relative flex flex-col items-end gap-2 pointer-events-auto">
              {/* Tooltip Detail Wajah */}
              {!isBrushing && history.length === 0 && (
                <div className="relative animate-bounce pointer-events-none drop-shadow-md mt-2">
                  <div className="bg-[#8B5CF6] animate-pulse text-white text-[10px] sm:text-xs font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 whitespace-nowrap">
                    <Brush size={14} strokeWidth={2.5} />
                    Detail Wajah
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className={`overflow-hidden transition-all duration-300 flex items-center bg-black/40 backdrop-blur-sm rounded-xl px-2 border border-white/10 ${isBrushing ? 'w-24 sm:w-32 h-9 sm:h-11 opacity-100' : 'w-0 h-9 sm:h-11 opacity-0 pointer-events-none'}`}>
                  <input 
                     type="range" min="10" max="100" 
                     value={brushSize} 
                     onChange={(e) => setBrushSize(Number(e.target.value))}
                     className="w-full accent-[#8B5CF6]"
                  />
                </div>
                
                <div
                  onClick={toggleBrush}
                  title="Mode Seleksi"
                  className={`group relative w-9 h-9 sm:w-11 sm:h-11 rounded-2xl backdrop-blur-sm border flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-90 ${
                    isBrushing && !coloredPhoto
                      ? 'bg-[#8B5CF6]/90 border-[#8B5CF6] text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                      : 'bg-black/40 border-white/15 text-white hover:bg-black/60'
                  }`}
                >
                  <Brush size={18} strokeWidth={2} />
                  <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-sm text-white text-[11px] font-semibold py-1 px-2.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150">
                    {coloredPhoto ? 'Edit Detail' : 'Kuas Detail'}
                  </div>
                </div>
              </div>

              {/* Extended Tools for Brush Mode */}
              {isBrushing && !coloredPhoto && (
                <>
                  {/* Tool Panel: Brush & Pan */}
                  <div className="flex bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden shadow-lg mt-1">
                    <div 
                      onClick={() => setActiveTool('brush')}
                      className={`w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center cursor-pointer transition-colors ${activeTool === 'brush' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'}`}
                      title="Kuas"
                    >
                      <Brush size={16} />
                    </div>
                    <div className="w-[1px] bg-white/10"></div>
                    <div 
                      onClick={() => setActiveTool('pan')}
                      className={`w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center cursor-pointer transition-colors ${activeTool === 'pan' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'}`}
                      title="Geser Canvas"
                    >
                      <Hand size={16} />
                    </div>
                  </div>

                  {/* Tool Panel: Zoom Out & In */}
                  <div className="flex bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden shadow-lg mt-1">
                    <div 
                      onClick={() => setZoomLevel(z => Math.max(0.2, z - 0.5))}
                      className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center cursor-pointer text-white/80 hover:text-white transition-colors"
                      title="Zoom Out"
                    >
                      <ZoomOut size={16} />
                    </div>
                    <div className="w-[1px] bg-white/10"></div>
                    <div 
                      onClick={() => setZoomLevel(z => Math.min(10, z + 0.5))}
                      className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center cursor-pointer text-white/80 hover:text-white transition-colors"
                      title="Zoom In"
                    >
                      <ZoomIn size={16} />
                    </div>
                  </div>
                  
                  {/* Tool Panel: Undo & Redo */}
                  <div className="flex bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden shadow-lg mt-1">
                    <div 
                      onClick={undo}
                      className={`w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center cursor-pointer transition-colors ${historyStep >= 0 ? 'text-white/80 hover:text-white' : 'text-white/20 pointer-events-none'}`}
                      title="Undo"
                    >
                      <Undo2 size={16} />
                    </div>
                    <div className="w-[1px] bg-white/10"></div>
                    <div 
                      onClick={redo}
                      className={`w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center cursor-pointer transition-colors ${historyStep < history.length - 1 ? 'text-white/80 hover:text-white' : 'text-white/20 pointer-events-none'}`}
                      title="Redo"
                    >
                      <Redo2 size={16} />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}


        </div>

        {/* ===== Loading Progress Overlay ===== */}
        <div className={`absolute left-3 right-3 sm:left-4 sm:right-4 bottom-20 sm:bottom-24 bg-black/60 backdrop-blur-md rounded-2xl p-2.5 sm:p-4 flex items-center gap-2.5 pointer-events-none transition-all duration-300 ease-in-out z-30 ${btnState === 'busy' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 flex-none animate-spin text-[#C084FC]" />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-[10px] sm:text-xs text-white/80 font-semibold mb-1">
              <span>{loadingText}</span><span>{Math.floor(loadingPct)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#C084FC] to-white transition-all duration-150 ease-linear" style={{ width: `${loadingPct}%` }}></div>
            </div>
          </div>
        </div>

        {/* ===== BOTTOM: Paste & Download Button (floating inside photo) ===== */}
        <div className={`absolute bottom-0 left-0 right-0 z-[100] p-3 sm:p-4 pb-[calc(10px+env(safe-area-inset-bottom,0px))] bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-all duration-300 ${(btnState === 'done') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <div className="flex flex-col gap-2 pointer-events-auto">
            {btnState === 'done' && !orderCode && (
              <button
                onClick={handleConfirmOrder}
                disabled={isConfirming}
                className={`relative w-full rounded-xl py-3 px-5 text-white font-baloo font-bold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer overflow-hidden transition-all duration-200 active:translate-y-[1px] backdrop-blur-sm bg-gradient-to-br from-[#8B5CF6] to-[#5B21B6] shadow-none hover:brightness-110 ${isConfirming ? 'opacity-70 pointer-events-none' : ''}`}
              >
                {isConfirming ? <Loader2 className="w-5 h-5 animate-spin" /> : <PaintBucket size={18} strokeWidth={2.5} />}
                {isConfirming ? 'Mengirim Pesanan...' : 'Konfirmasi Pesanan'}
              </button>
            )}
            {btnState === 'done' && orderCode && (
              <button
                onClick={downloadFiles}
                className="relative w-full rounded-xl py-3 px-5 text-white font-baloo font-bold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer overflow-hidden transition-all duration-200 active:translate-y-[1px] backdrop-blur-sm bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] shadow-none hover:brightness-110"
              >
                <Download size={18} strokeWidth={2.5} />
                {lineartPhoto ? 'Unduh 2 File (Petunjuk & Lineart)' : 'Unduh Petunjuk Pewarnaan'}
              </button>
            )}
          </div>
        </div>

      </div>

      </div>

      {/* ===== Order Success Modal ===== */}
      {showOrderModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#090714] border border-[#8B5CF6] rounded-xl p-6 max-w-sm w-full flex flex-col items-center text-center">
            <h2 className="text-xl font-baloo font-bold text-white mb-2">Pesanan Sukses</h2>
            <p className="text-sm text-white/70 mb-6">Berikan kode unik ini kepada Seller.</p>
            
            <div className="w-full bg-black border border-white/20 rounded-lg p-4 flex items-center justify-between mb-6">
              <span className="font-mono text-xl font-bold text-[#C084FC] tracking-widest select-text">{orderCode}</span>
              <button 
                onClick={() => copyToClipboard(orderCode || '')}
                className="bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/40 p-2 rounded-lg text-white"
                title="Salin Kode"
              >
                <Copy size={18} />
              </button>
            </div>
            
            <button 
              onClick={() => setShowOrderModal(false)}
              className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold py-3 rounded-lg"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ===== Toast ===== */}
      <div className={`fixed left-1/2 bottom-24 sm:bottom-28 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-xs sm:text-[12.5px] font-semibold py-2 px-3.5 rounded-full whitespace-nowrap pointer-events-none transition-all duration-200 z-[150] ${showToastObj ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2.5'}`}>
        {toastMsg}
      </div>
    </div>
  );
}
