import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCfBOWtD6z0oUZaH1x0XvQP0kJ6kYWDfAw",
  authDomain: "tokocia.firebaseapp.com",
  projectId: "tokocia",
  storageBucket: "tokocia.firebasestorage.app",
  messagingSenderId: "595772805464",
  appId: "1:595772805464:web:6fdfc48ab28e07b2e4152d",
  measurementId: "G-5W6FGP3VQM"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Helper function to generate a random unique code (e.g. CIA-9A3X)
const generateOrderCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'CIA-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};



import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";

const IMGBB_API_KEY = "950889f49261d3cbf38b4954fde1bfc3";

const uploadToImgBB = async (base64Str: string, name: string) => {
    const base64Data = base64Str.split(',')[1];
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64Data);
    formData.append('name', name);

    const res = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData
    });
    
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || "Failed to upload to ImgBB");
    
    let url = data.data.url as string;
    if (url.includes('i.ibb.co/')) {
        url = url.replace('i.ibb.co/', 'i.ibb.co.com/');
    }
    return url;
};

export const saveOrderToFirebase = async (guideBase64: string, lineartBase64: string, paletteNumber: number) => {
    try {
        const orderCode = generateOrderCode();
        
        // 1. Upload Images to ImgBB
        const [guideUrl, lineartUrl] = await Promise.all([
            uploadToImgBB(guideBase64, `${orderCode}_guide`),
            uploadToImgBB(lineartBase64, `${orderCode}_lineart`)
        ]);

        // 2. Save Data to Firestore
        await addDoc(collection(db, "orders"), {
            orderCode,
            paletteNumber,
            guideUrl,
            lineartUrl,
            status: 'pending',
            createdAt: serverTimestamp()
        });

        return { success: true, orderCode };
    } catch (error: any) {
        console.error("Error saving order:", error);
        return { success: false, error: error.message || String(error) };
    }
};

export const getOrderFromFirebase = async (orderCode: string) => {
    try {
        const q = query(collection(db, "orders"), where("orderCode", "==", orderCode));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return { success: false, error: "Pesanan tidak ditemukan" };
        }
        const data = querySnapshot.docs[0].data();
        return { success: true, data };
    } catch (error) {
        console.error("Error fetching order:", error);
        return { success: false, error };
    }
};
