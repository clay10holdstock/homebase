import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase.js";
import { formatCurrency, calcMonthly } from "../utils/loanUtils.js";

export default function GradeMyRateSection({ liveRates }) {
  const [mode, setMode] = useState("upload"); // upload | manual
  const [file, setFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  // Manual entry fallback
  const [manual, setManual] = useState({
    rate: "", apr: "", loanAmt: "", loanType: "30-Year Fixed", points: "0", lender: "", closingCosts: ""
  });

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setFileName(f.name);
    setAnalysis(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setFileData(e.target.result.split(",")[1]);
    reader.readAsDataURL(f);
  };

  const analyzeWithClaude = async () => {
    setAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const { r30, r15, products, asOf } = liveRates;
      const arm  = products.find(p => p.name.includes("ARM"))?.rate  ?? (r30 - 0.625).toFixed(3);
      const fha  = products.find(p => p.name.includes("FHA"))?.rate  ?? (r30 - 0.375).toFixed(3);
      const va   = products.find(p => p.name.includes("VA"))?.rate   ?? (r30 - 0.50).toFixed(3);
      const ratesContext = `Current market rates (Freddie Mac PMMS${asOf ? `, week of ${asOf}` : ""}):
- 30-Year Fixed: ${r30}%
- 15-Year Fixed: ${r15}%
- 5/1 ARM: ~${arm}%
- FHA 30-Year: ~${fha}%
- VA 30-Year: ~${va}%
These are real, authoritative rates. Use them as your market benchmark.`;

      const isImage = file && file.type.startsWith("image/");
      const isPDF = file && file.type === "application/pdf";
      const mediaType = file ? file.type : null;

      let messages;

      if (file && fileData && (isImage || isPDF)) {
        const contentType = isPDF ? "document" : "image";
        const sourceType = isPDF ? { type: "base64", media_type: "application/pdf", data: fileData } : { type: "base64", media_type: mediaType, data: fileData };

        messages = [{
          role: "user",
          content: [
            isPDF
              ? { type: "document", source: sourceType }
              : { type: "image", source: sourceType },
            {
              type: "text",
              text: `You are a mortgage rate analyst for HomeStart, a mortgage platform. Analyze this loan quote document and extract all the relevant loan details.

${ratesContext}

Evaluate whether this is a good deal based on those current market rates above.

Respond ONLY in valid JSON (no markdown, no backticks) with this exact structure:
{
  "extracted": {
    "lender": "string or Unknown",
    "rate": number or null,
    "apr": number or null,
    "loanAmount": number or null,
    "loanType": "string",
    "points": number or null,
    "closingCosts": number or null,
    "monthlyPayment": number or null,
    "term": number (years)
  },
  "grade": "A" | "B" | "C" | "D" | "F",
  "gradeLabel": "Excellent" | "Good" | "Fair" | "Below Market" | "Poor",
  "rateVsMarket": number (difference in bps, negative = better than market),
  "summary": "2-3 sentence plain English summary of this quote",
  "redFlags": ["array of specific concerns, empty if none"],
  "positives": ["array of specific strengths, empty if none"],
  "ourOffer": {
    "rate": number,
    "apr": number,
    "monthlyPayment": number,
    "monthlySavings": number,
    "lifetimeSavings": number
  },
  "tips": ["2-3 actionable negotiation tips specific to this quote"]
}`
            }
          ]
        }];
      } else {
        // Manual entry or text-based analysis
        const details = `Loan Details to analyze:
- Lender: ${manual.lender || "Unknown"}
- Rate: ${manual.rate}%
- APR: ${manual.apr}%
- Loan Amount: $${manual.loanAmt}
- Loan Type: ${manual.loanType}
- Points: ${manual.points}
- Closing Costs: $${manual.closingCosts}`;

        messages = [{
          role: "user",
          content: `You are a mortgage rate analyst for HomeStart. Analyze this loan quote and evaluate whether it is a good deal.

${ratesContext}

${details}

Respond ONLY in valid JSON (no markdown, no backticks) with this exact structure:
{
  "extracted": {
    "lender": "string or Unknown",
    "rate": number or null,
    "apr": number or null,
    "loanAmount": number or null,
    "loanType": "string",
    "points": number or null,
    "closingCosts": number or null,
    "monthlyPayment": number or null,
    "term": number
  },
  "grade": "A" | "B" | "C" | "D" | "F",
  "gradeLabel": "Excellent" | "Good" | "Fair" | "Below Market" | "Poor",
  "rateVsMarket": number,
  "summary": "2-3 sentence plain English summary",
  "redFlags": ["array of concerns"],
  "positives": ["array of strengths"],
  "ourOffer": {
    "rate": number,
    "apr": number,
    "monthlyPayment": number,
    "monthlySavings": number,
    "lifetimeSavings": number
  },
  "tips": ["2-3 actionable negotiation tips"]
}`
        }];
      }

      const response = await fetch("/api/analyze-rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages
        })
      });

      const data = await response.json();
      const text = data.content.map(i => i.text || "").join("");
      const clean = text.replace(/\x60{3}json|\x60{3}/g, "").trim();
      const parsed = JSON.parse(clean);
      setAnalysis(parsed);
    } catch (err) {
      setError("Could not analyze the quote. Please try manual entry or check the file format.");
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const gradeColors = { A: "#3d7d5a", B: "#5a9e6f", C: "#c27a1a", D: "#c05a2a", F: "#c0392b" };
  const gradeColor = analysis ? gradeColors[analysis.grade] || "var(--muted)" : "var(--muted)";

  return (
    <div>
      {!analysis && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          {/* Upload / Manual Toggle */}
          <div>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <button
                className={mode === "upload" ? "btn-primary" : "btn-secondary"}
                onClick={() => setMode("upload")}
                style={{ flex: 1 }}
              >📄 Upload Quote</button>
              <button
                className={mode === "manual" ? "btn-primary" : "btn-secondary"}
                onClick={() => setMode("manual")}
                style={{ flex: 1 }}
              >✏️ Enter Manually</button>
            </div>

            {mode === "upload" ? (
              <div
                className="card"
                style={{
                  border: `2px dashed ${dragOver ? "var(--accent)" : "var(--border)"}`,
                  textAlign: "center",
                  padding: "3rem 2rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: dragOver ? "rgba(194,113,79,0.04)" : "var(--card)"
                }}
                onClick={() => fileRef.current.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,image/*"
                  style={{ display: "none" }}
                  onChange={e => handleFile(e.target.files[0])}
                />
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
                  {file ? "✅" : "📋"}
                </div>
                {file ? (
                  <>
                    <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>{fileName}</div>
                    <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Click to change file</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Drop your Loan Estimate or quote here</div>
                    <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Supports PDF, PNG, JPG · Loan Estimate (LE), GFE, or any quote screenshot</div>
                  </>
                )}
              </div>
            ) : (
              <div className="card">
                <h3 className="section-label">Enter Quote Details</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="field"><label>Interest Rate (%)</label><input className="text-input" value={manual.rate} onChange={e => setManual(m => ({...m, rate: e.target.value}))} placeholder="6.875" /></div>
                  <div className="field"><label>APR (%)</label><input className="text-input" value={manual.apr} onChange={e => setManual(m => ({...m, apr: e.target.value}))} placeholder="6.94" /></div>
                  <div className="field"><label>Loan Amount ($)</label><input className="text-input" value={manual.loanAmt} onChange={e => setManual(m => ({...m, loanAmt: e.target.value}))} placeholder="320000" /></div>
                  <div className="field"><label>Points</label><input className="text-input" value={manual.points} onChange={e => setManual(m => ({...m, points: e.target.value}))} placeholder="0" /></div>
                  <div className="field" style={{ gridColumn: "1/-1" }}>
                    <label>Loan Type</label>
                    <select className="text-input" value={manual.loanType} onChange={e => setManual(m => ({...m, loanType: e.target.value}))}>
                      {["30-Year Fixed","15-Year Fixed","5/1 ARM","FHA 30-Year","VA 30-Year","Jumbo"].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="field"><label>Lender Name</label><input className="text-input" value={manual.lender} onChange={e => setManual(m => ({...m, lender: e.target.value}))} placeholder="Big Bank Mortgage" /></div>
                  <div className="field"><label>Closing Costs ($)</label><input className="text-input" value={manual.closingCosts} onChange={e => setManual(m => ({...m, closingCosts: e.target.value}))} placeholder="8500" /></div>
                </div>
              </div>
            )}

            <button
              className="btn-primary"
              style={{ width: "100%", marginTop: "1rem", padding: "0.85rem", fontSize: "1rem" }}
              disabled={analyzing || (mode === "upload" && !file)}
              onClick={analyzeWithClaude}
            >
              {analyzing ? "Analyzing your quote..." : "⚡ Grade This Rate"}
            </button>

            {error && (
              <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.25)", borderRadius: "10px", color: "#fca5a5", fontSize: "0.9rem" }}>
                {error}
              </div>
            )}
          </div>

          {/* What we check */}
          <div className="card">
            <h3 className="section-label">What We Analyze</h3>
            {[
              { icon: "📊", title: "Rate vs. Market", desc: "Compare your rate to today's national averages for your loan type" },
              { icon: "💸", title: "Points & Fees", desc: "Identify if you're paying excessive points or origination fees" },
              { icon: "📄", title: "APR Spread", desc: "The gap between rate and APR reveals hidden costs" },
              { icon: "🔍", title: "Red Flags", desc: "Prepayment penalties, adjustable caps, rate lock issues" },
              { icon: "💰", title: "Lifetime Savings", desc: "Calculate how much you'd save switching to our offer" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: "1rem", padding: "0.75rem 0", borderBottom: i < 5 ? "1px solid var(--border)" : "none", alignItems: "flex-start" }}>
                <div style={{ fontSize: "1.4rem", lineHeight: 1 }}>{item.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.2rem" }}>{item.title}</div>
                  <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{item.desc}</div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: "1rem", padding: "0.75rem", background: "rgba(194,113,79,0.06)", borderRadius: "8px", fontSize: "0.8rem", color: "var(--muted)" }}>
              🔒 Your quote is analyzed privately and never stored or shared.
            </div>
          </div>
        </div>
      )}

      {analyzing && (
        <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1.5rem", animation: "spin 2s linear infinite", display: "inline-block" }}>⚙️</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", marginBottom: "0.5rem" }}>Analyzing your quote...</div>
          <div style={{ color: "var(--muted)" }}>Comparing rates, fees, and terms against today's market</div>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {analysis && !analyzing && (
        <div>
          {/* Grade Hero */}
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "2rem", marginBottom: "2rem", alignItems: "center" }}>
            <div style={{
              width: "120px", height: "120px", borderRadius: "50%",
              background: `conic-gradient(${gradeColor} 0%, rgba(44,32,18,0.06) 0%)`,
              border: `4px solid ${gradeColor}`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 32px ${gradeColor}44`
            }}>
              <div style={{ fontSize: "3rem", fontWeight: 800, color: gradeColor, lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>{analysis.grade}</div>
              <div style={{ fontSize: "0.7rem", color: gradeColor, fontWeight: 600 }}>{analysis.gradeLabel}</div>
            </div>

            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                {analysis.extracted?.lender || "Your Quote"} — {analysis.extracted?.loanType}
              </div>
              <div style={{ color: "var(--muted)", lineHeight: 1.6, fontSize: "0.95rem" }}>{analysis.summary}</div>
              <div style={{ marginTop: "0.75rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <span style={{ background: "var(--surface)", borderRadius: "6px", padding: "0.3rem 0.75rem", fontSize: "0.85rem" }}>
                  Rate: <strong style={{ color: gradeColor }}>{analysis.extracted?.rate}%</strong>
                </span>
                <span style={{ background: "var(--surface)", borderRadius: "6px", padding: "0.3rem 0.75rem", fontSize: "0.85rem" }}>
                  APR: <strong>{analysis.extracted?.apr}%</strong>
                </span>
                {analysis.extracted?.loanAmount && (
                  <span style={{ background: "var(--surface)", borderRadius: "6px", padding: "0.3rem 0.75rem", fontSize: "0.85rem" }}>
                    Loan: <strong>{formatCurrency(analysis.extracted.loanAmount)}</strong>
                  </span>
                )}
                <span style={{
                  background: analysis.rateVsMarket > 0 ? "rgba(239,68,68,0.12)" : "rgba(61,125,90,0.1)",
                  borderRadius: "6px", padding: "0.3rem 0.75rem", fontSize: "0.85rem",
                  color: analysis.rateVsMarket > 0 ? "#fca5a5" : "#86efac"
                }}>
                  {analysis.rateVsMarket > 0 ? `▲ ${analysis.rateVsMarket} bps above market` : `▼ ${Math.abs(analysis.rateVsMarket)} bps below market`}
                </span>
              </div>
            </div>

            <button className="btn-secondary" onClick={() => { setAnalysis(null); setFile(null); setFileData(null); setFileName(""); }}>
              ↺ Analyze Another
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
            {/* Red Flags */}
            <div className="card">
              <h3 className="section-label" style={{ color: "#fca5a5" }}>⚠️ Red Flags</h3>
              {analysis.redFlags?.length > 0 ? analysis.redFlags.map((flag, i) => (
                <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
                  <span style={{ color: "#ef4444", flexShrink: 0 }}>✕</span>
                  <span>{flag}</span>
                </div>
              )) : (
                <div style={{ color: "var(--muted)", fontSize: "0.875rem" }}>No red flags found. This quote looks clean.</div>
              )}
            </div>

            {/* Positives */}
            <div className="card">
              <h3 className="section-label" style={{ color: "var(--green)" }}>✅ Strengths</h3>
              {analysis.positives?.length > 0 ? analysis.positives.map((pos, i) => (
                <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
                  <span style={{ color: "var(--green)", flexShrink: 0 }}>✓</span>
                  <span>{pos}</span>
                </div>
              )) : (
                <div style={{ color: "var(--muted)", fontSize: "0.875rem" }}>No standout strengths identified.</div>
              )}
            </div>

            {/* Negotiation Tips */}
            <div className="card">
              <h3 className="section-label" style={{ color: "#93c5fd" }}>💡 Negotiation Tips</h3>
              {analysis.tips?.map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
                  <span style={{ color: "var(--accent)", flexShrink: 0, fontWeight: 700 }}>{i + 1}.</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Our Offer vs Theirs */}
          {analysis.ourOffer && (
            <div style={{
              background: "linear-gradient(135deg, rgba(194,113,79,0.08), rgba(194,113,79,0.04))",
              border: "1px solid rgba(194,113,79,0.25)",
              borderRadius: "14px",
              padding: "2rem"
            }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", marginBottom: "1.5rem" }}>
                🏠 HomeStart Can Do Better
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "2rem", alignItems: "center" }}>
                {/* Their offer */}
                <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "10px", padding: "1.25rem" }}>
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: "0.75rem" }}>Their Quote</div>
                  <div style={{ fontSize: "2rem", fontWeight: 800, color: gradeColor }}>{analysis.extracted?.rate}%</div>
                  <div style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>APR {analysis.extracted?.apr}%</div>
                  {analysis.extracted?.monthlyPayment && (
                    <div style={{ marginTop: "0.75rem", fontWeight: 600 }}>{formatCurrency(analysis.extracted.monthlyPayment)}<span style={{ color: "var(--muted)", fontWeight: 400, fontSize: "0.85rem" }}>/mo</span></div>
                  )}
                </div>

                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "2rem" }}>→</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.25rem" }}>switch and save</div>
                </div>

                {/* Our offer */}
                <div style={{ background: "rgba(61,125,90,0.08)", border: "1px solid rgba(61,125,90,0.25)", borderRadius: "10px", padding: "1.25rem" }}>
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--green)", marginBottom: "0.75rem" }}>HomeStart Offer</div>
                  <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--green)" }}>{analysis.ourOffer.rate}%</div>
                  <div style={{ color: "rgba(134,239,172,0.7)", fontSize: "0.85rem", marginTop: "0.25rem" }}>APR {analysis.ourOffer.apr}%</div>
                  <div style={{ marginTop: "0.75rem", fontWeight: 600 }}>{formatCurrency(analysis.ourOffer.monthlyPayment)}<span style={{ color: "var(--muted)", fontWeight: 400, fontSize: "0.85rem" }}>/mo</span></div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1.5rem" }}>
                <div style={{ background: "rgba(61,125,90,0.07)", borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--green)" }}>{formatCurrency(analysis.ourOffer.monthlySavings)}/mo</div>
                  <div style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>Monthly Savings</div>
                </div>
                <div style={{ background: "rgba(61,125,90,0.07)", borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--green)" }}>{formatCurrency(analysis.ourOffer.lifetimeSavings)}</div>
                  <div style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>Lifetime Savings</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button className="btn-primary" style={{ flex: 1, padding: "0.85rem", fontSize: "1rem" }}>
                  Get Our Official Quote →
                </button>
                <button className="btn-secondary" onClick={() => { setAnalysis(null); setFile(null); setFileData(null); setFileName(""); }}>
                  Analyze Another Quote
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---- MAIN APP ----

// ---- FIND A REALTOR ----

const FEATURED_REALTORS = [
  {
    id: "r1",
    name: "Sarah Connelly",
    brokerage: "Austin Premier Realty",
    avatar: "SC",
    color: "var(--accent)",
    phone: "(512) 555-0182",
    email: "sarah@austinrealty.com",
    license: "TX-589234",
    experience: 11,
    closedDeals: 214,
    avgPrice: 412000,
    rating: 4.9,
    reviews: 87,
    specialties: ["First-Time Buyers", "New Construction", "Relocation"],
    areas: ["South Austin", "Round Rock", "Cedar Park"],
    bio: "Specializing in first-time homebuyers across the greater Austin area. Known for patient, educational guidance through every step of the process.",
    responseTime: "< 1 hour",
    languages: ["English", "Spanish"],
    badge: "Top Producer",
  },
  {
    id: "r2",
    name: "Marcus Webb",
    brokerage: "Lone Star Properties",
    avatar: "MW",
    color: "#8b5cf6",
    phone: "(512) 555-0239",
    email: "marcus@lonestar.com",
    license: "TX-612047",
    experience: 8,
    closedDeals: 163,
    avgPrice: 485000,
    rating: 4.8,
    reviews: 61,
    specialties: ["Luxury Homes", "Investment Properties", "Downsizing"],
    areas: ["West Lake Hills", "Barton Creek", "Tarrytown"],
    bio: "Focused on the premium Austin market with deep expertise in investment strategy and negotiation. Former finance professional turned real estate advisor.",
    responseTime: "< 2 hours",
    languages: ["English"],
    badge: "Luxury Specialist",
  },
  {
    id: "r3",
    name: "Diana Flores",
    brokerage: "Casas del Sol Realty",
    avatar: "DF",
    color: "#10b981",
    phone: "(512) 555-0371",
    email: "diana@casasdelsol.com",
    license: "TX-574891",
    experience: 14,
    closedDeals: 298,
    avgPrice: 348000,
    rating: 4.9,
    reviews: 112,
    specialties: ["First-Time Buyers", "FHA/VA Loans", "Condos & Townhomes"],
    areas: ["East Austin", "Manor", "Pflugerville"],
    bio: "Bilingual agent with 14 years helping families find their first home. Deep knowledge of FHA and VA loan programs and down payment assistance options.",
    responseTime: "< 30 min",
    languages: ["English", "Spanish"],
    badge: "Most Reviews",
  },
  {
    id: "r4",
    name: "Tyler Okonkwo",
    brokerage: "NextStep Realty Group",
    avatar: "TO",
    color: "var(--amber)",
    phone: "(512) 555-0498",
    email: "tyler@nextstep.com",
    license: "TX-631205",
    experience: 5,
    closedDeals: 89,
    avgPrice: 375000,
    rating: 4.7,
    reviews: 44,
    specialties: ["New Construction", "Tech Professionals", "First-Time Buyers"],
    areas: ["North Austin", "Domain", "Georgetown"],
    bio: "Former tech professional who understands the Austin relocation market inside and out. Specializes in new construction and helping tech workers navigate competitive offers.",
    responseTime: "< 1 hour",
    languages: ["English"],
    badge: "Rising Star",
  },
];

