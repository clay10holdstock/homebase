import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { formatCurrency } from "../utils/loanUtils.js";

export default function PreApprovalSection({ user, profile }) {
  const alreadySubmitted = !!profile?.pre_approval_status;
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(alreadySubmitted);
  const [submittedData, setSubmittedData] = useState(null);

  const [form, setForm] = useState({
    // Step 1 — Personal
    firstName: (user?.name || "").split(" ")[0] || "",
    lastName:  (user?.name || "").split(" ").slice(1).join(" ") || "",
    email:     user?.email || "",
    phone:     user?.phone || "",
    dob:       "",
    ssnLast4:  "",
    citizenship: "US Citizen",
    currentHousing: "Renting",
    monthlyHousingPayment: "",
    // Step 2 — Employment & Income
    employmentType: "Full-Time Salaried",
    employer: "", jobTitle: "", jobYears: "",
    annualIncome: "", otherIncome: "", otherIncomeSource: "",
    hasCoApplicant: false,
    coFirstName: "", coLastName: "",
    coEmploymentType: "Full-Time Salaried",
    coEmployer: "", coJobTitle: "", coAnnualIncome: "",
    // Step 3 — Monthly Debts
    debtCarLoan: "", debtStudentLoan: "", debtCreditCard: "",
    debtPersonalLoan: "", debtOther: "",
    // Step 4 — Assets
    checkingBalance: "", savingsBalance: "",
    retirementBalance: "", otherAssets: "",
    giftFunds: false, giftFundsAmount: "",
    // Step 5 — Property & Goals
    propPrice: "", downPct: "20", propType: "Single Family",
    occupancy: "Primary Residence",
    loanType: "Conventional 30-Year Fixed",
    purchaseTimeline: "1-3 months",
    hasBankruptcy: false, hasForeclosure: false,
    creditScore: "",
  });

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const money = v => v ? "$" + parseFloat(v.replace(/[^0-9.]/g, "")).toLocaleString() : "";
  const parseNum = v => parseFloat((v || "0").replace(/[^0-9.]/g, "")) || null;

  const Field = ({ label, col2, children }) => (
    <div style={{ gridColumn: col2 ? "1/-1" : "auto" }}>
      <label style={{ display:"block", fontSize:"0.8rem", color:"var(--muted)", marginBottom:"0.35rem", fontWeight:500 }}>{label}</label>
      {children}
    </div>
  );
  const Input = ({ k, placeholder, type="text" }) => (
    <input className="text-input" type={type} value={form[k]} onChange={e=>upd(k,e.target.value)} placeholder={placeholder} />
  );
  const Select = ({ k, opts }) => (
    <select className="text-input" value={form[k]} onChange={e=>upd(k,e.target.value)}>
      {opts.map(o => <option key={o}>{o}</option>)}
    </select>
  );
  const Divider = ({ label }) => (
    <div style={{ gridColumn:"1/-1", borderTop:"1px solid var(--border)", paddingTop:"1rem", marginTop:"0.25rem", fontSize:"0.72rem", textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--muted)", fontWeight:700 }}>{label}</div>
  );

  const STEPS = [
    { title:"Personal Information",    icon:"👤", desc:"Tell us about yourself" },
    { title:"Employment & Income",     icon:"💼", desc:"Your job and earnings" },
    { title:"Monthly Debts",           icon:"📊", desc:"Existing obligations" },
    { title:"Assets & Savings",        icon:"🏦", desc:"What you have saved" },
    { title:"Property & Loan Goals",   icon:"🏠", desc:"What you're looking for" },
  ];

  const stepContent = [
    // ── Step 1: Personal ────────────────────────────────────────────────────
    <div key="s1" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
      <Field label="First Name"><Input k="firstName" placeholder="Jane" /></Field>
      <Field label="Last Name"><Input k="lastName" placeholder="Smith" /></Field>
      <Field label="Email Address"><Input k="email" placeholder="jane@email.com" /></Field>
      <Field label="Phone"><Input k="phone" placeholder="(555) 000-0000" /></Field>
      <Field label="Date of Birth"><Input k="dob" type="date" /></Field>
      <Field label="Last 4 of SSN">
        <input className="text-input" type="password" maxLength={4} value={form.ssnLast4} onChange={e=>upd("ssnLast4",e.target.value.replace(/\D/g,""))} placeholder="••••" />
      </Field>
      <Field label="Citizenship / Residency"><Select k="citizenship" opts={["US Citizen","Permanent Resident (Green Card)","Work Visa (H-1B, L-1, etc.)","Other"]} /></Field>
      <Field label="Current Housing"><Select k="currentHousing" opts={["Renting","Own with Mortgage","Own Free & Clear","Living with Family"]} /></Field>
      <Field label="Monthly Housing Payment" col2>
        <Input k="monthlyHousingPayment" placeholder="$1,800" />
      </Field>
      <div style={{ gridColumn:"1/-1", padding:"0.75rem 1rem", background:"rgba(47,111,168,0.07)", borderRadius:"8px", fontSize:"0.82rem", color:"var(--blue)" }}>
        🔒 Your SSN last 4 is used solely to authorize a credit inquiry. It is encrypted and never shared with third parties.
      </div>
    </div>,

    // ── Step 2: Employment & Income ─────────────────────────────────────────
    <div key="s2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
      <Divider label="Primary Applicant" />
      <Field label="Employment Type" col2><Select k="employmentType" opts={["Full-Time Salaried","Full-Time Hourly","Part-Time","Self-Employed / 1099","Contractor","Retired","Other"]} /></Field>
      <Field label="Employer / Company"><Input k="employer" placeholder="Acme Corp" /></Field>
      <Field label="Job Title"><Input k="jobTitle" placeholder="Software Engineer" /></Field>
      <Field label="Years at Current Job"><Input k="jobYears" placeholder="3.5" /></Field>
      <Field label="Annual Gross Income"><Input k="annualIncome" placeholder="$85,000" /></Field>
      <Field label="Other Monthly Income"><Input k="otherIncome" placeholder="$0" /></Field>
      <Field label="Other Income Source"><Input k="otherIncomeSource" placeholder="Rental income, alimony, etc." /></Field>
      <div style={{ gridColumn:"1/-1", borderTop:"1px solid var(--border)", paddingTop:"1rem" }}>
        <label style={{ display:"flex", alignItems:"center", gap:"0.75rem", cursor:"pointer", fontSize:"0.9rem", fontWeight:500 }}>
          <input type="checkbox" checked={form.hasCoApplicant} onChange={e=>upd("hasCoApplicant",e.target.checked)} style={{ width:"16px", height:"16px" }} />
          Add a spouse or co-applicant
        </label>
      </div>
      {form.hasCoApplicant && <>
        <Divider label="Co-Applicant" />
        <Field label="First Name"><Input k="coFirstName" placeholder="John" /></Field>
        <Field label="Last Name"><Input k="coLastName" placeholder="Smith" /></Field>
        <Field label="Employment Type" col2><Select k="coEmploymentType" opts={["Full-Time Salaried","Full-Time Hourly","Part-Time","Self-Employed / 1099","Contractor","Retired","Other"]} /></Field>
        <Field label="Employer"><Input k="coEmployer" placeholder="Corp Inc" /></Field>
        <Field label="Job Title"><Input k="coJobTitle" placeholder="Teacher" /></Field>
        <Field label="Annual Gross Income"><Input k="coAnnualIncome" placeholder="$65,000" /></Field>
      </>}
    </div>,

    // ── Step 3: Monthly Debts ───────────────────────────────────────────────
    <div key="s3" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
      <Field label="Car Loan / Auto Payment"><Input k="debtCarLoan" placeholder="$0 / month" /></Field>
      <Field label="Student Loan Payment"><Input k="debtStudentLoan" placeholder="$0 / month" /></Field>
      <Field label="Credit Card Minimums"><Input k="debtCreditCard" placeholder="$0 / month" /></Field>
      <Field label="Personal Loan Payment"><Input k="debtPersonalLoan" placeholder="$0 / month" /></Field>
      <Field label="Other Monthly Debt" col2><Input k="debtOther" placeholder="$0 / month" /></Field>
      <div style={{ gridColumn:"1/-1" }}>
        {(() => {
          const total = [form.debtCarLoan, form.debtStudentLoan, form.debtCreditCard, form.debtPersonalLoan, form.debtOther]
            .map(v => parseFloat((v||"0").replace(/[^0-9.]/g,""))||0).reduce((a,b)=>a+b,0);
          const monthlyIncome = (parseNum(form.annualIncome)||0) / 12;
          const dti = monthlyIncome > 0 ? Math.round((total / monthlyIncome) * 100) : null;
          return total > 0 ? (
            <div style={{ padding:"0.85rem 1rem", background: dti > 43 ? "rgba(192,57,43,0.07)" : dti > 36 ? "rgba(194,122,26,0.07)" : "rgba(61,125,90,0.07)", borderRadius:"8px", border:`1px solid ${dti > 43 ? "rgba(192,57,43,0.2)" : dti > 36 ? "rgba(194,122,26,0.2)" : "rgba(61,125,90,0.2)"}`, fontSize:"0.85rem", color: dti > 43 ? "var(--red)" : dti > 36 ? "var(--amber)" : "var(--green)" }}>
              Total monthly debt: <strong>{formatCurrency(total)}/mo</strong>
              {dti !== null && <span style={{ marginLeft:"1rem" }}>Estimated back-end DTI: <strong>{dti}%</strong> {dti <= 36 ? "✓ Good" : dti <= 43 ? "⚠ Borderline" : "✗ High"}</span>}
            </div>
          ) : null;
        })()}
      </div>
      <div style={{ gridColumn:"1/-1", padding:"0.75rem 1rem", background:"var(--surface)", borderRadius:"8px", fontSize:"0.82rem", color:"var(--muted)" }}>
        💡 List minimum required monthly payments only — not extra amounts you voluntarily pay.
      </div>
    </div>,

    // ── Step 4: Assets ──────────────────────────────────────────────────────
    <div key="s4" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
      <Field label="Checking Account Balance"><Input k="checkingBalance" placeholder="$8,000" /></Field>
      <Field label="Savings Account Balance"><Input k="savingsBalance" placeholder="$40,000" /></Field>
      <Field label="Retirement / 401(k) / IRA"><Input k="retirementBalance" placeholder="$80,000" /></Field>
      <Field label="Other Assets (stocks, etc.)"><Input k="otherAssets" placeholder="$0" /></Field>
      <div style={{ gridColumn:"1/-1", borderTop:"1px solid var(--border)", paddingTop:"1rem" }}>
        <label style={{ display:"flex", alignItems:"center", gap:"0.75rem", cursor:"pointer", fontSize:"0.9rem", fontWeight:500 }}>
          <input type="checkbox" checked={form.giftFunds} onChange={e=>upd("giftFunds",e.target.checked)} style={{ width:"16px", height:"16px" }} />
          I am receiving gift funds toward my down payment
        </label>
      </div>
      {form.giftFunds && <Field label="Gift Fund Amount" col2><Input k="giftFundsAmount" placeholder="$10,000" /></Field>}
      {form.giftFunds && (
        <div style={{ gridColumn:"1/-1", padding:"0.75rem 1rem", background:"rgba(194,122,26,0.07)", borderRadius:"8px", fontSize:"0.82rem", color:"var(--amber)" }}>
          ⚠ Gift funds require a signed gift letter from the donor. Your loan officer will follow up on this.
        </div>
      )}
      <div style={{ gridColumn:"1/-1" }}>
        {(() => {
          const liquid = (parseNum(form.checkingBalance)||0) + (parseNum(form.savingsBalance)||0);
          return liquid > 0 ? (
            <div style={{ padding:"0.85rem 1rem", background:"rgba(61,125,90,0.06)", borderRadius:"8px", border:"1px solid rgba(61,125,90,0.15)", fontSize:"0.85rem", color:"var(--green)" }}>
              Total liquid assets: <strong>{formatCurrency(liquid)}</strong>
            </div>
          ) : null;
        })()}
      </div>
    </div>,

    // ── Step 5: Property & Goals ────────────────────────────────────────────
    <div key="s5" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
      <Field label="Target Purchase Price"><Input k="propPrice" placeholder="$400,000" /></Field>
      <Field label="Down Payment (%)"><Select k="downPct" opts={["3","3.5","5","10","15","20","25","30"]} /></Field>
      <Field label="Property Type"><Select k="propType" opts={["Single Family","Condo / Townhome","Multi-Family (2–4 units)","Manufactured Home"]} /></Field>
      <Field label="Intended Occupancy"><Select k="occupancy" opts={["Primary Residence","Second Home / Vacation","Investment Property"]} /></Field>
      <Field label="Loan Type"><Select k="loanType" opts={["Conventional 30-Year Fixed","Conventional 15-Year Fixed","FHA 30-Year Fixed","VA 30-Year Fixed","USDA","Jumbo","Not sure — advise me"]} /></Field>
      <Field label="Purchase Timeline"><Select k="purchaseTimeline" opts={["ASAP","1-3 months","3-6 months","6-12 months","Just exploring"]} /></Field>
      <Field label="Estimated Credit Score"><Select k="creditScore" opts={["760+","720–759","680–719","640–679","600–639","Below 600","Not sure"]} /></Field>
      <div style={{ gridColumn:"1/-1", borderTop:"1px solid var(--border)", paddingTop:"1rem" }}>
        <div style={{ fontSize:"0.78rem", textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--muted)", fontWeight:700, marginBottom:"0.75rem" }}>Credit History Disclosures</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
          <label style={{ display:"flex", alignItems:"center", gap:"0.75rem", cursor:"pointer", fontSize:"0.9rem" }}>
            <input type="checkbox" checked={form.hasBankruptcy} onChange={e=>upd("hasBankruptcy",e.target.checked)} style={{ width:"16px", height:"16px" }} />
            I have filed for bankruptcy in the last 7 years
          </label>
          <label style={{ display:"flex", alignItems:"center", gap:"0.75rem", cursor:"pointer", fontSize:"0.9rem" }}>
            <input type="checkbox" checked={form.hasForeclosure} onChange={e=>upd("hasForeclosure",e.target.checked)} style={{ width:"16px", height:"16px" }} />
            I have had a foreclosure in the last 7 years
          </label>
        </div>
      </div>
      {(form.hasBankruptcy || form.hasForeclosure) && (
        <div style={{ gridColumn:"1/-1", padding:"0.75rem 1rem", background:"rgba(194,122,26,0.07)", borderRadius:"8px", fontSize:"0.82rem", color:"var(--amber)" }}>
          ⚠ These may affect loan eligibility. Your loan officer will review your specific circumstances — many borrowers with prior events still qualify.
        </div>
      )}
      <div style={{ gridColumn:"1/-1", padding:"0.75rem 1rem", background:"rgba(61,125,90,0.06)", borderRadius:"8px", fontSize:"0.82rem", color:"var(--green)", borderLeft:"3px solid var(--green)" }}>
        ✓ By submitting you authorize HomeStart to perform a soft credit inquiry. A hard inquiry will only occur with your explicit consent before final approval.
      </div>
    </div>,
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const userId = user?.id;
      if (!userId) throw new Error("Not logged in");

      const { error: appErr } = await supabase
        .from("pre_approval_applications")
        .upsert({
          user_id: userId,
          assigned_lender_id: "bdf8864e-5765-4926-8fbe-6dbbff862015",
          status: "under_review",
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          phone: form.phone || null,
          date_of_birth: form.dob || null,
          ssn_last4: form.ssnLast4 || null,
          citizenship: form.citizenship,
          current_housing: form.currentHousing,
          monthly_housing_payment: parseNum(form.monthlyHousingPayment),
          employment_type: form.employmentType,
          employer: form.employer || null,
          job_title: form.jobTitle || null,
          job_years: form.jobYears || null,
          annual_income: parseNum(form.annualIncome),
          other_income: parseNum(form.otherIncome),
          other_income_source: form.otherIncomeSource || null,
          has_co_applicant: form.hasCoApplicant,
          co_first_name: form.hasCoApplicant ? form.coFirstName : null,
          co_last_name: form.hasCoApplicant ? form.coLastName : null,
          co_employment_type: form.hasCoApplicant ? form.coEmploymentType : null,
          co_employer: form.hasCoApplicant ? form.coEmployer : null,
          co_job_title: form.hasCoApplicant ? form.coJobTitle : null,
          co_income: form.hasCoApplicant ? parseNum(form.coAnnualIncome) : null,
          debt_car_loan: parseNum(form.debtCarLoan),
          debt_student_loan: parseNum(form.debtStudentLoan),
          debt_credit_card: parseNum(form.debtCreditCard),
          debt_personal_loan: parseNum(form.debtPersonalLoan),
          debt_other: parseNum(form.debtOther),
          checking_balance: parseNum(form.checkingBalance),
          savings_balance: parseNum(form.savingsBalance),
          retirement_balance: parseNum(form.retirementBalance),
          other_assets: parseNum(form.otherAssets),
          gift_funds: form.giftFunds,
          gift_funds_amount: form.giftFunds ? parseNum(form.giftFundsAmount) : null,
          purchase_price: parseNum(form.propPrice),
          property_type: form.propType,
          down_payment_pct: parseFloat(form.downPct) || null,
          occupancy: form.occupancy,
          loan_type: form.loanType,
          purchase_timeline: form.purchaseTimeline,
          credit_score_range: form.creditScore,
          has_bankruptcy: form.hasBankruptcy,
          has_foreclosure: form.hasForeclosure,
        }, { onConflict: "user_id" });

      if (appErr) throw appErr;

      await supabase.from("profiles").update({
        pre_approval_status: "under_review",
        pre_approval_submitted_at: new Date().toISOString(),
        onboarded: true,
      }).eq("id", userId);

      await supabase.from("realtor_clients").update({
        client_status: "Pre-Approval Review",
      }).eq("client_id", userId);

      setSubmittedData({ ...form });
      setSubmitted(true);
    } catch(e) {
      console.error("Pre-approval error:", e);
      alert("Submission failed: " + (e.message || "Check console for details."));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Under Review screen ──────────────────────────────────────────────────
  if (submitted) {
    const data = submittedData || {};
    const price = parseNum(data.propPrice) || 0;
    const downPct = parseFloat(data.downPct) || 20;
    const loanAmt = price * (1 - downPct / 100);
    const annualInc = parseNum(data.annualIncome) || 0;
    const coInc = data.hasCoApplicant ? (parseNum(data.coAnnualIncome) || 0) : 0;
    const totalDebt = [data.debtCarLoan, data.debtStudentLoan, data.debtCreditCard, data.debtPersonalLoan, data.debtOther]
      .map(v => parseNum(v)||0).reduce((a,b)=>a+b,0);
    const monthlyIncome = (annualInc + coInc) / 12;
    const dti = monthlyIncome > 0 ? Math.round((totalDebt / monthlyIncome) * 100) : null;

    return (
      <div style={{ maxWidth:"680px", margin:"0 auto" }}>
        <div style={{ background:"linear-gradient(135deg,rgba(47,111,168,0.1),rgba(47,111,168,0.04))", border:"1px solid rgba(47,111,168,0.2)", borderRadius:"16px", padding:"2.5rem", textAlign:"center", marginBottom:"1.5rem" }}>
          <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>⏳</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.5rem", fontWeight:700, color:"var(--blue)", marginBottom:"0.5rem" }}>Application Under Review</div>
          <div style={{ color:"var(--muted)", fontSize:"0.9rem", lineHeight:1.7, maxWidth:"420px", margin:"0 auto" }}>
            Your pre-approval application has been submitted to your loan officer. You'll hear back within <strong>1–2 business days</strong>.
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"1.25rem" }}>
          {[
            ["Loan Amount", loanAmt > 0 ? formatCurrency(loanAmt) : "—", "var(--accent)"],
            ["Down Payment", price > 0 ? `${formatCurrency(price * downPct / 100)} (${downPct}%)` : "—", "var(--text)"],
            ["Combined Income", (annualInc + coInc) > 0 ? `${formatCurrency(annualInc + coInc)}/yr` : "—", "var(--green)"],
            ["Est. Back-End DTI", dti !== null ? `${dti}%` : "—", dti > 43 ? "var(--red)" : dti > 36 ? "var(--amber)" : "var(--green)"],
          ].map(([label, value, color], i) => (
            <div key={i} className="card" style={{ textAlign:"center", padding:"1.25rem" }}>
              <div style={{ fontSize:"0.7rem", textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--muted)", marginBottom:"0.35rem" }}>{label}</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.4rem", fontWeight:700, color }}>{value}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom:"1rem" }}>
          <div className="section-label">Submitted Details</div>
          {[
            ["Applicant", `${data.firstName || ""} ${data.lastName || ""}`.trim() || "—"],
            ["Loan Type", data.loanType || "—"],
            ["Property Type", data.propType || "—"],
            ["Occupancy", data.occupancy || "—"],
            ["Purchase Timeline", data.purchaseTimeline || "—"],
            ["Credit Score Range", data.creditScore || "—"],
            ...(data.hasCoApplicant ? [["Co-Applicant", `${data.coFirstName || ""} ${data.coLastName || ""}`.trim() || "—"]] : []),
          ].map(([k,v], i) => (
            <div key={i} className="breakdown-row"><span>{k}</span><span style={{ color:"var(--text)", fontWeight:500 }}>{v}</span></div>
          ))}
        </div>

        <div style={{ padding:"0.85rem 1rem", background:"rgba(61,125,90,0.07)", borderRadius:"10px", border:"1px solid rgba(61,125,90,0.2)", fontSize:"0.85rem", color:"var(--green)", textAlign:"center" }}>
          ✓ Your realtor has been notified. You will receive an email when a decision is made.
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth:"680px", margin:"0 auto" }}>
      {/* Progress bar */}
      <div style={{ display:"flex", gap:"0.35rem", marginBottom:"1.5rem" }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ flex:1 }}>
            <div style={{ height:"4px", borderRadius:"2px", background: i < step ? "var(--green)" : i === step ? "var(--accent)" : "var(--border)", transition:"background 0.3s", marginBottom:"0.4rem" }} />
            <div style={{ fontSize:"0.65rem", color: i === step ? "var(--text)" : "var(--muted)", fontWeight: i === step ? 700 : 400, textAlign:"center", display:"none" }}>{s.title}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1.5rem" }}>
          <span style={{ fontSize:"1.5rem" }}>{STEPS[step].icon}</span>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.25rem", fontWeight:700 }}>{STEPS[step].title}</div>
            <div style={{ color:"var(--muted)", fontSize:"0.85rem" }}>{STEPS[step].desc} · Step {step+1} of {STEPS.length}</div>
          </div>
        </div>

        {stepContent[step]}

        <div style={{ display:"flex", gap:"1rem", marginTop:"2rem", justifyContent:"space-between", borderTop:"1px solid var(--border)", paddingTop:"1.25rem" }}>
          <div>{step > 0 && <button className="btn-secondary" onClick={() => setStep(s => s - 1)}>← Back</button>}</div>
          <div>
            {step < STEPS.length - 1
              ? <button className="btn-primary" onClick={() => setStep(s => s + 1)}>Continue →</button>
              : <button className="btn-primary" style={{ opacity:submitting?0.7:1, background:"linear-gradient(135deg,var(--green),#2d6648)" }} disabled={submitting} onClick={handleSubmit}>
                  {submitting ? "Submitting..." : "Submit Application ✦"}
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}


