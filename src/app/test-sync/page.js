"use client";
import { getDubaiPulseData } from "../../syncMarket";

export default function TestPage() {
  return (
    <div className="p-20 bg-black text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">DXB Analytics: Sync Engine</h1>
      <button 
        onClick={() => getDubaiPulseData()}
        className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-bold"
      >
        START LIVE PULSE SYNC
      </button>
    </div>
  );
}
