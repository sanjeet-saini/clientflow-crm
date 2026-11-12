// =====================================================================
// useCRM.js — custom hook. Kaam: data LOAD karna aur har change par SAVE karna.
// Custom hook = "use" se shuru hone wala function jo andar React hooks use karta hai.
// Fayda: storage ka logic App.jsx se alag, saaf aur reusable.
// =====================================================================
import { useEffect, useState } from "react";
import { demoData, isValidData } from "./data";
// localStorage ki key. "v1" version hai — aage data ka shape badle to v2 bana sakte hain
export const STORAGE_KEY = "clientflow-v1";
export function useCRM() {
  // LOAD (sirf ek baar): useState mein function dena = "lazy initializer",
  // yeh sirf pehle render par chalta hai, har render par nahi.
  const [initial] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // Kuch saved nahi → pehli visit → demo data
      if (!raw) return { data: demoData(), error: "" };
      // localStorage sirf string rakhta hai → JSON.parse se wapas object
      const parsed = JSON.parse(raw);
      // Shape galat → error throw → neeche catch mein demo data + warning
      if (!isValidData(parsed)) throw new Error();
      return { data: parsed, error: "" };
      // JSON kharab ho ya storage blocked ho — app crash nahi hogi
    } catch {
      return {
        data: demoData(),
        error: "Saved data could not be read. Demo data was restored.",
      };
    }
  });
  // Asli state jo App use karta hai
  const [data, setData] = useState(initial.data);
  const [storageError, setStorageError] = useState(initial.error);
  // SAVE: [data] dependency → jab bhi data badle, yeh effect chalta hai
  // aur JSON.stringify karke localStorage mein likh deta hai.
  // Storage full/blocked ho to error message dikhate hain.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      setStorageError(
        "Browser storage is unavailable or full. Changes will only last for this session.",
      );
    }
  }, [data]);
  // App ko yeh teen cheezein milti hain
  return { data, setData, storageError };
}
