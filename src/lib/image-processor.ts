export type ColorPalette = { name: string; bg: string; colors: number[][] };

export type ProcessResult = {
  colored: string;   // colored illustration data URL (for preview in 3D frame)
  guide: string;     // coloring guide data URL (for download)
  lineart: string;   // numbered lineart data URL (for download)
};

export async function processImageToLineart(
  imgBase64: string,
  themeColors: number[][] | null,
  maskBase64: string | null,
  onProgress: (pct: number, text: string) => void
): Promise<ProcessResult> {
    
    const img = new Image();
    await new Promise(r => { img.onload = r; img.src = imgBase64; });

    // The uploaded image is ALREADY formatted to A5 with a 177px margin by App.tsx.
    const isPortrait = img.height > img.width;
    const A5_W = isPortrait ? 1748 : 2480;
    const A5_H = isPortrait ? 2480 : 1748;
    const MARGIN = 177;
    const INNER_W = A5_W - (MARGIN * 2);
    const INNER_H = A5_H - (MARGIN * 2);

    const canvas = document.createElement('canvas');
    canvas.width = INNER_W;
    canvas.height = INNER_H;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    
    onProgress(5, 'Menyiapkan ukuran kertas A5...');
    await yieldToMain();

    // 1. Draw blurred background (low detail) with enhanced contrast & saturation
    ctx.filter = 'contrast(125%) saturate(115%) blur(8px)';
    ctx.drawImage(img, MARGIN, MARGIN, INNER_W, INNER_H, 0, 0, INNER_W, INNER_H);
    const blurredData = ctx.getImageData(0, 0, INNER_W, INNER_H).data;

    // 2. Draw sharp image (high detail) with enhanced contrast & sharpness
    ctx.filter = 'contrast(125%) saturate(115%) blur(0.5px)';
    ctx.drawImage(img, MARGIN, MARGIN, INNER_W, INNER_H, 0, 0, INNER_W, INNER_H);
    const sharpData = ctx.getImageData(0, 0, INNER_W, INNER_H).data;

    // 3. Extract mask if brush was used
    let maskData: Uint8ClampedArray | null = null;
    if (maskBase64) {
        const maskImg = new Image();
        await new Promise(r => { maskImg.onload = r; maskImg.src = maskBase64; });
        ctx.filter = 'none';
        ctx.clearRect(0, 0, INNER_W, INNER_H);
        ctx.drawImage(maskImg, MARGIN, MARGIN, INNER_W, INNER_H, 0, 0, INNER_W, INNER_H);
        maskData = ctx.getImageData(0, 0, INNER_W, INNER_H).data;
    }

    // Combine pixels based on mask
    ctx.clearRect(0, 0, INNER_W, INNER_H);
    const combinedImgData = ctx.createImageData(INNER_W, INNER_H);
    const data = combinedImgData.data;
    for (let i = 0; i < data.length; i += 4) {
        const isDetailed = maskData && maskData[i + 3] > 10;
        
        if (isDetailed) {
            // Lift shadows (gamma correction) for brushed areas to prevent dark face details 
            // from merging with unbrushed black hair/backgrounds during K-Means
            const r = sharpData[i];
            const g = sharpData[i+1];
            const b = sharpData[i+2];
            data[i] = Math.pow(r / 255, 0.7) * 255;
            data[i+1] = Math.pow(g / 255, 0.7) * 255;
            data[i+2] = Math.pow(b / 255, 0.7) * 255;
        } else {
            data[i] = blurredData[i];
            data[i+1] = blurredData[i+1];
            data[i+2] = blurredData[i+2];
        }
        data[i+3] = 255;
    }
    
    let paletteColors: number[][] = themeColors ? JSON.parse(JSON.stringify(themeColors)) : [];

    if (!paletteColors || paletteColors.length === 0) {
        onProgress(15, 'Mengekstrak warna asli (AI)...');
        await yieldToMain();
        
        // Fast K-Means to find 6 dominant colors
        const colorCount = 6;
        const sampleStep = Math.max(4, Math.floor((data.length / 4) / 5000) * 4); // Sample ~5000 pixels
        let centroids: number[][] = [];
        
        // Find all brushed pixels to prioritize them
        const brushedIndices: number[] = [];
        if (maskData) {
            for (let i = 0; i < data.length; i += 4) {
                if (maskData[i + 3] > 10) brushedIndices.push(i);
            }
        }
        
        for (let i = 0; i < colorCount; i++) {
            let idx;
            if (brushedIndices.length > 100) {
                // If brush was used, pick 4 out of 6 colors strictly from the brushed area to preserve face details
                if (i < 4) {
                    idx = brushedIndices[Math.floor(Math.random() * brushedIndices.length)];
                } else {
                    idx = Math.floor(Math.random() * (data.length / 4)) * 4;
                }
            } else {
                idx = Math.floor(Math.random() * (data.length / 4)) * 4;
            }
            centroids.push([data[idx], data[idx+1], data[idx+2]]);
        }
        
        for (let iter = 0; iter < 10; iter++) {
            const clusters = Array.from({length: colorCount}, () => ({ r: 0, g: 0, b: 0, count: 0 }));
            
            for (let i = 0; i < data.length; i += sampleStep) {
                const r = data[i], g = data[i+1], b = data[i+2];
                let minDist = Infinity;
                let bestIdx = 0;
                for (let j = 0; j < colorCount; j++) {
                    const dr = r - centroids[j][0];
                    const dg = g - centroids[j][1];
                    const db = b - centroids[j][2];
                    const dist = dr*dr + dg*dg + db*db;
                    if (dist < minDist) { minDist = dist; bestIdx = j; }
                }
                
                // Heavily weight brushed pixels (50x) so K-Means clusters gravitate towards face details
                const weight = (maskData && maskData[i + 3] > 10) ? 50 : 1;
                
                clusters[bestIdx].r += r * weight;
                clusters[bestIdx].g += g * weight;
                clusters[bestIdx].b += b * weight;
                clusters[bestIdx].count += weight;
            }
            
            let changed = false;
            for (let j = 0; j < colorCount; j++) {
                if (clusters[j].count > 0) {
                    const newR = Math.round(clusters[j].r / clusters[j].count);
                    const newG = Math.round(clusters[j].g / clusters[j].count);
                    const newB = Math.round(clusters[j].b / clusters[j].count);
                    if (newR !== centroids[j][0] || newG !== centroids[j][1] || newB !== centroids[j][2]) {
                        changed = true;
                    }
                    centroids[j] = [newR, newG, newB];
                } else {
                    const idx = Math.floor(Math.random() * (data.length / 4)) * 4;
                    centroids[j] = [data[idx], data[idx+1], data[idx+2]];
                    changed = true;
                }
            }
            if (!changed) break;
        }
        
        // Sort from Dark to Light for lineart numbering consistency
        centroids.sort((a, b) => {
            const lumA = a[0]*0.299 + a[1]*0.587 + a[2]*0.114;
            const lumB = b[0]*0.299 + b[1]*0.587 + b[2]*0.114;
            return lumA - lumB;
        });
        
        paletteColors = centroids;
    } else {
        onProgress(15, 'Menganalisis warna (Kuantisasi)...');
        await yieldToMain();
    }

    onProgress(25, 'Menggabungkan warna minor...');
    await yieldToMain();
    
    // Dynamic Palette Merging: Remove colors used < 2% until we hit minimum 3 colors
    const MIN_PERCENT = 0.03; // 3% threshold prevents tiny color fragments
    const sampleStepForMerge = Math.max(4, Math.floor((data.length / 4) / 10000) * 4);
    
    let merged = true;
    while (merged && paletteColors.length > 3) {
        merged = false;
        
        let counts = new Int32Array(paletteColors.length);
        let totalSampled = 0;
        
        for (let i = 0; i < data.length; i += sampleStepForMerge) {
            const r = data[i], g = data[i+1], b = data[i+2];
            let minDist = Infinity;
            let bestIdx = 0;
            for (let j = 0; j < paletteColors.length; j++) {
                const pr = paletteColors[j][0], pg = paletteColors[j][1], pb = paletteColors[j][2];
                const dist = (r-pr)**2 + (g-pg)**2 + (b-pb)**2;
                if (dist < minDist) { minDist = dist; bestIdx = j; }
            }
            counts[bestIdx]++;
            totalSampled++;
        }
        
        let minCount = Infinity;
        let minIdx = -1;
        for (let i = 0; i < paletteColors.length; i++) {
            if (counts[i] < minCount) {
                minCount = counts[i];
                minIdx = i;
            }
        }
        
        if (minCount / totalSampled < MIN_PERCENT) {
            paletteColors.splice(minIdx, 1); // Remove the minor color
            merged = true; // Re-evaluate with smaller palette
        }
    }
    
    // Final Sort from Dark to Light for lineart numbering consistency
    paletteColors.sort((a: number[], b: number[]) => {
        const lumA = a[0]*0.299 + a[1]*0.587 + a[2]*0.114;
        const lumB = b[0]*0.299 + b[1]*0.587 + b[2]*0.114;
        return lumA - lumB;
    });

    const colorMap = new Int32Array(INNER_W * INNER_H);
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2];
        let minDist = Infinity;
        let bestIdx = 0;
        for (let j = 0; j < paletteColors.length; j++) {
            const pr = paletteColors[j][0], pg = paletteColors[j][1], pb = paletteColors[j][2];
            const dist = (r-pr)**2 + (g-pg)**2 + (b-pb)**2;
            if (dist < minDist) {
                minDist = dist;
                bestIdx = j;
            }
        }
        colorMap[i/4] = bestIdx;
    }
    
    onProgress(35, 'Menghaluskan area warna...');
    await yieldToMain();
    
    // Mode Filter to clean noise
    const cleanMap = new Int32Array(INNER_W * INNER_H);
    const counts = new Int32Array(paletteColors.length);
    for (let y = 1; y < INNER_H - 1; y++) {
        for (let x = 1; x < INNER_W - 1; x++) {
            const idx = y * INNER_W + x;
            counts.fill(0);
            for(let dy=-1; dy<=1; dy++) {
                for(let dx=-1; dx<=1; dx++) {
                    counts[colorMap[(y+dy)*INNER_W + (x+dx)]]++;
                }
            }
            let maxCount = 0;
            let modeC = colorMap[idx];
            for(let c=0; c<counts.length; c++) {
                if(counts[c] > maxCount) {
                    maxCount = counts[c];
                    modeC = c;
                }
            }
            cleanMap[idx] = modeC;
        }
    }
    
    // Copy border pixels
    for(let y = 0; y < INNER_H; y++) {
        cleanMap[y * INNER_W] = colorMap[y * INNER_W];
        cleanMap[y * INNER_W + INNER_W - 1] = colorMap[y * INNER_W + INNER_W - 1];
    }
    for(let x = 0; x < INNER_W; x++) {
        cleanMap[x] = colorMap[x];
        cleanMap[(INNER_H - 1) * INNER_W + x] = colorMap[(INNER_H - 1) * INNER_W + x];
    }

    // ===== Generate Colored Illustration =====
    onProgress(50, 'Membuat ilustrasi berwarna...');
    await yieldToMain();
    
    // REUSE existing canvas to save massive memory
    ctx.clearRect(0, 0, INNER_W, INNER_H);
    const colorImgData = ctx.createImageData(INNER_W, INNER_H);
    const cData = colorImgData.data;
    
    const globalCounts = new Int32Array(paletteColors.length);
    
    for (let i = 0; i < cleanMap.length; i++) {
        const colorIdx = cleanMap[i];
        globalCounts[colorIdx]++;
        const pc = paletteColors[colorIdx];
        cData[i*4] = pc[0];
        cData[i*4+1] = pc[1];
        cData[i*4+2] = pc[2];
        cData[i*4+3] = 255;
    }
    ctx.putImageData(colorImgData, 0, 0);
    
    // Create Guide Canvas (A5)
    const guideCanvas = document.createElement('canvas');
    guideCanvas.width = A5_W;
    guideCanvas.height = A5_H;
    const gCtx = guideCanvas.getContext('2d')!;
    
    // Fill white
    gCtx.fillStyle = '#ffffff';
    gCtx.fillRect(0, 0, A5_W, A5_H);
    
    // 1. Title
    gCtx.fillStyle = '#1a1a1a';
    gCtx.font = 'bold 90px "Plus Jakarta Sans", Arial, sans-serif';
    gCtx.textAlign = 'center';
    gCtx.textBaseline = 'top';
    gCtx.fillText('PETUNJUK PEWARNAAN', A5_W / 2, 120);

    // 2. Image (Scale to fit in a middle box)
    const imgBoxY = 300;
    const imgBoxH = A5_H - 750 - imgBoxY;
    const imgBoxW = A5_W - 200; // 100px margin on sides
    
    const scale = Math.min(imgBoxW / INNER_W, imgBoxH / INNER_H);
    const drawW = INNER_W * scale;
    const drawH = INNER_H * scale;
    const drawX = (A5_W - drawW) / 2;
    const drawY = imgBoxY + (imgBoxH - drawH) / 2;
    
    gCtx.shadowColor = 'rgba(0,0,0,0.1)';
    gCtx.shadowBlur = 40;
    gCtx.shadowOffsetY = 15;
    gCtx.drawImage(canvas, 0, 0, INNER_W, INNER_H, drawX, drawY, drawW, drawH);
    gCtx.shadowColor = 'transparent';
    gCtx.shadowBlur = 0;

    // 3. Palette Section
    const paletteStartY = A5_H - 600;
    const cols = isPortrait ? 3 : 6;
    const colWidth = (A5_W - 200) / cols;
    const rowHeight = 220;
    const totalPixels = cleanMap.length;
    
    for (let i = 0; i < paletteColors.length; i++) {
        const c = i % cols;
        const r = Math.floor(i / cols);
        
        const cellX = 100 + (c * colWidth);
        const cellY = paletteStartY + (r * rowHeight);
        
        // Color Swatch Circle
        const rgb = `rgb(${paletteColors[i][0]}, ${paletteColors[i][1]}, ${paletteColors[i][2]})`;
        gCtx.fillStyle = rgb;
        gCtx.beginPath();
        gCtx.arc(cellX + 70, cellY + 80, 60, 0, Math.PI * 2);
        gCtx.fill();
        
        gCtx.strokeStyle = '#e5e5e5';
        gCtx.lineWidth = 4;
        gCtx.stroke();
        
        // Number inside circle
        const lum = paletteColors[i][0]*0.299 + paletteColors[i][1]*0.587 + paletteColors[i][2]*0.114;
        gCtx.fillStyle = lum > 140 ? '#111111' : '#ffffff';
        gCtx.textAlign = 'center';
        gCtx.textBaseline = 'middle';
        gCtx.font = 'bold 50px Arial';
        gCtx.fillText((i + 1).toString(), cellX + 70, cellY + 83);
        
        // Percentage & Hex Text
        const pct = ((globalCounts[i] / totalPixels) * 100).toFixed(1);
        const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
        const hex = `#${toHex(paletteColors[i][0])}${toHex(paletteColors[i][1])}${toHex(paletteColors[i][2])}`;
        
        gCtx.textAlign = 'left';
        gCtx.fillStyle = '#222222';
        gCtx.font = 'bold 42px Arial';
        gCtx.fillText(`${pct}%`, cellX + 160, cellY + 60);
        
        gCtx.fillStyle = '#777777';
        gCtx.font = '30px Arial';
        gCtx.fillText(hex, cellX + 160, cellY + 105);
    }

    const finalColoredCanvas = document.createElement('canvas');
    finalColoredCanvas.width = A5_W;
    finalColoredCanvas.height = A5_H;
    const fcCtx = finalColoredCanvas.getContext('2d')!;
    fcCtx.fillStyle = '#ffffff';
    fcCtx.fillRect(0, 0, A5_W, A5_H);
    fcCtx.drawImage(canvas, MARGIN, MARGIN);
    
    const coloredDataUrl = finalColoredCanvas.toDataURL('image/jpeg', 0.90);
    const guideDataUrl = guideCanvas.toDataURL('image/jpeg', 0.90);

    // ===== Generate Lineart =====
    onProgress(65, 'Mendeteksi garis tepi (Super HD)...');
    await yieldToMain();
    
    // REUSE existing canvas again
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, INNER_W, INNER_H);
    
    ctx.strokeStyle = '#E7A56B';
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    let ops = 0;
    for (let y = 0; y < INNER_H - 1; y++) {
        for (let x = 0; x < INNER_W - 1; x++) {
            const idx = y * INNER_W + x;
            const c = cleanMap[idx];
            
            // Check right neighbor
            if (cleanMap[idx + 1] !== c) {
                ctx.moveTo(x + 1, y);
                ctx.lineTo(x + 1, y + 1);
                ops++;
            }
            
            // Check bottom neighbor
            if (cleanMap[idx + INNER_W] !== c) {
                ctx.moveTo(x, y + 1);
                ctx.lineTo(x + 1, y + 1);
                ops++;
            }
            
            // Chunk strokes to prevent browser freeze on millions of paths
            if (ops > 20000) {
                ctx.stroke();
                ctx.beginPath();
                ops = 0;
            }
        }
    }
    if (ops > 0) ctx.stroke();

    onProgress(85, 'Menulis nomor warna...');
    await yieldToMain();
    
    ctx.fillStyle = '#EC9A61';
    ctx.font = 'bold 22px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Connected Component BFS for precise numbering
    const visited = new Uint8Array(INNER_W * INNER_H);
    const queue = new Int32Array(INNER_W * INNER_H);
    
    for (let y = 0; y < INNER_H; y++) {
        for (let x = 0; x < INNER_W; x++) {
            const idx = y * INNER_W + x;
            if (visited[idx]) continue;
            
            const colorIdx = cleanMap[idx];
            let qHead = 0;
            let qTail = 0;
            
            queue[qTail++] = idx;
            visited[idx] = 1;
            
            let sumX = 0;
            let sumY = 0;
            let count = 0;
            
            while (qHead < qTail) {
                const curr = queue[qHead++];
                const cx = curr % INNER_W;
                const cy = Math.floor(curr / INNER_W);
                
                sumX += cx;
                sumY += cy;
                count++;
                
                // check neighbors
                if (cx > 0 && !visited[curr - 1] && cleanMap[curr - 1] === colorIdx) {
                    visited[curr - 1] = 1; queue[qTail++] = curr - 1;
                }
                if (cx < INNER_W - 1 && !visited[curr + 1] && cleanMap[curr + 1] === colorIdx) {
                    visited[curr + 1] = 1; queue[qTail++] = curr + 1;
                }
                if (cy > 0 && !visited[curr - INNER_W] && cleanMap[curr - INNER_W] === colorIdx) {
                    visited[curr - INNER_W] = 1; queue[qTail++] = curr - INNER_W;
                }
                if (cy < INNER_H - 1 && !visited[curr + INNER_W] && cleanMap[curr + INNER_W] === colorIdx) {
                    visited[curr + INNER_W] = 1; queue[qTail++] = curr + INNER_W;
                }
            }
            
            // Adjust threshold for A5 resolution
            if (count > 500) {
                const centerOfMassX = Math.floor(sumX / count);
                const centerOfMassY = Math.floor(sumY / count);
                
                const candidates = [
                    { x: centerOfMassX, y: centerOfMassY },
                    { x: queue[Math.floor(qTail * 0.25)] % INNER_W, y: Math.floor(queue[Math.floor(qTail * 0.25)] / INNER_W) },
                    { x: queue[Math.floor(qTail * 0.50)] % INNER_W, y: Math.floor(queue[Math.floor(qTail * 0.50)] / INNER_W) },
                    { x: queue[Math.floor(qTail * 0.75)] % INNER_W, y: Math.floor(queue[Math.floor(qTail * 0.75)] / INNER_W) }
                ];
                
                let bestX = centerOfMassX;
                let bestY = centerOfMassY;
                let maxClearance = -1;
                
                for (const c of candidates) {
                    if (c.x < 0 || c.x >= INNER_W || c.y < 0 || c.y >= INNER_H) continue;
                    if (cleanMap[c.y * INNER_W + c.x] !== colorIdx) continue;
                    
                    let clearance = 1;
                    let hit = false;
                    while (clearance < 100 && !hit) {
                        const steps = 8;
                        for (let s = 0; s < steps; s++) {
                            const angle = (s / steps) * Math.PI * 2;
                            const nx = Math.round(c.x + Math.cos(angle) * clearance);
                            const ny = Math.round(c.y + Math.sin(angle) * clearance);
                            if (nx < 0 || nx >= INNER_W || ny < 0 || ny >= INNER_H || cleanMap[ny * INNER_W + nx] !== colorIdx) {
                                hit = true;
                                break;
                            }
                        }
                        if (!hit) clearance += 3; // jump by 3 pixels to speed up calculation
                    }
                    
                    if (clearance > maxClearance) {
                        maxClearance = clearance;
                        bestX = c.x;
                        bestY = c.y;
                    }
                }
                
                ctx.fillText((colorIdx + 1).toString(), bestX, bestY);
            }
        }
    }

    onProgress(100, 'Selesai!');
    
    // Draw lineart onto final A5 canvas with margins
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = A5_W;
    finalCanvas.height = A5_H;
    const finalCtx = finalCanvas.getContext('2d')!;
    
    finalCtx.fillStyle = '#ffffff';
    finalCtx.fillRect(0, 0, A5_W, A5_H);
    finalCtx.drawImage(canvas, MARGIN, MARGIN);

    const lineartDataUrl = finalCanvas.toDataURL('image/jpeg', 0.90);
    
    return {
        colored: coloredDataUrl,
        guide: guideDataUrl,
        lineart: lineartDataUrl,
    };
}


function yieldToMain() {
    return new Promise(r => setTimeout(r, 0));
}
