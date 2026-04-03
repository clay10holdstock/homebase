export const PORTAL_CSS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0} body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif} :root{--bg:#f8f5f0;--card:#ffffff;--card-bg-2:#f9f7f4;--border:#e8e0d6;--accent:#c2714f;--accent2:#a85c3a;--text:#2d2418;--muted:#8a7968;--green:#3d7d5a;--red:#c0392b} .card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:1.5rem;box-shadow:0 1px 4px rgba(44,32,18,0.06)} .btn-primary{background:linear-gradient(135deg,#c2714f,#a85c3a);color:white;border:none;padding:0.6rem 1.4rem;border-radius:8px;font-family:'DM Sans',sans-serif;font-weight:600;font-size:0.9rem;cursor:pointer} .btn-secondary{background:white;color:var(--text);border:1px solid var(--border);padding:0.6rem 1.4rem;border-radius:8px;font-family:'DM Sans',sans-serif;font-weight:600;font-size:0.9rem;cursor:pointer} .section-label{font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted);margin-bottom:1rem} .breakdown-row{display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid #f0ebe3;font-size:0.9rem;color:var(--muted)} .breakdown-row span:last-child{color:var(--text);font-weight:500} .text-input{width:100%;background:#faf8f5;border:1px solid var(--border);border-radius:8px;padding:0.65rem 0.85rem;color:var(--text);font-family:'DM Sans',sans-serif;font-size:0.9rem;outline:none} .field label{display:block;font-size:0.8rem;color:var(--muted);margin-bottom:0.4rem;font-weight:500}`;

export const LENDER_CSS = `
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

export const STATUS_STEPS = [
  "Invited",
  "Account Created",
  "Documents Needed",
  "Pre-Approved",
  "Under Contract",
  "Closed",
];

export const STATUS_COLORS = {
  "Invited": "#a0927e",
  "Account Created": "var(--blue)",
  "Documents Needed": "var(--amber)",
  "Pre-Approved": "var(--green)",
  "Under Contract": "var(--accent)",
  "Closed": "var(--green)",
};


export const MOCK_DB = {
  realtors: [
    { id: "r1", email: "sarah@austinrealty.com", password: "demo", name: "Sarah Connelly", brokerage: "Austin Premier Realty", phone: "(512) 555-0182", license: "TX-589234", avatar: "SC", clients: ["c1","c2","c3"] }
  ],
  clients: [
    { id: "c1", email: "james@email.com", password: "demo", name: "James Torres", phone: "(512) 555-0291", realtorId: "r1", onboarded: true, status: "Under Contract", statusStep: 3, loanAmount: 340000, loanType: "30-Year Fixed", rate: 6.875, preApprovalDate: "2025-02-10", preApprovalExpiry: "2025-05-10", income: 92000, creditScore: 724, downPct: 10, flags: [] },
    { id: "c2", email: "priya@email.com", password: "demo", name: "Priya Sharma", phone: "(512) 555-0344", realtorId: "r1", onboarded: true, status: "Documents Needed", statusStep: 2, loanAmount: 420000, loanType: "30-Year Fixed", rate: null, preApprovalDate: null, preApprovalExpiry: null, income: 118000, creditScore: 698, downPct: 20, flags: ["Missing W2", "Bank statements needed"] },
    { id: "c3", email: "mike@email.com", password: "demo", name: "Mike Okafor", phone: "(512) 555-0417", realtorId: "r1", onboarded: false, status: "Invited", statusStep: 0, loanAmount: null, loanType: null, rate: null, preApprovalDate: null, preApprovalExpiry: null, income: null, creditScore: null, downPct: null, flags: [] },
  ],
  leads: [],
  lenders: [
    { id: "lo1", email: "admin@homestart.com", password: "demo", name: "David Chen", title: "Senior Loan Officer", nmls: "NMLS #1234567", avatar: "DC" }
  ],
  loanApplications: [
    { id: "la1", clientId: "c1", clientName: "James Torres", realtorName: "Sarah Connelly", brokerage: "Austin Premier Realty", status: "Application Review", submittedDate: "2025-03-01", loanType: "Conventional 30-Year Fixed", loanAmount: 306000, purchasePrice: 340000, downPct: 10, downAmount: 34000, ltv: 90, propertyAddress: "142 Maple Grove Dr", propertyCity: "Austin", propertyState: "TX", propertyZip: "78701", propertyType: "Single Family", closingDate: "2025-04-15", employerName: "Vertex Technologies", jobTitle: "Software Engineer", employmentType: "Full-Time Salaried", yearsAtJob: 4, annualIncome: 92000, monthlyIncome: 7667, otherIncome: 0, checkingBalance: 12400, savingsBalance: 48000, retirementBalance: 67000, carPayment: 380, studentLoan: 0, creditCardMin: 75, otherDebt: 0, totalMonthlyDebt: 455, creditScore: 724, dti: 38.2, estRate: 6.875, estMonthlyPayment: 2014, firstTimeBuyer: true, usCitizen: true, giftFunds: false, flags: [], docs: [ { name: "W-2 (2024)", status: "received" }, { name: "W-2 (2023)", status: "received" }, { name: "Pay Stubs (last 30 days)", status: "received" }, { name: "Bank Statements (2 mo)", status: "received" }, { name: "Purchase Contract", status: "received" }, { name: "Photo ID", status: "received" }, { name: "Tax Returns (2yr)", status: "pending" } ], notes: "" },
    { id: "la2", clientId: "c2", clientName: "Priya Sharma", realtorName: "Sarah Connelly", brokerage: "Austin Premier Realty", status: "Pre-Approval Review", submittedDate: "2025-02-20", loanType: "Conventional 30-Year Fixed", loanAmount: 336000, purchasePrice: 420000, downPct: 20, downAmount: 84000, ltv: 80, propertyAddress: "TBD", propertyCity: "Austin", propertyState: "TX", propertyZip: "", propertyType: "Single Family", closingDate: null, employerName: "Dell Technologies", jobTitle: "Product Manager", employmentType: "Full-Time Salaried", yearsAtJob: 6, annualIncome: 118000, monthlyIncome: 9833, otherIncome: 0, checkingBalance: 28000, savingsBalance: 95000, retirementBalance: 142000, carPayment: 0, studentLoan: 520, creditCardMin: 120, otherDebt: 0, totalMonthlyDebt: 640, creditScore: 698, dti: 32.1, estRate: 7.0, estMonthlyPayment: 2236, firstTimeBuyer: false, usCitizen: true, giftFunds: false, flags: ["Missing W2", "Bank statements needed"], docs: [ { name: "W-2 (2024)", status: "missing" }, { name: "W-2 (2023)", status: "received" }, { name: "Pay Stubs (last 30 days)", status: "received" }, { name: "Bank Statements (2 mo)", status: "missing" }, { name: "Purchase Contract", status: "n/a" }, { name: "Photo ID", status: "received" }, { name: "Tax Returns (2yr)", status: "received" } ], notes: "Borrower traveling — expects to submit missing docs by 3/10." },
    { id: "la3", clientId: "c4", clientName: "Marcus Webb", realtorName: "Marcus Webb Realty", brokerage: "Lone Star Properties", status: "Approved", submittedDate: "2025-01-15", loanType: "Jumbo 30-Year Fixed", loanAmount: 920000, purchasePrice: 1150000, downPct: 20, downAmount: 230000, ltv: 80, propertyAddress: "89 Sunset Blvd", propertyCity: "Austin", propertyState: "TX", propertyZip: "78746", propertyType: "Single Family", closingDate: "2025-03-28", employerName: "Self / Webb Capital LLC", jobTitle: "Principal", employmentType: "Self-Employed", yearsAtJob: 11, annualIncome: 340000, monthlyIncome: 28333, otherIncome: 4200, checkingBalance: 180000, savingsBalance: 620000, retirementBalance: 890000, carPayment: 1200, studentLoan: 0, creditCardMin: 400, otherDebt: 0, totalMonthlyDebt: 1600, creditScore: 791, dti: 28.4, estRate: 7.25, estMonthlyPayment: 6272, firstTimeBuyer: false, usCitizen: true, giftFunds: false, flags: [], docs: [ { name: "W-2 / K-1 (2024)", status: "received" }, { name: "W-2 / K-1 (2023)", status: "received" }, { name: "Pay Stubs / P&L", status: "received" }, { name: "Bank Statements (2 mo)", status: "received" }, { name: "Purchase Contract", status: "received" }, { name: "Photo ID", status: "received" }, { name: "Tax Returns (2yr)", status: "received" } ], notes: "Jumbo approved. Clear to close pending final appraisal." },
    { id: "la4", clientId: "c5", clientName: "Aisha Johnson", realtorName: "Diana Flores", brokerage: "Casas del Sol Realty", status: "Suspended", submittedDate: "2025-02-05", loanType: "FHA 30-Year Fixed", loanAmount: 229500, purchasePrice: 245000, downPct: 6.3, downAmount: 15500, ltv: 93.7, propertyAddress: "55 Pinecrest Ave", propertyCity: "Austin", propertyState: "TX", propertyZip: "78704", propertyType: "Condo / Townhome", closingDate: "2025-04-01", employerName: "Austin ISD", jobTitle: "Teacher", employmentType: "Full-Time Salaried", yearsAtJob: 3, annualIncome: 54000, monthlyIncome: 4500, otherIncome: 0, checkingBalance: 8200, savingsBalance: 18000, retirementBalance: 12000, carPayment: 0, studentLoan: 310, creditCardMin: 90, otherDebt: 0, totalMonthlyDebt: 400, creditScore: 631, dti: 41.8, estRate: 7.5, estMonthlyPayment: 1607, firstTimeBuyer: true, usCitizen: true, giftFunds: true, flags: ["Credit score below FHA preferred threshold", "DTI approaching limit"], docs: [ { name: "W-2 (2024)", status: "received" }, { name: "W-2 (2023)", status: "received" }, { name: "Pay Stubs (last 30 days)", status: "received" }, { name: "Bank Statements (2 mo)", status: "received" }, { name: "Gift Letter", status: "missing" }, { name: "Photo ID", status: "received" }, { name: "Tax Returns (2yr)", status: "received" } ], notes: "Suspended pending gift letter and credit explanation letter." },
  ]
};
