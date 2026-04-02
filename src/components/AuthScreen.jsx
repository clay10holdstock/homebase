import { useState } from "react";
import { supabase } from "../supabase.js";
import { PORTAL_CSS } from "../constants/appConstants.js";
import { GradeMyRateLandingWrapper } from "./GradeMyRateLanding.jsx";

export default function AuthScreen({ onLogin }) {
  const [view, setView] = useState("landing");
  const [loginType, setLoginType] = useState("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [signup, setSignup] = useState({ name:"", email:"", phone:"", brokerage:"", license:"", password:"", confirm:"" });
  const [signupDone, setSignupDone] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!email || !password) { setError("Please enter your email and password."); return; }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
  };

  const handleSignUp = async (role, opts = {}) => {
    setError("");
    const _email = opts.email || email;
    const _password = opts.password || password;
    const _name = opts.name || signup.name || _email.split("@")[0];
    const _phone = opts.phone || signup.phone || null;
    const _brokerage = opts.brokerage || signup.brokerage || null;
    const _license = opts.license || signup.license || null;
    if (!_email || !_password) { setError("Please enter your email and password."); return; }
    const { data, error } = await supabase.auth.signUp({ email: _email, password: _password });
    if (error) { setError(error.message); return; }
    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        role,
        email: _email,
        name: _name,
        phone: _phone,
      });
      if (profileError) console.error("Profile insert error:", profileError);
      if (role === "realtor") {
        const { error: realtorError } = await supabase.from("realtors").insert({
          id: data.user.id,
          brokerage: _brokerage,
          license: _license,
        });
        if (realtorError) console.error("Realtor insert error:", realtorError);
      }
    }
  };

  if (signupDone) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)" }}>
      <style>{PORTAL_CSS}</style>
      <div style={{ textAlign:"center", maxWidth:"440px", padding:"2rem" }}>
        <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>🎉</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.8rem", fontWeight:700, marginBottom:"0.75rem" }}>You're all set!</div>
        <div style={{ color:"var(--muted)", marginBottom:"2rem", lineHeight:1.6 }}>Your realtor account is ready. Start adding clients and they'll receive a welcome email with login instructions.</div>
        <button className="btn-primary" style={{ width:"100%", padding:"0.85rem" }} onClick={() => setView("login")}>Sign In to Your Dashboard →</button>
      </div>
    </div>
  );

  if (view === "realtor-signup") return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)", padding:"2rem" }}>
      <style>{PORTAL_CSS}</style>
      <div style={{ width:"100%", maxWidth:"520px" }}>
        <button className="btn-secondary" style={{ marginBottom:"1.5rem", fontSize:"0.8rem" }} onClick={() => setView("landing")}>← Back</button>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.8rem", fontWeight:700, marginBottom:"0.25rem" }}>Create Realtor Account</div>
        <div style={{ color:"var(--muted)", marginBottom:"2rem", fontSize:"0.9rem" }}>Free to join. Send clients pre-approval invites in minutes.</div>
        <div className="card">
          {error && <div style={{ padding:"0.75rem", background:"rgba(192,57,43,0.08)", border:"1px solid rgba(192,57,43,0.25)", borderRadius:"8px", color:"#fca5a5", fontSize:"0.85rem", marginBottom:"1rem" }}>{error}</div>}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
            <div className="field" style={{ gridColumn:"1/-1" }}><label>Full Name *</label><input className="text-input" value={signup.name} onChange={e => setSignup(s=>({...s,name:e.target.value}))} placeholder="Sarah Connelly" /></div>
            <div className="field"><label>Email *</label><input className="text-input" value={signup.email} onChange={e => setSignup(s=>({...s,email:e.target.value}))} placeholder="sarah@realty.com" /></div>
            <div className="field"><label>Phone</label><input className="text-input" value={signup.phone} onChange={e => setSignup(s=>({...s,phone:e.target.value}))} placeholder="(555) 000-0000" /></div>
            <div className="field" style={{ gridColumn:"1/-1" }}><label>Brokerage *</label><input className="text-input" value={signup.brokerage} onChange={e => setSignup(s=>({...s,brokerage:e.target.value}))} placeholder="Austin Premier Realty" /></div>
            <div className="field"><label>License #</label><input className="text-input" value={signup.license} onChange={e => setSignup(s=>({...s,license:e.target.value}))} placeholder="TX-123456" /></div>
            <div className="field"><label>State</label><select className="text-input"><option>Texas</option><option>Utah</option><option>California</option><option>Florida</option></select></div>
            <div className="field"><label>Password *</label><input className="text-input" type="password" value={signup.password} onChange={e => setSignup(s=>({...s,password:e.target.value}))} placeholder="••••••••" /></div>
            <div className="field"><label>Confirm Password</label><input className="text-input" type="password" value={signup.confirm} onChange={e => setSignup(s=>({...s,confirm:e.target.value}))} placeholder="••••••••" /></div>
          </div>
          <button className="btn-primary" style={{ width:"100%", marginTop:"1.5rem", padding:"0.85rem" }} onClick={async () => {
  if(!signup.name||!signup.email||!signup.password){setError("Fill in required fields.");return;}
  await handleSignUp("realtor", { email:signup.email, password:signup.password, name:signup.name, phone:signup.phone, brokerage:signup.brokerage, license:signup.license });
  setSignupDone(true);
}}>Create My Account →</button>
          <div style={{ textAlign:"center", fontSize:"0.75rem", color:"var(--muted)", marginTop:"0.75rem" }}>By signing up you agree to our Terms of Service and Privacy Policy</div>
        </div>
      </div>
    </div>
  );

  if (view === "buyer-signup") return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)", padding:"2rem" }}>
      <style>{PORTAL_CSS}</style>
      <div style={{ width:"100%", maxWidth:"420px" }}>
        <button className="btn-secondary" style={{ marginBottom:"1.5rem", fontSize:"0.8rem" }} onClick={() => setView("login")}>← Back</button>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.8rem", fontWeight:700, marginBottom:"0.25rem" }}>Create Your Account</div>
        <div style={{ color:"var(--muted)", marginBottom:"1.5rem", fontSize:"0.9rem" }}>Free to join. Get pre-approved, track your home, and manage your mortgage.</div>
        <div className="card">
          {error && <div style={{ padding:"0.75rem", background:"rgba(192,57,43,0.08)", border:"1px solid rgba(192,57,43,0.25)", borderRadius:"8px", color:"var(--red)", fontSize:"0.85rem", marginBottom:"1rem" }}>{error}</div>}
          <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
            <div className="field"><label>Full Name *</label><input className="text-input" value={signup.name} onChange={e=>setSignup(s=>({...s,name:e.target.value}))} placeholder="Jane Smith" /></div>
            <div className="field"><label>Email *</label><input className="text-input" value={signup.email} onChange={e=>setSignup(s=>({...s,email:e.target.value}))} placeholder="jane@email.com" /></div>
            <div className="field"><label>Phone</label><input className="text-input" value={signup.phone} onChange={e=>setSignup(s=>({...s,phone:e.target.value}))} placeholder="(555) 000-0000" /></div>
            <div className="field"><label>Password *</label><input className="text-input" type="password" value={signup.password} onChange={e=>setSignup(s=>({...s,password:e.target.value}))} placeholder="••••••••" /></div>
          </div>
          <button className="btn-primary" style={{ width:"100%", marginTop:"1.5rem", padding:"0.85rem" }} onClick={async () => {
            if(!signup.name||!signup.email||!signup.password){setError("Fill in required fields.");return;}
            await handleSignUp("buyer", { email:signup.email, password:signup.password, name:signup.name, phone:signup.phone });
          }}>Create Account →</button>
          <div style={{ textAlign:"center", fontSize:"0.75rem", color:"var(--muted)", marginTop:"0.75rem" }}>By signing up you agree to our Terms of Service</div>
        </div>
      </div>
    </div>
  );

  if (view === "login") return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)" }}>
      <style>{PORTAL_CSS}</style>
      <div style={{ width:"100%", maxWidth:"420px", padding:"2rem" }}>
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"2rem", fontWeight:800, background:"linear-gradient(135deg,#c2714f,#a85c3a)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>HomeStart</div>
          <div style={{ color:"var(--muted)", fontSize:"0.9rem" }}>Sign in to your account</div>
        </div>
        <div style={{ display:"flex", background:"var(--surface)", borderRadius:"10px", padding:"3px", border:"1px solid var(--border)", marginBottom:"1.5rem" }}>
          {[["client","🏠 Homebuyer"],["realtor","🤝 Realtor"],["lender","🏦 Lender"]].map(([t,label]) => (
            <button key={t} onClick={() => setLoginType(t)} style={{ flex:1, padding:"0.5rem", borderRadius:"8px", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:"0.8rem", background:loginType===t?"rgba(194,113,79,0.15)":"transparent", color:loginType===t?"var(--accent)":"var(--muted)", transition:"all 0.2s" }}>
              {label}
            </button>
          ))}
        </div>
        <div className="card">
          {error && <div style={{ padding:"0.75rem", background:"rgba(192,57,43,0.08)", border:"1px solid rgba(192,57,43,0.25)", borderRadius:"8px", color:"#fca5a5", fontSize:"0.85rem", marginBottom:"1rem" }}>{error}</div>}
          <div className="field" style={{ marginBottom:"1rem" }}><label>Email</label><input className="text-input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" /></div>
          <div className="field" style={{ marginBottom:"1.5rem" }}><label>Password</label><input className="text-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" /></div>
          <button className="btn-primary" style={{ width:"100%", padding:"0.85rem" }} onClick={handleLogin}>Sign In →</button>
          <div style={{ textAlign:"center", marginTop:"1rem", fontSize:"0.8rem", color:"var(--muted)" }}>
            {loginType === "client" && <span>New here? <span style={{ color:"var(--accent)", cursor:"pointer", fontWeight:600 }} onClick={() => setView("buyer-signup")}>Create a free account</span></span>}
            {loginType === "lender" && <span>Contact <a href="mailto:admin@homestart.com" style={{ color:"var(--accent)" }}>admin@homestart.com</a> to get access</span>}
          </div>
        </div>
        {loginType==="realtor" && <div style={{ textAlign:"center", marginTop:"1.5rem", fontSize:"0.9rem", color:"var(--muted)" }}>Don't have an account? <span style={{ color:"var(--accent)", cursor:"pointer", fontWeight:600 }} onClick={() => setView("realtor-signup")}>Sign up free</span></div>}
        <div style={{ textAlign:"center", marginTop:"1rem" }}><button className="btn-secondary" style={{ fontSize:"0.8rem" }} onClick={() => setView("landing")}>← Back</button></div>
      </div>
    </div>
  );

  if (view === "grade-my-rate") return <GradeMyRateLandingWrapper onBack={() => setView("landing")} />;

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <style>{PORTAL_CSS}</style>
      <header style={{ padding:"1.5rem 3rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.5rem", fontWeight:800, background:"linear-gradient(135deg,#c2714f,#a85c3a)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>HomeStart</div>
        <div style={{ display:"flex", gap:"1rem" }}>
          <button className="btn-secondary" onClick={() => setView("login")}>Sign In</button>
          <button className="btn-primary" onClick={() => setView("realtor-signup")}>Realtors: Join Free →</button>
        </div>
      </header>
      <div style={{ textAlign:"center", padding:"5rem 2rem 3rem", position:"relative" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 70% 50% at 50% 0%, rgba(194,113,79,0.08), transparent)", pointerEvents:"none" }} />
        <div style={{ fontSize:"0.8rem", fontWeight:700, letterSpacing:"0.15em", color:"var(--accent)", textTransform:"uppercase", marginBottom:"1rem" }}>The smarter mortgage platform</div>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(2.5rem,6vw,4rem)", fontWeight:800, letterSpacing:"-0.03em", lineHeight:1.1, marginBottom:"1.5rem" }}>From first showing<br />to final payment</h1>
        <p style={{ color:"var(--muted)", fontSize:"1.15rem", maxWidth:"520px", margin:"0 auto 3rem", lineHeight:1.7 }}>Realtors invite clients. Clients get pre-approved. Everyone manages their mortgage, home value, and equity in one place — for life.</p>
        <div style={{ display:"flex", gap:"1rem", justifyContent:"center", flexWrap:"wrap" }}>
          <button className="btn-primary" style={{ padding:"0.85rem 2rem", fontSize:"1rem" }} onClick={() => setView("login")}>Get Started →</button>
          <button className="btn-secondary" style={{ padding:"0.85rem 2rem", fontSize:"1rem" }} onClick={() => setView("realtor-signup")}>I'm a Realtor</button>
          <button onClick={() => setView("grade-my-rate")} style={{ padding:"0.85rem 2rem", fontSize:"1rem", background:"linear-gradient(135deg,rgba(194,113,79,0.12),rgba(194,113,79,0.06))", border:"1px solid rgba(194,113,79,0.35)", borderRadius:"8px", color:"var(--accent)", fontFamily:"'DM Sans',sans-serif", fontWeight:700, cursor:"pointer" }}>⚡ Grade My Rate — Free</button>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1.5rem", maxWidth:"1100px", margin:"2rem auto", padding:"0 2rem" }}>
        {[
          { icon:"🤝", title:"For Realtors", desc:"Invite clients in seconds. Track their loan status and pre-approval without becoming a loan officer." },
          { icon:"🏠", title:"For Buyers", desc:"Get pre-approved, shop loans, compare rates, and manage every step of your purchase from one guided dashboard." },
          { icon:"📈", title:"For Homeowners", desc:"Monitor refi opportunities, track home value, manage equity, and find contractors — all in one place, forever." },
        ].map((f,i) => (
          <div key={i} className="card" style={{ textAlign:"center" }}>
            <div style={{ fontSize:"2.5rem", marginBottom:"1rem" }}>{f.icon}</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.15rem", fontWeight:700, marginBottom:"0.5rem" }}>{f.title}</div>
            <div style={{ color:"var(--muted)", fontSize:"0.875rem", lineHeight:1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

