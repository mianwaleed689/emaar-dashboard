import React, { useState } from 'react';

export default function RoiCalculator({ project, roi, T }) {
  const colors = T;
  const [beds, setBeds] = useState('1BR');
  const [years, setYears] = useState(5);
  const [strategy, setStrategy] = useState('long');
  const [customPrice, setCustomPrice] = useState(project?.price || 0);

  const bedKey = beds === '1BR' ? 'apt1' : beds === '2BR' ? 'apt2' : beds === '3BR' ? 'apt3' : 'th';
  const grossYield = (roi?.grossYield?.[bedKey] || roi?.grossYield?.apt1 || roi?.grossYield?.th || 6) / 100;
  const netYield = (roi?.netYield?.[bedKey] || roi?.netYield?.apt1 || roi?.netYield?.th || 5) / 100;
  const annualRent = roi?.estRent?.[bedKey] || roi?.estRent?.apt1 || roi?.estRent?.th || 100000;
  const appreciationYoY = (roi?.appreciationYoY || 12) / 100;
  const shortTermPremium = (roi?.shortTermPremium || 30) / 100;
  const serviceCharge = roi?.serviceCharge || 18;
  const price = Number(customPrice) || project?.price || 1000000;

  const paymentStr = project?.payment || project?.paymentPlan || '80/20';
  const downPct = parseInt(paymentStr.split('/')[0]) / 100;
  const downPayment = price * downPct;

  const projectedValue = price * Math.pow(1 + appreciationYoY, years);
  const capitalGain = projectedValue - price;
  const effectiveRent = strategy === 'short' ? annualRent * (1 + shortTermPremium) : strategy === 'flip' ? 0 : annualRent;
  const annualServiceCharge = (project?.sizeFrom || 900) * serviceCharge;
  const netAnnualRent = Math.max(0, effectiveRent - annualServiceCharge);
  const totalRentalIncome = netAnnualRent * years;
  const totalReturn = capitalGain + totalRentalIncome;
  const roiPct = downPayment > 0 ? ((totalReturn / downPayment) * 100).toFixed(1) : '0';
  const cashOnCash = downPayment > 0 ? ((netAnnualRent / downPayment) * 100).toFixed(1) : '0';
  const annualisedReturn = (((Math.pow((projectedValue + totalRentalIncome) / price, 1 / years)) - 1) * 100).toFixed(1);
  const fmt = (n) => n >= 1e6 ? 'AED ' + (n / 1e6).toFixed(2) + 'M' : 'AED ' + Math.round(n).toLocaleString();

  return (
    <div style={{ marginBottom: 16, background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.04))', borderRadius: 12, padding: 16, border: '1px solid rgba(59,130,246,0.2)' }}>
      <h3 style={{ fontSize: 11, fontWeight: 700, color: colors.blue, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>Interactive ROI Calculator</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 9, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Purchase Price (AED)</div>
          <input type="number" value={customPrice} onChange={e => setCustomPrice(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', background: colors.surface, border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: colors.textPrimary, fontSize: 13, fontFamily: 'Outfit, sans-serif', outline: 'none' }} />
        </div>
        <div>
          <div style={{ fontSize: 9, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Holding Period: {years} years</div>
          <input type="range" min={1} max={10} step={1} value={years} onChange={e => setYears(Number(e.target.value))}
            style={{ width: '100%', marginTop: 6, accentColor: colors.blue, cursor: 'pointer' }} />
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Bedrooms</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['1BR', '2BR', '3BR', 'TH/Villa'].map(b => (
            <button key={b} type="button" onClick={() => setBeds(b)}
              style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid ' + (beds === b ? colors.blue : colors.border), background: beds === b ? 'rgba(59,130,246,0.15)' : 'transparent', color: beds === b ? colors.blue : colors.textSecondary, fontSize: 11, fontWeight: beds === b ? 700 : 400, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>{b}</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 9, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Rental Strategy</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[['long', 'Long-Term'], ['short', 'Short-Term Airbnb'], ['flip', 'Flip at Handover']].map(([val, label]) => (
            <button key={val} type="button" onClick={() => setStrategy(val)}
              style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid ' + (strategy === val ? colors.gold : colors.border), background: strategy === val ? 'rgba(212,168,67,0.12)' : 'transparent', color: strategy === val ? colors.gold : colors.textSecondary, fontSize: 11, fontWeight: strategy === val ? 700 : 400, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>{label}</button>
          ))}
        </div>
      </div>
      <div style={{ background: colors.surface, borderRadius: 10, padding: 14, border: '1px solid rgba(59,130,246,0.15)' }}>
        <div style={{ fontSize: 10, color: colors.blue, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Results �€” {years}-Year Projection</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
          {[
            { label: 'Down Payment', value: fmt(downPayment), color: colors.textPrimary },
            { label: 'Projected Value', value: fmt(projectedValue), color: colors.gold },
            { label: 'Capital Gain', value: fmt(capitalGain), color: colors.green },
            { label: strategy === 'flip' ? 'Flip Profit' : 'Total Rental Income', value: strategy === 'flip' ? fmt(capitalGain) : fmt(totalRentalIncome), color: colors.teal },
            { label: 'Total Return', value: fmt(totalReturn), color: colors.green },
            { label: 'ROI on Down Payment', value: roiPct + '%', color: colors.blue },
          ].map((item, i) => (
            <div key={i} style={{ background: colors.surfaceAlt, borderRadius: 8, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 8, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: item.color, fontFamily: 'Fraunces, serif' }}>{item.value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: 8, padding: '10px 12px', textAlign: 'center', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ fontSize: 9, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Cash-on-Cash Return</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: colors.green, fontFamily: 'Fraunces, serif' }}>{cashOnCash}%</div>
            <div style={{ fontSize: 9, color: colors.textMuted }}>Annual yield on down payment</div>
          </div>
          <div style={{ background: 'rgba(212,168,67,0.08)', borderRadius: 8, padding: '10px 12px', textAlign: 'center', border: '1px solid rgba(212,168,67,0.2)' }}>
            <div style={{ fontSize: 9, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Annualised Total Return</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: colors.gold, fontFamily: 'Fraunces, serif' }}>{annualisedReturn}%</div>
            <div style={{ fontSize: 9, color: colors.textMuted }}>Per year (capital + rental)</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
          <div style={{ background: 'rgba(59,130,246,0.06)', borderRadius: 8, padding: '8px 12px', textAlign: 'center', border: '1px solid rgba(59,130,246,0.15)' }}>
            <div style={{ fontSize: 9, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Gross Yield</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: colors.blue, fontFamily: 'Fraunces, serif' }}>{(grossYield * 100).toFixed(1)}%</div>
          </div>
          <div style={{ background: 'rgba(59,130,246,0.06)', borderRadius: 8, padding: '8px 12px', textAlign: 'center', border: '1px solid rgba(59,130,246,0.15)' }}>
            <div style={{ fontSize: 9, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Net Yield</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: colors.blue, fontFamily: 'Fraunces, serif' }}>{(netYield * 100).toFixed(1)}%</div>
          </div>
        </div>
        <div style={{ marginTop: 8, fontSize: 9, color: colors.textMuted }}>Estimates based on community averages. Service charge: AED {serviceCharge}/sqft/yr. Not financial advice.</div>
      </div>
    </div>
  );
}
