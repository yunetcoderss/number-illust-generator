import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ezcbdrydtcijwefkbzkg.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_zwefQV0fGgG5fMKK98kM7g_e1aBTuIk';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to generate a random unique order code (e.g. CIA-9A3X)
export const generateOrderCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'CIA-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Convert base64 Data URL to Blob for upload
const base64ToBlob = (base64Str: string): Blob => {
  const parts = base64Str.split(',');
  const mime = parts[0]?.match(/:(.*?);/)?.[1] || 'image/png';
  const b64Data = parts[1] || parts[0];
  const byteCharacters = atob(b64Data);
  const byteNumbers = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Blob([byteNumbers], { type: mime });
};

// Upload image to Supabase Storage bucket ('order-images')
const uploadImageToStorage = async (imageStr: string, filePath: string): Promise<string> => {
  // If it's already a hosted URL, return as-is
  if (imageStr.startsWith('http://') || imageStr.startsWith('https://')) {
    return imageStr;
  }

  const blob = base64ToBlob(imageStr);
  const { error: uploadError } = await supabase.storage
    .from('order-images')
    .upload(filePath, blob, {
      contentType: blob.type || 'image/png',
      upsert: true
    });

  if (uploadError) {
    throw new Error(`Gagal upload gambar (${filePath}): ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from('order-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

export const saveOrderToSupabase = async (
  guideBase64: string,
  lineartBase64: string,
  paletteNumber: number,
  existingCode?: string
) => {
  try {
    const orderCode = existingCode || generateOrderCode();

    // 1. Upload Images to Supabase Storage Bucket ('order-images')
    const [guideUrl, lineartUrl] = await Promise.all([
      uploadImageToStorage(guideBase64, `${orderCode}/${orderCode}_guide.png`),
      uploadImageToStorage(lineartBase64, `${orderCode}/${orderCode}_lineart.png`)
    ]);

    // 2. Save / Upsert Data to Supabase Database ('orders')
    const { error: dbError } = await supabase
      .from('orders')
      .upsert({
        order_code: orderCode,
        palette_number: paletteNumber,
        guide_url: guideUrl,
        lineart_url: lineartUrl,
        status: 'pending',
        created_at: new Date().toISOString()
      }, { onConflict: 'order_code' });

    if (dbError) {
      throw new Error(`Gagal menyimpan data pesanan: ${dbError.message}`);
    }

    return { success: true, orderCode };
  } catch (error: any) {
    console.error("Error saving order to Supabase:", error);
    return { success: false, error: error.message || String(error) };
  }
};

export const checkOrderExistsInSupabase = async (orderCode: string): Promise<boolean> => {
  try {
    if (!orderCode) return false;
    const cleanCode = orderCode.trim();
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_code')
      .ilike('order_code', cleanCode)
      .maybeSingle();

    if (error) {
      console.warn("Error checking order existence:", error);
      return false;
    }

    return Boolean(data);
  } catch (err) {
    console.warn("Exception checking order existence:", err);
    return false;
  }
};

export const getOrderFromSupabase = async (orderCode: string) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_code', orderCode)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      return { success: false, error: "Pesanan tidak ditemukan" };
    }

    return {
      success: true,
      data: {
        orderCode: data.order_code,
        paletteNumber: data.palette_number,
        guideUrl: data.guide_url,
        coloredUrl: data.guide_url,
        lineartUrl: data.lineart_url,
        status: data.status,
        createdAt: data.created_at
      }
    };
  } catch (error: any) {
    console.error("Error fetching order from Supabase:", error);
    return { success: false, error: error.message || String(error) };
  }
};
