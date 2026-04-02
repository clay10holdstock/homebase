import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase.js";
import { formatCurrency, calcMonthly } from "../utils/loanUtils.js";

export default function GradeMyRateSectionPublic({ liveRates, onAnalysisDone, leadCaptured, pendingAnalysis }) {
  const [mode, setMode] = useState("upload");
  const [file, setFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const [manual, setManual] = useState({
    rate: "", apr: "", loanAmt: "", loanType: "30-Year Fixed", points: "0", lender: "", closingCosts: ""
  });

  const handleFile = (f) => {
    if (!f) return;
    setFile(f); setFileName(f.name); setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setFileData(e.target.result.split(",")[1]);
    reader.readAsDataURL(f);
  };

  const analyzeWithClaude = async () => {
    setAnalyzing(true); setError(null);
    try {
      const { r30, r15, products, asOf } = liveRates;
      const arm = products.find(p=>p.name.includes("ARM"))?.rate ?? (r30-0.625).toFixed(3);
      const fha = products.find(p=>p.name.includes("FHA"))?.rate ?? (r30-0.375).toFixed(3);
      const va  = products.find(p=>p.name.includes("VA"))?.rate  ?? (r30-0.50).toFixed(3);
      const ratesContext = `Current market rates (Freddie Mac PMMS${asOf?`, week of ${asOf}`:""}):
- 30-Year Fixed: ${r30}%
- 15-Year Fixed: ${r15}%
- 5/1 ARM: ~${arm}%
- FHA 30-Year: ~${fha}%
- VA 30-Year: ~${va}%`;

      let messages;
      const PROMPT = `You are a mortgage rate analyst for HomeStart. Analyze this loan quote and evaluate whether it is a good deal.
${ratesContext}
Respond ONLY in valid JSON (no markdown, no backticks):
{"extracted":{"lender":"string","rate":null,"apr":null,"loanAmount":null,"loanType":"string","points":null,"closingCosts":null,"monthlyPayment":null,"term":30},"grade":"A"|"B"|"C"|"D"|"F","gradeLabel":"Excellent"|"Good"|"Fair"|"Below Market"|"Poor","rateVsMarket":0,"summary":"2-3 sentences","redFlags":[],"positives":[],"ourOffer":{"rate":0,"apr":0,"monthlyPayment":0,"monthlySavings":0,"lifetimeSavings":0},"tips":[]}`;

      if (file && fileData) {
        const isPDF = file.type === "application/pdf";
        messages = [{ role:"user", content:[
          isPDF ? { type:"document", source:{ type:"base64", media_type:"application/pdf", data:fileData } }
                : { type:"image",    source:{ type:"base64", media_type:file.type, data:fileData } },
          { type:"text", text:PROMPT }
        ]}];
      } else {
        messages = [{ role:"user", content:`${PROMPT}

Loan details: Lender: ${manual.lender||"Unknown"}, Rate: ${manual.rate}%, APR: ${manual.apr}%, Amount: $${manual.loanAmt}, Type: ${manual.loanType}, Points: ${manual.points}, Closing Costs: $${manual.closingCosts}` }];
      }

      const res  = await fetch("https://api.anthropic.com/v1/messages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, messages }) });
      const data = await res.json();
      const text = data.content.map(i=>i.text||"").join("");
      const parsed = JSON.parse(text.trim());
      onAnalysisDone(parsed);
    } catch(err) {
      setError("Could not analyze. Please try manual entry or check the file format.");
    } finally {
      setAnalyzing(false);
    }
  };

  const analysis = leadCaptured ? pendingAnalysis : null;
  const gradeColors = { A:"#3d7d5a", B:"#5a9e6f", C:"#c27a1a", D:"#c05a2a", F:"#c0392b" };
  const gradeColor = analysis ? gradeColors[analysis.grade]||"var(--muted)" : "var(--muted)";

  if (analyzing) return (
    <div style={{ textAlign:"center", padding:"5rem 2rem" }}>
      <div style={{ fontSize:"3rem", marginBottom:"1.5rem", animation:"spin 2s linear infinite", display:"inline-block" }}>⚙️</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.5rem", marginBottom:"0.5rem" }}>Analyzing your quote...</div>
      <div style={{ color:"var(--muted)" }}>Comparing your rate against today's market</div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );

  if (analysis) return (
    <div>
      {/* Grade Hero */}
      <div style={{ display:"grid", gridTemplateColumns:"auto 1fr auto", gap:"2rem", marginBottom:"2rem", alignItems:"center" }}>
        <div style={{ width:"110px", height:"110px", borderRadius:"50%", border:`4px solid ${gradeColor}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"white" }}>
          <div style={{ fontSize:"2.5rem", fontWeight:800, color:gradeColor, lineHeight:1 }}>{analysis.grade}</div>
          <div style={{ fontSize:"0.7rem", color:gradeColor, fontWeight:700 }}>{analysis.gradeLabel}</div>
        </div>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.5rem", fontWeight:700, marginBottom:"0.5rem" }}>
            {analysis.extracted?.lender||"Your Quote"} — {analysis.extracted?.loanType}
          </div>
          <div style={{ color:"var(--muted)", lineHeight:1.6 }}>{analysis.summary}</div>
          <div style={{ marginTop:"0.75rem", display:"flex", gap:"0.75rem", flexWrap:"wrap" }}>
            <span style={{ background:"var(--surface)", borderRadius:"6px", padding:"0.3rem 0.75rem", fontSize:"0.85rem" }}>Rate: <strong style={{ color:gradeColor }}>{analysis.extracted?.rate}%</strong></span>
            <span style={{ background:"var(--surface)", borderRadius:"6px", padding:"0.3rem 0.75rem", fontSize:"0.85rem" }}>APR: <strong>{analysis.extracted?.apr}%</strong></span>
            <span style={{ background:analysis.rateVsMarket>0?"rgba(192,57,43,0.1)":"rgba(61,125,90,0.1)", borderRadius:"6px", padding:"0.3rem 0.75rem", fontSize:"0.85rem", color:analysis.rateVsMarket>0?"var(--red)":"var(--green)" }}>
              {analysis.rateVsMarket>0?`▲ ${analysis.rateVsMarket} bps above market`:`▼ ${Math.abs(analysis.rateVsMarket)} bps below market`}
            </span>
          </div>
        </div>
        <button className="btn-secondary" onClick={() => { onAnalysisDone(null); }}>↺ Analyze Another</button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"1.5rem", marginBottom:"1.5rem" }}>
        <div className="card">
          <div className="section-label" style={{ color:"var(--red)" }}>⚠️ Red Flags</div>
          {analysis.redFlags?.length>0 ? analysis.redFlags.map((f,i)=><div key={i} style={{ display:"flex", gap:"0.5rem", marginBottom:"0.6rem", fontSize:"0.875rem" }}><span style={{ color:"var(--red)" }}>✕</span><span>{f}</span></div>) : <div style={{ color:"var(--muted)", fontSize:"0.875rem" }}>No red flags found.</div>}
        </div>
        <div className="card">
          <div className="section-label" style={{ color:"var(--green)" }}>✅ Strengths</div>
          {analysis.positives?.length>0 ? analysis.positives.map((p,i)=><div key={i} style={{ display:"flex", gap:"0.5rem", marginBottom:"0.6rem", fontSize:"0.875rem" }}><span style={{ color:"var(--green)" }}>✓</span><span>{p}</span></div>) : <div style={{ color:"var(--muted)", fontSize:"0.875rem" }}>No standout strengths.</div>}
        </div>
        <div className="card">
          <div className="section-label" style={{ color:"var(--blue)" }}>💡 Negotiation Tips</div>
          {analysis.tips?.map((t,i)=><div key={i} style={{ display:"flex", gap:"0.5rem", marginBottom:"0.6rem", fontSize:"0.875rem" }}><span style={{ fontWeight:700, color:"var(--accent)" }}>{i+1}.</span><span>{t}</span></div>)}
        </div>
      </div>

      {analysis.ourOffer && (
        <div style={{ background:"linear-gradient(135deg,rgba(194,113,79,0.09),rgba(194,113,79,0.04))", border:"1px solid rgba(194,113,79,0.25)", borderRadius:"14px", padding:"2rem" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.25rem", fontWeight:700, marginBottom:"1.25rem" }}>🏠 HomeStart Can Do Better</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:"2rem", alignItems:"center", marginBottom:"1.5rem" }}>
            <div style={{ background:"rgba(44,32,18,0.04)", borderRadius:"10px", padding:"1.25rem" }}>
              <div style={{ fontSize:"0.72rem", textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--muted)", marginBottom:"0.5rem" }}>Their Quote</div>
              <div style={{ fontSize:"2rem", fontWeight:800, color:gradeColor }}>{analysis.extracted?.rate}%</div>
              <div style={{ color:"var(--muted)", fontSize:"0.85rem" }}>APR {analysis.extracted?.apr}%</div>
              {analysis.extracted?.monthlyPayment && <div style={{ marginTop:"0.6rem", fontWeight:600 }}>{formatCurrency(analysis.extracted.monthlyPayment)}<span style={{ color:"var(--muted)", fontWeight:400, fontSize:"0.82rem" }}>/mo</span></div>}
            </div>
            <div style={{ textAlign:"center" }}><div style={{ fontSize:"1.5rem" }}>→</div><div style={{ fontSize:"0.75rem", color:"var(--muted)" }}>switch & save</div></div>
            <div style={{ background:"rgba(61,125,90,0.08)", border:"1px solid rgba(61,125,90,0.2)", borderRadius:"10px", padding:"1.25rem" }}>
              <div style={{ fontSize:"0.72rem", textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--green)", marginBottom:"0.5rem" }}>HomeStart Offer</div>
              <div style={{ fontSize:"2rem", fontWeight:800, color:"var(--green)" }}>{analysis.ourOffer.rate}%</div>
              <div style={{ color:"var(--muted)", fontSize:"0.85rem" }}>APR {analysis.ourOffer.apr}%</div>
              <div style={{ marginTop:"0.6rem", fontWeight:600 }}>{formatCurrency(analysis.ourOffer.monthlyPayment)}<span style={{ color:"var(--muted)", fontWeight:400, fontSize:"0.82rem" }}>/mo</span></div>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"1.5rem" }}>
            <div style={{ background:"rgba(61,125,90,0.07)", borderRadius:"8px", padding:"1rem", textAlign:"center" }}>
              <div style={{ fontSize:"1.5rem", fontWeight:800, color:"var(--green)" }}>{formatCurrency(analysis.ourOffer.monthlySavings)}/mo</div>
              <div style={{ color:"var(--muted)", fontSize:"0.78rem", marginTop:"0.2rem" }}>Monthly Savings</div>
            </div>
            <div style={{ background:"rgba(61,125,90,0.07)", borderRadius:"8px", padding:"1rem", textAlign:"center" }}>
              <div style={{ fontSize:"1.5rem", fontWeight:800, color:"var(--green)" }}>{formatCurrency(analysis.ourOffer.lifetimeSavings)}</div>
              <div style={{ color:"var(--muted)", fontSize:"0.78rem", marginTop:"0.2rem" }}>Lifetime Savings</div>
            </div>
          </div>
          <button className="btn-primary" style={{ width:"100%", padding:"0.85rem", fontSize:"1rem" }}>Get Our Official Quote →</button>
        </div>
      )}
    </div>
  );

  // Input form (pre-analysis)
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2rem" }}>
      <div>
        <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.5rem" }}>
          <button className={mode==="upload"?"btn-primary":"btn-secondary"} style={{ flex:1 }} onClick={()=>setMode("upload")}>📄 Upload Quote</button>
          <button className={mode==="manual"?"btn-primary":"btn-secondary"} style={{ flex:1 }} onClick={()=>setMode("manual")}>✏️ Enter Manually</button>
        </div>
        {mode==="upload" ? (
          <div className="card" style={{ border:`2px dashed ${dragOver?"var(--accent)":"var(--border)"}`, textAlign:"center", padding:"3rem 2rem", cursor:"pointer", background:dragOver?"rgba(194,113,79,0.04)":"var(--card)" }}
            onClick={()=>fileRef.current.click()}
            onDragOver={e=>{e.preventDefault();setDragOver(true)}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0])}}
          >
            <input ref={fileRef} type="file" accept=".pdf,image/*" style={{ display:"none" }} onChange={e=>handleFile(e.target.files[0])} />
            <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>{file?"✅":"📋"}</div>
            {file ? <><div style={{ fontWeight:700 }}>{fileName}</div><div style={{ color:"var(--muted)", fontSize:"0.85rem" }}>Click to change</div></> : <><div style={{ fontWeight:600, marginBottom:"0.5rem" }}>Drop your Loan Estimate here</div><div style={{ color:"var(--muted)", fontSize:"0.85rem" }}>PDF, PNG, JPG · Loan Estimate, GFE, or any quote screenshot</div></>}
          </div>
        ) : (
          <div className="card">
            <div className="section-label">Enter Quote Details</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
              <div className="field"><label>Interest Rate (%)</label><input className="text-input" value={manual.rate} onChange={e=>setManual(m=>({...m,rate:e.target.value}))} placeholder="6.875" /></div>
              <div className="field"><label>APR (%)</label><input className="text-input" value={manual.apr} onChange={e=>setManual(m=>({...m,apr:e.target.value}))} placeholder="6.94" /></div>
              <div className="field"><label>Loan Amount ($)</label><input className="text-input" value={manual.loanAmt} onChange={e=>setManual(m=>({...m,loanAmt:e.target.value}))} placeholder="320000" /></div>
              <div className="field"><label>Points</label><input className="text-input" value={manual.points} onChange={e=>setManual(m=>({...m,points:e.target.value}))} placeholder="0" /></div>
              <div className="field" style={{ gridColumn:"1/-1" }}><label>Loan Type</label><select className="text-input" value={manual.loanType} onChange={e=>setManual(m=>({...m,loanType:e.target.value}))}>{["30-Year Fixed","15-Year Fixed","5/1 ARM","FHA 30-Year","VA 30-Year","Jumbo"].map(v=><option key={v}>{v}</option>)}</select></div>
              <div className="field"><label>Lender Name</label><input className="text-input" value={manual.lender} onChange={e=>setManual(m=>({...m,lender:e.target.value}))} placeholder="Big Bank Mortgage" /></div>
              <div className="field"><label>Closing Costs ($)</label><input className="text-input" value={manual.closingCosts} onChange={e=>setManual(m=>({...m,closingCosts:e.target.value}))} placeholder="8500" /></div>
            </div>
          </div>
        )}
        <button className="btn-primary" style={{ width:"100%", marginTop:"1rem", padding:"0.85rem", fontSize:"1rem" }} disabled={analyzing||(mode==="upload"&&!file)} onClick={analyzeWithClaude}>
          ⚡ Grade This Rate
        </button>
        {error && <div style={{ marginTop:"1rem", padding:"0.85rem", background:"rgba(192,57,43,0.08)", border:"1px solid rgba(192,57,43,0.2)", borderRadius:"8px", color:"var(--red)", fontSize:"0.875rem" }}>{error}</div>}
      </div>

      <div className="card">
        <div className="section-label">What We Analyze</div>
        {[
          { icon:"📊", title:"Rate vs. Market", desc:"Compare against today's national Freddie Mac averages" },
          { icon:"💸", title:"Points & Fees", desc:"Identify excessive origination fees or unnecessary points" },
          { icon:"📄", title:"APR Spread", desc:"The gap between rate and APR reveals hidden costs" },
          { icon:"🔍", title:"Red Flags", desc:"Prepayment penalties, adjustable caps, rate lock issues" },
          { icon:"💰", title:"Lifetime Savings", desc:"Calculate how much you'd save with a better offer" },
          { icon:"🤝", title:"Negotiation Tips", desc:"Specific tactics to get a better deal right now" },
        ].map((item,i)=>(
          <div key={i} style={{ display:"flex", gap:"1rem", padding:"0.75rem 0", borderBottom:i<5?"1px solid var(--border)":"none", alignItems:"flex-start" }}>
            <div style={{ fontSize:"1.3rem" }}>{item.icon}</div>
            <div><div style={{ fontWeight:600, fontSize:"0.875rem", marginBottom:"0.15rem" }}>{item.title}</div><div style={{ color:"var(--muted)", fontSize:"0.8rem" }}>{item.desc}</div></div>
          </div>
        ))}
        <div style={{ marginTop:"1rem", padding:"0.65rem 0.85rem", background:"rgba(194,113,79,0.06)", borderRadius:"8px", fontSize:"0.78rem", color:"var(--muted)" }}>
          🔒 Your quote is never stored or shared without your permission.
        </div>
      </div>
    </div>
  );
}

// =============================================
// LENDER / ADMIN PORTAL
// =============================================

const APP_STATUS_COLORS = {
  "Pre-Approval Review": { bg:"rgba(47,111,168,0.1)", text:"#2f6fa8", border:"rgba(47,111,168,0.25)" },
  "Application Review":  { bg:"rgba(194,122,26,0.1)",  text:"#b8720a", border:"rgba(194,122,26,0.25)" },
  "Underwriting":        { bg:"rgba(124,58,192,0.1)",  text:"#7c3ac0", border:"rgba(124,58,192,0.25)" },
  "Approved":            { bg:"rgba(61,125,90,0.1)",   text:"#3d7d5a", border:"rgba(61,125,90,0.25)" },
  "Suspended":           { bg:"rgba(194,113,79,0.1)",  text:"#c2714f", border:"rgba(194,113,79,0.25)" },
  "Denied":              { bg:"rgba(192,57,43,0.1)",   text:"#c0392b", border:"rgba(192,57,43,0.25)" },
  "Closed":              { bg:"rgba(61,125,90,0.08)",  text:"#3d7d5a", border:"rgba(61,125,90,0.2)" },
};

const LENDER_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f4f1ed; color: #1e1810; font-family: 'DM Sans', sans-serif; }
  :root {
    --bg: #f4f1ed; --surface: #ede9e3; --card: #ffffff; --border: #e2dbd0;
    --accent: #c2714f; --accent2: #a85c3a; --text: #1e1810; --muted: #8a7968;
    --green: #3d7d5a; --green-bg: #edf5f0; --red: #c0392b; --red-bg: #fdf0ee;
    --amber: #b8720a; --amber-bg: #fdf6ec; --blue: #2f6fa8; --blue-bg: #eaf2fb;
    --purple: #7c3ac0; --purple-bg: #f3edfb;
    --sidebar-w: 220px;
  }
  .l-layout { display: flex; min-height: 100vh; }
  .l-sidebar {
    width: var(--sidebar-w); background: #1a1410; color: #e8e0d6;
    display: flex; flex-direction: column; flex-shrink: 0; position: fixed;
    top: 0; left: 0; bottom: 0; z-index: 50; overflow-y: auto;
  }
  .l-sidebar-logo { padding: 1.5rem 1.25rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.07); }
  .l-sidebar-logo .wordmark { font-family: 'Playfair Display', serif; font-size: 1.15rem; font-weight: 800; background: linear-gradient(135deg,#c2714f,#e8956a); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .l-sidebar-logo .sub { font-size: 0.68rem; color: #7a6a5a; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 0.1rem; }
  .l-nav { padding: 1rem 0.75rem; flex: 1; }
  .l-nav-label { font-size: 0.62rem; color: #5a4a3a; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; padding: 0.5rem 0.5rem 0.25rem; margin-top: 0.5rem; }
  .l-nav-btn { display: flex; align-items: center; gap: 0.6rem; width: 100%; padding: 0.55rem 0.75rem; border-radius: 8px; border: none; background: transparent; color: #c0b0a0; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 500; text-align: left; transition: all 0.15s; margin-bottom: 0.15rem; }
  .l-nav-btn:hover { background: rgba(255,255,255,0.07); color: #f0e8e0; }
  .l-nav-btn.active { background: rgba(194,113,79,0.18); color: #e8956a; font-weight: 700; }
  .l-nav-btn .icon { font-size: 1rem; width: 1.1rem; text-align: center; }
  .l-nav-btn .badge { margin-left: auto; font-size: 0.68rem; background: rgba(194,113,79,0.3); color: #e8956a; padding: 0.1rem 0.45rem; border-radius: 10px; font-weight: 700; }
  .l-main { margin-left: var(--sidebar-w); flex: 1; display: flex; flex-direction: column; min-height: 100vh; }
  .l-topbar { background: white; border-bottom: 1px solid var(--border); padding: 0 2rem; height: 56px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 40; }
  .l-content { padding: 2rem; flex: 1; }
  .l-card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 1.5rem; box-shadow: 0 1px 4px rgba(44,32,18,0.05); }
  .l-metric { display: flex; flex-direction: column; }
  .l-metric .value { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 700; line-height: 1; }
  .l-metric .label { font-size: 0.72rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.35rem; }
  .l-metric .delta { font-size: 0.78rem; margin-top: 0.35rem; }
  .l-table { width: 100%; border-collapse: collapse; }
  .l-table th { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); font-weight: 600; padding: 0.6rem 1rem; text-align: left; border-bottom: 2px solid var(--border); white-space: nowrap; }
  .l-table td { padding: 0.85rem 1rem; border-bottom: 1px solid #f0ebe3; font-size: 0.875rem; vertical-align: middle; }
  .l-table tr:last-child td { border-bottom: none; }
  .l-table tbody tr { cursor: pointer; transition: background 0.12s; }
  .l-table tbody tr:hover td { background: #faf8f5; }
  .l-status-chip { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.25rem 0.7rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; white-space: nowrap; border: 1px solid; }
  .l-section-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); font-weight: 700; margin-bottom: 0.85rem; }
  .l-field-row { display: flex; justify-content: space-between; align-items: baseline; padding: 0.45rem 0; border-bottom: 1px solid #f0ebe3; font-size: 0.875rem; }
  .l-field-row:last-child { border-bottom: none; }
  .l-field-row .key { color: var(--muted); }
  .l-field-row .val { font-weight: 500; color: var(--text); text-align: right; }
  .l-btn-primary { background: linear-gradient(135deg,#c2714f,#a85c3a); color: white; border: none; padding: 0.6rem 1.4rem; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: opacity 0.15s; }
  .l-btn-primary:hover { opacity: 0.9; }
  .l-btn-secondary { background: white; color: var(--text); border: 1px solid var(--border); padding: 0.6rem 1.4rem; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: background 0.15s; }
  .l-btn-secondary:hover { background: var(--surface); }
  .l-btn-approve { background: linear-gradient(135deg,#3d7d5a,#2d6648); color: white; border: none; padding: 0.65rem 1.5rem; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 0.875rem; cursor: pointer; }
  .l-btn-suspend { background: linear-gradient(135deg,#c2714f,#a85c3a); color: white; border: none; padding: 0.65rem 1.5rem; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 0.875rem; cursor: pointer; }
  .l-btn-deny { background: linear-gradient(135deg,#c0392b,#a93226); color: white; border: none; padding: 0.65rem 1.5rem; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 0.875rem; cursor: pointer; }
  .l-input { background: #faf8f5; border: 1px solid var(--border); border-radius: 8px; padding: 0.55rem 0.8rem; color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 0.875rem; outline: none; transition: border-color 0.15s; }
  .l-input:focus { border-color: var(--accent); }
  select.l-input { cursor: pointer; }
  .mono { font-family: 'DM Mono', monospace; font-size: 0.82rem; }
  .doc-row { display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0.75rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 0.35rem; }
  .doc-row.received { background: var(--green-bg); }
  .doc-row.missing { background: var(--red-bg); }
  .doc-row.pending { background: var(--amber-bg); }
  .doc-row.na { background: var(--surface); }
  .gauge-bar { height: 8px; border-radius: 4px; background: var(--border); overflow: hidden; margin-top: 0.35rem; }
  .gauge-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
`;

