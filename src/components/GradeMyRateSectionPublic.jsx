import { useState, useEffect, useRef } from "react";
import { LENDER_CSS } from "../constants/appConstants.js";
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

      const res  = await fetch("/api/analyze-rate", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, messages }) });
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

