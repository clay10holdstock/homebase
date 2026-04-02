export function buildLoanProducts(r30, r15) {
  const arm   = r30 !== null ? +(r30 - 0.625).toFixed(3) : null;
  const fha   = r30 !== null ? +(r30 - 0.375).toFixed(3) : null;
  const va    = r30 !== null ? +(r30 - 0.50).toFixed(3)  : null;
  const apr30 = r30 !== null ? +(r30 + 0.065).toFixed(3) : null;
  const apr15 = r15 !== null ? +(r15 + 0.085).toFixed(3) : null;
  return [
    { name: "30-Year Fixed", rate: r30,  apr: apr30,                              points: 0,   lender: "Meridian Bank",       badge: "Most Popular", term: 30 },
    { name: "15-Year Fixed", rate: r15,  apr: apr15,                              points: 0.5, lender: "Summit Lending",      badge: "Best Rate",    term: 15 },
    { name: "5/1 ARM",       rate: arm,  apr: arm ? +(arm+0.13).toFixed(3) : null, points: 0,   lender: "Pacific Mortgage",    badge: null,           term: 30 },
    { name: "FHA 30-Year",   rate: fha,  apr: fha ? +(fha+0.11).toFixed(3) : null, points: 0,   lender: "National Home Loans", badge: "Low Down",     term: 30 },
    { name: "VA 30-Year",    rate: va,   apr: va  ? +(va +0.055).toFixed(3): null, points: 0,   lender: "Veterans First",      badge: "0% Down",      term: 30 },
  ];
}

export function calcMonthly(principal, annualRate, years) {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function formatCurrency(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
