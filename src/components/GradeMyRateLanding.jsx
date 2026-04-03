import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { PORTAL_CSS, MOCK_DB } from "../constants/appConstants.js";
import { formatCurrency } from "../utils/loanUtils.js";
import GradeMyRateSectionPublic from "./GradeMyRateSectionPublic.jsx";

export function GradeMyRateLanding({ liveRates, onBack }) {
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [pendingAnalysis, setPendingAnalysis] = useState(null);
  const [lead, setLead] = useState({ name:"", email:"", phone:"" });
  const [leadError, setLeadError] = useState("");
  const [leadSubmitting, setLeadSubmitting] = useState(false);

  // Intercept analysis completion — show gate before full results
  const handleAnalysisDone = (analysis) => {
    setPendingAnalysis(analysis);
    if (!leadCaptured) {
      setShowGate(true);
    }
  };

  const submitLead = async () => {
    if (!lead.name || !lead.email) { setLeadError("Name and email are required."); return; }
    if (!lead.email.includes("@")) { setLeadError("Please enter a valid email."); return; }
    setLeadSubmitting(true);
    // Save to Supabase leads table
    const { error: leadDbError } = await supabase.from("leads").insert({
      name: lead.name,
      email: lead.email,
      phone: lead.phone || null,
      source: "Grade My Rate",
      grade: pendingAnalysis?.grade || null,
      grade_label: pendingAnalysis?.gradeLabel || null,
      lender_name: pendingAnalysis?.extracted?.lender || null,
      rate: pendingAnalysis?.extracted?.rate || null,
      loan_amount: pendingAnalysis?.extracted?.loanAmount || null,
      monthly_savings: pendingAnalysis?.ourOffer?.monthlySavings || null,
      lifetime_savings: pendingAnalysis?.ourOffer?.lifetimeSavings || null,
      assigned_lender_id: "bdf8864e-5765-4926-8fbe-6dbbff862015",
    });
    if (leadDbError) console.error("Lead insert error:", leadDbError);
    // Also keep in MOCK_DB for lender portal display
    MOCK_DB.leads.push({
      id: "lead_" + Date.now(),
      name: lead.name, email: lead.email, phone: lead.phone,
      source: "Grade My Rate", capturedAt: new Date().toISOString().slice(0,10),
      grade: pendingAnalysis?.grade, gradeLabel: pendingAnalysis?.gradeLabel,
      lender: pendingAnalysis?.extracted?.lender, rate: pendingAnalysis?.extracted?.rate,
      loanAmount: pendingAnalysis?.extracted?.loanAmount,
      monthlySavings: pendingAnalysis?.ourOffer?.monthlySavings,
      lifetimeSavings: pendingAnalysis?.ourOffer?.lifetimeSavings,
    });
    setLeadCaptured(true);
    setShowGate(false);
    setLeadSubmitting(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <style>{PORTAL_CSS}</style>

      {/* Header */}
      <header style={{ padding:"1.25rem 2rem", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid var(--border)", background:"white" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.3rem", fontWeight:800, background:"linear-gradient(135deg,#c2714f,#a85c3a)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>HomeStart</div>
        <div style={{ display:"flex", gap:"0.75rem", alignItems:"center" }}>
          <span style={{ fontSize:"0.85rem", color:"var(--muted)" }}>Free tool — no account needed</span>
          <button className="btn-secondary" style={{ fontSize:"0.82rem", padding:"0.4rem 0.9rem" }} onClick={onBack}>← Back</button>
        </div>
      </header>

      {/* Hero */}
      <div style={{ background:"linear-gradient(135deg,rgba(194,113,79,0.07),rgba(194,113,79,0.03))", borderBottom:"1px solid var(--border)", padding:"2.5rem 2rem 2rem", textAlign:"center" }}>
        <div style={{ display:"inline-block", background:"rgba(194,113,79,0.1)", border:"1px solid rgba(194,113,79,0.2)", borderRadius:"20px", padding:"0.3rem 1rem", fontSize:"0.75rem", fontWeight:700, color:"var(--accent)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"1rem" }}>
          Free Rate Grader · AI-Powered
        </div>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.6rem,4vw,2.4rem)", fontWeight:800, marginBottom:"0.75rem" }}>Is Your Mortgage Rate Any Good?</h1>
        <p style={{ color:"var(--muted)", fontSize:"1rem", maxWidth:"500px", margin:"0 auto", lineHeight:1.7 }}>
          Upload your Loan Estimate or enter your details. We'll grade your rate against today's market and show you exactly how much you could save.
        </p>
      </div>

      {/* Tool */}
      <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"2rem" }}>
        <GradeMyRateSectionPublic liveRates={liveRates} onAnalysisDone={handleAnalysisDone} leadCaptured={leadCaptured} pendingAnalysis={pendingAnalysis} />
      </div>

      {/* Lead capture gate modal */}
      {showGate && pendingAnalysis && (
        <div style={{ position:"fixed", inset:0, background:"rgba(44,32,18,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, backdropFilter:"blur(6px)" }}>
          <div className="card" style={{ width:"480px", position:"relative" }}>
            {/* Teaser — grade visible, details locked */}
            <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
              <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:"80px", height:"80px", borderRadius:"50%", border:`3px solid ${{"A":"#3d7d5a","B":"#5a9e6f","C":"#c27a1a","D":"#c05a2a","F":"#c0392b"}[pendingAnalysis.grade]||"#888"}`, marginBottom:"0.75rem" }}>
                <span style={{ fontSize:"2rem", fontWeight:800, color:{"A":"#3d7d5a","B":"#5a9e6f","C":"#c27a1a","D":"#c05a2a","F":"#c0392b"}[pendingAnalysis.grade] }}>{pendingAnalysis.grade}</span>
              </div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.25rem", fontWeight:700, marginBottom:"0.3rem" }}>
                Your rate grades: <span style={{ color:{"A":"#3d7d5a","B":"#5a9e6f","C":"#c27a1a","D":"#c05a2a","F":"#c0392b"}[pendingAnalysis.grade] }}>{pendingAnalysis.gradeLabel}</span>
              </div>
              {pendingAnalysis.ourOffer?.lifetimeSavings > 0 && (
                <div style={{ fontSize:"0.9rem", color:"var(--muted)" }}>
                  You could save up to <strong style={{ color:"var(--green)", fontSize:"1rem" }}>{formatCurrency(pendingAnalysis.ourOffer.lifetimeSavings)}</strong> over the life of your loan.
                </div>
              )}
            </div>

            <div style={{ padding:"1rem", background:"rgba(194,113,79,0.06)", borderRadius:"10px", border:"1px dashed rgba(194,113,79,0.25)", marginBottom:"1.5rem", textAlign:"center" }}>
              <div style={{ fontSize:"0.85rem", color:"var(--muted)" }}>🔓 Enter your info below to unlock the <strong style={{ color:"var(--text)" }}>full breakdown</strong> — red flags, negotiation tips, and our competing offer.</div>
            </div>

            {leadError && (
              <div style={{ padding:"0.6rem 0.85rem", background:"rgba(192,57,43,0.08)", border:"1px solid rgba(192,57,43,0.2)", borderRadius:"8px", fontSize:"0.82rem", color:"#c0392b", marginBottom:"1rem" }}>{leadError}</div>
            )}

            <div style={{ display:"flex", flexDirection:"column", gap:"0.85rem", marginBottom:"1.25rem" }}>
              <div className="field">
                <label>Full Name *</label>
                <input className="text-input" value={lead.name} onChange={e=>setLead(l=>({...l,name:e.target.value}))} placeholder="Jane Smith" />
              </div>
              <div className="field">
                <label>Email Address *</label>
                <input className="text-input" type="email" value={lead.email} onChange={e=>setLead(l=>({...l,email:e.target.value}))} placeholder="jane@email.com" />
              </div>
              <div className="field">
                <label>Phone (optional)</label>
                <input className="text-input" value={lead.phone} onChange={e=>setLead(l=>({...l,phone:e.target.value}))} placeholder="(555) 000-0000" />
              </div>
            </div>

            <button
              className="btn-primary"
              style={{ width:"100%", padding:"0.85rem", fontSize:"1rem", opacity:leadSubmitting?0.7:1 }}
              onClick={submitLead}
              disabled={leadSubmitting}
            >
              {leadSubmitting ? "Saving..." : "Unlock Full Analysis →"}
            </button>
            <div style={{ textAlign:"center", fontSize:"0.73rem", color:"var(--muted)", marginTop:"0.6rem" }}>
              No spam. A HomeStart loan officer may reach out to discuss your results.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// GradeMyRateSectionPublic — same as GradeMyRateSection but calls onAnalysisDone callback
// and hides the full breakdown until leadCaptured is true

export function GradeMyRateLandingWrapper({ onBack }) {
  const liveRates = useLiveRates();
  return <GradeMyRateLanding liveRates={liveRates} onBack={onBack} />;
}
