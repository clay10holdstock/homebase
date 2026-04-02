import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { PORTAL_CSS } from "../constants/appConstants.js";

export default function InviteAcceptPage({ token, onAccepted }) {
  const [invite, setInvite] = useState(null);
  const [realtor, setRealtor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("welcome"); // welcome | signup | login
  const [form, setForm] = useState({ name:"", email:"", phone:"", password:"" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    loadInvite();
  }, [token]);

  const loadInvite = async () => {
    setLoading(true);
    // Fetch invite by token
    const { data: inviteData, error: inviteError } = await supabase
      .from("invites")
      .select("*")
      .eq("token", token)
      .single();
    if (inviteError || !inviteData) {
      setError("This invite link is invalid or has expired.");
      setLoading(false);
      return;
    }
    if (inviteData.status === "accepted") {
      setError("This invite has already been accepted.");
      setLoading(false);
      return;
    }
    setInvite(inviteData);
    // Fetch realtor profile separately
    const { data: realtorData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", inviteData.realtor_id)
      .single();
    setRealtor(realtorData);
    setForm(f => ({ ...f, name: inviteData.client_name || "", email: inviteData.client_email || "", phone: inviteData.client_phone || "" }));
    setLoading(false);
  };

  const acceptInvite = async (userId) => {
    // Link client to realtor first
    const { error: linkError } = await supabase
      .from("realtor_clients")
      .upsert({ realtor_id: invite.realtor_id, client_id: userId, invite_id: invite.id });
    if (linkError) console.error("realtor_clients error:", linkError);

    // Mark invite as accepted
    const { error: inviteError } = await supabase
      .from("invites")
      .update({ status:"accepted", accepted_at: new Date().toISOString() })
      .eq("token", token);
    if (inviteError) console.error("invite update error:", inviteError);

    // Mark as NOT onboarded so wizard shows exactly once after reload
    await supabase.from("profiles").update({ onboarded: false }).eq("id", userId);

    // Force a clean reload into the app
    window.location.href = "/";
  };

  const handleSignUp = async () => {
  setFormError("");
  if (!form.name || !form.email || !form.password) { setFormError("Fields required."); return; }
  setSubmitting(true);
  const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password });
  if (error) { setFormError(error.message); setSubmitting(false); return; }
  
  if (data.user) {
    // 1. Create Profile
    await supabase.from("profiles").insert({ 
      id: data.user.id, 
      role: "buyer", 
      name: form.name, 
      onboarded: false // Ensure wizard triggers once
    });

    // 2. Link to Realtor & Update Invite Status
    await supabase.from("realtor_clients").insert({ 
      realtor_id: invite.realtor_id, 
      client_id: data.user.id 
    });

    await supabase.from("invites").update({ 
      status: "accepted", 
      accepted_at: new Date().toISOString() 
    }).eq("token", token);

    window.location.href = "/"; // Force refresh to clear invite state
  }
};

  const handleLogin = async () => {
    setFormError("");
    if (!form.email || !form.password) { setFormError("Email and password are required."); return; }
    setSubmitting(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    if (error) { setFormError(error.message); setSubmitting(false); return; }
    if (data.user) await acceptInvite(data.user.id);
    setSubmitting(false);
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f8f5f0", fontFamily:"'DM Sans',sans-serif" }}>
      <style>{PORTAL_CSS}</style>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.5rem", fontWeight:800, background:"linear-gradient(135deg,#c2714f,#a85c3a)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:"1rem" }}>HomeStart</div>
        <div style={{ color:"#8a7968" }}>Loading your invite...</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f8f5f0", fontFamily:"'DM Sans',sans-serif" }}>
      <style>{PORTAL_CSS}</style>
      <div style={{ textAlign:"center", maxWidth:"400px", padding:"2rem" }}>
        <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>❌</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.5rem", fontWeight:700, marginBottom:"0.75rem" }}>Invite Not Found</div>
        <div style={{ color:"var(--muted)", marginBottom:"1.5rem" }}>{error}</div>
        <button className="btn-primary" onClick={() => window.location.href = "/"}>Go to HomeStart →</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", fontFamily:"'DM Sans',sans-serif" }}>
      <style>{PORTAL_CSS}</style>

      {/* Header */}
      <header style={{ padding:"1.25rem 2rem", background:"white", borderBottom:"1px solid var(--border)", textAlign:"center" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.3rem", fontWeight:800, background:"linear-gradient(135deg,#c2714f,#a85c3a)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>HomeStart</div>
      </header>

      <div style={{ maxWidth:"480px", margin:"3rem auto", padding:"0 1.5rem" }}>

        {/* Welcome view */}
        {view === "welcome" && (
          <div>
            {/* Realtor card */}
            <div className="card" style={{ textAlign:"center", marginBottom:"1.5rem", background:"linear-gradient(135deg,rgba(194,113,79,0.07),rgba(194,113,79,0.03))", border:"1px solid rgba(194,113,79,0.2)" }}>
              <div style={{ width:"60px", height:"60px", borderRadius:"50%", background:"linear-gradient(135deg,#c2714f,#a85c3a)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:"1.1rem", color:"white", margin:"0 auto 1rem" }}>
                {realtor?.name ? realtor.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase() : "HS"}
              </div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.3rem", fontWeight:700, marginBottom:"0.25rem" }}>
                {realtor?.name || "Your Realtor"} invited you
              </div>
              <div style={{ color:"var(--muted)", fontSize:"0.875rem" }}>
                to start your mortgage pre-approval with HomeStart
              </div>
            </div>

            {/* What to expect */}
            <div className="card" style={{ marginBottom:"1.5rem" }}>
              <div className="section-label">What happens next</div>
              {[
                { icon:"👤", step:"Create your free account", desc:"Takes about 60 seconds" },
                { icon:"📋", step:"Complete your pre-approval profile", desc:"Income, employment, and basic financials" },
                { icon:"✅", step:"Get pre-approved", desc:"Your loan officer will review and issue your letter" },
                { icon:"🏠", step:"Start shopping with confidence", desc:"Share your pre-approval with any seller" },
              ].map((s,i) => (
                <div key={i} style={{ display:"flex", gap:"1rem", padding:"0.65rem 0", borderBottom:i<3?"1px solid var(--border)":"none" }}>
                  <div style={{ fontSize:"1.25rem", flexShrink:0 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontWeight:600, fontSize:"0.875rem" }}>{s.step}</div>
                    <div style={{ color:"var(--muted)", fontSize:"0.78rem" }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn-primary" style={{ width:"100%", padding:"0.9rem", fontSize:"1rem", marginBottom:"0.75rem" }} onClick={() => setView("signup")}>
              Get Started →
            </button>
            <div style={{ textAlign:"center", fontSize:"0.85rem", color:"var(--muted)" }}>
              Already have an account?{" "}
              <span style={{ color:"var(--accent)", cursor:"pointer", fontWeight:600 }} onClick={() => setView("login")}>Sign in instead</span>
            </div>
          </div>
        )}

        {/* Signup view */}
        {view === "signup" && (
          <div>
            <button onClick={() => setView("welcome")} style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", marginBottom:"1.25rem", fontSize:"0.85rem" }}>← Back</button>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.6rem", fontWeight:700, marginBottom:"0.25rem" }}>Create your account</div>
            <div style={{ color:"var(--muted)", fontSize:"0.875rem", marginBottom:"1.5rem" }}>
              Invited by <strong style={{ color:"var(--text)" }}>{realtor?.name}</strong>
            </div>
            <div className="card">
              {formError && <div style={{ padding:"0.65rem 0.85rem", background:"rgba(192,57,43,0.08)", border:"1px solid rgba(192,57,43,0.2)", borderRadius:"8px", fontSize:"0.82rem", color:"var(--red)", marginBottom:"1rem" }}>{formError}</div>}
              <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
                <div className="field"><label>Full Name *</label><input className="text-input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Jane Smith" /></div>
                <div className="field"><label>Email *</label><input className="text-input" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="jane@email.com" /></div>
                <div className="field"><label>Phone</label><input className="text-input" type="tel" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="(555) 000-0000" /></div>
                <div className="field"><label>Password *</label><input className="text-input" type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="••••••••" /></div>
              </div>
              <button className="btn-primary" style={{ width:"100%", marginTop:"1.5rem", padding:"0.85rem", opacity:submitting?0.7:1 }} onClick={handleSignUp} disabled={submitting}>
                {submitting ? "Creating account..." : "Create Account & Accept Invite →"}
              </button>
            </div>
            <div style={{ textAlign:"center", marginTop:"1rem", fontSize:"0.85rem", color:"var(--muted)" }}>
              Already have an account?{" "}
              <span style={{ color:"var(--accent)", cursor:"pointer", fontWeight:600 }} onClick={() => setView("login")}>Sign in instead</span>
            </div>
          </div>
        )}

        {/* Login view */}
        {view === "login" && (
          <div>
            <button onClick={() => setView("welcome")} style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", marginBottom:"1.25rem", fontSize:"0.85rem" }}>← Back</button>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.6rem", fontWeight:700, marginBottom:"0.25rem" }}>Welcome back</div>
            <div style={{ color:"var(--muted)", fontSize:"0.875rem", marginBottom:"1.5rem" }}>
              Sign in to accept {realtor?.name ? `${realtor.name}'s` : "the"} invite
            </div>
            <div className="card">
              {formError && <div style={{ padding:"0.65rem 0.85rem", background:"rgba(192,57,43,0.08)", border:"1px solid rgba(192,57,43,0.2)", borderRadius:"8px", fontSize:"0.82rem", color:"var(--red)", marginBottom:"1rem" }}>{formError}</div>}
              <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
                <div className="field"><label>Email</label><input className="text-input" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="jane@email.com" /></div>
                <div className="field"><label>Password</label><input className="text-input" type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="••••••••" /></div>
              </div>
              <button className="btn-primary" style={{ width:"100%", marginTop:"1.5rem", padding:"0.85rem", opacity:submitting?0.7:1 }} onClick={handleLogin} disabled={submitting}>
                {submitting ? "Signing in..." : "Sign In & Accept Invite →"}
              </button>
            </div>
            <div style={{ textAlign:"center", marginTop:"1rem", fontSize:"0.85rem", color:"var(--muted)" }}>
              New to HomeStart?{" "}
              <span style={{ color:"var(--accent)", cursor:"pointer", fontWeight:600 }} onClick={() => setView("signup")}>Create an account</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Thin wrapper so GradeMyRateLanding can access useLiveRates (hooks must be called in components)
