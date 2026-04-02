import { useState, useEffect } from "react";

function buildLoanProducts(r30, r15) {
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

async function fetchLiveRatesViaClaude() {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{
        role: "user",
        content: `Search for the current Freddie Mac Primary Mortgage Market Survey (PMMS) rates. Find the most recent weekly average rates for 30-year fixed and 15-year fixed mortgages.

Respond ONLY in valid JSON (no markdown, no backticks, no explanation) like this:
{
  "rate30": 6.72,
  "rate15": 6.05,
  "asOf": "2025-01-30",
  "source": "Freddie Mac PMMS"
}`
      }]
    })
  });

  const data = await response.json();
  const text = data.content.map(b => b.text || "").join("").trim();
  const clean = text.trim();
  return JSON.parse(clean);
}

export function useLiveRates() {
  const [state, setState] = useState({
    r30: 6.875,
    r15: 6.125,
    asOf: null,
    loading: true,
    error: null,
    products: buildLoanProducts(6.875, 6.125),
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { rate30, rate15, asOf } = await fetchLiveRatesViaClaude();
        if (cancelled) return;

        const r30 = rate30 ?? 6.875;
        const r15 = rate15 ?? 6.125;
        setState({
          r30,
          r15,
          asOf,
          loading: false,
          error: null,
          products: buildLoanProducts(r30, r15),
        });
      } catch (e) {
        if (cancelled) return;
        setState(s => ({
          ...s,
          loading: false,
          error: "Could not fetch live rates. Showing recent estimates.",
        }));
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return state;
}
