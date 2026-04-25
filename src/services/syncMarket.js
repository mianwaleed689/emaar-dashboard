import { db } from "./firebaseConfig"; 
import { doc, setDoc } from "firebase/firestore";

export const getDubaiPulseData = async () => {
  const url = "https://api.dubaipulse.gov.ae";
  try {
    const response = await fetch(url);
    const data = await response.json();
    await setDoc(doc(db, "market_pulse", "latest_stats"), {
      total_value_aed: data?.base_amount || 0, 
      area: data?.area_name_en || "Dubai",
      last_sync: new Date().toLocaleString()
    });
    alert("? Success! Dubai Pulse is now inside your Firebase.");
  } catch (error) {
    alert("? Sync Failed: Check your firebaseConfig.js file.");
  }
};
