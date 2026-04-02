import { useState } from "react";

export default function LoanApplicationWizard({ user, onComplete, onDismiss }) {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    // Property
    propertyAddress: "", propertyCity: "", propertyState: "", propertyZip: "",
    propertyType: "Single Family", purchasePrice: "", closingDate: "",
    // Employment
    employerName: "", jobTitle: "", employmentType: "Full-Time Salaried",
    yearsAtJob: "", annualIncome: "", otherIncome: "", otherIncomeSource: "",
    // Assets
    checkingBalance: "", savingsBalance: "", retirementBalance: "", otherAssets: "",
    // Liabilities
    carPayment: "", studentLoan: "", creditCardMin: "", otherDebt: "",
    // Additional
    usCitizen: "Yes", firstTimeBuyer: "Yes", ownsOtherProperties: "No",
    giftFunds: "No", giftFundsAmount: "",
    notes: "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const STEPS = [
    { title:"Property Details", icon:"🏠" },
    { title:"Employment & Income", icon:"💼" },
    { title:"Assets", icon:"🏦" },
    { title:"Liabilities", icon:"📊" },
    { title:"Additional Info", icon:"📋" },
    { title:"Review & Submit", icon:"✅" },
  ];

  const handleSubmit = () => setSubmitted(true);

  const FieldRow = ({ label, children, col2 }) => (
    <div style={{ gridColumn: col2 ? "1/-1" : "auto" }}>
      <label style={{ display:"block", fontSize:"0.8rem", color:"var(--muted)", marginBottom:"0.35rem", fontWeight:500 }}>{label}</label>
      {children}
    </div>
  );

  const Input = ({ field, placeholder, type="text" }) => (
    <input type={type} className="text-input" value={form[field]} onChange={e => set(field, e.target.value)} placeholder={placeholder} />
  );

  const Select = ({ field, options }) => (
    <select className="text-input" value={form[field]} onChange={e => set(field, e.target.value)}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );

  if (submitted) return (
    <div style={{ position:"fixed", inset:0, background:"rgba(44,32,18,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, backdropFilter:"blur(4px)" }}>
      <div className="card" style={{ width:"480px", textAlign:"center", padding:"3rem 2rem" }}>
        <div style={{ fontSize:"3.5rem", marginBottom:"1rem" }}>🎉</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.5rem", fontWeight:700, marginBottom:"0.5rem" }}>Application Submitted!</div>
        <div style={{ color:"var(--muted)", fontSize:"0.9rem", lineHeight:1.7, marginBottom:"2rem" }}>
          Your loan application has been submitted. Your loan officer will review it within 1–2 business days and reach out with next steps.
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem", padding:"1rem", background:"var(--surface)", borderRadius:"10px", marginBottom:"1.5rem", textAlign:"left" }}>
          {[
            ["🔍", "Underwriting review", "1–3 business days"],
            ["🏠", "Property appraisal", "5–7 business days"],
            ["📋", "Final approval", "7–10 business days"],
            ["🔑", "Clear to close", "1–2 business days after approval"],
          ].map(([icon, label, time], i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:"0.75rem", fontSize:"0.84rem" }}>
              <span>{icon}</span>
              <span style={{ flex:1 }}>{label}</span>
              <span style={{ color:"var(--muted)", fontSize:"0.78rem" }}>{time}</span>
            </div>
          ))}
        </div>
        <button className="btn-primary" style={{ width:"100%" }} onClick={onComplete}>Back to Dashboard →</button>
      </div>
    </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(44,32,18,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, backdropFilter:"blur(4px)", overflowY:"auto", padding:"2rem 0" }}>
      <div className="card" style={{ width:"580px", maxHeight:"90vh", overflowY:"auto", position:"relative" }}>
        {/* Header */}
        <div style={{ marginBottom:"1.5rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.3rem", fontWeight:700 }}>Loan Application</div>
            <button onClick={onDismiss} style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:"1.1rem" }}>✕</button>
          </div>
          {/* Step indicators */}
          <div style={{ display:"flex", gap:"0.25rem" }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ flex:1, height:"4px", borderRadius:"2px", background: i < step ? "var(--green)" : i === step ? "var(--accent)" : "var(--border)", transition:"background 0.3s" }} />
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:"0.5rem" }}>
            <div style={{ fontSize:"0.85rem", fontWeight:600 }}>{STEPS[step].icon} {STEPS[step].title}</div>
            <div style={{ fontSize:"0.78rem", color:"var(--muted)" }}>Step {step + 1} of {STEPS.length}</div>
          </div>
        </div>

        {/* Step content */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"1.75rem" }}>
          {step === 0 && <>
            <FieldRow label="Property Address" col2><Input field="propertyAddress" placeholder="123 Main Street" /></FieldRow>
            <FieldRow label="City"><Input field="propertyCity" placeholder="Austin" /></FieldRow>
            <FieldRow label="State"><Select field="propertyState" options={["TX","CA","FL","NY","CO","WA","OR","AZ","GA","IL"]} /></FieldRow>
            <FieldRow label="Zip Code"><Input field="propertyZip" placeholder="78701" /></FieldRow>
            <FieldRow label="Property Type"><Select field="propertyType" options={["Single Family","Condo / Townhome","Multi-Family (2–4 units)","Manufactured Home"]} /></FieldRow>
            <FieldRow label="Purchase Price"><Input field="purchasePrice" placeholder="$425,000" /></FieldRow>
            <FieldRow label="Expected Closing Date"><Input field="closingDate" type="date" /></FieldRow>
          </>}

          {step === 1 && <>
            <FieldRow label="Employer / Company Name"><Input field="employerName" placeholder="Acme Corp" /></FieldRow>
            <FieldRow label="Job Title"><Input field="jobTitle" placeholder="Software Engineer" /></FieldRow>
            <FieldRow label="Employment Type"><Select field="employmentType" options={["Full-Time Salaried","Full-Time Hourly","Part-Time","Self-Employed","Contractor / 1099","Retired","Other"]} /></FieldRow>
            <FieldRow label="Years at Current Job"><Input field="yearsAtJob" placeholder="3.5" /></FieldRow>
            <FieldRow label="Annual Gross Income"><Input field="annualIncome" placeholder="$95,000" /></FieldRow>
            <FieldRow label="Other Monthly Income (optional)"><Input field="otherIncome" placeholder="$500" /></FieldRow>
            <FieldRow label="Other Income Source" col2><Input field="otherIncomeSource" placeholder="Rental income, alimony, etc." /></FieldRow>
          </>}

          {step === 2 && <>
            <FieldRow label="Checking Account Balance"><Input field="checkingBalance" placeholder="$8,500" /></FieldRow>
            <FieldRow label="Savings Account Balance"><Input field="savingsBalance" placeholder="$42,000" /></FieldRow>
            <FieldRow label="Retirement / 401(k) Balance"><Input field="retirementBalance" placeholder="$85,000" /></FieldRow>
            <FieldRow label="Other Assets (stocks, real estate, etc.)" col2><Input field="otherAssets" placeholder="$15,000" /></FieldRow>
            <div style={{ gridColumn:"1/-1", padding:"0.75rem 1rem", background:"#eaf2fb", borderRadius:"8px", fontSize:"0.82rem", color:"var(--blue)" }}>
              💡 You'll need 2+ months of bank statements to verify these balances during underwriting.
            </div>
          </>}

          {step === 3 && <>
            <FieldRow label="Car Payment / Auto Loan"><Input field="carPayment" placeholder="$0 / month" /></FieldRow>
            <FieldRow label="Student Loan Payment"><Input field="studentLoan" placeholder="$0 / month" /></FieldRow>
            <FieldRow label="Credit Card Minimum Payments"><Input field="creditCardMin" placeholder="$0 / month" /></FieldRow>
            <FieldRow label="Other Monthly Debt Obligations"><Input field="otherDebt" placeholder="$0 / month" /></FieldRow>
            <div style={{ gridColumn:"1/-1", padding:"0.75rem 1rem", background:"rgba(194,122,26,0.07)", borderRadius:"8px", fontSize:"0.82rem", color:"var(--amber)" }}>
              ⚠️ Only list minimum required monthly payments, not extra payments you choose to make.
            </div>
          </>}

          {step === 4 && <>
            <FieldRow label="Are you a US Citizen or Permanent Resident?"><Select field="usCitizen" options={["Yes","No - Visa Holder","No - Other"]} /></FieldRow>
            <FieldRow label="Is this your first home purchase?"><Select field="firstTimeBuyer" options={["Yes","No"]} /></FieldRow>
            <FieldRow label="Do you own any other properties?"><Select field="ownsOtherProperties" options={["No","Yes - Primary Residence","Yes - Investment Property"]} /></FieldRow>
            <FieldRow label="Using gift funds for down payment?"><Select field="giftFunds" options={["No","Yes"]} /></FieldRow>
            {form.giftFunds === "Yes" && <FieldRow label="Gift Fund Amount"><Input field="giftFundsAmount" placeholder="$10,000" /></FieldRow>}
            <FieldRow label="Additional notes for loan officer" col2>
              <textarea className="text-input" rows={3} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Anything your loan officer should know..." style={{ resize:"vertical" }} />
            </FieldRow>
          </>}

          {step === 5 && (
            <div style={{ gridColumn:"1/-1" }}>
              <div style={{ marginBottom:"1rem", padding:"1rem", background:"var(--surface)", borderRadius:"10px", border:"1px solid var(--border)" }}>
                <div className="section-label">Property</div>
                {[["Address", form.propertyAddress || "—"], ["City / State / Zip", [form.propertyCity, form.propertyState, form.propertyZip].filter(Boolean).join(", ") || "—"], ["Type", form.propertyType], ["Purchase Price", form.purchasePrice || "—"], ["Closing Date", form.closingDate || "—"]].map(([k,v],i) => (
                  <div key={i} className="breakdown-row"><span>{k}</span><span>{v}</span></div>
                ))}
              </div>
              <div style={{ marginBottom:"1rem", padding:"1rem", background:"var(--surface)", borderRadius:"10px", border:"1px solid var(--border)" }}>
                <div className="section-label">Employment</div>
                {[["Employer", form.employerName || "—"], ["Title", form.jobTitle || "—"], ["Type", form.employmentType], ["Annual Income", form.annualIncome || "—"]].map(([k,v],i) => (
                  <div key={i} className="breakdown-row"><span>{k}</span><span>{v}</span></div>
                ))}
              </div>
              <div style={{ marginBottom:"1.25rem", padding:"1rem", background:"var(--surface)", borderRadius:"10px", border:"1px solid var(--border)" }}>
                <div className="section-label">Assets & Liabilities</div>
                {[["Checking", form.checkingBalance || "—"], ["Savings", form.savingsBalance || "—"], ["Monthly Debt", [form.carPayment, form.studentLoan, form.creditCardMin, form.otherDebt].filter(Boolean).join(" + ") || "—"]].map(([k,v],i) => (
                  <div key={i} className="breakdown-row"><span>{k}</span><span>{v}</span></div>
                ))}
              </div>
              <div style={{ padding:"0.75rem 1rem", background:"rgba(61,125,90,0.07)", borderRadius:"8px", fontSize:"0.82rem", color:"var(--green)", marginBottom:"0.25rem" }}>
                ✓ By submitting, you authorize HomeStart to pull a hard credit inquiry and begin underwriting your loan.
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display:"flex", gap:"0.75rem", borderTop:"1px solid var(--border)", paddingTop:"1.25rem" }}>
          {step > 0 && <button className="btn-secondary" onClick={() => setStep(s => s - 1)}>← Back</button>}
          <div style={{ flex:1 }} />
          {step < STEPS.length - 1
            ? <button className="btn-primary" style={{ minWidth:"140px" }} onClick={() => setStep(s => s + 1)}>Continue →</button>
            : <button className="btn-primary" style={{ minWidth:"160px", background:"linear-gradient(135deg,var(--green),#2d6648)" }} onClick={handleSubmit}>Submit Application ✓</button>
          }
        </div>
      </div>
    </div>
  );
}



// =============================================
// GRADE MY RATE — PUBLIC LANDING (lead capture)
// =============================================

