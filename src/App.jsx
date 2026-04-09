import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";
import { useLiveRates } from "./hooks/useLiveRates.js";
import { calcMonthly, formatCurrency } from "./utils/loanUtils.js";
import PreApprovalSection from "./components/PreApprovalSection.jsx";
import AuthScreen from "./components/AuthScreen.jsx";
import GradeMyRateSection from "./components/GradeMyRateSection.jsx";
import { GradeMyRateLandingWrapper } from "./components/GradeMyRateLanding.jsx";
import LoanApplicationWizard from "./components/LoanApplicationWizard.jsx";
import InviteAcceptPage from "./components/InviteAcceptPage.jsx";
import { PORTAL_CSS, LENDER_CSS, MOCK_DB, STATUS_STEPS, STATUS_COLORS } from "./constants/appConstants.js";

const BUYER_TABS = ["Pre-Approval", "Grade My Rate"];
const BUYER_TITLES = ["Pre-Approval", "Grade My Rate"];

// ---- SECTIONS ----

function AffordabilitySection({ defaultRate = 6.875 }) {
  const [income, setIncome] = useState(85000);
  const [debt, setDebt] = useState(500);
  const [down, setDown] = useState(20);
  const [rate, setRate] = useState(defaultRate);
  const [creditScore, setCreditScore] = useState(720);

  // Sync rate when live data arrives
  useEffect(() => { setRate(defaultRate); }, [defaultRate]);

  const monthlyIncome = income / 12;
  const maxPayment = monthlyIncome * 0.28;
  const maxTotalDebt = monthlyIncome * 0.43;
  const availableForHousing = Math.max(0, maxTotalDebt - debt);
  const effectiveMax = Math.min(maxPayment, availableForHousing);

  const r = rate / 100 / 12;
  const n = 360;
  const maxLoan = effectiveMax * ((Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n)));
  const downAmount = (down / 100) * maxLoan / (1 - down / 100);
  const maxHome = maxLoan + downAmount;

  const dti = ((debt + effectiveMax) / monthlyIncome) * 100;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
      <div className="card">
        <h3 className="section-label">Your Financial Profile</h3>
        <div className="input-group">
          <label>Annual Gross Income</label>
          <div className="input-row">
            <input type="range" min="30000" max="300000" step="1000" value={income} onChange={e => setIncome(+e.target.value)} />
            <span className="val">{formatCurrency(income)}</span>
          </div>
        </div>
        <div className="input-group">
          <label>Monthly Debt Payments</label>
          <div className="input-row">
            <input type="range" min="0" max="3000" step="50" value={debt} onChange={e => setDebt(+e.target.value)} />
            <span className="val">{formatCurrency(debt)}/mo</span>
          </div>
        </div>
        <div className="input-group">
          <label>Down Payment (%)</label>
          <div className="input-row">
            <input type="range" min="3" max="30" step="1" value={down} onChange={e => setDown(+e.target.value)} />
            <span className="val">{down}%</span>
          </div>
        </div>
        <div className="input-group">
          <label>Interest Rate (%)</label>
          <div className="input-row">
            <input type="range" min="4" max="10" step="0.125" value={rate} onChange={e => setRate(+e.target.value)} />
            <span className="val">{rate}%</span>
          </div>
        </div>
        <div className="input-group">
          <label>Credit Score</label>
          <div className="input-row">
            <input type="range" min="580" max="850" step="5" value={creditScore} onChange={e => setCreditScore(+e.target.value)} />
            <span className="val">{creditScore}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div className="card hero-card">
          <div className="hero-label">Estimated Home Budget</div>
          <div className="hero-number">{formatCurrency(maxHome)}</div>
          <div className="hero-sub">Max loan: {formatCurrency(maxLoan)} · Down: {formatCurrency(downAmount)}</div>
        </div>

        <div className="card">
          <h3 className="section-label">Breakdown</h3>
          <div className="breakdown-row">
            <span>Monthly Income</span>
            <span>{formatCurrency(monthlyIncome)}</span>
          </div>
          <div className="breakdown-row">
            <span>Max Housing Payment (28%)</span>
            <span className="green">{formatCurrency(maxPayment)}</span>
          </div>
          <div className="breakdown-row">
            <span>Existing Debt</span>
            <span className="red">-{formatCurrency(debt)}</span>
          </div>
          <div className="breakdown-row bold">
            <span>Available for Mortgage</span>
            <span>{formatCurrency(effectiveMax)}</span>
          </div>
          <div className="dti-bar-wrap">
            <div className="dti-label">Debt-to-Income Ratio: <strong style={{color: dti > 43 ? "var(--red)" : dti > 36 ? "var(--amber)" : "var(--green)"}}>{dti.toFixed(1)}%</strong></div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${Math.min(dti, 100)}%`, background: dti > 43 ? "var(--red)" : dti > 36 ? "var(--amber)" : "var(--green)" }} />
            </div>
            <div className="dti-markers"><span>0%</span><span style={{marginLeft:"36%"}}>36%</span><span style={{marginLeft:"7%"}}>43%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FindHomesSection({ budget }) {
  const [maxPrice, setMaxPrice] = useState(420000);
  const filtered = MOCK_HOMES.filter(h => h.price <= maxPrice);

  return (
    <div>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <div style={{ flex: 1 }}>
            <label className="section-label">Max Home Price</label>
            <div className="input-row">
              <input type="range" min="200000" max="800000" step="5000" value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} style={{ flex: 1 }} />
              <span className="val">{formatCurrency(maxPrice)}</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Showing</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--blue)" }}>{filtered.length}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>of {MOCK_HOMES.length} homes</div>
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        {filtered.map((h, i) => (
          <div key={i} className="home-card card">
            <div className="home-emoji">{h.img}</div>
            <div className="home-price">{formatCurrency(h.price)}</div>
            <div className="home-address">{h.address}</div>
            <div className="home-city">{h.city}</div>
            <div className="home-details">
              <span>{h.beds} bd</span><span className="dot">·</span>
              <span>{h.baths} ba</span><span className="dot">·</span>
              <span>{h.sqft.toLocaleString()} sqft</span>
            </div>
            <div className="home-monthly">~{formatCurrency(calcMonthly(h.price * 0.8, 6.875, 30))}/mo</div>
            <button className="btn-secondary" style={{ marginTop: "0.75rem", width: "100%" }}>View Details</button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
            No homes found in this price range. Try increasing your budget.
          </div>
        )}
      </div>
    </div>
  );
}

function CreditSection() {
  const [score, setScore] = useState(680);
  const [utilization, setUtilization] = useState(45);
  const [missedPayments, setMissedPayments] = useState(1);
  const [accountAge, setAccountAge] = useState(3);

  const scoreColor = score >= 750 ? "var(--green)" : score >= 700 ? "#5a9e6f" : score >= 650 ? "var(--amber)" : "#ef4444";
  const scoreLabel = score >= 750 ? "Excellent" : score >= 700 ? "Good" : score >= 650 ? "Fair" : "Poor";

  const tips = [];
  if (utilization > 30) tips.push({ action: `Lower credit utilization below 30% (currently ${utilization}%)`, impact: "High", points: "+20-40 pts" });
  if (missedPayments > 0) tips.push({ action: "Bring all accounts current and set up autopay", impact: "Critical", points: "+30-60 pts" });
  if (accountAge < 5) tips.push({ action: "Avoid opening new credit accounts to preserve account age", impact: "Medium", points: "+5-15 pts" });
  tips.push({ action: "Keep old credit card accounts open even if unused", impact: "Medium", points: "+10-20 pts" });
  tips.push({ action: "Dispute any errors on your credit report (free at annualcreditreport.com)", impact: "High", points: "Varies" });

  const dtiIncome = 85000 / 12;
  const totalDebt = 500;
  const dti = (totalDebt / dtiIncome * 100).toFixed(1);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
      <div>
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h3 className="section-label">Credit Score Simulator</h3>
          <div style={{ textAlign: "center", margin: "1.5rem 0" }}>
            <div style={{ fontSize: "3.5rem", fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score}</div>
            <div style={{ fontSize: "1rem", color: scoreColor, marginTop: "0.25rem" }}>{scoreLabel}</div>
            <div className="score-arc" style={{ "--pct": `${(score - 300) / 550}`, "--clr": scoreColor }}>
              <div className="arc-track" />
            </div>
          </div>
          <div className="input-group">
            <label>Credit Score</label>
            <div className="input-row">
              <input type="range" min="500" max="850" step="5" value={score} onChange={e => setScore(+e.target.value)} />
              <span className="val">{score}</span>
            </div>
          </div>
          <div className="input-group">
            <label>Credit Utilization</label>
            <div className="input-row">
              <input type="range" min="0" max="100" step="1" value={utilization} onChange={e => setUtilization(+e.target.value)} />
              <span className="val">{utilization}%</span>
            </div>
          </div>
          <div className="input-group">
            <label>Missed Payments (last 2 yrs)</label>
            <div className="input-row">
              <input type="range" min="0" max="10" step="1" value={missedPayments} onChange={e => setMissedPayments(+e.target.value)} />
              <span className="val">{missedPayments}</span>
            </div>
          </div>
          <div className="input-group">
            <label>Avg Account Age (years)</label>
            <div className="input-row">
              <input type="range" min="1" max="20" step="1" value={accountAge} onChange={e => setAccountAge(+e.target.value)} />
              <span className="val">{accountAge} yrs</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="section-label">Rate Impact by Score</h3>
          {[
            { range: "760–850", rate: "6.25%", label: "Excellent" },
            { range: "700–759", rate: "6.50%", label: "Good" },
            { range: "650–699", rate: "7.00%", label: "Fair" },
            { range: "620–649", rate: "7.75%", label: "Poor" },
          ].map((row, i) => (
            <div key={i} className="breakdown-row" style={{ background: score >= parseInt(row.range) ? "rgba(61,125,90,0.07)" : "transparent", borderRadius: "6px", padding: "0.4rem 0.5rem" }}>
              <span style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{row.range}</span>
              <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{row.label}</span>
              <span style={{ fontWeight: 700 }}>{row.rate}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="section-label">Action Plan to Improve Your Score</h3>
        {tips.map((t, i) => (
          <div key={i} style={{ padding: "1rem", borderRadius: "10px", background: "var(--card-bg-2)", marginBottom: "0.75rem", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: t.impact === "Critical" ? "var(--red)" : t.impact === "High" ? "#f59e0b" : "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.impact} Impact</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--green)" }}>{t.points}</span>
            </div>
            <div style={{ fontSize: "0.9rem" }}>{t.action}</div>
          </div>
        ))}

        <div style={{ marginTop: "1.5rem", padding: "1rem", background: "linear-gradient(135deg, #fbeee8, #fdf4ec)", borderRadius: "10px", border: "1px solid #e8d4c8" }}>
          <div className="section-label" style={{ marginBottom: "0.5rem" }}>Debt-to-Income Overview</div>
          <div className="breakdown-row">
            <span>Monthly Gross Income</span>
            <span>{formatCurrency(dtiIncome)}</span>
          </div>
          <div className="breakdown-row">
            <span>Monthly Debt Payments</span>
            <span>{formatCurrency(totalDebt)}</span>
          </div>
          <div className="breakdown-row bold">
            <span>Current DTI</span>
            <span style={{ color: "var(--green)" }}>{dti}% ✓ Excellent</span>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.5rem" }}>
            Most lenders require DTI below 43%. Below 36% is ideal.
          </div>
        </div>
      </div>
    </div>
  );
}

function ShopLoansSection({ liveRates }) {
  const [loanAmt, setLoanAmt] = useState(320000);
  const { products, loading, error, asOf } = liveRates;

  return (
    <div>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="input-row" style={{ alignItems: "center" }}>
          <label style={{ fontWeight: 600, whiteSpace: "nowrap", marginRight: "1rem" }}>Loan Amount:</label>
          <input type="range" min="100000" max="800000" step="5000" value={loanAmt} onChange={e => setLoanAmt(+e.target.value)} style={{ flex: 1 }} />
          <span className="val">{formatCurrency(loanAmt)}</span>
        </div>
      </div>
      {loading && (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>Loading live rates...</div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {products.map((loan, i) => {
          const years = loan.term || 30;
          const monthly = loan.rate ? calcMonthly(loanAmt, loan.rate, years) : null;
          const totalCost = monthly ? monthly * years * 12 : null;
          return (
            <div key={i} className="loan-card card" style={{ position: "relative" }}>
              {loan.badge && <div className="loan-badge">{loan.badge}</div>}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto", gap: "1rem", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{loan.name}</div>
                  <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{loan.lender}</div>
                </div>
                <div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--blue)" }}>{loan.rate ?? "—"}%</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Rate</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{loan.apr ?? "—"}%</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>APR</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{monthly ? formatCurrency(monthly) : "—"}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Monthly</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{totalCost ? formatCurrency(totalCost) : "—"}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Total Cost</div>
                </div>
                <button className="btn-primary">Apply</button>
              </div>
            </div>
          );
        })}
      </div>
      {asOf && <div style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--muted)", textAlign: "right" }}>Rates from Freddie Mac PMMS week of {asOf} · Subject to credit approval</div>}
    </div>
  );
}

function RealtorPortal({ user, onLogout }) {
  const [tab, setTab] = useState("clients");
  const [showAdd, setShowAdd] = useState(false);
  const [newClient, setNewClient] = useState({ name:"", email:"", phone:"" });
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [realtorClients, setRealtorClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [clientStatuses, setClientStatuses] = useState({});
  const [contractFiles, setContractFiles] = useState({});

  // Pre-approval letter state
  const [letterAmount, setLetterAmount] = useState(0);
  const [letterGenerated, setLetterGenerated] = useState(false);
  const [showLetterPreview, setShowLetterPreview] = useState(false);

  // Under contract flow state
  const [showContractModal, setShowContractModal] = useState(false);
  const [contractUploadStep, setContractUploadStep] = useState("upload");
  const [contractFileName, setContractFileName] = useState("");
  const [contractDragOver, setContractDragOver] = useState(false);

  // Merge real Supabase clients with mock clients for demo purposes
  const clients = realtorClients.length > 0
    ? realtorClients.map(c => ({
        ...c,
        status: c.status || "Account Created",
        loanAmount: c.loan_amount || null,
        loanType: c.loan_type || null,
        preApprovalDate: c.pre_approval_date || null,
        flags: c.flags || [],
        downPct: c.down_pct || null,
      }))
    : MOCK_DB.clients.filter(c => user.clients?.includes(c.id));
  const getClientStatus = (client) => clientStatuses[client.id] || client.status;

  const selectClient = (client) => {
    setSelected(client);
    setLetterAmount(client.loanAmount || 0);
    setLetterGenerated(false);
    setShowLetterPreview(false);
  };

  const deselectClient = () => {
    setSelected(null);
    setLetterGenerated(false);
    setShowLetterPreview(false);
  };

  const openContractModal = () => {
    setContractUploadStep("upload");
    setContractFileName("");
    setShowContractModal(true);
  };

  const handleContractFile = (file) => {
    if (!file) return;
    setContractFileName(file.name);
    setContractUploadStep("confirm");
  };

  const confirmUnderContract = () => {
    setClientStatuses(prev => ({ ...prev, [selected.id]: "Under Contract" }));
    setContractFiles(prev => ({ ...prev, [selected.id]: contractFileName }));
    setContractUploadStep("done");
  };

  // Load real clients from Supabase on mount
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setClientsLoading(true);
    // Load accepted clients
    const { data: clientData } = await supabase
      .from("realtor_clients")
      .select("*, client:profiles!realtor_clients_client_id_fkey(*)")
      .eq("realtor_id", user.id);

    // Load pending invites to show in pipeline
    const { data: inviteData } = await supabase
      .from("invites")
      .select("*")
      .eq("realtor_id", user.id)
      .eq("status", "pending");

    const acceptedClients = (clientData || []).map(r => r.client).filter(Boolean).map(c => ({ ...c, status: "Account Created" }));
    const pendingInvites = (inviteData || []).map(inv => ({
      id: inv.id,
      name: inv.client_name || inv.client_email,
      email: inv.client_email,
      status: "Invited",
      loanAmount: null, loanType: null, preApprovalDate: null, flags: [], downPct: null,
    }));

    setRealtorClients([...acceptedClients, ...pendingInvites]);
    setClientsLoading(false);
  };

  const sendInvite = async () => {
    if (!newClient.name || !newClient.email) return;
    setInviteError("");
    setInviteSending(true);
    try {
      // Insert the invite
      const { error: insertError } = await supabase
        .from("invites")
        .insert({ realtor_id: user.id, client_email: newClient.email, client_name: newClient.name });
      if (insertError) throw insertError;

      // Fetch it back by realtor_id + email (most recent)
      const { data, error: fetchError } = await supabase
        .from("invites")
        .select("token")
        .eq("realtor_id", user.id)
        .eq("client_email", newClient.email)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (fetchError) throw fetchError;

      const link = `${window.location.origin}?invite=${data.token}`;
      setInviteLink(link);
      // Send invite email via serverless function
      await fetch("/api/send-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientEmail: newClient.email,
          clientName: newClient.name,
          realtorName: user.name,
          inviteLink: link,
        }),
      });
      setInviteSent(true);
    } catch(err) {
      setInviteError("Failed to create invite: " + (err.message || err));
    } finally {
      setInviteSending(false);
    }
  };

  const closeInviteModal = () => {
    setShowAdd(false);
    setInviteSent(false);
    setInviteLink("");
    setInviteError("");
    setNewClient({ name:"", email:"", phone:"" });
  };

  const statusCounts = STATUS_STEPS.reduce((acc,s) => { acc[s] = clients.filter(c=>getClientStatus(c)===s).length; return acc; }, {});

  if (selected) {
    const effectiveStatus = getClientStatus(selected);
    const maxApproved = selected.loanAmount || 0;

    const today = new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });
    const expiry = selected.preApprovalExpiry
      ? new Date(selected.preApprovalExpiry).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })
      : new Date(Date.now() + 90*86400000).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });
    const downAmt = letterAmount * ((selected.downPct||10) / 100);
    const loanAmt = letterAmount - downAmt;

    const LetterPreview = () => (
      <div style={{ background:"linear-gradient(135deg,#fdf8f4 0%,#f5ece3 100%)", borderRadius:"16px", padding:"2.5rem", border:"2px solid rgba(194,113,79,0.35)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, right:0, width:"160px", height:"160px", background:"radial-gradient(circle,rgba(194,113,79,0.08),transparent 70%)" }} />
        <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.5rem", fontWeight:800, background:"linear-gradient(135deg,#c2714f,#a85c3a)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>HomeStart Mortgage</div>
          <div style={{ fontSize:"0.75rem", color:"#9a8878", marginTop:"0.25rem", textTransform:"uppercase", letterSpacing:"0.1em" }}>Pre-Approval Letter</div>
        </div>
        <div style={{ borderTop:"1px solid #e8c4b0", borderBottom:"1px solid #e8c4b0", padding:"1rem 0", marginBottom:"1.25rem" }}>
          <div style={{ fontSize:"0.72rem", color:"#a8968a", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.3rem" }}>Issued to</div>
          <div style={{ fontSize:"1.15rem", fontWeight:700 }}>{selected.name}</div>
          <div style={{ color:"#9a8878", fontSize:"0.85rem" }}>{selected.email}</div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"1.25rem" }}>
          <div style={{ background:"rgba(194,113,79,0.08)", borderRadius:"10px", padding:"1rem" }}>
            <div style={{ fontSize:"0.7rem", color:"#a8968a", textTransform:"uppercase", letterSpacing:"0.08em" }}>Pre-Approved Up To</div>
            <div style={{ fontSize:"1.6rem", fontWeight:800, color:"var(--accent)", marginTop:"0.25rem" }}>{formatCurrency(letterAmount)}</div>
          </div>
          <div style={{ background:"#edf5f0", borderRadius:"10px", padding:"1rem" }}>
            <div style={{ fontSize:"0.7rem", color:"#a8968a", textTransform:"uppercase", letterSpacing:"0.08em" }}>Loan Amount</div>
            <div style={{ fontSize:"1.6rem", fontWeight:800, color:"var(--green)", marginTop:"0.25rem" }}>{formatCurrency(loanAmt)}</div>
          </div>
          <div>
            <div style={{ fontSize:"0.7rem", color:"#a8968a", textTransform:"uppercase", letterSpacing:"0.08em" }}>Loan Type</div>
            <div style={{ fontWeight:600, marginTop:"0.2rem", fontSize:"0.9rem" }}>{selected.loanType || "Conventional 30-Year Fixed"}</div>
          </div>
          <div>
            <div style={{ fontSize:"0.7rem", color:"#a8968a", textTransform:"uppercase", letterSpacing:"0.08em" }}>Down Payment</div>
            <div style={{ fontWeight:600, marginTop:"0.2rem", fontSize:"0.9rem" }}>{formatCurrency(downAmt)} ({selected.downPct||10}%)</div>
          </div>
        </div>
        <div style={{ fontSize:"0.75rem", color:"#b8a89c", lineHeight:1.6, borderTop:"1px solid #e8d4c8", paddingTop:"1rem" }}>
          This pre-approval is based on information provided and is subject to verification of income, assets, employment, and credit. This letter does not constitute a commitment to lend. Valid until {expiry}.
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"1.25rem" }}>
          <div style={{ fontSize:"0.72rem", color:"#c0b0a4" }}>Prepared by: {user.name} · {user.brokerage}</div>
          <div style={{ fontSize:"0.72rem", color:"#c0b0a4" }}>Issued: {today}</div>
        </div>
      </div>
    );

    return (
      <>
      <div style={{ minHeight:"100vh", background:"var(--bg)", padding:"2rem" }}>
        <style>{PORTAL_CSS}</style>
        <button className="btn-secondary" style={{ marginBottom:"1.5rem" }} onClick={deselectClient}>← Back to Clients</button>
        <div style={{ maxWidth:"860px" }}>

          {/* Client header */}
          <div style={{ display:"flex", alignItems:"center", gap:"1.5rem", marginBottom:"2rem" }}>
            <div style={{ width:"56px", height:"56px", borderRadius:"50%", background:"linear-gradient(135deg,#c2714f,#a85c3a)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:"1.1rem" }}>
              {selected.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
            </div>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.5rem", fontWeight:700 }}>{selected.name}</div>
              <div style={{ color:"var(--muted)", fontSize:"0.9rem" }}>{selected.email} · {selected.phone}</div>
            </div>
            <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:"0.75rem" }}>
              <span style={{ padding:"0.4rem 1rem", borderRadius:"20px", fontSize:"0.8rem", fontWeight:700, background:`${STATUS_COLORS[effectiveStatus]}20`, color:STATUS_COLORS[effectiveStatus], border:`1px solid ${STATUS_COLORS[effectiveStatus]}40` }}>{effectiveStatus}</span>
              {effectiveStatus === "Pre-Approved" && (
                <button className="btn-primary" style={{ fontSize:"0.8rem", padding:"0.4rem 1rem", background:"linear-gradient(135deg,#2f6fa8,#1e5a8a)" }} onClick={openContractModal}>
                  🏡 Mark Under Contract
                </button>
              )}
              {effectiveStatus === "Under Contract" && contractFiles[selected.id] && (
                <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.35rem 0.75rem", background:"rgba(61,125,90,0.1)", borderRadius:"8px", border:"1px solid rgba(61,125,90,0.25)", fontSize:"0.78rem", color:"var(--green)" }}>
                  📄 {contractFiles[selected.id]}
                </div>
              )}
            </div>
          </div>

          {/* Pipeline */}
          <div className="card" style={{ marginBottom:"1.5rem" }}>
            <div className="section-label">Loan Pipeline</div>
            <div style={{ display:"flex", gap:0, position:"relative" }}>
              {STATUS_STEPS.map((step,i) => {
                const idx = STATUS_STEPS.indexOf(effectiveStatus);
                const isActive = i===idx, isDone = i<idx;
                return (
                  <div key={step} style={{ flex:1, textAlign:"center", position:"relative" }}>
                    {i<STATUS_STEPS.length-1 && <div style={{ position:"absolute", top:"14px", left:"50%", width:"100%", height:"2px", background:isDone||isActive?"var(--accent)":"var(--border)", zIndex:0 }} />}
                    <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:isActive?"var(--accent)":isDone?"var(--green)":"var(--border)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 0.5rem", position:"relative", zIndex:1, fontSize:"0.75rem", fontWeight:700 }}>{isDone?"✓":i+1}</div>
                    <div style={{ fontSize:"0.65rem", color:isActive?"var(--text)":"var(--muted)", fontWeight:isActive?700:400, lineHeight:1.3 }}>{step}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem", marginBottom:"1.5rem" }}>
            {/* Loan info — no credit/income */}
            <div className="card">
              <div className="section-label">Loan Details</div>
              {[
                ["Loan Type", selected.loanType || "—"],
                ["Down Payment", selected.downPct ? `${selected.downPct}%` : "—"],
                ["Pre-Approval Date", selected.preApprovalDate || "Pending"],
                ["Expiry Date", selected.preApprovalExpiry || "—"],
                ["Rate", selected.rate ? `${selected.rate}%` : "Pending"],
              ].map(([k,v],i) => (
                <div key={i} className="breakdown-row"><span>{k}</span><span>{v}</span></div>
              ))}
              {selected.flags?.length > 0 && (
                <div style={{ marginTop:"1rem" }}>
                  <div className="section-label" style={{ color:"var(--amber)" }}>⚠️ Action Needed</div>
                  {selected.flags.map((f,i) => <div key={i} style={{ padding:"0.5rem 0.75rem", background:"rgba(194,122,26,0.09)", borderRadius:"6px", fontSize:"0.85rem", color:"var(--amber)", marginBottom:"0.4rem" }}>{f}</div>)}
                </div>
              )}
            </div>

            {/* Pre-approval letter generator */}
            <div className="card" style={{ background: (effectiveStatus === "Pre-Approved" || effectiveStatus === "Under Contract") ? "linear-gradient(135deg,rgba(61,125,90,0.07),rgba(61,125,90,0.04))" : "var(--card)", border: (effectiveStatus === "Pre-Approved" || effectiveStatus === "Under Contract") ? "1px solid rgba(61,125,90,0.2)" : "1px solid var(--border)" }}>
              <div className="section-label">📄 Pre-Approval Letter</div>

              {(effectiveStatus !== "Pre-Approved" && effectiveStatus !== "Under Contract") ? (
                <div style={{ textAlign:"center", padding:"1.5rem 0", color:"var(--muted)" }}>
                  <div style={{ fontSize:"2rem", marginBottom:"0.75rem" }}>⏳</div>
                  <div style={{ fontSize:"0.9rem" }}>Pre-approval letter will be available once the client's application is reviewed and approved.</div>
                  <div style={{ marginTop:"0.75rem", padding:"0.5rem 0.75rem", background:"rgba(194,122,26,0.09)", borderRadius:"8px", fontSize:"0.8rem", color:"var(--amber)" }}>Current status: {effectiveStatus}</div>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom:"1.25rem" }}>
                    <div style={{ fontSize:"0.8rem", color:"var(--muted)", marginBottom:"0.4rem", fontWeight:500 }}>
                      Letter Amount <span style={{ color:"var(--green)" }}>(max approved: {formatCurrency(maxApproved)})</span>
                    </div>
                    <input
                      type="range"
                      min={Math.round(maxApproved * 0.5)}
                      max={maxApproved}
                      step={5000}
                      value={letterAmount}
                      onChange={e => { setLetterAmount(+e.target.value); setLetterGenerated(false); setShowLetterPreview(false); }}                      style={{ width:"100%", accentColor:"var(--green)", marginBottom:"0.4rem" }}
                    />
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.75rem", color:"var(--muted)" }}>
                      <span>{formatCurrency(Math.round(maxApproved * 0.5))}</span>
                      <span style={{ fontWeight:700, color:"var(--green)", fontSize:"0.95rem" }}>{formatCurrency(letterAmount)}</span>
                      <span>{formatCurrency(maxApproved)}</span>
                    </div>
                    {letterAmount < maxApproved && (
                      <div style={{ marginTop:"0.5rem", fontSize:"0.75rem", color:"var(--amber)", background:"rgba(194,122,26,0.07)", padding:"0.4rem 0.6rem", borderRadius:"6px" }}>
                        ⚠️ Letter is {formatCurrency(maxApproved - letterAmount)} below max approval — useful for offer strategy.
                      </div>
                    )}
                  </div>

                  <div style={{ display:"flex", gap:"0.75rem" }}>
                    <button className="btn-primary" style={{ flex:1 }} onClick={() => { setLetterGenerated(true); setShowLetterPreview(true); }}>
                      {letterGenerated ? "Regenerate Letter" : "Generate Letter"}
                    </button>
                    {letterGenerated && (
                      <button className="btn-secondary" style={{ flex:1 }} onClick={() => window.print()}>
                        ⬇ Download PDF
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Under Contract Status Card */}
          {effectiveStatus === "Under Contract" && (
            <div className="card" style={{ marginBottom:"1.5rem", background:"linear-gradient(135deg,#eaf2fb,#f0f7ff)", border:"1px solid rgba(47,111,168,0.25)" }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:"1rem" }}>
                <div style={{ fontSize:"2rem", flexShrink:0 }}>🏡</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.1rem", fontWeight:700, marginBottom:"0.25rem", color:"var(--blue)" }}>Under Contract</div>
                  <div style={{ color:"var(--muted)", fontSize:"0.88rem", lineHeight:1.6, marginBottom:"1rem" }}>
                    The purchase contract has been uploaded. {selected.name} has been notified to begin their full loan application. Track progress below.
                  </div>
                  {contractFiles[selected.id] && (
                    <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.6rem 0.85rem", background:"white", borderRadius:"8px", border:"1px solid rgba(47,111,168,0.2)", fontSize:"0.83rem", marginBottom:"0.85rem" }}>
                      <span style={{ fontSize:"1.1rem" }}>📄</span>
                      <span style={{ fontWeight:600, color:"var(--text)" }}>{contractFiles[selected.id]}</span>
                      <span style={{ color:"var(--muted)", marginLeft:"auto" }}>Purchase Contract</span>
                    </div>
                  )}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"0.75rem" }}>
                    {[
                      { label:"Loan Application", status:"Awaiting Client", color:"var(--amber)", icon:"📝" },
                      { label:"Title Search", status:"Not Started", color:"var(--muted)", icon:"🔍" },
                      { label:"Appraisal", status:"Not Started", color:"var(--muted)", icon:"🏠" },
                    ].map((item,i) => (
                      <div key={i} style={{ padding:"0.6rem 0.75rem", background:"white", borderRadius:"8px", border:"1px solid var(--border)" }}>
                        <div style={{ fontSize:"1rem", marginBottom:"0.25rem" }}>{item.icon}</div>
                        <div style={{ fontSize:"0.75rem", fontWeight:600 }}>{item.label}</div>
                        <div style={{ fontSize:"0.7rem", color:item.color, marginTop:"0.1rem" }}>{item.status}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Letter preview */}
          {showLetterPreview && letterGenerated && (
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.1rem", fontWeight:700, marginBottom:"1rem" }}>Letter Preview</div>
              <LetterPreview />
              <div style={{ display:"flex", gap:"1rem", marginTop:"1.25rem" }}>
                <button className="btn-primary" style={{ flex:1, padding:"0.85rem" }} onClick={() => window.print()}>⬇ Download as PDF</button>
                <button className="btn-secondary" onClick={() => { setLetterGenerated(false); setShowLetterPreview(false); }}>✕ Close Preview</button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Contract Upload Modal */}
      {showContractModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(44,32,18,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" }}>
          <div className="card" style={{ width:"520px", position:"relative" }}>

            {contractUploadStep === "done" ? (
              <div style={{ textAlign:"center", padding:"2rem 1rem" }}>
                <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>🎉</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.4rem", fontWeight:700, marginBottom:"0.5rem" }}>Status Updated!</div>
                <div style={{ color:"var(--muted)", fontSize:"0.9rem", lineHeight:1.6, marginBottom:"1.5rem" }}>
                  <strong style={{ color:"var(--text)" }}>{selected.name}</strong> has been marked <strong style={{ color:"var(--blue)" }}>Under Contract</strong>.<br/>
                  They'll see a prompt on their dashboard to begin the full loan application.
                </div>
                <div style={{ padding:"0.75rem 1rem", background:"#eaf2fb", borderRadius:"10px", border:"1px solid rgba(47,111,168,0.2)", fontSize:"0.83rem", color:"var(--blue)", marginBottom:"1.5rem", textAlign:"left" }}>
                  <strong>📋 What happens next:</strong>
                  <ul style={{ margin:"0.4rem 0 0 1rem", lineHeight:2 }}>
                    <li>Client is notified to start their loan application</li>
                    <li>Contract is attached to the loan file</li>
                    <li>Pipeline advances to Under Contract stage</li>
                  </ul>
                </div>
                <button className="btn-primary" style={{ width:"100%" }} onClick={() => setShowContractModal(false)}>Done</button>
              </div>
            ) : contractUploadStep === "confirm" ? (
              <div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.2rem", fontWeight:700, marginBottom:"0.25rem" }}>Confirm & Submit</div>
                <div style={{ color:"var(--muted)", fontSize:"0.85rem", marginBottom:"1.5rem" }}>Review the details before marking this client under contract.</div>
                <div style={{ padding:"1rem", background:"var(--surface)", borderRadius:"10px", border:"1px solid var(--border)", marginBottom:"1.25rem" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.75rem" }}>
                    <span style={{ fontSize:"1.5rem" }}>📄</span>
                    <div>
                      <div style={{ fontWeight:600, fontSize:"0.9rem" }}>{contractFileName}</div>
                      <div style={{ color:"var(--muted)", fontSize:"0.78rem" }}>Purchase Contract</div>
                    </div>
                  </div>
                  <div style={{ borderTop:"1px solid var(--border)", paddingTop:"0.75rem", display:"flex", flexDirection:"column", gap:"0.4rem" }}>
                    {[["Client", selected.name], ["New Status", "Under Contract"], ["Notification", "Client will be prompted to start loan application"]].map(([k,v],i) => (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:"0.83rem" }}>
                        <span style={{ color:"var(--muted)" }}>{k}</span>
                        <span style={{ fontWeight:600, color: k==="New Status" ? "var(--blue)" : "var(--text)" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display:"flex", gap:"0.75rem" }}>
                  <button className="btn-secondary" style={{ flex:1 }} onClick={() => setContractUploadStep("upload")}>← Back</button>
                  <button className="btn-primary" style={{ flex:2 }} onClick={confirmUnderContract}>✓ Confirm & Mark Under Contract</button>
                </div>
              </div>
            ) : (
              <div>
                <button onClick={() => setShowContractModal(false)} style={{ position:"absolute", top:"1rem", right:"1rem", background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:"1.2rem" }}>✕</button>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.2rem", fontWeight:700, marginBottom:"0.25rem" }}>Upload Purchase Contract</div>
                <div style={{ color:"var(--muted)", fontSize:"0.85rem", marginBottom:"1.5rem" }}>
                  Upload the signed purchase contract for <strong style={{ color:"var(--text)" }}>{selected.name}</strong>. This will mark them as Under Contract and prompt them to start their loan application.
                </div>
                <div
                  onDragOver={e => { e.preventDefault(); setContractDragOver(true); }}
                  onDragLeave={() => setContractDragOver(false)}
                  onDrop={e => { e.preventDefault(); setContractDragOver(false); handleContractFile(e.dataTransfer.files[0]); }}
                  style={{ border:`2px dashed ${contractDragOver ? "var(--accent)" : "var(--border)"}`, borderRadius:"12px", padding:"2.5rem 1.5rem", textAlign:"center", background:contractDragOver ? "rgba(194,113,79,0.04)" : "var(--surface)", cursor:"pointer", transition:"all 0.2s", marginBottom:"1rem" }}
                  onClick={() => document.getElementById("contractFileInput").click()}
                >
                  <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>📂</div>
                  <div style={{ fontWeight:600, marginBottom:"0.25rem" }}>Drop PDF here or click to browse</div>
                  <div style={{ color:"var(--muted)", fontSize:"0.83rem" }}>Accepts PDF, DOC, DOCX · Max 25MB</div>
                  <input id="contractFileInput" type="file" accept=".pdf,.doc,.docx" style={{ display:"none" }} onChange={e => handleContractFile(e.target.files[0])} />
                </div>
                <div style={{ padding:"0.75rem 1rem", background:"rgba(194,122,26,0.07)", borderRadius:"8px", fontSize:"0.8rem", color:"var(--amber)", marginBottom:"1.25rem" }}>
                  ⚠️ Only upload fully executed (signed by all parties) purchase contracts.
                </div>
                <button className="btn-secondary" style={{ width:"100%" }} onClick={() => setShowContractModal(false)}>Cancel</button>
              </div>
            )}
          </div>
        </div>
      )}
      </>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <style>{PORTAL_CSS}</style>
      <header style={{ padding:"1.25rem 2rem", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid var(--border)", background:"rgba(10,15,30,0.95)" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.3rem", fontWeight:800, background:"linear-gradient(135deg,#c2714f,#a85c3a)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>HomeStart <span style={{ fontSize:"0.75rem", color:"var(--muted)", WebkitTextFillColor:"var(--muted)", fontFamily:"'DM Sans',sans-serif", fontWeight:400 }}>Realtor Portal</span></div>
        <div style={{ display:"flex", gap:"0.5rem" }}>
          {["clients","profile"].map(t => <button key={t} onClick={() => setTab(t)} style={{ padding:"0.4rem 1rem", border:`1px solid ${tab===t?"var(--accent)":"var(--border)"}`, borderRadius:"8px", background:tab===t?"rgba(194,113,79,0.1)":"transparent", color:tab===t?"var(--accent)":"var(--muted)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:"0.85rem" }}>{t==="clients"?"👥 Clients":"⚙️ Profile"}</button>)}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontWeight:600, fontSize:"0.9rem" }}>{user.name}</div>
            <div style={{ color:"var(--muted)", fontSize:"0.75rem" }}>{user.brokerage}</div>
          </div>
          <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:"linear-gradient(135deg,#c2714f,#a85c3a)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:"0.85rem" }}>{user.avatar||user.name.slice(0,2)}</div>
          <button className="btn-secondary" style={{ fontSize:"0.8rem", padding:"0.4rem 0.85rem" }} onClick={onLogout}>Sign Out</button>
        </div>
      </header>

      <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"2rem" }}>
        {tab==="clients" && <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"1rem", marginBottom:"2rem" }}>
            {[{label:"Total Clients",value:clients.length,color:"var(--accent)"},{label:"Pre-Approved",value:statusCounts["Pre-Approved"]||0,color:"var(--green)"},{label:"Docs Needed",value:statusCounts["Documents Needed"]||0,color:"var(--amber)"},{label:"Closed",value:statusCounts["Closed"]||0,color:"var(--accent)"}].map((m,i) => (
              <div key={i} className="card" style={{ textAlign:"center" }}>
                <div style={{ fontSize:"0.72rem", textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--muted)", marginBottom:"0.4rem" }}>{m.label}</div>
                <div style={{ fontSize:"2rem", fontWeight:800, color:m.color, fontFamily:"'Playfair Display',serif" }}>{m.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.3rem", fontWeight:700 }}>Client Pipeline</div>
            <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Add Client</button>
          </div>

          {showAdd && (
            <div style={{ position:"fixed", inset:0, background:"rgba(44,32,18,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" }}>
              <div className="card" style={{ width:"480px", position:"relative" }}>
                <button onClick={closeInviteModal} style={{ position:"absolute", top:"1rem", right:"1rem", background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:"1.2rem" }}>✕</button>
                {inviteSent ? (
                  <div style={{ padding:"1.5rem 0.5rem" }}>
                    <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
                      <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>📧</div>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.3rem", fontWeight:700, marginBottom:"0.5rem" }}>Invite Sent!</div>
                      <div style={{ color:"var(--muted)", fontSize:"0.875rem", lineHeight:1.6 }}>
                        <strong style={{ color:"var(--text)" }}>{newClient.name}</strong> has been invited to join HomeStart.<br/>
                        You'll be notified once they've created their account and started their pre-approval.
                      </div>
                    </div>
                    <div style={{ padding:"0.85rem 1rem", background:"rgba(61,125,90,0.07)", borderRadius:"10px", border:"1px solid rgba(61,125,90,0.15)", fontSize:"0.85rem", color:"var(--green)", marginBottom:"1.25rem", textAlign:"center" }}>
                      ✓ They'll appear in your pipeline as "Invited" until they sign up
                    </div>
                    <button className="btn-primary" style={{ width:"100%" }} onClick={() => { closeInviteModal(); loadClients(); }}>Done</button>
                  </div>
                ) : (
                  <>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.3rem", fontWeight:700, marginBottom:"0.25rem" }}>Add New Client</div>
                    <div style={{ color:"var(--muted)", fontSize:"0.85rem", marginBottom:"1.5rem" }}>They'll receive an email invitation to create their account and begin the pre-approval wizard.</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
                      <div className="field"><label>Client Name *</label><input className="text-input" value={newClient.name} onChange={e=>setNewClient(c=>({...c,name:e.target.value}))} placeholder="James Torres" /></div>
                      <div className="field"><label>Email Address *</label><input className="text-input" value={newClient.email} onChange={e=>setNewClient(c=>({...c,email:e.target.value}))} placeholder="james@email.com" /></div>
                      <div className="field"><label>Phone (optional)</label><input className="text-input" value={newClient.phone} onChange={e=>setNewClient(c=>({...c,phone:e.target.value}))} placeholder="(555) 000-0000" /></div>
                    </div>
                    <div style={{ display:"flex", gap:"1rem", marginTop:"1.5rem" }}>
                      {inviteError && <div style={{ gridColumn:"1/-1", padding:"0.6rem", background:"rgba(192,57,43,0.08)", borderRadius:"8px", fontSize:"0.82rem", color:"var(--red)" }}>{inviteError}</div>}
                      <button className="btn-secondary" style={{ flex:1 }} onClick={closeInviteModal}>Cancel</button>
                      <button className="btn-primary" style={{ flex:2, opacity:inviteSending?0.7:1 }} onClick={sendInvite} disabled={inviteSending}>{inviteSending?"Creating invite...":"Generate Invite Link →"}</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
            {clients.map((client,i) => (
              <div key={i} className="card" style={{ cursor:"pointer", transition:"border-color 0.2s, transform 0.15s" }}
                onClick={() => selectClient(client)}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(194,113,79,0.45)";e.currentTarget.style.transform="translateX(4px)"}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.transform="translateX(0)"}}>
                <div style={{ display:"grid", gridTemplateColumns:"auto 2fr 1fr 1fr 1fr auto", gap:"1.5rem", alignItems:"center" }}>
                  <div style={{ width:"40px", height:"40px", borderRadius:"50%", background:"linear-gradient(135deg,#c2714f,#a85c3a)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:"0.85rem", flexShrink:0 }}>
                    {client.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                  </div>
                  <div><div style={{ fontWeight:700 }}>{client.name}</div><div style={{ color:"var(--muted)", fontSize:"0.8rem" }}>{client.email}</div></div>
                  <span style={{ padding:"0.3rem 0.75rem", borderRadius:"20px", fontSize:"0.75rem", fontWeight:700, background:`${STATUS_COLORS[getClientStatus(client)]}18`, color:STATUS_COLORS[getClientStatus(client)], border:`1px solid ${STATUS_COLORS[getClientStatus(client)]}30`, whiteSpace:"nowrap" }}>{getClientStatus(client)}</span>
                  <div><div style={{ color:"var(--muted)", fontSize:"0.72rem", marginBottom:"0.1rem" }}>Loan Amount</div><div style={{ fontWeight:600 }}>{client.loanAmount?formatCurrency(client.loanAmount):"—"}</div></div>
                  <div><div style={{ color:"var(--muted)", fontSize:"0.72rem", marginBottom:"0.1rem" }}>Pre-Approval</div><div style={{ fontWeight:600 }}>{client.preApprovalDate||"Pending"}</div></div>
                  <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
                    {client.flags?.length>0 && <span style={{ fontSize:"0.7rem", background:"rgba(194,122,26,0.12)", color:"var(--amber)", padding:"0.2rem 0.5rem", borderRadius:"4px", fontWeight:700 }}>⚠️ {client.flags.length}</span>}
                    <span style={{ color:"var(--muted)", fontSize:"1.2rem" }}>→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>}

        {tab==="profile" && (
          <div style={{ maxWidth:"600px" }}>
            <div className="card">
              <div className="section-label">Realtor Profile</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
                {[["Full Name",user.name],["Email",user.email],["Phone",user.phone],["Brokerage",user.brokerage],["License #",user.license]].map(([k,v],i) => (
                  <div key={i} className="field" style={{ gridColumn:k==="Brokerage"?"1/-1":"auto" }}>
                    <label>{k}</label><input className="text-input" defaultValue={v} />
                  </div>
                ))}
              </div>
              <button className="btn-primary" style={{ marginTop:"1.5rem" }}>Save Changes</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OwnerDashboard({ liveRates, setOwnerTab }) {
  const [home] = useState({
    address: "142 Maple Grove Dr, Austin, TX 78701",
    purchasePrice: 385000,
    currentValue: 431000,
    purchaseDate: "2022-03-15",
    originalLoan: 308000,
    currentBalance: 291400,
    currentRate: 7.25,
    loanType: "30-Year Fixed",
    monthlyPayment: 2102,
    insurance: 1840,
    propertyTax: 4620,
    lender: "Big Bank Mortgage",
  });

  const equity = home.currentValue - home.currentBalance;
  const equityPct = ((equity / home.currentValue) * 100).toFixed(1);
  const appreciation = home.currentValue - home.purchasePrice;
  const refiSavings = liveRates.r30 ? calcMonthly(home.currentBalance, liveRates.r30, 30) : null;
  const monthlySavings = refiSavings ? Math.max(0, home.monthlyPayment - refiSavings) : null;
  const refiWorthy = liveRates.r30 && (home.currentRate - liveRates.r30) >= 0.75;

  const alerts = [
    refiWorthy && { type: "refi", icon: "🔔", color: "var(--amber)", label: "Refi Opportunity", desc: `Rates dropped ${(home.currentRate - liveRates.r30).toFixed(2)}% below your rate — save ~${formatCurrency(monthlySavings)}/mo`, tab: 1 },
    { type: "insurance", icon: "🛡️", color: "var(--accent)", label: "Insurance Review Due", desc: "Your policy renews in 47 days. Compare quotes to potentially save.", tab: 5 },
    { type: "maintenance", icon: "🔧", color: "var(--accent)", label: "Spring Maintenance", desc: "HVAC service, gutter cleaning, and roof inspection recommended.", tab: 4 },
  ].filter(Boolean);

  return (
    <div>
      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
          {alerts.map((alert, i) => (
            <div key={i} onClick={() => setOwnerTab(alert.tab)} style={{
              display: "flex", alignItems: "center", gap: "1rem",
              padding: "1rem 1.5rem", borderRadius: "12px",
              background: `linear-gradient(135deg, ${alert.color}18, ${alert.color}08)`,
              border: `1px solid ${alert.color}40`, cursor: "pointer",
              transition: "transform 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateX(4px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateX(0)"}
            >
              <span style={{ fontSize: "1.5rem" }}>{alert.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: alert.color }}>{alert.label}</div>
                <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{alert.desc}</div>
              </div>
              <span style={{ color: alert.color, fontSize: "1.2rem" }}>→</span>
            </div>
          ))}
        </div>
      )}

      {/* Key metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Home Value", value: formatCurrency(home.currentValue), sub: `↑ ${formatCurrency(appreciation)} since purchase`, color: "var(--green)" },
          { label: "Equity", value: formatCurrency(equity), sub: `${equityPct}% of home value`, color: "var(--blue)" },
          { label: "Current Rate", value: `${home.currentRate}%`, sub: `Market: ${liveRates.r30}% · ${home.currentRate > liveRates.r30 ? "↑ above" : "↓ below"} market`, color: home.currentRate - liveRates.r30 > 0.75 ? "#f87171" : "var(--accent)" },
          { label: "Monthly Payment", value: formatCurrency(home.monthlyPayment), sub: "Principal + Interest", color: "#fb923c" },
        ].map((m, i) => (
          <div key={i} className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "0.5rem" }}>{m.label}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 800, color: m.color, lineHeight: 1 }}>{m.value}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.4rem" }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Property details */}
        <div className="card">
          <h3 className="section-label">Your Property</h3>
          <div style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "1rem" }}>🏡 {home.address}</div>
          {[
            ["Purchase Price", formatCurrency(home.purchasePrice)],
            ["Purchase Date", new Date(home.purchaseDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })],
            ["Original Loan", formatCurrency(home.originalLoan)],
            ["Current Balance", formatCurrency(home.currentBalance)],
            ["Lender", home.lender],
            ["Loan Type", home.loanType],
          ].map(([k, v], i) => (
            <div key={i} className="breakdown-row"><span>{k}</span><span>{v}</span></div>
          ))}
        </div>

        {/* Annual costs */}
        <div className="card">
          <h3 className="section-label">Annual Cost Breakdown</h3>
          {[
            { label: "Principal & Interest", amount: home.monthlyPayment * 12, color: "var(--blue)" },
            { label: "Property Tax", amount: home.propertyTax, color: "var(--amber)" },
            { label: "Homeowners Insurance", amount: home.insurance, color: "var(--blue)" },
            { label: "Estimated Maintenance (1%)", amount: home.currentValue * 0.01, color: "#fb923c" },
          ].map((row, i) => {
            const total = home.monthlyPayment * 12 + home.propertyTax + home.insurance + home.currentValue * 0.01;
            return (
              <div key={i} style={{ marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.3rem" }}>
                  <span style={{ color: "var(--muted)" }}>{row.label}</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(row.amount)}</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(row.amount / total * 100).toFixed(1)}%`, background: row.color }} />
                </div>
              </div>
            );
          })}
          <div className="breakdown-row bold" style={{ marginTop: "0.5rem" }}>
            <span>Total Annual Cost</span>
            <span>{formatCurrency(home.monthlyPayment * 12 + home.propertyTax + home.insurance + home.currentValue * 0.01)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- REFI MONITOR ----
function RefiMonitor({ liveRates }) {
  const [currentRate, setCurrentRate] = useState(7.25);
  const [balance, setBalance] = useState(291400);
  const [yearsLeft, setYearsLeft] = useState(27);
  const [closingCosts, setClosingCosts] = useState(6500);
  const [newRate, setNewRate] = useState(liveRates.r30 || 6.875);
  const [newTerm, setNewTerm] = useState(30);
  const [alertThreshold, setAlertThreshold] = useState(0.75);
  const [alertSet, setAlertSet] = useState(false);

  useEffect(() => { if (liveRates.r30) setNewRate(liveRates.r30); }, [liveRates.r30]);

  const currentMonthly = calcMonthly(balance, currentRate, yearsLeft);
  const newMonthly = calcMonthly(balance, newRate, newTerm);
  const monthlySavings = currentMonthly - newMonthly;
  const annualSavings = monthlySavings * 12;
  const breakeven = monthlySavings > 0 ? Math.ceil(closingCosts / monthlySavings) : null;
  const lifetimeSavings = monthlySavings > 0 ? (monthlySavings * newTerm * 12) - closingCosts : null;
  const rateDiff = currentRate - (liveRates.r30 || newRate);
  const refiWorthy = rateDiff >= alertThreshold;

  // Amortization for chart
  const buildAmortization = (principal, rate, years, label) => {
    const r = rate / 100 / 12;
    const n = years * 12;
    const payment = calcMonthly(principal, rate, years);
    let bal = principal;
    const points = [];
    for (let mo = 0; mo <= n; mo += 12) {
      points.push({ year: mo / 12, balance: Math.max(0, bal), label });
      for (let m = 0; m < 12 && mo + m < n; m++) {
        const interest = bal * r;
        bal -= (payment - interest);
      }
    }
    return points;
  };

  const currentAmort = buildAmortization(balance, currentRate, yearsLeft, "Current");
  const newAmort = buildAmortization(balance, newRate, newTerm, "Refi");

  const maxBal = balance;
  const chartH = 140;
  const chartW = 500;

  const pathD = (points) => points.map((p, i) => {
    const x = (p.year / Math.max(yearsLeft, newTerm)) * chartW;
    const y = chartH - (p.balance / maxBal) * chartH;
    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");

  return (
    <div>
      {/* Refi Alert Status */}
      <div style={{
        padding: "1.5rem 2rem", borderRadius: "14px", marginBottom: "2rem",
        background: refiWorthy
          ? "linear-gradient(135deg, #edf5f0, #f0f7f3)"
          : "linear-gradient(135deg, #f8f5f0, #f4f0eb)",
        border: `1px solid ${refiWorthy ? "rgba(61,125,90,0.35)" : "var(--border)"}`,
        display: "flex", alignItems: "center", gap: "1.5rem"
      }}>
        <div style={{ fontSize: "2.5rem" }}>{refiWorthy ? "🟢" : "🟡"}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.25rem" }}>
            {refiWorthy ? "Refinancing Makes Sense Now" : "Not Quite Time to Refi Yet"}
          </div>
          <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
            {refiWorthy
              ? `Rates are ${rateDiff.toFixed(2)}% below your current rate — you've crossed the ${alertThreshold}% savings threshold.`
              : `Market rates are ${rateDiff > 0 ? rateDiff.toFixed(2) + "% below" : Math.abs(rateDiff).toFixed(2) + "% above"} your current rate. Set an alert for when rates drop further.`}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          {monthlySavings > 0 && (
            <>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--green)" }}>{formatCurrency(monthlySavings)}/mo</div>
              <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>potential savings</div>
            </>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        {/* Inputs */}
        <div>
          <div className="card" style={{ marginBottom: "1rem" }}>
            <h3 className="section-label">Your Current Loan</h3>
            <div className="input-group">
              <label>Current Interest Rate</label>
              <div className="input-row">
                <input type="range" min="3" max="10" step="0.125" value={currentRate} onChange={e => setCurrentRate(+e.target.value)} />
                <span className="val">{currentRate}%</span>
              </div>
            </div>
            <div className="input-group">
              <label>Remaining Balance</label>
              <div className="input-row">
                <input type="range" min="50000" max="900000" step="1000" value={balance} onChange={e => setBalance(+e.target.value)} />
                <span className="val">{formatCurrency(balance)}</span>
              </div>
            </div>
            <div className="input-group">
              <label>Years Remaining</label>
              <div className="input-row">
                <input type="range" min="1" max="30" step="1" value={yearsLeft} onChange={e => setYearsLeft(+e.target.value)} />
                <span className="val">{yearsLeft} yrs</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: "1rem" }}>
            <h3 className="section-label">New Loan Terms</h3>
            <div className="input-group">
              <label>New Rate {liveRates.r30 && <span style={{ color: "var(--accent)", fontSize: "0.75rem" }}>(live: {liveRates.r30}%)</span>}</label>
              <div className="input-row">
                <input type="range" min="3" max="10" step="0.125" value={newRate} onChange={e => setNewRate(+e.target.value)} />
                <span className="val">{newRate}%</span>
              </div>
            </div>
            <div className="input-group">
              <label>New Term</label>
              <div className="input-row">
                {[10, 15, 20, 30].map(t => (
                  <button key={t} onClick={() => setNewTerm(t)} style={{
                    flex: 1, padding: "0.4rem", border: `1px solid ${newTerm === t ? "var(--accent)" : "var(--border)"}`,
                    background: newTerm === t ? "rgba(194,113,79,0.12)" : "transparent",
                    borderRadius: "6px", color: newTerm === t ? "var(--accent)" : "var(--muted)",
                    cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "0.85rem"
                  }}>{t}yr</button>
                ))}
              </div>
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Estimated Closing Costs</label>
              <div className="input-row">
                <input type="range" min="2000" max="20000" step="500" value={closingCosts} onChange={e => setClosingCosts(+e.target.value)} />
                <span className="val">{formatCurrency(closingCosts)}</span>
              </div>
            </div>
          </div>

          {/* Alert Setup */}
          <div className="card">
            <h3 className="section-label">🔔 Rate Alert</h3>
            <div className="input-group">
              <label>Alert me when rates drop</label>
              <div className="input-row">
                <input type="range" min="0.25" max="2" step="0.25" value={alertThreshold} onChange={e => setAlertThreshold(+e.target.value)} />
                <span className="val">{alertThreshold}% below mine</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <input className="text-input" placeholder="your@email.com" style={{ flex: 1 }} />
              <button className="btn-primary" onClick={() => setAlertSet(true)}>
                {alertSet ? "✓ Alert Set" : "Set Alert"}
              </button>
            </div>
            {alertSet && <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "var(--green)" }}>
              ✓ We'll email you when 30yr rates hit {(currentRate - alertThreshold).toFixed(3)}% or lower.
            </div>}
          </div>
        </div>

        {/* Results */}
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            {[
              { label: "Current Payment", value: formatCurrency(currentMonthly), sub: `at ${currentRate}%`, color: "var(--red)" },
              { label: "New Payment", value: formatCurrency(newMonthly), sub: `at ${newRate}%`, color: "var(--green)" },
              { label: "Monthly Savings", value: monthlySavings > 0 ? formatCurrency(monthlySavings) : "—", sub: `${formatCurrency(annualSavings)}/year`, color: "var(--blue)" },
              { label: "Breakeven Point", value: breakeven ? `${breakeven} months` : "—", sub: breakeven ? `~${(breakeven / 12).toFixed(1)} years` : "No savings", color: "var(--amber)" },
            ].map((m, i) => (
              <div key={i} className="card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "0.4rem" }}>{m.label}</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: m.color, fontFamily: "'Playfair Display', serif" }}>{m.value}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.25rem" }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {lifetimeSavings !== null && (
            <div className="card hero-card" style={{ marginBottom: "1rem" }}>
              <div className="hero-label">Lifetime Savings (after closing costs)</div>
              <div className="hero-number">{formatCurrency(lifetimeSavings)}</div>
              <div className="hero-sub">over the life of the new {newTerm}-year loan</div>
            </div>
          )}

          {/* Amortization chart */}
          <div className="card">
            <h3 className="section-label">Balance Payoff Comparison</h3>
            <svg viewBox={`0 0 ${chartW} ${chartH + 20}`} style={{ width: "100%", overflow: "visible" }}>
              {/* Grid lines */}
              {[0.25, 0.5, 0.75].map(pct => (
                <line key={pct} x1="0" y1={chartH * (1 - pct)} x2={chartW} y2={chartH * (1 - pct)}
                  stroke="rgba(44,32,18,0.08)" strokeWidth="1" />
              ))}
              {/* Current loan */}
              <path d={pathD(currentAmort)} fill="none" stroke="#c0392b" strokeWidth="2.5" strokeLinecap="round" />
              {/* New loan */}
              <path d={pathD(newAmort)} fill="none" stroke="#3d7d5a" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6,3" />
              {/* Labels */}
              <text x="8" y="12" fontSize="10" fill="var(--red)">Current ({yearsLeft}yr payoff)</text>
              <text x="8" y="26" fontSize="10" fill="var(--green)">Refi ({newTerm}yr payoff) - - -</text>
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.25rem" }}>
              <span>Now</span><span>{Math.ceil(Math.max(yearsLeft, newTerm) / 2)} years</span><span>{Math.max(yearsLeft, newTerm)} years</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- HOME VALUE ----
function HomeValueSection() {
  const [homeValue, setHomeValue] = useState(431000);
  const purchasePrice = 385000;
  const purchaseDate = "2022-03-15";

  const appreciation = homeValue - purchasePrice;
  const appreciationPct = ((appreciation / purchasePrice) * 100).toFixed(1);
  const yearsOwned = ((Date.now() - new Date(purchaseDate)) / (1000 * 60 * 60 * 24 * 365)).toFixed(1);
  const annualizedReturn = ((Math.pow(homeValue / purchasePrice, 1 / yearsOwned) - 1) * 100).toFixed(2);

  // Mock value history
  const history = [
    { date: "Mar 2022", value: 385000 },
    { date: "Sep 2022", value: 392000 },
    { date: "Mar 2023", value: 401000 },
    { date: "Sep 2023", value: 408000 },
    { date: "Mar 2024", value: 419000 },
    { date: "Sep 2024", value: 425000 },
    { date: "Mar 2025", value: homeValue },
  ];

  const minV = Math.min(...history.map(h => h.value)) * 0.98;
  const maxV = Math.max(...history.map(h => h.value)) * 1.01;
  const W = 500, H = 160;
  const px = (i) => (i / (history.length - 1)) * W;
  const py = (v) => H - ((v - minV) / (maxV - minV)) * H;
  const linePath = history.map((h, i) => `${i === 0 ? "M" : "L"} ${px(i)} ${py(h.value)}`).join(" ");
  const areaPath = `${linePath} L ${W} ${H} L 0 ${H} Z`;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Estimated Value", value: formatCurrency(homeValue), color: "var(--blue)" },
          { label: "Total Appreciation", value: formatCurrency(appreciation), color: "var(--green)" },
          { label: "Appreciation %", value: `+${appreciationPct}%`, color: "var(--green)" },
          { label: "Annualized Return", value: `${annualizedReturn}%/yr`, color: "var(--blue)" },
        ].map((m, i) => (
          <div key={i} className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "0.4rem" }}>{m.label}</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: m.color, fontFamily: "'Playfair Display', serif" }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
        <div className="card">
          <h3 className="section-label">Value History</h3>
          <svg viewBox={`0 0 ${W} ${H + 30}`} style={{ width: "100%", overflow: "visible" }}>
            <defs>
              <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c2714f" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#c2714f" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#valueGrad)" />
            <path d={linePath} fill="none" stroke="#c2714f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {history.map((h, i) => (
              <g key={i}>
                <circle cx={px(i)} cy={py(h.value)} r="4" fill="#c2714f" />
                <text x={px(i)} y={H + 18} textAnchor="middle" fontSize="9" fill="#8a7968">{h.date}</text>
              </g>
            ))}
          </svg>

          <div style={{ marginTop: "1rem" }}>
            <label className="section-label">Update Your Estimate</label>
            <div className="input-row">
              <input type="range" min="300000" max="700000" step="1000" value={homeValue} onChange={e => setHomeValue(+e.target.value)} />
              <span className="val">{formatCurrency(homeValue)}</span>
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.5rem" }}>
              Connect Zillow or Redfin for automatic updates, or adjust manually based on recent comps.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="card">
            <h3 className="section-label">Comparables</h3>
            {[
              { address: "138 Maple Grove Dr", sold: "Jan 2025", price: 428000 },
              { address: "201 Maple Grove Dr", sold: "Nov 2024", price: 445000 },
              { address: "91 Birchwood Pl", sold: "Feb 2025", price: 418000 },
            ].map((comp, i) => (
              <div key={i} style={{ padding: "0.6rem 0", borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{comp.address}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.2rem" }}>
                  <span>Sold {comp.sold}</span>
                  <span style={{ color: "var(--accent)", fontWeight: 700 }}>{formatCurrency(comp.price)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="section-label">Market Trend</h3>
            <div style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "var(--muted)" }}>
              Austin median home prices are up <strong style={{ color: "var(--green)" }}>4.2%</strong> year-over-year. Your neighborhood has outperformed the metro average by <strong style={{ color: "var(--blue)" }}>1.1%</strong>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- EQUITY ----
function EquitySection() {
  const homeValue = 431000;
  const balance = 291400;
  const equity = homeValue - balance;
  const ltv = ((balance / homeValue) * 100).toFixed(1);
  const helocAvailable = Math.max(0, homeValue * 0.85 - balance);
  const cashOutAvailable = Math.max(0, homeValue * 0.80 - balance);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Total Equity", value: formatCurrency(equity), color: "var(--green)" },
          { label: "LTV Ratio", value: `${ltv}%`, color: ltv < 80 ? "var(--green)" : "var(--amber)" },
          { label: "HELOC Available", value: formatCurrency(helocAvailable), color: "var(--blue)" },
          { label: "Cash-Out Refi", value: formatCurrency(cashOutAvailable), color: "var(--blue)" },
        ].map((m, i) => (
          <div key={i} className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "0.4rem" }}>{m.label}</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: m.color, fontFamily: "'Playfair Display', serif" }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        <div className="card">
          <h3 className="section-label">Equity Stack</h3>
          <div style={{ position: "relative", height: "200px", borderRadius: "10px", overflow: "hidden", marginBottom: "1rem" }}>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${(balance / homeValue * 100).toFixed(1)}%`, background: "linear-gradient(180deg, rgba(192,57,43,0.25), rgba(239,68,68,0.15))", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
              <div style={{ fontWeight: 700 }}>{formatCurrency(balance)}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Mortgage Balance</div>
            </div>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: `${(equity / homeValue * 100).toFixed(1)}%`, background: "linear-gradient(180deg, rgba(61,125,90,0.35), rgba(61,125,90,0.15))", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
              <div style={{ fontWeight: 700 }}>{formatCurrency(equity)}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--green)" }}>Your Equity</div>
            </div>
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.6 }}>
            You own <strong style={{ color: "var(--green)" }}>{(100 - ltv).toFixed(1)}%</strong> of your home outright. Once LTV drops below 80% you can remove PMI if applicable.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="card">
            <h3 className="section-label">Ways to Use Your Equity</h3>
            {[
              { title: "HELOC", desc: `Borrow up to ${formatCurrency(helocAvailable)} as a revolving line of credit. Typical rate: Prime + 0.5%`, action: "Explore HELOC" },
              { title: "Cash-Out Refinance", desc: `Refinance and pull out up to ${formatCurrency(cashOutAvailable)} in cash. Resets your loan term.`, action: "Run Numbers" },
              { title: "Home Improvement", desc: "Use equity to fund renovations that increase your home's value further.", action: "Get Quotes" },
            ].map((opt, i) => (
              <div key={i} style={{ padding: "0.85rem", background: "var(--card-bg-2)", borderRadius: "10px", marginBottom: "0.75rem" }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.3rem" }}>{opt.title}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: "0.5rem" }}>{opt.desc}</div>
                <button className="btn-secondary" style={{ fontSize: "0.8rem", padding: "0.35rem 0.85rem" }}>{opt.action} →</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- CONTRACTOR MARKETPLACE ----
function ContractorMarketplace() {
  const [category, setCategory] = useState("All");
  const [quoteForm, setQuoteForm] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const categories = ["All", "HVAC", "Roofing", "Plumbing", "Electrical", "Landscaping", "Painting", "Remodeling", "Cleaning"];

  const contractors = [
    { name: "Peak HVAC Solutions", category: "HVAC", rating: 4.9, reviews: 312, jobs: 847, badge: "Top Rated", response: "< 1 hr", rate: "$85–120/hr", avatar: "❄️" },
    { name: "Summit Roofing Co.", category: "Roofing", rating: 4.8, reviews: 198, jobs: 423, badge: "Verified", response: "< 2 hr", rate: "Free estimate", avatar: "🏠" },
    { name: "Clear Flow Plumbing", category: "Plumbing", rating: 4.7, reviews: 445, jobs: 1203, badge: "Top Rated", response: "< 30 min", rate: "$95–140/hr", avatar: "🔧" },
    { name: "Volt Masters Electric", category: "Electrical", rating: 4.9, reviews: 267, jobs: 589, badge: "Licensed", response: "< 1 hr", rate: "$110–150/hr", avatar: "⚡" },
    { name: "Green Thumb Landscaping", category: "Landscaping", rating: 4.6, reviews: 183, jobs: 672, badge: "Verified", response: "< 3 hr", rate: "Free estimate", avatar: "🌿" },
    { name: "ProPaint Austin", category: "Painting", rating: 4.8, reviews: 391, jobs: 918, badge: "Top Rated", response: "< 2 hr", rate: "Free estimate", avatar: "🎨" },
    { name: "Dream Remodel Co.", category: "Remodeling", rating: 4.7, reviews: 124, jobs: 201, badge: "Licensed", response: "< 4 hr", rate: "Free estimate", avatar: "🏗️" },
    { name: "Spotless Home Cleaning", category: "Cleaning", rating: 4.9, reviews: 876, jobs: 3210, badge: "Top Rated", response: "< 30 min", rate: "$35–55/hr", avatar: "✨" },
  ];

  const filtered = category === "All" ? contractors : contractors.filter(c => c.category === category);

  if (submitted) return (
    <div style={{ maxWidth: "500px", margin: "4rem auto", textAlign: "center" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Quote Request Sent!</div>
      <div style={{ color: "var(--muted)", marginBottom: "2rem" }}>
        {quoteForm?.contractor?.name} will respond within {quoteForm?.contractor?.response}. You'll receive an email confirmation shortly.
      </div>
      <button className="btn-primary" onClick={() => { setSubmitted(false); setQuoteForm(null); }}>Back to Marketplace</button>
    </div>
  );

  if (quoteForm) return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <button className="btn-secondary" style={{ marginBottom: "1.5rem" }} onClick={() => setQuoteForm(null)}>← Back</button>
      <div className="card">
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: "2rem" }}>{quoteForm.contractor.avatar}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{quoteForm.contractor.name}</div>
            <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{quoteForm.contractor.category} · ⭐ {quoteForm.contractor.rating} · {quoteForm.contractor.reviews} reviews</div>
          </div>
        </div>
        <h3 className="section-label">Request a Quote</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="field"><label>First Name</label><input className="text-input" placeholder="Jane" /></div>
          <div className="field"><label>Last Name</label><input className="text-input" placeholder="Smith" /></div>
          <div className="field" style={{ gridColumn: "1/-1" }}><label>Property Address</label><input className="text-input" placeholder="142 Maple Grove Dr, Austin TX" defaultValue="142 Maple Grove Dr, Austin TX" /></div>
          <div className="field" style={{ gridColumn: "1/-1" }}>
            <label>Type of Work Needed</label>
            <select className="text-input">
              {category === "HVAC" && <><option>AC Repair</option><option>AC Replacement</option><option>Furnace Repair</option><option>Annual Maintenance</option></>}
              {category === "Roofing" && <><option>Roof Inspection</option><option>Roof Repair</option><option>Full Roof Replacement</option></>}
              {category === "All" && <option>General Inquiry</option>}
              <option>Other</option>
            </select>
          </div>
          <div className="field" style={{ gridColumn: "1/-1" }}>
            <label>Describe the issue or project</label>
            <textarea className="text-input" rows="3" placeholder="Please describe what you need help with..." style={{ resize: "vertical" }} />
          </div>
          <div className="field"><label>Preferred Date</label><input className="text-input" type="date" /></div>
          <div className="field"><label>Best Time to Call</label>
            <select className="text-input"><option>Morning (8am–12pm)</option><option>Afternoon (12pm–5pm)</option><option>Evening (5pm–8pm)</option></select>
          </div>
          <div className="field"><label>Phone Number</label><input className="text-input" placeholder="(555) 000-0000" /></div>
          <div className="field"><label>Email</label><input className="text-input" placeholder="jane@example.com" /></div>
        </div>
        <button className="btn-primary" style={{ width: "100%", marginTop: "1.5rem", padding: "0.85rem", fontSize: "1rem" }} onClick={() => setSubmitted(true)}>
          Send Quote Request →
        </button>
        <div style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.75rem" }}>
          No commitment required · Free quotes · Licensed & insured contractors only
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Category filters */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)} style={{
            padding: "0.4rem 1rem", borderRadius: "20px", border: `1px solid ${category === cat ? "var(--accent)" : "var(--border)"}`,
            background: category === cat ? "rgba(194,113,79,0.12)" : "transparent",
            color: category === cat ? "var(--accent)" : "var(--muted)",
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: "0.85rem",
            transition: "all 0.15s"
          }}>{cat}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
        {filtered.map((c, i) => (
          <div key={i} className="card" style={{ display: "flex", gap: "1rem", alignItems: "flex-start", transition: "border-color 0.2s, transform 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(194,113,79,0.45)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ fontSize: "2.2rem", flexShrink: 0 }}>{c.avatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontWeight: 700, fontSize: "1rem" }}>{c.name}</div>
                <span style={{
                  fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "4px",
                  background: c.badge === "Top Rated" ? "rgba(61,125,90,0.12)" : "rgba(194,113,79,0.12)",
                  color: c.badge === "Top Rated" ? "var(--green)" : "var(--accent)",
                }}>{c.badge}</span>
              </div>
              <div style={{ color: "var(--muted)", fontSize: "0.8rem", margin: "0.2rem 0" }}>{c.category}</div>
              <div style={{ display: "flex", gap: "1rem", fontSize: "0.8rem", marginBottom: "0.75rem" }}>
                <span>⭐ {c.rating} ({c.reviews})</span>
                <span style={{ color: "var(--muted)" }}>· {c.jobs} jobs</span>
                <span style={{ color: "var(--muted)" }}>· responds {c.response}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--accent)", fontWeight: 600 }}>{c.rate}</span>
                <button className="btn-primary" style={{ fontSize: "0.8rem", padding: "0.35rem 0.85rem" }}
                  onClick={() => setQuoteForm({ contractor: c })}>
                  Get Quote
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: "2rem", padding: "1.5rem", background: "rgba(194,113,79,0.04)", borderRadius: "14px", border: "1px dashed var(--border)" }}>
        <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Are you a contractor?</div>
        <div style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "1rem" }}>Join our marketplace and get matched with homeowners in your area.</div>
        <button className="btn-secondary">Apply to Join →</button>
      </div>
    </div>
  );
}

// ---- INSURANCE MANAGER ----
function InsuranceManager() {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        <div className="card">
          <h3 className="section-label">Current Policy</h3>
          {[
            ["Provider", "State Farm"],
            ["Policy #", "SF-2847193"],
            ["Annual Premium", "$1,840"],
            ["Coverage Amount", "$431,000"],
            ["Deductible", "$2,500"],
            ["Renewal Date", "April 15, 2026"],
          ].map(([k, v], i) => (
            <div key={i} className="breakdown-row"><span>{k}</span><span>{v}</span></div>
          ))}
          <div style={{ marginTop: "1rem", padding: "0.75rem", background: "rgba(194,122,26,0.09)", borderRadius: "8px", fontSize: "0.85rem", color: "var(--amber)" }}>
            ⏰ Renews in 47 days — now is the best time to shop competing quotes.
          </div>
        </div>
        <div className="card">
          <h3 className="section-label">Competing Quotes</h3>
          {[
            { provider: "Hippo", premium: 1620, savings: 220, badge: "Best Price" },
            { provider: "Lemonade", premium: 1710, savings: 130, badge: null },
            { provider: "Allstate", premium: 1780, savings: 60, badge: null },
          ].map((q, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem", background: "var(--card-bg-2)", borderRadius: "10px", marginBottom: "0.75rem" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{q.provider} {q.badge && <span style={{ fontSize: "0.7rem", color: "var(--green)", fontWeight: 700, marginLeft: "0.4rem" }}>★ {q.badge}</span>}</div>
                <div style={{ color: "var(--green)", fontSize: "0.85rem" }}>Save {formatCurrency(q.savings)}/yr</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700 }}>{formatCurrency(q.premium)}/yr</div>
                <button className="btn-secondary" style={{ fontSize: "0.75rem", padding: "0.25rem 0.65rem", marginTop: "0.25rem" }}>Switch →</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- MAIN APP ----

function FindRealtorSection({ session }) {
  const [selected, setSelected] = useState(null);
  const [requestForm, setRequestForm] = useState({ message: "", timeline: "1-3 months", budget: "", hasPreApproval: "No" });
  const [submitted, setSubmitted] = useState(false);
  const [filter, setFilter] = useState("All");
  const upd = (k, v) => setRequestForm(f => ({ ...f, [k]: v }));

  const hasRealtor = session?.user?.realtorId;
  const specialtyFilters = ["All", "First-Time Buyers", "Luxury Homes", "New Construction", "Investment Properties"];
  const filtered = filter === "All" ? FEATURED_REALTORS : FEATURED_REALTORS.filter(r => r.specialties.includes(filter));

  if (hasRealtor) return (
    <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center", padding: "3rem 2rem" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🤝</div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>You already have a realtor</div>
      <div style={{ color: "var(--muted)", lineHeight: 1.7, marginBottom: "2rem" }}>
        You're already connected with a real estate agent through HomeStart. If you need to change agents or have questions, contact us at <span style={{ color: "var(--blue)" }}>support@homestart.com</span>.
      </div>
      <div className="card" style={{ textAlign: "left" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg,#c2714f,#a85c3a)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>SC</div>
          <div>
            <div style={{ fontWeight: 700 }}>Sarah Connelly</div>
            <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Austin Premier Realty · (512) 555-0182</div>
          </div>
          <span style={{ marginLeft: "auto", padding: "0.3rem 0.75rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, background: "rgba(61,125,90,0.1)", color: "var(--green)", border: "1px solid rgba(61,125,90,0.25)" }}>Connected</span>
        </div>
      </div>
    </div>
  );

  if (submitted) return (
    <div style={{ maxWidth: "560px", margin: "0 auto", textAlign: "center", padding: "3rem 2rem" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", fontWeight: 700, marginBottom: "0.75rem" }}>Request Sent!</div>
      <div style={{ color: "var(--muted)", lineHeight: 1.7, marginBottom: "2rem" }}>
        We've sent your details to <strong style={{ color: "var(--text)" }}>{selected.name}</strong> at {selected.brokerage}. They'll reach out within {selected.responseTime} to introduce themselves and get started.
      </div>
      <div className="card" style={{ textAlign: "left", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: `linear-gradient(135deg, ${selected.color}, ${selected.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "white", fontSize: "1rem" }}>{selected.avatar}</div>
          <div>
            <div style={{ fontWeight: 700 }}>{selected.name}</div>
            <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{selected.brokerage}</div>
          </div>
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.6 }}>
          📞 {selected.phone}<br />
          ✉️ {selected.email}<br />
          ⏱ Typical response: {selected.responseTime}
        </div>
      </div>
      <button className="btn-secondary" onClick={() => { setSubmitted(false); setSelected(null); }}>Browse Other Realtors</button>
    </div>
  );

  if (selected) return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      <button className="btn-secondary" style={{ marginBottom: "1.5rem" }} onClick={() => setSelected(null)}>← Back to Realtors</button>

      {/* Realtor profile */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: `linear-gradient(135deg, ${selected.color}, ${selected.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.4rem", color: "white", flexShrink: 0 }}>{selected.avatar}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700 }}>{selected.name}</div>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "4px", background: `${selected.color}20`, color: selected.color, border: `1px solid ${selected.color}40` }}>{selected.badge}</span>
            </div>
            <div style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "0.75rem" }}>{selected.brokerage} · License {selected.license}</div>
            <div style={{ fontSize: "0.875rem", lineHeight: 1.7, color: "var(--muted)", marginBottom: "1rem" }}>{selected.bio}</div>
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              {[
                { label: "Experience", value: `${selected.experience} years` },
                { label: "Closed Deals", value: selected.closedDeals },
                { label: "Avg Sale Price", value: formatCurrency(selected.avgPrice) },
                { label: "Rating", value: `⭐ ${selected.rating} (${selected.reviews})` },
                { label: "Response Time", value: selected.responseTime },
              ].map(({ label, value }, i) => (
                <div key={i}>
                  <div style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", marginTop: "0.15rem" }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border)" }}>
          <div>
            <div style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>Specialties</div>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {selected.specialties.map((s, i) => <span key={i} style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem", borderRadius: "20px", background: "rgba(194,113,79,0.08)", color: "var(--accent)", border: "1px solid rgba(194,113,79,0.15)" }}>{s}</span>)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>Areas Served</div>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {selected.areas.map((a, i) => <span key={i} style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem", borderRadius: "20px", background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }}>{a}</span>)}
            </div>
          </div>
        </div>
      </div>

      {/* Request form */}
      <div className="card">
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.25rem" }}>Connect with {selected.name.split(" ")[0]}</div>
        <div style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>Tell them a bit about what you're looking for and they'll reach out to get started.</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div className="field">
            <label>Buying Timeline</label>
            <select className="text-input" value={requestForm.timeline} onChange={e => upd("timeline", e.target.value)}>
              {["ASAP", "1-3 months", "3-6 months", "6-12 months", "Just exploring"].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Budget Range</label>
            <select className="text-input" value={requestForm.budget} onChange={e => upd("budget", e.target.value)}>
              {["Under $250k", "$250k–$350k", "$350k–$500k", "$500k–$750k", "$750k+"].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Pre-Approval Status</label>
            <select className="text-input" value={requestForm.hasPreApproval} onChange={e => upd("hasPreApproval", e.target.value)}>
              {["Yes — through HomeStart", "Yes — through another lender", "In progress", "Not yet"].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Property Type</label>
            <select className="text-input">
              {["Single Family", "Condo / Townhome", "New Construction", "Not sure yet"].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div className="field" style={{ gridColumn: "1/-1" }}>
            <label>Message (optional)</label>
            <textarea className="text-input" rows="3" value={requestForm.message} onChange={e => upd("message", e.target.value)} placeholder={`Hi ${selected.name.split(" ")[0]}, I'm looking for a home in the ${selected.areas[0]} area and would love to connect...`} style={{ resize: "vertical" }} />
          </div>
        </div>

        {/* Client info preview */}
        <div style={{ padding: "0.85rem 1rem", background: "rgba(194,113,79,0.05)", borderRadius: "10px", border: "1px solid rgba(194,113,79,0.12)", marginBottom: "1.25rem", fontSize: "0.85rem" }}>
          <div style={{ fontWeight: 600, marginBottom: "0.25rem", color: "var(--muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Shared with realtor</div>
          <div style={{ color: "var(--muted)" }}>Your name, email, phone, and HomeStart pre-approval status will be shared. <strong style={{ color: "var(--text)" }}>Income, credit score, and financial details are not shared.</strong></div>
        </div>

        <button className="btn-primary" style={{ width: "100%", padding: "0.9rem", fontSize: "1rem" }} onClick={() => setSubmitted(true)}>
          Send Request to {selected.name.split(" ")[0]} →
        </button>
      </div>
    </div>
  );

  // Main listing
  return (
    <div>
      {/* Intro banner */}
      <div style={{ padding: "1.5rem 2rem", borderRadius: "14px", background: "linear-gradient(135deg, rgba(194,113,79,0.08), rgba(194,113,79,0.04,0.08))", border: "1px solid rgba(194,113,79,0.2)", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <div style={{ fontSize: "2.5rem", flexShrink: 0 }}>🏡</div>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.25rem" }}>Find Your Agent</div>
          <div style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
            Our partner realtors know the HomeStart platform inside and out. Once connected, your agent can access your pre-approval status and generate offer letters on your behalf — no paperwork ping-pong.
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {specialtyFilters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "0.4rem 1rem", borderRadius: "20px", border: `1px solid ${filter === f ? "var(--accent)" : "var(--border)"}`, background: filter === f ? "rgba(194,113,79,0.12)" : "transparent", color: filter === f ? "var(--accent)" : "var(--muted)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: "0.85rem", transition: "all 0.15s" }}>{f}</button>
        ))}
      </div>

      {/* Realtor cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.25rem" }}>
        {filtered.map((realtor, i) => (
          <div key={i} className="card" style={{ cursor: "pointer", transition: "border-color 0.2s, transform 0.2s", position: "relative" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${realtor.color}60`; e.currentTarget.style.transform = "translateY(-3px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            {/* Badge */}
            <div style={{ position: "absolute", top: "-1px", right: "1.25rem", fontSize: "0.68rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "0 0 6px 6px", background: `${realtor.color}25`, color: realtor.color, border: `1px solid ${realtor.color}40`, borderTop: "none" }}>{realtor.badge}</div>

            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: `linear-gradient(135deg, ${realtor.color}, ${realtor.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.1rem", color: "white", flexShrink: 0 }}>{realtor.avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "1rem" }}>{realtor.name}</div>
                <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{realtor.brokerage}</div>
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.3rem", fontSize: "0.8rem" }}>
                  <span>⭐ {realtor.rating} <span style={{ color: "var(--muted)" }}>({realtor.reviews})</span></span>
                  <span style={{ color: "var(--muted)" }}>·</span>
                  <span style={{ color: "var(--muted)" }}>{realtor.closedDeals} closed</span>
                  <span style={{ color: "var(--muted)" }}>·</span>
                  <span style={{ color: "var(--muted)" }}>responds {realtor.responseTime}</span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "1rem" }}>{realtor.bio}</div>

            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              {realtor.specialties.map((s, j) => (
                <span key={j} style={{ fontSize: "0.72rem", padding: "0.2rem 0.55rem", borderRadius: "20px", background: `${realtor.color}12`, color: realtor.color, border: `1px solid ${realtor.color}30` }}>{s}</span>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                📍 {realtor.areas.join(", ")}
              </div>
              <button className="btn-primary" style={{ fontSize: "0.82rem", padding: "0.45rem 1rem" }} onClick={() => setSelected(realtor)}>
                Connect →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CTA for realtors */}
      <div style={{ marginTop: "2rem", padding: "1.5rem", textAlign: "center", borderRadius: "14px", border: "1px dashed var(--border)", background: "rgba(194,113,79,0.03)" }}>
        <div style={{ fontWeight: 600, marginBottom: "0.4rem" }}>Are you a real estate agent?</div>
        <div style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "1rem" }}>Join our partner network and get matched with pre-approved buyers actively searching in your market.</div>
        <button className="btn-secondary">Apply to Join as a Realtor Partner →</button>
      </div>
    </div>
  );
}


// =============================================
// LOAN APPLICATION WIZARD (client-side, triggered after Under Contract)
// =============================================

function LenderPortal({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [applications, setApplications] = useState(MOCK_DB.loanApplications);
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDecisionModal, setShowDecisionModal] = useState(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [decisionRate, setDecisionRate] = useState("");
  const [decisionDone, setDecisionDone] = useState(false);
  const [realLeads, setRealLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [preApprovalQueue, setPreApprovalQueue] = useState([]);
  const [selectedPreApproval, setSelectedPreApproval] = useState(null);
  const [preApprovalDecision, setPreApprovalDecision] = useState(null);
  const [preApprovalAmount, setPreApprovalAmount] = useState("");
  const [preApprovalConditions, setPreApprovalConditions] = useState("");
  const [preApprovalDone, setPreApprovalDone] = useState(false);

  useEffect(() => {
    loadRealLeads();
    loadPreApprovalQueue();
  }, []);

  const loadRealLeads = async () => {
    setLeadsLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("captured_at", { ascending: false });
    if (error) console.error("Leads load error:", error);
    if (data) setRealLeads(data);
    setLeadsLoading(false);
  };

  const loadPreApprovalQueue = async () => {
    const { data, error } = await supabase
      .from("pre_approval_applications")
      .select("*")
      .eq("status", "under_review")
      .order("submitted_at", { ascending: false });
    if (error) console.error("Pre-approval queue error:", error);
    if (data) setPreApprovalQueue(data);
  };

  const statuses = ["All", ...Object.keys(STATUS_COLORS)];

  const filtered = applications.filter(a => {
    const matchStatus = statusFilter === "All" || a.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || a.clientName.toLowerCase().includes(q) || a.realtorName.toLowerCase().includes(q) || a.propertyAddress.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const metrics = {
    total: applications.length,
    pipeline: applications.filter(a => ["Pre-Approval Review","Application Review","Underwriting"].includes(a.status)).length,
    approved: applications.filter(a => a.status === "Approved").length,
    suspended: applications.filter(a => a.status === "Suspended").length,
    volume: applications.reduce((s,a) => s + a.loanAmount, 0),
    avgLTV: Math.round(applications.reduce((s,a) => s + a.ltv, 0) / applications.length),
    avgDTI: +(applications.reduce((s,a) => s + a.dti, 0) / applications.length).toFixed(1),
    avgScore: Math.round(applications.reduce((s,a) => s + a.creditScore, 0) / applications.length),
  };

  const doDecision = (newStatus) => {
    setApplications(prev => prev.map(a => a.id === selected.id ? { ...a, status: newStatus, decisionNote, ...(newStatus === "Approved" && decisionRate ? { estRate: parseFloat(decisionRate) } : {}) } : a));
    setSelected(prev => ({ ...prev, status: newStatus, decisionNote, ...(newStatus === "Approved" && decisionRate ? { estRate: parseFloat(decisionRate) } : {}) }));
    setDecisionDone(true);
  };

  const closeDecision = () => { setShowDecisionModal(null); setDecisionNote(""); setDecisionRate(""); setDecisionDone(false); };

  const closePreApprovalModal = () => {
    setSelectedPreApproval(null);
    setPreApprovalDecision(null);
    setPreApprovalAmount("");
    setPreApprovalConditions("");
    setPreApprovalDone(false);
  };

  const doPreApprovalDecision = async (decision) => {
    console.log("doPreApprovalDecision called with:", decision);
    console.log("selectedPreApproval:", selectedPreApproval);
    console.log("preApprovalAmount:", preApprovalAmount);

    if (!selectedPreApproval) {
      console.error("No selectedPreApproval");
      return;
    }
    if (decision === "approve" && !preApprovalAmount) {
      alert("Please enter a pre-approval amount");
      return;
    }

    try {
      console.log("Updating database...");
      const { error } = await supabase
        .from("pre_approval_applications")
        .update({
          status: decision === "approve" ? "pre_approved" : "denied",
          pre_approval_amount: decision === "approve" ? parseFloat(preApprovalAmount) : null,
          conditions_notes: preApprovalConditions || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedPreApproval.id);

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      console.log("Database update successful");
      setPreApprovalQueue(prev => prev.filter(p => p.id !== selectedPreApproval.id));
      setPreApprovalDone(true);

      // Close modal and reset form
      setSelectedPreApproval(null);
      setPreApprovalDecision(null);
      setPreApprovalAmount("");
      setPreApprovalConditions("");

      // Show success message
      alert(`Application ${decision === "approve" ? "approved" : "denied"} successfully!`);
    } catch (err) {
      console.error("Pre-approval decision error:", err);
      alert("Error recording decision: " + (err.message || "Unknown error"));
    }
  };

  const StatusChip = ({ status }) => {
    const c = STATUS_COLORS[status] || { bg:"#f0ebe3", text:"#8a7968", border:"#e2dbd0" };
    return <span className="l-status-chip" style={{ background:c.bg, color:c.text, borderColor:c.border }}>{status}</span>;
  };

  const Gauge = ({ value, max, color, label }) => (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.78rem", marginBottom:"0.2rem" }}>
        <span style={{ color:"var(--muted)" }}>{label}</span>
        <span style={{ fontWeight:700, color }}>{value}</span>
      </div>
      <div className="gauge-bar"><div className="gauge-fill" style={{ width:`${Math.min(100,(value/max)*100)}%`, background:color }} /></div>
    </div>
  );

  // ── Application Detail View ─────────────────────────────────────────────────
  if (selected) {
    const app = selected;
    const piti = app.estMonthlyPayment + Math.round(app.purchasePrice * 0.012 / 12) + Math.round(app.purchasePrice * 0.0025 / 12) + (app.ltv > 80 ? Math.round(app.loanAmount * 0.008 / 12) : 0);
    const frontDTI = +((piti / app.monthlyIncome) * 100).toFixed(1);
    const allDocs = app.docs || [];
    const docsComplete = allDocs.filter(d => d.status === "received").length;

    return (
      <div className="l-layout">
        <style>{LENDER_CSS}</style>
        <aside className="l-sidebar">
          <div className="l-sidebar-logo">
            <div className="wordmark">HomeStart</div>
            <div className="sub">Loan Officer Portal</div>
          </div>
          <nav className="l-nav">
            {[["dashboard","📊","Dashboard"],["pipeline","📋","Pipeline"],["preapprovals","🔍","Pre-Approvals"],["reports","📈","Reports"]].map(([id,icon,label]) => (
              <button key={id} className={`l-nav-btn${activeTab===id?" active":""}`} onClick={() => { setActiveTab(id); setSelected(null); }}>
                <span className="icon">{icon}</span>{label}
              </button>
            ))}
          </nav>
          <div style={{ padding:"1rem", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", marginBottom:"0.75rem" }}>
              <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:"linear-gradient(135deg,#c2714f,#a85c3a)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:"0.75rem", flexShrink:0 }}>{user.avatar}</div>
              <div><div style={{ fontSize:"0.82rem", fontWeight:600, color:"#e8e0d6" }}>{user.name}</div><div style={{ fontSize:"0.7rem", color:"#7a6a5a" }}>{user.nmls}</div></div>
            </div>
            <button className="l-nav-btn" onClick={onLogout} style={{ fontSize:"0.8rem", color:"#7a6a5a" }}>← Sign Out</button>
          </div>
        </aside>

        <main className="l-main">
          <div className="l-topbar">
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
              <button className="l-btn-secondary" style={{ fontSize:"0.8rem", padding:"0.4rem 0.85rem" }} onClick={() => setSelected(null)}>← Back to Pipeline</button>
              <span style={{ color:"var(--muted)", fontSize:"0.85rem" }}>{app.clientName}</span>
            </div>
            <StatusChip status={app.status} />
          </div>

          <div className="l-content">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:"1.5rem" }}>

              {/* LEFT COLUMN */}
              <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>

                {/* Borrower header */}
                <div className="l-card">
                  <div style={{ display:"flex", alignItems:"center", gap:"1.25rem", marginBottom:"1.25rem" }}>
                    <div style={{ width:"52px", height:"52px", borderRadius:"50%", background:"linear-gradient(135deg,#c2714f,#a85c3a)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:"1rem", color:"white", flexShrink:0 }}>
                      {app.clientName.split(" ").map(n=>n[0]).join("").slice(0,2)}
                    </div>
                    <div>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.3rem", fontWeight:700 }}>{app.clientName}</div>
                      <div style={{ color:"var(--muted)", fontSize:"0.85rem" }}>{app.loanType} · {app.propertyAddress}{app.propertyAddress !== "TBD" ? `, ${app.propertyCity} ${app.propertyState}` : ""}</div>
                    </div>
                    <div style={{ marginLeft:"auto", textAlign:"right" }}>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.6rem", fontWeight:700, color:"var(--accent)" }}>{formatCurrency(app.loanAmount)}</div>
                      <div style={{ fontSize:"0.78rem", color:"var(--muted)" }}>Loan Amount</div>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"1rem", paddingTop:"1rem", borderTop:"1px solid var(--border)" }}>
                    {[
                      { label:"Purchase Price", value:formatCurrency(app.purchasePrice), color:"var(--text)" },
                      { label:"Down Payment", value:`${formatCurrency(app.downAmount)} (${app.downPct}%)`, color:"var(--text)" },
                      { label:"LTV", value:`${app.ltv}%`, color: app.ltv > 90 ? "var(--red)" : app.ltv > 80 ? "var(--amber)" : "var(--green)" },
                      { label:"Submitted", value:app.submittedDate, color:"var(--text)" },
                    ].map((m,i) => (
                      <div key={i}>
                        <div style={{ fontSize:"0.7rem", color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"0.2rem" }}>{m.label}</div>
                        <div style={{ fontWeight:700, color:m.color }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial analysis */}
                <div className="l-card">
                  <div className="l-section-label">Financial Analysis</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem" }}>
                    <div>
                      <div style={{ fontSize:"0.78rem", fontWeight:600, marginBottom:"0.75rem", color:"var(--text)" }}>Income & Ratios</div>
                      {[
                        ["Annual Income", `$${(app.annualIncome/1000).toFixed(0)}k`],
                        ["Monthly Income", formatCurrency(app.monthlyIncome)],
                        ["Other Income", app.otherIncome ? formatCurrency(app.otherIncome)+"/mo" : "—"],
                        ["Employment", app.employmentType],
                        ["Years at Job", `${app.yearsAtJob} yrs`],
                      ].map(([k,v],i) => <div key={i} className="l-field-row"><span className="key">{k}</span><span className="val">{v}</span></div>)}
                      <div style={{ marginTop:"1rem", display:"flex", flexDirection:"column", gap:"0.6rem" }}>
                        <Gauge value={frontDTI} max={55} color={frontDTI > 36 ? "var(--amber)" : "var(--green)"} label={`Front-End DTI: ${frontDTI}%`} />
                        <Gauge value={app.dti} max={55} color={app.dti > 43 ? "var(--red)" : app.dti > 36 ? "var(--amber)" : "var(--green)"} label={`Back-End DTI: ${app.dti}%`} />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize:"0.78rem", fontWeight:600, marginBottom:"0.75rem", color:"var(--text)" }}>Monthly Obligations</div>
                      {[
                        ["Est. P&I", formatCurrency(app.estMonthlyPayment)],
                        ["Est. Taxes", formatCurrency(Math.round(app.purchasePrice * 0.012 / 12))],
                        ["Est. Insurance", formatCurrency(Math.round(app.purchasePrice * 0.0025 / 12))],
                        ["PMI", app.ltv > 80 ? formatCurrency(Math.round(app.loanAmount * 0.008 / 12)) : "Not required"],
                        ["Total PITI", formatCurrency(piti)],
                        ["Other Debts", formatCurrency(app.totalMonthlyDebt)],
                      ].map(([k,v],i) => <div key={i} className="l-field-row" style={{ fontWeight: k==="Total PITI" ? 700 : 400 }}><span className="key">{k}</span><span className="val">{v}</span></div>)}
                    </div>
                  </div>
                </div>

                {/* Credit & Assets */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem" }}>
                  <div className="l-card">
                    <div className="l-section-label">Credit Profile</div>
                    <div style={{ textAlign:"center", marginBottom:"1rem" }}>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"2.5rem", fontWeight:700, color: app.creditScore >= 740 ? "var(--green)" : app.creditScore >= 680 ? "var(--amber)" : "var(--red)" }}>{app.creditScore}</div>
                      <div style={{ fontSize:"0.78rem", color:"var(--muted)" }}>{app.creditScore >= 740 ? "Excellent" : app.creditScore >= 700 ? "Good" : app.creditScore >= 650 ? "Fair" : "Poor"}</div>
                    </div>
                    <div className="gauge-bar" style={{ marginBottom:"1rem" }}>
                      <div className="gauge-fill" style={{ width:`${((app.creditScore-300)/550)*100}%`, background: app.creditScore >= 740 ? "var(--green)" : app.creditScore >= 680 ? "var(--amber)" : "var(--red)" }} />
                    </div>
                    {[
                      ["First-Time Buyer", app.firstTimeBuyer ? "Yes" : "No"],
                      ["US Citizen/PR", app.usCitizen ? "Yes" : "No / Visa"],
                      ["Gift Funds", app.giftFunds ? "Yes" : "No"],
                    ].map(([k,v],i) => <div key={i} className="l-field-row"><span className="key">{k}</span><span className="val">{v}</span></div>)}
                  </div>

                  <div className="l-card">
                    <div className="l-section-label">Assets</div>
                    {[
                      ["Checking", formatCurrency(app.checkingBalance)],
                      ["Savings", formatCurrency(app.savingsBalance)],
                      ["Retirement", formatCurrency(app.retirementBalance)],
                      ["Total Liquid", formatCurrency(app.checkingBalance + app.savingsBalance)],
                      ["Months Reserves", `${Math.floor((app.checkingBalance + app.savingsBalance) / piti)} mo`],
                    ].map(([k,v],i) => <div key={i} className="l-field-row" style={{ fontWeight: k.startsWith("Total") || k.startsWith("Months") ? 700 : 400 }}><span className="key">{k}</span><span className="val">{v}</span></div>)}
                  </div>
                </div>

                {/* Notes */}
                <div className="l-card">
                  <div className="l-section-label">Loan Officer Notes</div>
                  <textarea
                    className="l-input"
                    style={{ width:"100%", minHeight:"90px", resize:"vertical" }}
                    placeholder="Add notes about this application..."
                    defaultValue={app.decisionNote || app.notes}
                    onChange={e => setSelected(prev => ({ ...prev, decisionNote: e.target.value }))}
                  />
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>

                {/* Decision panel */}
                <div className="l-card" style={{ background:"linear-gradient(135deg,#1a1410,#2a1f18)", border:"1px solid rgba(194,113,79,0.2)" }}>
                  <div className="l-section-label" style={{ color:"#7a6a5a" }}>Underwriting Decision</div>
                  <div style={{ fontSize:"0.82rem", color:"#c0b0a0", marginBottom:"1.25rem" }}>Current status: <strong style={{ color:"#e8956a" }}>{app.status}</strong></div>
                  {app.status === "Approved" ? (
                    <div style={{ textAlign:"center", padding:"1rem 0" }}>
                      <div style={{ fontSize:"2rem", marginBottom:"0.5rem" }}>✅</div>
                      <div style={{ color:"#6dbf8a", fontWeight:700 }}>Approved</div>
                      {app.estRate && <div style={{ color:"#a0c0b0", fontSize:"0.82rem", marginTop:"0.35rem" }}>Rate: {app.estRate}%</div>}
                    </div>
                  ) : app.status === "Denied" ? (
                    <div style={{ textAlign:"center", padding:"1rem 0" }}>
                      <div style={{ fontSize:"2rem", marginBottom:"0.5rem" }}>❌</div>
                      <div style={{ color:"#e87b72", fontWeight:700 }}>Denied</div>
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
                      <button className="l-btn-approve" onClick={() => { setShowDecisionModal("approve"); setDecisionDone(false); }}>✓ Approve</button>
                      <button className="l-btn-suspend" onClick={() => { setShowDecisionModal("suspend"); setDecisionDone(false); }}>⏸ Suspend</button>
                      <button className="l-btn-deny" onClick={() => { setShowDecisionModal("deny"); setDecisionDone(false); }}>✕ Deny</button>
                    </div>
                  )}
                </div>

                {/* Checklist flags */}
                {app.flags?.length > 0 && (
                  <div className="l-card" style={{ borderColor:"rgba(184,114,10,0.3)", background:"var(--amber-bg)" }}>
                    <div className="l-section-label" style={{ color:"var(--amber)" }}>⚠️ Action Items</div>
                    {app.flags.map((f,i) => <div key={i} style={{ fontSize:"0.85rem", color:"var(--amber)", padding:"0.35rem 0", borderBottom:"1px solid rgba(184,114,10,0.15)" }}>{f}</div>)}
                  </div>
                )}

                {/* Risk summary */}
                <div className="l-card">
                  <div className="l-section-label">Risk Summary</div>
                  {[
                    { label:"LTV Risk", value:app.ltv, threshold:[80,90], unit:"%" },
                    { label:"Back-End DTI", value:app.dti, threshold:[36,43], unit:"%" },
                    { label:"Credit Score", value:app.creditScore, threshold:[700,680], unit:"", invert:true },
                  ].map((r,i) => {
                    const bad = r.invert ? r.value < r.threshold[1] : r.value > r.threshold[1];
                    const warn = r.invert ? r.value < r.threshold[0] : r.value > r.threshold[0];
                    const color = bad ? "var(--red)" : warn ? "var(--amber)" : "var(--green)";
                    return (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.45rem 0", borderBottom:"1px solid #f0ebe3" }}>
                        <span style={{ fontSize:"0.85rem", color:"var(--muted)" }}>{r.label}</span>
                        <span style={{ fontSize:"0.875rem", fontWeight:700, color }}>{r.value}{r.unit} {bad?"🔴":warn?"🟡":"🟢"}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Documents */}
                <div className="l-card">
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.85rem" }}>
                    <div className="l-section-label" style={{ marginBottom:0 }}>Documents</div>
                    <span style={{ fontSize:"0.75rem", color:"var(--muted)" }}>{docsComplete}/{allDocs.length} received</span>
                  </div>
                  {allDocs.map((doc,i) => {
                    const cfg = { received:{ bg:"var(--green-bg)", color:"var(--green)", icon:"✓" }, missing:{ bg:"var(--red-bg)", color:"var(--red)", icon:"✗" }, pending:{ bg:"var(--amber-bg)", color:"var(--amber)", icon:"⏳" }, "n/a":{ bg:"var(--surface)", color:"var(--muted)", icon:"—" } }[doc.status] || {};
                    return (
                      <div key={i} className="doc-row" style={{ background:cfg.bg }}>
                        <span style={{ fontSize:"0.83rem" }}>{doc.name}</span>
                        <span style={{ fontSize:"0.75rem", fontWeight:700, color:cfg.color }}>{cfg.icon} {doc.status}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Realtor info */}
                <div className="l-card">
                  <div className="l-section-label">Referring Agent</div>
                  {[["Name", app.realtorName],["Brokerage", app.brokerage]].map(([k,v],i) => (
                    <div key={i} className="l-field-row"><span className="key">{k}</span><span className="val">{v}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Main Portal (dashboard / pipeline / pre-approvals / reports) ─────────────
  return (
    <div className="l-layout">
      <style>{LENDER_CSS}</style>

      <aside className="l-sidebar">
        <div className="l-sidebar-logo">
          <div className="wordmark">HomeStart</div>
          <div className="sub">Loan Officer Portal</div>
        </div>
        <nav className="l-nav">
          <div className="l-nav-label">Overview</div>
          <button className={`l-nav-btn${activeTab==="dashboard"?" active":""}`} onClick={() => setActiveTab("dashboard")}><span className="icon">📊</span>Dashboard</button>
          <div className="l-nav-label">Applications</div>
          <button className={`l-nav-btn${activeTab==="pipeline"?" active":""}`} onClick={() => setActiveTab("pipeline")}><span className="icon">📋</span>Pipeline<span className="badge">{metrics.pipeline}</span></button>
          <button className={`l-nav-btn${activeTab==="preapprovals"?" active":""}`} onClick={() => setActiveTab("preapprovals")}><span className="icon">🔍</span>Pre-Approvals</button>
          <div className="l-nav-label">Analytics</div>
          <button className={`l-nav-btn${activeTab==="reports"?" active":""}`} onClick={() => setActiveTab("reports")}><span className="icon">📈</span>Reports</button>
          <div className="l-nav-label">Growth</div>
          <button className={`l-nav-btn${activeTab==="leads"?" active":""}`} onClick={() => setActiveTab("leads")}><span className="icon">⚡</span>Rate Grader Leads<span className="badge">{realLeads.length}</span></button>
        </nav>
        <div style={{ padding:"1rem", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", marginBottom:"0.75rem" }}>
            <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:"linear-gradient(135deg,#c2714f,#a85c3a)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:"0.75rem", flexShrink:0, color:"white" }}>{user.avatar}</div>
            <div><div style={{ fontSize:"0.82rem", fontWeight:600, color:"#e8e0d6" }}>{user.name}</div><div style={{ fontSize:"0.7rem", color:"#7a6a5a" }}>{user.nmls}</div></div>
          </div>
          <button className="l-nav-btn" onClick={onLogout} style={{ fontSize:"0.8rem", color:"#7a6a5a" }}>← Sign Out</button>
        </div>
      </aside>

      <main className="l-main">
        <div className="l-topbar">
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"1.05rem" }}>
            {activeTab==="dashboard"?"Dashboard":activeTab==="pipeline"?"Loan Pipeline":activeTab==="preapprovals"?"Pre-Approval Queue":activeTab==="leads"?"⚡ Rate Grader Leads":"Reports & Analytics"}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
            <span style={{ fontSize:"0.78rem", color:"var(--muted)" }}>Today: {new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span>
          </div>
        </div>

        <div className="l-content">

          {/* ── DASHBOARD ── */}
          {activeTab === "dashboard" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>

              {/* Metric cards */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"1rem" }}>
                {[
                  { label:"Active Pipeline", value:metrics.pipeline, delta:"+2 this week", color:"var(--blue)", icon:"📋" },
                  { label:"Approved (MTD)", value:metrics.approved, delta:formatCurrency(applications.filter(a=>a.status==="Approved").reduce((s,a)=>s+a.loanAmount,0)), color:"var(--green)", icon:"✅" },
                  { label:"Suspended", value:metrics.suspended, delta:"Needs attention", color:"var(--amber)", icon:"⏸" },
                  { label:"Total Volume", value:formatCurrency(metrics.volume).replace("$","$").slice(0,8), delta:"All applications", color:"var(--accent)", icon:"💰" },
                ].map((m,i) => (
                  <div key={i} className="l-card">
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.75rem" }}>
                      <div className="l-metric">
                        <div className="label">{m.label}</div>
                        <div className="value" style={{ color:m.color }}>{m.value}</div>
                        <div className="delta" style={{ color:"var(--muted)" }}>{m.delta}</div>
                      </div>
                      <span style={{ fontSize:"1.5rem" }}>{m.icon}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Portfolio averages */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem" }}>
                <div className="l-card">
                  <div className="l-section-label">Portfolio Risk Averages</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
                    <Gauge value={metrics.avgLTV} max={100} color={metrics.avgLTV>90?"var(--red)":metrics.avgLTV>80?"var(--amber)":"var(--green)"} label={`Avg LTV: ${metrics.avgLTV}%`} />
                    <Gauge value={metrics.avgDTI} max={55} color={metrics.avgDTI>43?"var(--red)":metrics.avgDTI>36?"var(--amber)":"var(--green)"} label={`Avg Back-End DTI: ${metrics.avgDTI}%`} />
                    <Gauge value={metrics.avgScore} max={850} color={metrics.avgScore>=740?"var(--green)":metrics.avgScore>=680?"var(--amber)":"var(--red)"} label={`Avg Credit Score: ${metrics.avgScore}`} />
                  </div>
                </div>

                <div className="l-card">
                  <div className="l-section-label">Pipeline by Status</div>
                  {Object.entries(STATUS_COLORS).map(([status, c]) => {
                    const count = applications.filter(a => a.status === status).length;
                    if (!count) return null;
                    return (
                      <div key={status} style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.6rem" }}>
                        <span className="l-status-chip" style={{ background:c.bg, color:c.text, borderColor:c.border, minWidth:"150px", justifyContent:"center" }}>{status}</span>
                        <div style={{ flex:1, height:"6px", borderRadius:"3px", background:"var(--border)", overflow:"hidden" }}>
                          <div style={{ height:"100%", borderRadius:"3px", background:c.text, width:`${(count/applications.length)*100}%` }} />
                        </div>
                        <span style={{ fontSize:"0.82rem", fontWeight:700, color:"var(--text)", minWidth:"20px" }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent activity */}
              <div className="l-card">
                <div className="l-section-label">Recent Applications</div>
                <table className="l-table">
                  <thead><tr><th>Borrower</th><th>Loan Amount</th><th>Type</th><th>Status</th><th>Submitted</th><th></th></tr></thead>
                  <tbody>
                    {applications.slice(0,4).map((a,i) => (
                      <tr key={i} onClick={() => setSelected(a)}>
                        <td><div style={{ fontWeight:600 }}>{a.clientName}</div><div style={{ fontSize:"0.75rem", color:"var(--muted)" }}>{a.realtorName}</div></td>
                        <td><span className="mono">{formatCurrency(a.loanAmount)}</span></td>
                        <td style={{ color:"var(--muted)", fontSize:"0.82rem" }}>{a.loanType}</td>
                        <td><StatusChip status={a.status} /></td>
                        <td style={{ color:"var(--muted)", fontSize:"0.82rem" }}>{a.submittedDate}</td>
                        <td style={{ color:"var(--muted)" }}>→</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PIPELINE ── */}
          {activeTab === "pipeline" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
              <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", flexWrap:"wrap" }}>
                <input className="l-input" style={{ width:"240px" }} placeholder="Search by name, address..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} />
                <select className="l-input" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
                  {statuses.map(s => <option key={s}>{s}</option>)}
                </select>
                <span style={{ fontSize:"0.82rem", color:"var(--muted)", marginLeft:"auto" }}>{filtered.length} applications</span>
              </div>

              <div className="l-card" style={{ padding:0, overflow:"hidden" }}>
                <table className="l-table">
                  <thead>
                    <tr>
                      <th>Borrower</th>
                      <th>Property</th>
                      <th>Loan Amount</th>
                      <th>LTV</th>
                      <th>DTI</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a,i) => (
                      <tr key={i} onClick={() => setSelected(a)}>
                        <td>
                          <div style={{ fontWeight:600 }}>{a.clientName}</div>
                          <div style={{ fontSize:"0.75rem", color:"var(--muted)" }}>{a.loanType}</div>
                        </td>
                        <td style={{ fontSize:"0.82rem", color:"var(--muted)" }}>{a.propertyAddress !== "TBD" ? `${a.propertyAddress}, ${a.propertyCity}` : "TBD"}</td>
                        <td><span className="mono" style={{ fontWeight:600 }}>{formatCurrency(a.loanAmount)}</span></td>
                        <td><span style={{ fontWeight:700, color: a.ltv>90?"var(--red)":a.ltv>80?"var(--amber)":"var(--green)" }}>{a.ltv}%</span></td>
                        <td><span style={{ fontWeight:700, color: a.dti>43?"var(--red)":a.dti>36?"var(--amber)":"var(--green)" }}>{a.dti}%</span></td>
                        <td><span style={{ fontWeight:700, color: a.creditScore>=740?"var(--green)":a.creditScore>=680?"var(--amber)":"var(--red)" }}>{a.creditScore}</span></td>
                        <td><StatusChip status={a.status} /></td>
                        <td style={{ fontSize:"0.82rem", color:"var(--muted)" }}>{a.submittedDate}</td>
                        <td style={{ color:"var(--muted)" }}>→</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && <div style={{ textAlign:"center", padding:"3rem", color:"var(--muted)" }}>No applications match your filters.</div>}
              </div>
            </div>
          )}

          {/* ── PRE-APPROVALS ── */}
          {activeTab === "preapprovals" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
              {preApprovalQueue.length === 0 ? (
                <div className="l-card" style={{ textAlign:"center", padding:"4rem 2rem" }}>
                  <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>📋</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.2rem", fontWeight:700, marginBottom:"0.5rem" }}>No pending pre-approvals</div>
                  <div style={{ color:"var(--muted)", fontSize:"0.875rem" }}>Pre-approval submissions from clients will appear here.</div>
                </div>
              ) : (
                <div className="l-card" style={{ padding:0, overflow:"hidden" }}>
                  <table className="l-table">
                    <thead>
                      <tr><th>Borrower</th><th>Email</th><th>Income</th><th>Purchase Price</th><th>Loan Type</th><th>Submitted</th><th></th></tr>
                    </thead>
                    <tbody>
                      {preApprovalQueue.map((p,i) => {
                        const onClick = () => {
                          console.log("Clicked pre-approval row:", p);
                          setSelectedPreApproval(p);
                        };
                        return (
                          <tr key={i} onClick={onClick} style={{ cursor: "pointer", userSelect: "none" }}>
                            <td style={{ fontWeight:600 }}>{`${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email}</td>
                            <td style={{ color:"var(--muted)", fontSize:"0.82rem" }}>{p.email}</td>
                            <td><span className="mono">{p.annual_income ? formatCurrency(p.annual_income) : "—"}</span></td>
                            <td><span className="mono">{p.purchase_price ? formatCurrency(p.purchase_price) : "—"}</span></td>
                            <td style={{ color:"var(--muted)", fontSize:"0.82rem" }}>{p.loan_type || "—"}</td>
                            <td style={{ color:"var(--muted)", fontSize:"0.82rem" }}>{p.submitted_at ? new Date(p.submitted_at).toLocaleDateString() : "—"}</td>
                            <td><span className="l-status-chip" style={{ background:"rgba(47,111,168,0.1)", color:"var(--blue)", borderColor:"rgba(47,111,168,0.25)" }}>Under Review</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── LEADS ── */}
          {activeTab === "leads" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem" }}>
                {[
                  { label:"Total Leads", value:MOCK_DB.leads.length, color:"var(--accent)", icon:"⚡" },
                  { label:"A/B Grades", value:MOCK_DB.leads.filter(l=>l.grade==="A"||l.grade==="B").length, color:"var(--green)", icon:"🟢" },
                  { label:"Potential Monthly Savings", value:MOCK_DB.leads.reduce((s,l)=>s+(l.monthlySavings||0),0), color:"var(--blue)", icon:"💰", isCurrency:true },
                ].map((m,i)=>(
                  <div key={i} className="l-card">
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div><div style={{ fontSize:"0.7rem", textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--muted)", marginBottom:"0.35rem" }}>{m.label}</div>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.8rem", fontWeight:700, color:m.color }}>{m.isCurrency?formatCurrency(m.value):m.value}</div></div>
                      <span style={{ fontSize:"1.5rem" }}>{m.icon}</span>
                    </div>
                  </div>
                ))}
              </div>

              {realLeads.length === 0 ? (
                <div className="l-card" style={{ textAlign:"center", padding:"4rem 2rem" }}>
                  <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>⚡</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.25rem", fontWeight:700, marginBottom:"0.5rem" }}>No leads yet</div>
                  <div style={{ color:"var(--muted)", fontSize:"0.9rem", maxWidth:"400px", margin:"0 auto" }}>
                    Leads are captured when visitors use the public Grade My Rate tool and submit their contact info to unlock the full analysis. Share the link to start generating leads.
                  </div>
                </div>
              ) : (
                <div className="l-card" style={{ padding:0, overflow:"hidden" }}>
                  <table className="l-table">
                    <thead>
                      <tr><th>Name</th><th>Email</th><th>Phone</th><th>Grade</th><th>Lender</th><th>Rate</th><th>Mo. Savings</th><th>Captured</th><th></th></tr>
                    </thead>
                    <tbody>
                      {realLeads.map((lead,i)=>{
                        const gc = {"A":"var(--green)","B":"#5a9e6f","C":"var(--amber)","D":"#c05a2a","F":"var(--red)"}[lead.grade]||"var(--muted)";
                        return (
                          <tr key={i}>
                            <td style={{ fontWeight:600 }}>{lead.name}</td>
                            <td style={{ color:"var(--blue)", fontSize:"0.85rem" }}><a href={"mailto:"+lead.email} style={{ color:"inherit", textDecoration:"none" }}>{lead.email}</a></td>
                            <td style={{ color:"var(--muted)", fontSize:"0.85rem" }}>{lead.phone||"—"}</td>
                            <td><span style={{ fontWeight:800, fontSize:"1rem", color:gc }}>{lead.grade}</span><span style={{ marginLeft:"0.4rem", fontSize:"0.72rem", color:"var(--muted)" }}>{lead.grade_label}</span></td>
                            <td style={{ color:"var(--muted)", fontSize:"0.82rem" }}>{lead.lender_name||"—"}</td>
                            <td><span className="mono">{lead.rate?lead.rate+"%":"—"}</span></td>
                            <td style={{ color:"var(--green)", fontWeight:600 }}>{lead.monthly_savings?formatCurrency(lead.monthly_savings)+"/mo":"—"}</td>
                            <td style={{ color:"var(--muted)", fontSize:"0.82rem" }}>{lead.captured_at ? new Date(lead.captured_at).toLocaleDateString() : "—"}</td>
                            <td><button className="l-btn-primary" style={{ fontSize:"0.75rem", padding:"0.3rem 0.75rem" }} onClick={()=>window.open("mailto:"+lead.email)}>Contact</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="l-card" style={{ background:"linear-gradient(135deg,rgba(194,113,79,0.06),rgba(194,113,79,0.02))", border:"1px solid rgba(194,113,79,0.2)" }}>
                <div className="l-section-label">Share Your Rate Grader</div>
                <div style={{ fontSize:"0.875rem", color:"var(--muted)", marginBottom:"1rem" }}>Drive leads by sharing this free tool. It works without any login and captures contact info before revealing the full analysis.</div>
                <div style={{ display:"flex", gap:"0.75rem", alignItems:"center" }}>
                  <div style={{ flex:1, padding:"0.6rem 0.85rem", background:"var(--surface)", borderRadius:"8px", border:"1px solid var(--border)", fontSize:"0.82rem", color:"var(--muted)", fontFamily:"'DM Mono',monospace" }}>
                    homestart.io/grade-my-rate
                  </div>
                  <button className="l-btn-secondary" style={{ whiteSpace:"nowrap" }}>Copy Link</button>
                  <button className="l-btn-primary" style={{ whiteSpace:"nowrap" }}>Share →</button>
                </div>
              </div>
            </div>
          )}

          {/* ── REPORTS ── */}
          {activeTab === "reports" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem" }}>
              {[
                { title:"Loan Volume", value:formatCurrency(metrics.volume), sub:"Total across all applications", color:"var(--accent)", icon:"💰" },
                { title:"Avg Loan Size", value:formatCurrency(Math.round(metrics.volume/applications.length)), sub:`Across ${applications.length} applications`, color:"var(--blue)", icon:"📐" },
                { title:"Approval Rate", value:`${Math.round((metrics.approved/applications.length)*100)}%`, sub:`${metrics.approved} of ${applications.length} decided`, color:"var(--green)", icon:"✅" },
                { title:"Avg Credit Score", value:metrics.avgScore, sub:"Portfolio average", color: metrics.avgScore>=740?"var(--green)":metrics.avgScore>=680?"var(--amber)":"var(--red)", icon:"📊" },
                { title:"Avg DTI", value:`${metrics.avgDTI}%`, sub:"Back-end debt-to-income", color: metrics.avgDTI>43?"var(--red)":metrics.avgDTI>36?"var(--amber)":"var(--green)", icon:"⚖️" },
                { title:"Avg LTV", value:`${metrics.avgLTV}%`, sub:"Loan-to-value ratio", color: metrics.avgLTV>90?"var(--red)":metrics.avgLTV>80?"var(--amber)":"var(--green)", icon:"🏠" },
              ].map((m,i) => (
                <div key={i} className="l-card" style={{ display:"flex", gap:"1.25rem", alignItems:"center" }}>
                  <div style={{ fontSize:"2.5rem" }}>{m.icon}</div>
                  <div>
                    <div style={{ fontSize:"0.72rem", color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.2rem" }}>{m.title}</div>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.8rem", fontWeight:700, color:m.color }}>{m.value}</div>
                    <div style={{ fontSize:"0.78rem", color:"var(--muted)", marginTop:"0.2rem" }}>{m.sub}</div>
                  </div>
                </div>
              ))}

              <div className="l-card" style={{ gridColumn:"1/-1" }}>
                <div className="l-section-label">Loan Type Breakdown</div>
                {["Conventional 30-Year Fixed","Jumbo 30-Year Fixed","FHA 30-Year Fixed","VA 30-Year Fixed"].map((type,i) => {
                  const count = applications.filter(a=>a.loanType===type).length;
                  const vol = applications.filter(a=>a.loanType===type).reduce((s,a)=>s+a.loanAmount,0);
                  if (!count && i > 1) return null;
                  return (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:"1rem", padding:"0.6rem 0", borderBottom:"1px solid #f0ebe3" }}>
                      <span style={{ fontSize:"0.875rem", flex:1 }}>{type}</span>
                      <span style={{ fontSize:"0.82rem", color:"var(--muted)", width:"40px", textAlign:"right" }}>{count || 0}</span>
                      <span className="mono" style={{ width:"120px", textAlign:"right", fontSize:"0.82rem" }}>{vol ? formatCurrency(vol) : "—"}</span>
                      <div style={{ width:"120px", height:"6px", borderRadius:"3px", background:"var(--border)", overflow:"hidden" }}>
                        <div style={{ height:"100%", borderRadius:"3px", background:"var(--accent)", width:`${applications.length?((count||0)/applications.length)*100:0}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Decision Modal */}
        {showDecisionModal && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" }}>
            <div style={{ background:"white", borderRadius:"16px", padding:"2rem", width:"460px", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
              {decisionDone ? (
                <div style={{ textAlign:"center", padding:"1rem 0" }}>
                  <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>{showDecisionModal==="approve"?"✅":showDecisionModal==="deny"?"❌":"⏸️"}</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.2rem", fontWeight:700, marginBottom:"0.5rem" }}>
                    {showDecisionModal==="approve"?"Application Approved":showDecisionModal==="deny"?"Application Denied":"Application Suspended"}
                  </div>
                  <div style={{ color:"var(--muted)", fontSize:"0.88rem", marginBottom:"1.5rem" }}>Decision recorded and borrower has been notified.</div>
                  <button className="l-btn-primary" style={{ width:"100%" }} onClick={closeDecision}>Done</button>
                </div>
              ) : (
                <>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.2rem", fontWeight:700, marginBottom:"0.25rem" }}>
                    {showDecisionModal==="approve"?"Approve Application":showDecisionModal==="deny"?"Deny Application":"Suspend Application"}
                  </div>
                  <div style={{ color:"var(--muted)", fontSize:"0.85rem", marginBottom:"1.5rem" }}>
                    {showDecisionModal==="approve"?"Set the approved rate and add any conditions.":showDecisionModal==="deny"?"Provide a reason for denial (required for ECOA compliance).":"Specify what the borrower needs to provide to continue."}
                  </div>
                  {showDecisionModal==="approve" && (
                    <div style={{ marginBottom:"1rem" }}>
                      <label style={{ display:"block", fontSize:"0.8rem", color:"var(--muted)", marginBottom:"0.35rem" }}>Approved Rate (%)</label>
                      <input className="l-input" style={{ width:"100%" }} placeholder="e.g. 6.875" value={decisionRate} onChange={e=>setDecisionRate(e.target.value)} />
                    </div>
                  )}
                  <div style={{ marginBottom:"1.5rem" }}>
                    <label style={{ display:"block", fontSize:"0.8rem", color:"var(--muted)", marginBottom:"0.35rem" }}>
                      {showDecisionModal==="approve"?"Conditions / Notes":showDecisionModal==="deny"?"Denial Reason":"Required Items"}
                    </label>
                    <textarea className="l-input" style={{ width:"100%", minHeight:"90px", resize:"vertical" }} value={decisionNote} onChange={e=>setDecisionNote(e.target.value)} placeholder="Add details..." />
                  </div>
                  <div style={{ display:"flex", gap:"0.75rem" }}>
                    <button className="l-btn-secondary" style={{ flex:1 }} onClick={closeDecision}>Cancel</button>
                    <button
                      className={showDecisionModal==="approve"?"l-btn-approve":showDecisionModal==="deny"?"l-btn-deny":"l-btn-suspend"}
                      style={{ flex:2 }}
                      onClick={() => doDecision(showDecisionModal==="approve"?"Approved":showDecisionModal==="deny"?"Denied":"Suspended")}
                    >
                      Confirm {showDecisionModal==="approve"?"Approval":showDecisionModal==="deny"?"Denial":"Suspension"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Pre-Approval Detail Modal */}
        {selectedPreApproval && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)", overflowY: "auto" }}>
            <div style={{ background:"white", borderRadius:"16px", padding:"2rem", width:"640px", maxHeight:"90vh", overflowY: "auto", boxShadow:"0 20px 60px rgba(0,0,0,0.3)", margin: "2rem auto" }}>
              {preApprovalDone ? (
                <div style={{ textAlign:"center", padding:"2rem 0" }}>
                  <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>✅</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.3rem", fontWeight:700, marginBottom:"0.5rem" }}>Decision Recorded</div>
                  <div style={{ color:"var(--muted)", fontSize:"0.9rem", marginBottom:"1.5rem" }}>The borrower will be notified of the {preApprovalDecision} decision.</div>
                  <button className="l-btn-primary" style={{ width:"100%" }} onClick={closePreApprovalModal}>Done</button>
                </div>
              ) : (
                <>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem" }}>
                    <div>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.4rem", fontWeight:700 }}>{`${selectedPreApproval.first_name || ""} ${selectedPreApproval.last_name || ""}`.trim() || "Borrower"}</div>
                      <div style={{ color:"var(--muted)", fontSize:"0.85rem" }}>{selectedPreApproval.email}</div>
                    </div>
                    <button style={{ background:"none", border:"none", fontSize:"1.5rem", cursor:"pointer" }} onClick={closePreApprovalModal}>✕</button>
                  </div>

                  <div style={{ borderTop:"1px solid var(--border)", paddingTop:"1.5rem", marginBottom:"1.5rem" }}>
                    <div style={{ fontSize:"0.7rem", textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--muted)", fontWeight:700, marginBottom:"1rem" }}>Financial Profile</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
                      {[
                        ["Annual Income", selectedPreApproval.annual_income ? formatCurrency(selectedPreApproval.annual_income) : "—"],
                        ["Purchase Price", selectedPreApproval.purchase_price ? formatCurrency(selectedPreApproval.purchase_price) : "—"],
                        ["Down Payment %", `${selectedPreApproval.down_payment_pct || "—"}%`],
                        ["Loan Type", selectedPreApproval.loan_type || "—"],
                        ["Credit Score", selectedPreApproval.credit_score_range || "—"],
                        ["Employment", selectedPreApproval.employment_type || "—"],
                      ].map(([k, v], i) => (
                        <div key={i} style={{ padding:"0.75rem", background:"var(--surface)", borderRadius:"8px" }}>
                          <div style={{ fontSize:"0.7rem", color:"var(--muted)", marginBottom:"0.25rem" }}>{k}</div>
                          <div style={{ fontWeight:700, color:"var(--text)" }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ borderTop:"1px solid var(--border)", paddingTop:"1.5rem", marginBottom:"1.5rem" }}>
                    <div style={{ fontSize:"0.7rem", textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--muted)", fontWeight:700, marginBottom:"1rem" }}>Contact & Property</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
                      {[
                        ["Phone", selectedPreApproval.phone || "—"],
                        ["Date of Birth", selectedPreApproval.date_of_birth ? new Date(selectedPreApproval.date_of_birth).toLocaleDateString() : "—"],
                        ["Property Type", selectedPreApproval.property_type || "—"],
                        ["Occupancy", selectedPreApproval.occupancy || "—"],
                        ["Current Housing", selectedPreApproval.current_housing || "—"],
                        ["Purchase Timeline", selectedPreApproval.purchase_timeline || "—"],
                      ].map(([k, v], i) => (
                        <div key={i} style={{ padding:"0.75rem", background:"var(--surface)", borderRadius:"8px" }}>
                          <div style={{ fontSize:"0.7rem", color:"var(--muted)", marginBottom:"0.25rem" }}>{k}</div>
                          <div style={{ fontWeight:700, color:"var(--text)" }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ borderTop:"1px solid var(--border)", paddingTop:"1.5rem", marginBottom:"1.5rem" }}>
                    <div style={{ fontSize:"0.7rem", textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--muted)", fontWeight:700, marginBottom:"1rem" }}>Debts & Assets</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
                      {[
                        ["Auto Loan", selectedPreApproval.debt_car_loan ? formatCurrency(selectedPreApproval.debt_car_loan) : "—"],
                        ["Student Loans", selectedPreApproval.debt_student_loan ? formatCurrency(selectedPreApproval.debt_student_loan) : "—"],
                        ["Credit Cards", selectedPreApproval.debt_credit_card ? formatCurrency(selectedPreApproval.debt_credit_card) : "—"],
                        ["Checking Balance", selectedPreApproval.checking_balance ? formatCurrency(selectedPreApproval.checking_balance) : "—"],
                        ["Savings Balance", selectedPreApproval.savings_balance ? formatCurrency(selectedPreApproval.savings_balance) : "—"],
                        ["Retirement", selectedPreApproval.retirement_balance ? formatCurrency(selectedPreApproval.retirement_balance) : "—"],
                      ].map(([k, v], i) => (
                        <div key={i} style={{ padding:"0.75rem", background:"var(--surface)", borderRadius:"8px" }}>
                          <div style={{ fontSize:"0.7rem", color:"var(--muted)", marginBottom:"0.25rem" }}>{k}</div>
                          <div style={{ fontWeight:700, color:"var(--text)" }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {!preApprovalDecision ? (
                    <div style={{ display:"flex", gap:"0.75rem" }}>
                      <button className="l-btn-deny" style={{ flex:1 }} onClick={() => setPreApprovalDecision("deny")}>✕ Reject</button>
                      <button className="l-btn-approve" style={{ flex:1 }} onClick={() => setPreApprovalDecision("approve")}>✓ Approve Pre-Approval</button>
                    </div>
                  ) : (
                    <div style={{ borderTop:"1px solid var(--border)", paddingTop:"1.5rem" }}>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.1rem", fontWeight:700, marginBottom:"1rem" }}>
                        {preApprovalDecision === "approve" ? "Set Pre-Approval Amount" : "Provide Rejection Reason"}
                      </div>
                      {preApprovalDecision === "approve" && (
                        <div style={{ marginBottom:"1rem" }}>
                          <label style={{ display:"block", fontSize:"0.8rem", color:"var(--muted)", marginBottom:"0.35rem" }}>Pre-Approval Amount ($) *</label>
                          <input className="l-input" style={{ width:"100%", fontSize:"1rem" }} placeholder="e.g. 350000" value={preApprovalAmount} onChange={e=>setPreApprovalAmount(e.target.value)} type="number" />
                        </div>
                      )}
                      <div style={{ marginBottom:"1.5rem" }}>
                        <label style={{ display:"block", fontSize:"0.8rem", color:"var(--muted)", marginBottom:"0.35rem" }}>
                          {preApprovalDecision === "approve" ? "Conditions / Notes" : "Rejection Reason *"}
                        </label>
                        <textarea className="l-input" style={{ width:"100%", minHeight:"100px", resize:"vertical" }} value={preApprovalConditions} onChange={e=>setPreApprovalConditions(e.target.value)} placeholder="Add details..." />
                      </div>
                      <div style={{ display:"flex", gap:"0.75rem" }}>
                        <button className="l-btn-secondary" style={{ flex:1 }} onClick={() => { setPreApprovalDecision(null); setPreApprovalAmount(""); setPreApprovalConditions(""); }}>Back</button>
                        <button
                          className={preApprovalDecision === "approve" ? "l-btn-approve" : "l-btn-deny"}
                          style={{ flex:2 }}
                          onClick={() => doPreApprovalDecision(preApprovalDecision)}
                        >
                          Confirm {preApprovalDecision === "approve" ? "Approval" : "Rejection"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}




// =============================================
// INVITE ACCEPT PAGE
// =============================================


export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [clientOnboarded, setClientOnboarded] = useState(false);
  const [mode, setMode] = useState("buyer");
  const [activeTab, setActiveTab] = useState(0);
  const [ownerTab, setOwnerTab] = useState(0);
  const [showLoanApp, setShowLoanApp] = useState(false);
  const [loanAppComplete, setLoanAppComplete] = useState(false);
  const liveRates = useLiveRates();

  // Check for invite token in URL
  const inviteToken = new URLSearchParams(window.location.search).get("invite");

  useEffect(() => {
    let initialized = false;
    // Check for existing session on load first
    supabase.auth.getSession().then(({ data: { session } }) => {
      initialized = true;
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setAuthLoading(false);
    });
    // Only listen for SUBSEQUENT auth changes (sign in / sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!initialized) return; // skip the initial event, handled by getSession above
      if (event === "SIGNED_OUT") {
        setSession(null); setProfile(null); setClientOnboarded(false); setAuthLoading(false);
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setSession(session);
        if (session) loadProfile(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) {
      console.error("loadProfile error:", error);
      setAuthLoading(false);
      return;
    }
    if (!data) {
      console.warn("No profile found for user", userId);
      const fallbackRole = session?.user?.app_metadata?.role || session?.user?.user_metadata?.role || "buyer";
      setProfile({
        id: userId,
        role: fallbackRole,
        email: session?.user?.email || "",
        name: session?.user?.email?.split("@")[0] || "",
      });
      setAuthLoading(false);
      return;
    }
    setProfile(data);
    // All buyers go to main platform — PreApprovalSection shows form or Under Review based on profile
    setAuthLoading(false);
  };

  const handleLogin = (sess) => {
    // Used by demo login fallback only and by AuthScreen after sign in
    if (!sess) return;
    setSession(sess);
    const userId = sess.session?.user?.id || sess.user?.id;
    if (userId) loadProfile(userId);
    if (sess.type === "client" && sess.user?.onboarded) setClientOnboarded(true);
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null); setProfile(null); setClientOnboarded(false);
    setShowLoanApp(false); setLoanAppComplete(false);
  };
  const handleOnboardingComplete = async (form) => {
    // Mark profile as onboarded in Supabase
    if (session?.user?.id) {
      await supabase.from("profiles").update({ onboarded: true }).eq("id", session.user.id);
    }
    setClientOnboarded(true);
  };

  // Invite link — show accept page regardless of auth state
  if (inviteToken && !authLoading) return (
    <InviteAcceptPage
      token={inviteToken}
      onAccepted={() => {
        // Clear the invite token from URL — keep clientOnboarded false so wizard shows
        window.history.replaceState({}, "", "/");
        setClientOnboarded(false);
      }}
    />
  );

  // Loading state while checking auth
  if (authLoading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f8f5f0", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.5rem", fontWeight:800, background:"linear-gradient(135deg,#c2714f,#a85c3a)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:"1rem" }}>HomeStart</div>
        <div style={{ color:"#8a7968", fontSize:"0.9rem" }}>Loading...</div>
      </div>
    </div>
  );

  // Not logged in → show landing/auth
  // 1. Not logged in -> show landing/auth
  if (!session && !authLoading) return <AuthScreen onLogin={handleLogin} />;

  // 2. Logged in BUT profile not yet loaded -> show loading
  if (session && !profile) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f8f5f0", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.5rem", fontWeight:800, background:"linear-gradient(135deg,#c2714f,#a85c3a)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:"1rem" }}>HomeStart</div>
        <div style={{ color:"#8a7968", fontSize:"0.9rem" }}>Fetching your professional profile...</div>
      </div>
    </div>
  );
  
  // 3. Global loading state for initial auth check
  if (authLoading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f8f5f0" }}>
       {/* Simple Loading Spinner or Text */}
    </div>
  );

  // Determine role — from Supabase profile, user metadata, or fallback
  const normalizeRole = (value) => {
    const lower = (value || "").toString().toLowerCase();
    if (lower.includes("lend") || lower.includes("loan") || lower.includes("officer") || lower.includes("admin")) return "lender";
    if (lower.includes("real") || lower.includes("realtor") || lower.includes("agent")) return "realtor";
    return "buyer";
  };

  const role = normalizeRole(
    profile?.role || profile?.user_type || profile?.type || session?.user?.app_metadata?.role || session?.user?.user_metadata?.role
  );
  const user = { ...profile };

  // Lender → show lender portal
  if (role === "lender") return <LenderPortal user={user} onLogout={handleLogout} />;

  // Realtor → show realtor portal
  if (role === "realtor") return <RealtorPortal user={user} onLogout={handleLogout} />;

  // New buyers go straight to the main platform — PreApprovalSection handles first-time submission

  // Client onboarded → show main platform
  const NAV_ITEMS = BUYER_TABS;
  const TAB_TITLES = BUYER_TITLES;
  const currentTab = activeTab;
  const setCurrentTab = setActiveTab;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        :root {
          --bg: #f8f5f0;
          --surface: #f2ede6;
          --card: #ffffff;
          --card-bg-2: #faf8f5;
          --border: #e8e0d6;
          --accent: #c2714f;
          --accent2: #a85c3a;
          --text: #2d2418;
          --muted: #8a7968;
          --green: #3d7d5a;
          --green-bg: #edf5f0;
          --red: #c0392b;
          --amber: #c27a1a;
          --amber-bg: #fdf4e3;
          --blue: #2f6fa8;
          --blue-bg: #eaf2fb;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; min-height: 100vh; }

        .app { min-height: 100vh; }

        header {
          padding: 1rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border);
          background: rgba(248,245,240,0.96);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 100;
          gap: 1rem;
        }

        .logo {
          font-family: 'Playfair Display', serif;
          font-size: 1.45rem;
          font-weight: 800;
          color: var(--accent);
          letter-spacing: -0.02em;
          white-space: nowrap;
        }

        .logo span {
          color: var(--muted);
          font-weight: 400;
          font-size: 0.85rem;
          margin-left: 0.5rem;
          font-family: 'DM Sans', sans-serif;
        }

        nav { display: flex; gap: 0.15rem; flex-wrap: wrap; }

        .nav-btn {
          padding: 0.45rem 0.85rem;
          border: none;
          background: transparent;
          color: var(--muted);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          border-radius: 7px;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .nav-btn:hover { color: var(--text); background: var(--surface); }
        .nav-btn.active { color: var(--accent); background: #fbeee8; font-weight: 600; }

        .hero {
          background: linear-gradient(135deg, #fdf6ee 0%, #fbeee8 50%, #f5ede0 100%);
          padding: 4rem 2rem;
          text-align: center;
          position: relative;
          overflow: hidden;
          border-bottom: 1px solid var(--border);
        }

        .hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 70% 60% at 50% 0%, rgba(194,113,79,0.08), transparent);
        }

        .hero h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.1;
          position: relative;
          margin-bottom: 1rem;
          color: var(--text);
        }

        .hero h1 em { font-style: normal; color: var(--accent); }

        .hero p {
          color: var(--muted);
          font-size: 1.1rem;
          max-width: 500px;
          margin: 0 auto 2rem;
          position: relative;
        }

        .hero-btns { display: flex; gap: 1rem; justify-content: center; position: relative; }

        main { padding: 2rem; max-width: 1200px; margin: 0 auto; }

        .tab-header {
          display: flex;
          align-items: baseline;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .tab-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.8rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text);
        }

        .tab-sub { color: var(--muted); font-size: 0.9rem; }

        .card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 1.5rem;
          box-shadow: 0 1px 4px rgba(44,32,18,0.05);
        }

        .hero-card {
          background: linear-gradient(135deg, #fbeee8, #fdf4ec);
          border-color: #e8c4b0;
          text-align: center;
        }

        .hero-label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin-bottom: 0.5rem; }
        .hero-number { font-family: 'Playfair Display', serif; font-size: 2.8rem; font-weight: 800; color: var(--accent); line-height: 1; }
        .hero-sub { font-size: 0.85rem; color: var(--muted); margin-top: 0.5rem; }

        .section-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin-bottom: 1rem; }

        .input-group { margin-bottom: 1.25rem; }
        .input-group label { display: block; font-size: 0.85rem; color: var(--muted); margin-bottom: 0.4rem; font-weight: 500; }

        .input-row { display: flex; align-items: center; gap: 1rem; }
        .input-row input[type=range] { flex: 1; accent-color: var(--accent); height: 4px; cursor: pointer; }
        .val { font-weight: 700; font-size: 0.9rem; min-width: 90px; text-align: right; color: var(--text); }

        .breakdown-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f0ebe3;
          font-size: 0.9rem;
          color: var(--muted);
        }
        .breakdown-row:last-child { border-bottom: none; }
        .breakdown-row span:last-child { color: var(--text); font-weight: 500; }
        .breakdown-row.bold span { font-weight: 700; color: var(--text) !important; }
        .breakdown-row .green { color: var(--green) !important; }
        .breakdown-row .red { color: var(--red) !important; }

        .dti-bar-wrap { margin-top: 1rem; }
        .dti-label { font-size: 0.85rem; margin-bottom: 0.4rem; }
        .bar-track { height: 8px; background: var(--surface); border-radius: 4px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 4px; transition: all 0.5s; }
        .dti-markers { display: flex; font-size: 0.7rem; color: var(--muted); margin-top: 0.25rem; }

        .home-card { cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
        .home-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(44,32,18,0.1); }
        .home-emoji { font-size: 2.5rem; text-align: center; margin-bottom: 0.75rem; }
        .home-price { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 700; color: var(--accent); }
        .home-address { font-weight: 600; font-size: 0.9rem; margin-top: 0.25rem; color: var(--text); }
        .home-city { color: var(--muted); font-size: 0.8rem; }
        .home-details { display: flex; gap: 0.4rem; font-size: 0.8rem; color: var(--muted); margin-top: 0.5rem; align-items: center; }
        .dot { color: var(--border); }
        .home-monthly { font-size: 0.85rem; color: var(--green); font-weight: 600; margin-top: 0.4rem; }

        .loan-card { transition: border-color 0.2s; }
        .loan-card:hover { border-color: #d4a090; }

        .loan-badge {
          position: absolute;
          top: -1px;
          right: 1rem;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          color: white;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 0.25rem 0.6rem;
          border-radius: 0 0 6px 6px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #c2714f, #a85c3a);
          color: white;
          border: none;
          padding: 0.6rem 1.4rem;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
          white-space: nowrap;
        }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }

        .btn-secondary {
          background: white;
          color: var(--text);
          border: 1px solid var(--border);
          padding: 0.6rem 1.4rem;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }
        .btn-secondary:hover { background: var(--surface); border-color: #d4c8bc; }

        .field label { display: block; font-size: 0.8rem; color: var(--muted); margin-bottom: 0.4rem; font-weight: 500; }

        .text-input {
          width: 100%;
          background: #faf8f5;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.65rem 0.85rem;
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .text-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(194,113,79,0.1); }

        select.text-input { cursor: pointer; }
      `}</style>

      <div className="app">
        <header>
          <div className="logo">HomeStart<span>Mortgage Platform</span></div>

          <nav>
            {NAV_ITEMS.map((item, i) => (
              <button key={i} className={`nav-btn${currentTab === i ? " active" : ""}`} onClick={() => setCurrentTab(i)}>{item}</button>
            ))}
          </nav>

          {/* User chip */}
          <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginLeft:"1rem" }}>
            <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:"linear-gradient(135deg,#c2714f,#a85c3a)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:"0.75rem", flexShrink:0, color:"white" }}>
              {(user?.name || session?.user?.email || "?").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
            </div>
            <button onClick={handleLogout} style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:"0.8rem" }}>Sign Out</button>
          </div>
        </header>

        {/* Live Rates Ticker */}
        <div style={{
          background: "#ffffff",
          borderBottom: "1px solid var(--border)",
          padding: "0.5rem 2rem",
          display: "flex",
          alignItems: "center",
          gap: "2rem",
          fontSize: "0.8rem",
          overflowX: "auto",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: liveRates.loading ? "#d4901a" : liveRates.error ? "#c0392b" : "#3d7d5a", display: "inline-block", boxShadow: liveRates.loading ? "0 0 6px #d4901a" : liveRates.error ? "0 0 6px #c0392b" : "0 0 6px #3d7d5a" }} />
            <span style={{ color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {liveRates.loading ? "Fetching rates..." : liveRates.error ? "Estimated rates" : "Live rates"}
            </span>
            {liveRates.asOf && <span style={{ color: "var(--muted)", opacity: 0.6 }}>· {liveRates.asOf}</span>}
          </div>
          {liveRates.products.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: "0.4rem", alignItems: "baseline", flexShrink: 0 }}>
              <span style={{ color: "var(--muted)" }}>{p.name}</span>
              <span style={{ fontWeight: 700, color: p.rate ? "var(--accent)" : "var(--muted)" }}>
                {p.rate ? `${p.rate}%` : "—"}
              </span>
            </div>
          ))}
          {liveRates.error && <span style={{ color: "var(--red)", fontSize: "0.75rem" }}>({liveRates.error})</span>}
          <div style={{ marginLeft: "auto", flexShrink: 0 }}>
            <span style={{ color: "var(--muted)", fontSize: "0.72rem" }}>Source: Freddie Mac PMMS via FRED</span>
          </div>
        </div>

        {/* Under Contract Banner — shown when client is under contract and hasn't submitted loan app */}
        {session?.user?.status === "Under Contract" && !loanAppComplete && (
          <div style={{ background:"linear-gradient(135deg,#eaf2fb,#f0f7ff)", borderBottom:"1px solid rgba(47,111,168,0.2)", padding:"1rem 2rem", display:"flex", alignItems:"center", gap:"1.25rem" }}>
            <div style={{ fontSize:"1.8rem", flexShrink:0 }}>🏡</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:"0.95rem", color:"var(--blue)" }}>You're Under Contract — Time to Start Your Loan Application!</div>
              <div style={{ fontSize:"0.83rem", color:"var(--muted)", marginTop:"0.15rem" }}>Your realtor has uploaded the purchase contract. Complete your loan application to keep things moving toward closing.</div>
            </div>
            <button className="btn-primary" style={{ background:"linear-gradient(135deg,#2f6fa8,#1e5a8a)", whiteSpace:"nowrap", flexShrink:0 }} onClick={() => setShowLoanApp(true)}>
              Start Loan Application →
            </button>
          </div>
        )}

        {/* Loan Application Wizard (modal overlay) */}
        {showLoanApp && (
          <LoanApplicationWizard
            user={session.user}
            onComplete={() => { setShowLoanApp(false); setLoanAppComplete(true); }}
            onDismiss={() => setShowLoanApp(false)}
          />
        )}

        {/* Loan App Submitted Confirmation Banner */}
        {loanAppComplete && (
          <div style={{ background:"linear-gradient(135deg,#edf5f0,#f0f7f3)", borderBottom:"1px solid rgba(61,125,90,0.2)", padding:"0.75rem 2rem", display:"flex", alignItems:"center", gap:"1rem" }}>
            <span style={{ color:"var(--green)", fontSize:"1.1rem" }}>✓</span>
            <span style={{ fontSize:"0.88rem", color:"var(--green)", fontWeight:600 }}>Loan application submitted — your loan officer will be in touch within 1–2 business days.</span>
          </div>
        )}



        <main>
          <div className="tab-header">
            <div className="tab-title">{TAB_TITLES[currentTab]}</div>
          </div>
          {activeTab === 0 && <PreApprovalSection user={user} profile={profile} />}
          {activeTab === 1 && <GradeMyRateSection liveRates={liveRates} />}
        </main>
      </div>
    </>
  );
}
