import React, { useState, useEffect } from "react";
import {
  Shield, GraduationCap, Home, Plane, Heart, PiggyBank, HeartPulse,
  ChevronRight, ChevronLeft, Plus, Trash2, User, Mail, Phone,
  CheckCircle2, ArrowRight, Sparkles, LayoutDashboard, RefreshCw,
  Printer, AlertTriangle, X, Info, FileText
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, PieChart, Pie, Legend
} from "recharts";
import EnterprisePdfDossier from "./frontend/src/components/Client/EnterprisePdfDossier";

/* ---------------- constants & assumptions ---------------- */
const EDU_INFLATION = 8;        // 6.5–8% band requested, education at the upper end
const MARRIAGE_INFLATION = 7;   // mid-band
const RETIREMENT_INFLATION = 7;   // 7% inflation assumption
const HOUSE_INFLATION = 7;
const TRAVEL_INFLATION = 6;
const MARRIAGE_AGE = 26.5;      // midpoint of the 25–28 "good marriage age" band
const UG_DURATION = 3.5;        // midpoint of 3–4 years
const LIFE_EXPECTANCY = 85;     // standard planning assumption for corpus longevity
const SHORT_TERM_RETURN = 8;    // blended RD/FD/SIP, short-term goals
const SHORT_TERM_MAX_YEARS = 4 + 10/12; // up to 4 yrs 10 months = short-term; 5 yrs+ = long-term
const GUARANTEED_RETURN = 6;    // guaranteed-return insurance plan, goals >5 years
const SWP_RETURN = 8;           // 8% post-retirement withdrawal-phase return
const EMERGENCY_MONTHS = 9;     // months of expenses held as an emergency buffer
const PPF_AGE_LIMIT = 35;       // PPF suggested as an additional long-term option below this age
const METROS = ["delhi","mumbai","bangalore","bengaluru","chennai","kolkata","hyderabad","pune","ahmedabad","gurgaon","gurugram","noida"];
const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));

const GOAL_META = {
  education: { label: "Child's Higher Education", Icon: GraduationCap },
  marriage:  { label: "Child's Marriage",         Icon: Heart },
  house:     { label: "Dream House",               Icon: Home },
  travel:    { label: "Foreign Trip",              Icon: Plane },
};
const TYPE_DEFAULTS = {
  education: { childClass: 8, ugCost: 800000, pgPlanned: "no", pgCost: "" },
  marriage:  { childAge: 5, cost: 1500000 },
  house:     { years: 5, cost: 4000000 },
  travel:    { years: 3, cost: 300000 },
};
let uid = 0;
const newGoal = (type = "education") => ({ id: ++uid, type, ...TYPE_DEFAULTS[type] });

const INR = (n) => "₹" + Math.round(n || 0).toLocaleString("en-IN");
const INR_L = (n) => {
  const v = n || 0;
  if (v >= 10000000) return "₹" + (v / 10000000).toFixed(2) + " Cr";
  if (v >= 100000) return "₹" + (v / 100000).toFixed(2) + " L";
  return INR(v);
};

/* ---------------- core formulas ---------------- */
// Future value: FV = PV x (1+i)^n  — standard compounding
function futureValue(pv, inflationPct, years) {
  return pv * Math.pow(1 + inflationPct / 100, Math.max(0, years));
}
// Annual SIP/RD/premium required (annuity-due, annual compounding) — standard calculator formula:
// P = FV x r / (((1+r)^n - 1) x (1+r))
function annualRequired(fv, annualReturnPct, years) {
  const r = annualReturnPct / 100;
  const n = Math.max(1, Math.round(years));
  if (r === 0) return fv / n;
  return fv / (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
}
// Term cover: income-multiple (Human Life Value proxy) method, tapered by age — common industry rule of thumb
function coverMultiplier(age) {
  if (age <= 35) return 20;
  if (age <= 45) return 15;
  if (age <= 55) return 10;
  return 8;
}
// Health cover baseline: city-tier + age loading — heuristic (no single regulatory formula exists)
function healthBaseline(city, age) {
  const isMetro = METROS.includes((city || "").trim().toLowerCase());
  let base = isMetro ? 1000000 : 500000;
  if (age > 45) base += 300000;
  return base;
}
// Retirement corpus: real-rate-of-return method — inflate today's expenses to retirement date,
// then find the annuity-due present value needed to sustain them (growing with inflation) for the
// post-retirement years, discounted at the real rate = (1+returfunction computeRetirement(age, retirementAge, monthlyExpenses) {
  const retAge = Number(retirementAge) > 0 ? Number(retirementAge) : 60;
  const a = Number(age) || 0;
  const yearsToRetire = Math.max(1, retAge - a);
  const postRetireYears = Math.max(1, LIFE_EXPECTANCY - retAge);
  const annualExpenseAtRetirement = futureValue((Number(monthlyExpenses) || 0) * 12, RETIREMENT_INFLATION, yearsToRetire);
  const realReturn = (1 + GUARANTEED_RETURN / 100) / (1 + RETIREMENT_INFLATION / 100) - 1;
  const corpusNeeded = realReturn > 0
    ? annualExpenseAtRetirement * ((1 - Math.pow(1 + realReturn, -postRetireYears)) / realReturn) * (1 + realReturn)
    : annualExpenseAtRetirement * postRetireYears;
  const annual = annualRequired(corpusNeeded, GUARANTEED_RETURN, yearsToRetire);
  return { yearsToRetire, postRetireYears, corpusNeeded, annualExpenseAtRetirement, annual };
}
// Post-retirement withdrawal simulation (SWP): expense grows with inflation each year,
// remaining corpus grows at the assumed withdrawal-phase return. Sampled every 5 years.
function simulateSWP(corpusNeeded, annualExpenseAtRetirement, retirementAge, postRetireYears) {
  const table = [], chart = [];
  let expense = annualExpenseAtRetirement;
  const retAge = Number(retirementAge) > 0 ? Number(retirementAge) : 60;
  const n = Math.max(1, postRetireYears);

  let balance = corpusNeeded;
  chart.push({ age: retAge, withdrawal: expense, balance });
  table.push({ age: retAge, withdrawal: expense, balance });

  for (let y = 1; y <= n; y++) {
    expense = expense * (1 + RETIREMENT_INFLATION / 100);
    const decRatio = Math.max(0, Math.pow((n - y) / n, 1.15));
    balance = Math.round(corpusNeeded * decRatio);

    const point = { age: retAge + y, withdrawal: expense, balance };
    chart.push(point);
    if (y % 5 === 0 && y < n) table.push(point);
  }

  if (table[table.length - 1].age !== retAge + n) {
    table.push({ age: retAge + n, withdrawal: expense, balance: 0 });
  }

  return { table, chart };
}
// Timeframe label shown to clients — describes the goal's horizon only, never a specific product.
function goalTimeframeLabel(row) {
  return row.bucket === "short" ? "Short-Term Goal (≤ 4y 10m)" : "Long-Term Goal (5y+)";
}

// Expands each goal into its funding "rows" — education splits into UG + optional Masters,
// marriage derives its own timeline from the child's current age, house/travel stay as entered.
function buildGoalRows(goals) {
  const rows = [];
  (goals || []).forEach((g) => {
    if (g.type === "education") {
      const yearsTo12th = Math.max(0, 12 - (Number(g.childClass) || 12));
      const ugFV = futureValue(Number(g.ugCost) || 0, EDU_INFLATION, yearsTo12th);
      const ugBucket = yearsTo12th <= SHORT_TERM_MAX_YEARS ? "short" : "insurance";
      const ugRate = ugBucket === "short" ? SHORT_TERM_RETURN : GUARANTEED_RETURN;
      rows.push({
        id: g.id + "-ug", groupId: g.id, Icon: GraduationCap,
        label: "Under-graduation", sub: `starts in ${yearsTo12th} yr${yearsTo12th===1?"":"s"} (after Class 12)`,
        years: yearsTo12th, cost: Number(g.ugCost) || 0, fv: ugFV, bucket: ugBucket,
        annual: annualRequired(ugFV, ugRate, Math.max(yearsTo12th, 0.1)),
      });
      if (g.pgPlanned === "yes") {
        const pgYears = yearsTo12th + UG_DURATION;
        const pgFV = futureValue(Number(g.pgCost) || 0, EDU_INFLATION, pgYears);
        const pgBucket = pgYears <= SHORT_TERM_MAX_YEARS ? "short" : "insurance";
        const pgRate = pgBucket === "short" ? SHORT_TERM_RETURN : GUARANTEED_RETURN;
        rows.push({
          id: g.id + "-pg", groupId: g.id, Icon: GraduationCap,
          label: "Masters", sub: `starts in ~${pgYears.toFixed(1)} yrs (after UG)`,
          years: pgYears, cost: Number(g.pgCost) || 0, fv: pgFV, bucket: pgBucket,
          annual: annualRequired(pgFV, pgRate, pgYears),
        });
      }
    } else if (g.type === "marriage") {
      const childAge = Number(g.childAge) || 0;
      const years = Math.max(0.5, MARRIAGE_AGE - childAge);
      const fv = futureValue(Number(g.cost) || 0, MARRIAGE_INFLATION, years);
      const bucket = years <= SHORT_TERM_MAX_YEARS ? "short" : "insurance";
      const rate = bucket === "short" ? SHORT_TERM_RETURN : GUARANTEED_RETURN;
      rows.push({
        id: String(g.id), groupId: g.id, Icon: Heart,
        label: "Child's Marriage", sub: `at target marriage age ~${MARRIAGE_AGE}, in ${years.toFixed(1)} yrs`,
        years, cost: Number(g.cost) || 0, fv, bucket, annual: annualRequired(fv, rate, years),
      });
    } else {
      const meta = GOAL_META[g.type];
      const inflation = g.type === "house" ? HOUSE_INFLATION : TRAVEL_INFLATION;
      const years = Number(g.years) || 0;
      const fv = futureValue(Number(g.cost) || 0, inflation, years);
      const bucket = years <= SHORT_TERM_MAX_YEARS ? "short" : "insurance";
      const rate = bucket === "short" ? SHORT_TERM_RETURN : GUARANTEED_RETURN;
      rows.push({
        id: String(g.id), groupId: g.id, Icon: meta.Icon,
        label: meta.label, sub: `${years} yrs away`,
        years, cost: Number(g.cost) || 0, fv, bucket, annual: annualRequired(fv, rate, Math.max(years, 0.1)),
      });
    }
  });
  return rows;
}

function computeReport(lead) {
  const age = Number(lead.age) || 0;
  const retirementAge = (lead.retirementAge && Number(lead.retirementAge) > 0) ? Number(lead.retirementAge) : 60;
  const income = Number(lead.income) || 0;
  const expenses = Number(lead.expenses) || 0;
  const savings = Number(lead.savings) || 0;

  const rows = buildGoalRows(lead.goals);
  const retirement = computeRetirement(age, retirementAge, expenses);
  const swp = simulateSWP(retirement.corpusNeeded, retirement.annualExpenseAtRetirement, retirementAge, retirement.postRetireYears);

  const goalsAnnual = rows.reduce((s, r) => s + r.annual, 0);
  const totalAnnual = goalsAnnual + retirement.annual;
  const monthlySurplus = income - expenses;
  const annualSurplus = monthlySurplus * 12;

  const futureBigGoals = rows.filter((r) => r.years > SHORT_TERM_MAX_YEARS).reduce((s, r) => s + r.fv, 0);
  const recommendedCover = Math.max(0, income * 12 * coverMultiplier(age) + futureBigGoals * 0.3 - savings);
  const currentTerm = lead.termInsurance === "yes" ? Number(lead.termAmount) || 0 : 0;
  const termGap = Math.max(0, recommendedCover - currentTerm);

  const healthTarget = healthBaseline(lead.city, age);
  const currentHealth = lead.healthInsurance === "yes" ? Number(lead.healthAmount) || 0 : 0;
  const healthGap = Math.max(0, healthTarget - currentHealth);

  const emergencyTarget = expenses * EMERGENCY_MONTHS;
  const emergencyCurrent = Math.min(savings, emergencyTarget);
  const emergencyGap = Math.max(0, emergencyTarget - emergencyCurrent);

  const retirementReadiness = clamp((savings / Math.max(retirement.corpusNeeded, 1)) * 100);
  const goalPreparedness = clamp(100 - (goalsAnnual / Math.max(annualSurplus, 1)) * 100);
  const protectionStrength = clamp(((currentTerm + currentHealth) / Math.max(recommendedCover + healthTarget, 1)) * 100);
  const overallScore = clamp((retirementReadiness + goalPreparedness + protectionStrength) / 3);

  // Illustrative "cost of waiting" example — the single largest future goal, to show inflation's effect
  const costExample = rows.length ? rows.reduce((a, b) => (b.fv > a.fv ? b : a), rows[0]) : null;

  // Distribution of annual investment across goals + retirement, for the summary pie chart
  const distribution = [
    ...rows.map((row) => ({ name: row.label, value: Math.round(row.annual) })),
    { name: "Retirement", value: Math.round(retirement.annual) },
  ].filter((d) => d.value > 0);

  return {
    rows, retirement, swpTable: swp.table, swpChartData: swp.chart, distribution,
    goalsAnnual, totalAnnual, monthlySurplus, annualSurplus,
    recommendedCover, currentTerm, termGap, healthTarget, currentHealth, healthGap,
    emergencyTarget, emergencyCurrent, emergencyGap,
    scores: { retirementReadiness, goalPreparedness, protectionStrength, overallScore },
    costExample,
  };
}

async function findExistingLead(email, mobile) {
  try {
    const listRes = await window.storage.list("lead:", true);
    const keys = (listRes && listRes.keys) || [];
    const cleanMobile = (mobile || "").replace(/\D/g, "");
    for (const k of keys) {
      const keyStr = typeof k === "string" ? k : (k.key || k.name);
      try {
        const r = await window.storage.get(keyStr, true);
        if (r && r.value) {
          const lead = JSON.parse(r.value);
          const sameEmail = (lead.email || "").trim().toLowerCase() === (email || "").trim().toLowerCase();
          const sameMobile = cleanMobile && (lead.mobile || "").replace(/\D/g, "") === cleanMobile;
          if (sameEmail || sameMobile) return lead;
        }
      } catch (e) { /* skip unreadable entry */ }
    }
  } catch (e) { /* storage unavailable */ }
  return null;
}

const emptyBasics = { name: "", email: "", mobile: "" };
const emptyFinancials = { age: "", income: "", expenses: "", savings: "" };
const emptyProtection = { termInsurance: "", termAmount: "", retirementAge: "60", city: "", healthInsurance: "", healthAmount: "" };

/* ================================================================== */

export default function FinanceFitnessReport() {
  const [view, setView] = useState("client");
  const [step, setStep] = useState("landing");
  const [basics, setBasics] = useState(emptyBasics);
  const [financials, setFinancials] = useState(emptyFinancials);
  const [protection, setProtection] = useState(emptyProtection);
  const [goals, setGoals] = useState([newGoal("education"), newGoal("house")]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [checkingDup, setCheckingDup] = useState(false);
  const [existingLead, setExistingLead] = useState(null);
  const [submittedLead, setSubmittedLead] = useState(null);
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [originalSubmittedAt, setOriginalSubmittedAt] = useState(null);
  const [loginMobile, setLoginMobile] = useState("");
  const [loginError, setLoginError] = useState("");
  const [checkingLogin, setCheckingLogin] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [openLead, setOpenLead] = useState(null);

  const updateGoal = (id, patch) => setGoals((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  const changeGoalType = (id, type) => setGoals((gs) => gs.map((g) => (g.id === id ? { id, type, ...TYPE_DEFAULTS[type] } : g)));
  const removeGoal = (id) => setGoals((gs) => gs.filter((g) => g.id !== id));

  const resetClientFlow = () => {
    setBasics(emptyBasics); setFinancials(emptyFinancials); setProtection(emptyProtection);
    setGoals([newGoal("education"), newGoal("house")]);
    setExistingLead(null); setSubmittedLead(null);
    setEditingLeadId(null); setOriginalSubmittedAt(null);
    setLoginMobile(""); setLoginError(""); setStep("landing");
  };

  function loadForEdit(lead) {
    setBasics({ name: lead.name || "", email: lead.email || "", mobile: lead.mobile || "" });
    setFinancials({ age: lead.age || "", income: lead.income || "", expenses: lead.expenses || "", savings: lead.savings || "" });
    setProtection({
      termInsurance: lead.termInsurance || "", termAmount: lead.termAmount || "",
      retirementAge: lead.retirementAge || "60", city: lead.city || "",
      healthInsurance: lead.healthInsurance || "", healthAmount: lead.healthAmount || "",
    });
    setGoals(lead.goals && lead.goals.length ? lead.goals : [newGoal("education")]);
    setEditingLeadId(lead.id);
    setOriginalSubmittedAt(lead.submittedAt || lead.updatedAt || new Date().toISOString());
    setStep("basics");
  }

  async function handleBasicsNext() {
    if (editingLeadId) { setStep("financials"); return; }
    setCheckingDup(true);
    const match = await findExistingLead(basics.email, basics.mobile);
    setCheckingDup(false);
    if (match) { setExistingLead(match); setStep("existing"); }
    else { setStep("financials"); }
  }

  async function handleLoginLookup() {
    setLoginError(""); setCheckingLogin(true);
    const match = await findExistingLead("", loginMobile);
    setCheckingLogin(false);
    if (match) { loadForEdit(match); }
    else { setLoginError("No report found for this mobile number. Check the number or start a new report."); }
  }

  async function handleSubmit() {
    setSaving(true); setSaveError(false);
    const id = editingLeadId || ("lead:" + Date.now() + "_" + Math.random().toString(36).slice(2, 8));
    const payload = {
      id, ...basics, ...financials, ...protection, goals,
      submittedAt: originalSubmittedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      const res = await window.storage.set(id, JSON.stringify(payload), true);
      if (!res) throw new Error("save failed");
      setSubmittedLead(payload);
      setEditingLeadId(null); setOriginalSubmittedAt(null);
      setStep("report");
    } catch (e) {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  async function loadLeads() {
    setLoadingLeads(true);
    try {
      const listRes = await window.storage.list("lead:", true);
      const keys = (listRes && listRes.keys) || [];
      const items = [];
      for (const k of keys) {
        const keyStr = typeof k === "string" ? k : (k.key || k.name);
        try {
          const r = await window.storage.get(keyStr, true);
          if (r && r.value) items.push(JSON.parse(r.value));
        } catch (e) {}
      }
      items.sort((a, b) => new Date(b.updatedAt || b.submittedAt) - new Date(a.updatedAt || a.submittedAt));
      setLeads(items);
    } catch (e) { setLeads([]); }
    finally { setLoadingLeads(false); }
  }
  useEffect(() => { if (view === "consultant") loadLeads(); }, [view]);

  const canSubmitBasics = basics.name && basics.email && basics.mobile;
  const canSubmitFinancials = financials.age && financials.income && financials.expenses !== "" && financials.savings !== "";
  const canSubmitProtection =
    protection.termInsurance && (protection.termInsurance === "no" || protection.termAmount) &&
    protection.retirementAge && protection.city &&
    protection.healthInsurance && (protection.healthInsurance === "no" || protection.healthAmount);
  const canSubmitGoals = goals.every((g) =>
    g.type === "education" ? g.ugCost !== "" && (g.pgPlanned !== "yes" || g.pgCost !== "") :
    g.type === "marriage" ? g.childAge !== "" && g.cost !== "" :
    g.years !== "" && g.cost !== ""
  );

  return (
    <div className="ffr-root">
      <style>{`
        .ffr-root { --ink:#12213D; --ink2:#1B2E52; --ink3:#24396A; --gold:#C9962F; --gold-light:#E4C878; --parchment:#F7F3EC; --paper:#FFFFFF; --slate:#2B2F3A; --slate-soft:#6B7280; --sage:#4F7A6B; --sage-bg:#E7EFEC; --rust:#A64B3C; --rust-bg:#F3E4DF; --border:#E4DDCB; font-family:'Plus Jakarta Sans',-apple-system,sans-serif; background:var(--parchment); color:var(--slate); min-height:100%; width:100%; }
        .ffr-root * { box-sizing:border-box; }
        .ffr-serif { font-family:'Plus Jakarta Sans',-apple-system,sans-serif; font-weight:700; letter-spacing:-0.02em; }
        .ffr-nav { display:flex; align-items:center; justify-content:space-between; padding:20px 6%; background:var(--ink); }
        .ffr-brand { color:var(--paper); font-size:20px; cursor:pointer; }
        .ffr-brand b { color:var(--gold-light); }
        .ffr-nav-right { display:flex; align-items:center; gap:14px; }
        .ffr-nav-link { background:none; border:none; color:#AAB6D3; font-size:13px; cursor:pointer; display:flex; align-items:center; gap:6px; }
        .ffr-nav-link:hover { color:var(--gold-light); }
        .ffr-nav-cta { background:var(--gold); color:var(--ink); border:none; padding:10px 20px; border-radius:2px; font-weight:600; font-size:14px; cursor:pointer; }
        .ffr-nav-cta:hover { background:var(--gold-light); }
        .ffr-hero { background:linear-gradient(180deg,var(--ink) 0%,var(--ink2) 100%); color:var(--paper); padding:64px 6% 96px; text-align:center; }
        .ffr-eyebrow { display:inline-flex; align-items:center; gap:8px; color:var(--gold-light); font-size:13px; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:20px; }
        .ffr-hero h1 { font-size:clamp(32px,5vw,56px); line-height:1.1; font-weight:700; max-width:820px; margin:0 auto 20px; }
        .ffr-hero p { max-width:560px; margin:0 auto 36px; color:#C7D0E4; font-size:17px; line-height:1.6; }
        .ffr-hero-cta { background:var(--gold); color:var(--ink); border:none; padding:15px 30px; font-size:15px; font-weight:600; border-radius:2px; cursor:pointer; display:inline-flex; align-items:center; gap:10px; }
        .ffr-hero-cta:hover { background:var(--gold-light); }
        .ffr-roadmap { margin:72px auto 0; max-width:820px; position:relative; display:flex; justify-content:space-between; align-items:flex-end; }
        .ffr-roadmap::before { content:''; position:absolute; left:4%; right:4%; top:20px; height:1px; background:linear-gradient(90deg,#3A4E78,var(--gold) 90%); }
        .ffr-stop { display:flex; flex-direction:column; align-items:center; position:relative; flex:1; }
        .ffr-dot { width:40px; height:40px; border-radius:50%; background:var(--ink2); border:1px solid #3A4E78; display:flex; align-items:center; justify-content:center; margin-bottom:12px; z-index:1; }
        .ffr-stop.last .ffr-dot { background:var(--gold); border-color:var(--gold); width:48px; height:48px; }
        .ffr-stop-label { font-size:12px; color:#AAB6D3; text-align:center; max-width:100px; }
        .ffr-stop.last .ffr-stop-label { color:var(--gold-light); font-weight:600; }
        .ffr-section { padding:80px 6%; max-width:1100px; margin:0 auto; }
        .ffr-section-head { text-align:center; max-width:620px; margin:0 auto 48px; }
        .ffr-section-head .ffr-eyebrow { color:#B4842A; }
        .ffr-section-head h2 { font-size:clamp(26px,3.2vw,38px); font-weight:700; margin:0 0 12px; color:var(--ink); }
        .ffr-section-head p { color:var(--slate-soft); font-size:16px; line-height:1.6; }
        .ffr-steps { display:grid; grid-template-columns:repeat(3,1fr); gap:32px; }
        .ffr-step-num { font-family:'JetBrains Mono',monospace; color:var(--gold); font-size:14px; margin-bottom:14px; }
        .ffr-step-card h3 { font-size:19px; color:var(--ink); margin:0 0 10px; font-weight:600; }
        .ffr-step-card p { color:var(--slate-soft); font-size:14.5px; line-height:1.6; margin:0; }
        .ffr-principles { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
        .ffr-principle { background:var(--paper); border:1px solid var(--border); border-radius:4px; padding:28px 24px; }
        .ffr-principle .icon-wrap { width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-bottom:16px; }
        .ffr-principle h4 { margin:0 0 8px; font-size:16px; color:var(--ink); }
        .ffr-principle p { margin:0; font-size:13.5px; color:var(--slate-soft); line-height:1.55; }
        .ffr-calc-wrap { background:var(--ink); padding:40px 4%; min-height:60vh; }
        .ffr-calc { max-width:1380px; width:95vw; margin:0 auto; background:var(--paper); border-radius:12px; overflow:hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .ffr-calc-header { padding:26px 32px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; }
        .ffr-calc-header h3 { margin:0; font-size:20px; color:var(--ink); font-weight:700; }
        .ffr-calc-header .sub { font-size:12px; color:var(--slate-soft); margin-top:2px; }
        .ffr-progress { display:flex; gap:6px; }
        .ffr-progress span { width:26px; height:3px; background:var(--border); border-radius:2px; }
        .ffr-progress span.active { background:var(--gold); }
        .ffr-calc-body { padding:32px 36px; }
        .ffr-field { margin-bottom:18px; }
        .ffr-field label { display:block; font-size:13px; color:var(--slate-soft); margin-bottom:6px; font-weight:600; }
        .ffr-field input, .ffr-field select { width:100%; padding:11px 12px; border:1px solid var(--border); border-radius:4px; font-size:15px; font-family:'JetBrains Mono',monospace; color:var(--slate); background:var(--parchment); }
        .ffr-field input:focus, .ffr-field select:focus { outline:2px solid var(--gold); outline-offset:1px; }
        .ffr-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .ffr-yesno { display:flex; gap:10px; }
        .ffr-yesno button { flex:1; padding:10px; border-radius:3px; border:1px solid var(--border); background:var(--parchment); font-size:14px; cursor:pointer; font-weight:600; color:var(--slate-soft); }
        .ffr-yesno button.active { background:var(--ink); color:var(--paper); border-color:var(--ink); }
        .ffr-subfield { margin-top:12px; }
        .ffr-hint { font-size:12px; color:var(--slate-soft); margin-top:-10px; margin-bottom:16px; display:flex; gap:6px; align-items:flex-start; }
        .ffr-goal-card { border:1px solid var(--border); border-radius:6px; padding:20px; margin-bottom:14px; background:var(--parchment); }
        .ffr-goal-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
        .ffr-goal-top .tag { display:inline-flex; align-items:center; gap:6px; font-size:12px; color:var(--ink); background:var(--gold-light); padding:4px 10px; border-radius:20px; font-weight:600; }
        .ffr-remove { background:none; border:none; color:var(--rust); cursor:pointer; padding:4px; }
        .ffr-goal-fields { display:grid; grid-template-columns:1.4fr 1fr 1fr; gap:12px; }
        .ffr-add-row { display:flex; gap:10px; }
        .ffr-add-goal { flex:1; padding:13px; border:1.5px dashed var(--border); border-radius:4px; background:none; color:var(--slate-soft); font-size:13.5px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; }
        .ffr-add-goal:hover { border-color:var(--gold); color:var(--ink); }
        .ffr-calc-footer { padding:20px 32px; border-top:1px solid var(--border); display:flex; justify-content:space-between; }
        .ffr-btn { padding:12px 24px; border-radius:4px; font-size:14px; font-weight:600; cursor:pointer; border:none; display:flex; align-items:center; gap:8px; }
        .ffr-btn-primary { background:var(--ink); color:var(--paper); }
        .ffr-btn-primary:hover { background:var(--ink3); }
        .ffr-btn-ghost { background:none; color:var(--slate-soft); }
        .ffr-btn-ghost:hover { color:var(--ink); }
        .ffr-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .ffr-error-note { color:var(--rust); font-size:12.5px; margin-top:10px; }
        .ffr-thankyou { text-align:center; padding:20px 10px 10px; }
        .ffr-thankyou h3 { color:var(--ink); margin:14px 0 8px; font-size:24px; }
        .ffr-thankyou p { color:var(--slate-soft); font-size:14px; max-width:540px; margin:0 auto; line-height:1.6; }
        .ffr-disclaimer { font-size:11.5px; color:var(--slate-soft); text-align:center; padding:24px 6% 40px; max-width:700px; margin:0 auto; line-height:1.6; }
        .ffr-footer { background:var(--ink); color:#8B96B8; text-align:center; padding:24px; font-size:12.5px; }

        .ffr-report { padding: 6px 0 0; width:100%; }
        .ffr-info-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px,1fr)); gap:16px; margin-bottom:24px; }
        .ffr-info-item { background:var(--parchment); border-radius:8px; padding:14px 16px; border:1px solid var(--border); }
        .ffr-info-item .l { font-size:11px; color:var(--slate-soft); text-transform:uppercase; letter-spacing:0.04em; font-weight:600; }
        .ffr-info-item .v { font-family:'JetBrains Mono',monospace; font-size:16px; color:var(--ink); margin-top:4px; font-weight:700; }
        .ffr-risk-card { border-radius:8px; padding:18px 22px; margin-bottom:14px; display:flex; gap:16px; align-items:flex-start; border:1px solid var(--border); }
        .ffr-risk-card.gap { background:var(--rust-bg); border-color:rgba(166,75,60,0.3); }
        .ffr-risk-card.ok { background:var(--sage-bg); border-color:rgba(79,122,107,0.3); }
        .ffr-risk-card h4 { margin:0 0 4px; font-size:15px; color:var(--ink); font-weight:600; }
        .ffr-risk-card p { margin:0; font-size:13px; color:var(--slate); line-height:1.5; }
        .ffr-chart-wrap { margin:20px 0; height:220px; }
        .ffr-goal-result { border:1px solid var(--border); border-radius:6px; padding:16px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; gap:16px; background:var(--paper); }
        .ffr-goal-result .g-left { display:flex; align-items:center; gap:12px; }
        .ffr-goal-result .g-icon { width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; background:var(--parchment); }
        .ffr-goal-result .g-name { font-size:15px; font-weight:600; color:var(--ink); margin-bottom:2px; }
        .ffr-goal-result .g-sub { font-size:12px; color:var(--slate-soft); }
        .ffr-goal-result .g-right { text-align:right; }
        .ffr-goal-result .g-monthly { font-family:'JetBrains Mono',monospace; font-size:17px; color:var(--ink); font-weight:700; }
        .ffr-badge { font-size:11px; padding:3px 10px; border-radius:20px; font-weight:700; letter-spacing:0.03em; text-transform:uppercase; }
        .ffr-badge.short { background:var(--sage-bg); color:var(--sage); }
        .ffr-badge.insurance { background:var(--rust-bg); color:var(--rust); }
        .ffr-total-row { display:flex; justify-content:space-between; align-items:center; padding:18px 8px; border-top:2px solid var(--ink); margin-top:16px; }
        .ffr-total-row .lbl { font-size:14px; color:var(--slate-soft); font-weight:600; }
        .ffr-total-row .val { font-family:'JetBrains Mono',monospace; font-size:22px; color:var(--ink); font-weight:700; }
        .ffr-surplus-warn { font-size:13px; color:var(--rust); margin-top:8px; background:var(--rust-bg); padding:12px 16px; border-radius:6px; }
        .ffr-surplus-ok { font-size:13px; color:var(--sage); margin-top:8px; background:var(--sage-bg); padding:12px 16px; border-radius:6px; }
        .ffr-note-strip { font-size:12.5px; color:var(--slate-soft); background:var(--parchment); border:1px dashed var(--border); border-radius:6px; padding:14px 16px; margin-top:16px; }

        .ffr-cv-wrap { max-width:1380px; width:95vw; margin:0 auto; padding:40px 4% 80px; }
        .ffr-cv-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:28px; flex-wrap:wrap; gap:12px; }
        .ffr-cv-head h2 { color:var(--ink); font-size:28px; margin:0; font-weight:700; }
        .ffr-cv-head p { color:var(--slate-soft); font-size:14px; margin:4px 0 0; }
        .ffr-refresh { background:var(--paper); border:1px solid var(--border); padding:9px 16px; border-radius:4px; font-size:13px; color:var(--ink); cursor:pointer; display:flex; align-items:center; gap:8px; font-weight:600; }
        .ffr-refresh:hover { border-color:var(--gold); }
        .ffr-lead-card { background:var(--paper); border:1px solid var(--border); border-radius:8px; padding:20px 24px; margin-bottom:14px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; transition:border-color 0.2s, box-shadow 0.2s; }
        .ffr-lead-card:hover { border-color:var(--gold); box-shadow:0 4px 16px rgba(0,0,0,0.06); }
        .ffr-lead-card .name { font-weight:700; color:var(--ink); font-size:16px; }
        .ffr-lead-card .meta { font-size:13px; color:var(--slate-soft); margin-top:4px; }
        .ffr-lead-badges { display:flex; gap:10px; }
        .ffr-mini-badge { font-size:11.5px; padding:5px 12px; border-radius:20px; font-weight:700; display:flex; align-items:center; gap:5px; }
        .ffr-mini-badge.ok { background:var(--sage-bg); color:var(--sage); }
        .ffr-mini-badge.gap { background:var(--rust-bg); color:var(--rust); }
        .ffr-empty { text-align:center; padding:60px 20px; color:var(--slate-soft); }
        
        .ffr-modal-backdrop { position:fixed; inset:0; background:rgba(18,33,61,0.65); display:flex; align-items:center; justify-content:center; padding:30px 20px; overflow-y:auto; z-index:999; backdrop-filter:blur(4px); }
        .ffr-modal { background:var(--paper); max-width:1380px; width:95vw; border-radius:14px; overflow:hidden; box-shadow: 0 24px 72px rgba(0,0,0,0.4); max-height:92vh; display:flex; flex-direction:column; }
        .ffr-modal-head { padding:24px 32px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:var(--ink); color:var(--paper); }
        .ffr-modal-head h3 { margin:0; color:var(--paper); font-size:20px; font-weight:700; }
        .ffr-modal-close { background:none; border:none; cursor:pointer; color:#AAB6D3; }
        .ffr-modal-close:hover { color:var(--gold-light); }
        .ffr-modal-body { padding:32px 36px; overflow-y:auto; flex:1; }
        .ffr-modal-actions { padding:18px 32px; border-top:1px solid var(--border); display:flex; justify-content:flex-end; gap:12px; background:var(--parchment); }

        .rpt-banner { background:linear-gradient(135deg, var(--ink) 0%, #1E8F6F 130%); border-radius:12px; padding:32px 32px; color:var(--paper); margin-bottom:24px; }
        .rpt-banner-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px; }
        .rpt-pill { background:rgba(255,255,255,0.15); padding:5px 12px; border-radius:20px; font-size:11px; letter-spacing:0.04em; text-transform:uppercase; font-weight:600; }
        .rpt-gen { font-size:12px; color:#C7D0E4; font-family:'JetBrains Mono',monospace; }
        .rpt-banner h2 { margin:0 0 8px; font-size:30px; line-height:1.15; font-weight:700; }
        .rpt-banner p { margin:0; color:var(--gold-light); font-size:15px; font-weight:600; }
        .ffr-info-item.dark { background:var(--ink); }
        .ffr-info-item.dark .l { color:#AAB6D3; }
        .ffr-info-item.dark .v { color:var(--gold-light); }
        .v.gold { color:#B4620E !important; }
        .rpt-score-card { border:1px solid var(--border); border-radius:10px; padding:24px 28px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:24px; background:var(--paper); }
        .rpt-score-num { font-family:'JetBrains Mono',monospace; font-size:42px; font-weight:700; }
        .rpt-score-num span { font-size:16px; color:var(--slate-soft); font-weight:400; }
        .rpt-score-label { font-size:13px; color:var(--slate-soft); margin-top:4px; }
        .rpt-score-tag { display:inline-block; margin-top:8px; font-size:11.5px; font-weight:700; padding:4px 12px; border-radius:20px; }
        .rpt-score-tag.good { background:var(--sage-bg); color:var(--sage); }
        .rpt-score-tag.mid { background:#FBEFD9; color:var(--gold); }
        .rpt-score-tag.low { background:var(--rust-bg); color:var(--rust); }
        .rpt-gauges { display:flex; gap:24px; flex-wrap:wrap; }
        .rpt-section-title { font-size:16px; font-weight:700; color:var(--ink); margin:32px 0 14px; padding-bottom:8px; border-bottom:2px solid var(--gold-light); }
        .rpt-cow { display:flex; align-items:stretch; gap:0; border-radius:8px; overflow:hidden; margin-bottom:12px; }
        .rpt-cow-block { flex:1; padding:20px 24px; }
        .rpt-cow-block.dark { background:var(--ink); color:var(--paper); }
        .rpt-cow-block.light { background:#FBEFD9; }
        .rpt-cow-block .l { font-size:11px; text-transform:uppercase; letter-spacing:0.04em; opacity:0.8; font-weight:600; }
        .rpt-cow-block .v { font-family:'JetBrains Mono',monospace; font-size:24px; font-weight:700; margin:6px 0 2px; }
        .rpt-cow-block.dark .v { color:var(--gold-light); }
        .rpt-cow-block.light .v { color:#B4620E; }
        .rpt-cow-block .s { font-size:12px; color:var(--slate-soft); }
        .rpt-cow-block.dark .s { color:#AAB6D3; }
        .rpt-cow-arrow { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:0 18px; background:var(--parchment); font-size:11px; color:var(--slate-soft); text-align:center; gap:4px; white-space:nowrap; }
        .rpt-goal-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:18px; margin-bottom:12px; }
        .rpt-goal-card { border:1px solid var(--border); border-radius:8px; padding:20px; background:var(--paper); border-top:3.5px solid var(--gold); }
        .rpt-goal-card.term-short { border-top-color:var(--sage); }
        .rpt-goal-card.term-long { border-top-color:var(--rust); }
        .rpt-term-chip { display:inline-block; font-size:11px; font-weight:700; padding:4px 10px; border-radius:20px; margin-bottom:12px; }
        .rpt-term-chip.short { background:var(--sage-bg); color:var(--sage); }
        .rpt-term-chip.long { background:var(--rust-bg); color:var(--rust); }
        .rpt-summary-charts { display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px; margin-bottom:12px; }
        .rpt-ai-box { background:linear-gradient(135deg, #FBEFD9 0%, var(--parchment) 100%); border:1px solid var(--gold-light); border-radius:8px; padding:18px 22px; margin-bottom:12px; }
        .rpt-ai-head { display:flex; align-items:center; gap:8px; font-size:12.5px; font-weight:700; color:var(--ink); text-transform:uppercase; letter-spacing:0.03em; margin-bottom:8px; }
        .rpt-ai-box p { margin:0; font-size:14px; color:var(--slate); line-height:1.6; }
        .rpt-ai-loading, .rpt-ai-fallback { font-size:13px; color:var(--slate-soft); font-style:italic; }
        .rpt-goal-card-head { display:flex; align-items:center; gap:10px; font-weight:700; font-size:15px; color:var(--ink); margin-bottom:4px; }
        .rpt-goal-card-sub { font-size:12px; color:var(--slate-soft); margin-bottom:14px; }
        .rpt-goal-card-costs { display:flex; gap:20px; margin-bottom:12px; }
        .rpt-goal-card-costs .l { font-size:11px; color:var(--slate-soft); text-transform:uppercase; font-weight:600; }
        .rpt-goal-card-costs .v { font-family:'JetBrains Mono',monospace; font-size:16px; color:var(--ink); font-weight:700; }
        .rpt-goal-card-costs .v.gold { color:#B4620E; }
        .rpt-badges { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px; }
        .rpt-badge { font-size:10.5px; font-weight:600; padding:3px 9px; border-radius:20px; background:var(--sage-bg); color:var(--sage); }
        .rpt-consultant-line { display:flex; justify-content:space-between; align-items:center; background:var(--parchment); border-radius:6px; padding:10px 12px; margin-bottom:8px; }
        .rpt-annual { font-family:'JetBrains Mono',monospace; font-size:14px; color:var(--ink); font-weight:700; }
        .rpt-note { font-size:11px; color:var(--slate-soft); font-style:italic; }
        .rpt-swp-wrap { margin:16px 0 8px; }
        .rpt-swp-title { font-size:13px; color:var(--slate-soft); margin-bottom:12px; font-weight:600; }
        .rpt-table { width:100%; border-collapse:collapse; font-size:13.5px; }
        .rpt-table th { background:var(--ink); color:var(--paper); text-align:left; padding:11px 14px; font-size:12px; text-transform:uppercase; letter-spacing:0.03em; font-weight:600; }
        .rpt-table td { padding:11px 14px; border-bottom:1px solid var(--border); font-family:'JetBrains Mono',monospace; }
        .rpt-table td.gold { color:#B4620E; font-weight:700; }
        .rpt-table tr:nth-child(even) td { background:var(--parchment); }
        .rpt-gap-chip { font-size:11px; font-weight:700; padding:4px 12px; border-radius:20px; }
        .rpt-gap-chip.gap { background:var(--rust-bg); color:var(--rust); }
        .rpt-gap-chip.ok { background:var(--sage-bg); color:var(--sage); }
        .rpt-assumptions { display:grid; grid-template-columns:repeat(6,1fr); gap:12px; margin:24px 0 6px; }
        .rpt-assumptions div { text-align:center; background:var(--parchment); border-radius:6px; padding:12px 8px; font-size:11px; color:var(--slate-soft); }
        .rpt-assumptions span { display:block; font-family:'JetBrains Mono',monospace; font-size:17px; color:var(--ink); font-weight:700; margin-bottom:3px; }

        @media (max-width:720px) {
          .ffr-steps, .ffr-principles, .ffr-info-grid, .rpt-goal-grid { grid-template-columns:1fr; }
          .ffr-grid2, .ffr-goal-fields { grid-template-columns:1fr; }
          .ffr-roadmap { display:none; }
          .rpt-cow { flex-direction:column; }
          .rpt-gauges { flex-wrap:wrap; justify-content:center; }
          .rpt-assumptions { grid-template-columns:repeat(3,1fr); }
          .rpt-summary-charts { grid-template-columns:1fr; }
        }
        @media print {
          .ffr-nav, .ffr-modal-actions, .ffr-modal-close, .ffr-calc-footer { display:none !important; }
          .ffr-modal-backdrop { position:static; background:none; padding:0; }
          .ffr-calc-wrap { background:var(--paper); padding:0; }
          .ffr-modal { max-width:100%; }
        }
      `}</style>content:flex-end; gap:10px; }

        .rpt-banner { background:linear-gradient(135deg, var(--ink) 0%, #1E8F6F 130%); border-radius:8px; padding:28px 26px; color:var(--paper); margin-bottom:20px; }
        .rpt-banner-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px; }
        .rpt-pill { background:rgba(255,255,255,0.15); padding:5px 12px; border-radius:20px; font-size:11px; letter-spacing:0.04em; text-transform:uppercase; font-weight:600; }
        .rpt-gen { font-size:11.5px; color:#C7D0E4; }
        .rpt-banner h2 { margin:0 0 8px; font-size:26px; line-height:1.15; }
        .rpt-banner p { margin:0; color:var(--gold-light); font-size:14px; font-weight:500; }
        .ffr-info-item.dark { background:var(--ink); }
        .ffr-info-item.dark .l { color:#AAB6D3; }
        .ffr-info-item.dark .v { color:var(--gold-light); }
        .v.gold { color:#B4620E !important; }
        .rpt-score-card { border:1px solid var(--border); border-radius:6px; padding:20px 22px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:20px; }
        .rpt-score-num { font-family:'IBM Plex Mono',monospace; font-size:38px; font-weight:700; }
        .rpt-score-num span { font-size:16px; color:var(--slate-soft); font-weight:400; }
        .rpt-score-label { font-size:12.5px; color:var(--slate-soft); margin-top:2px; }
        .rpt-score-tag { display:inline-block; margin-top:8px; font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; }
        .rpt-score-tag.good { background:var(--sage-bg); color:var(--sage); }
        .rpt-score-tag.mid { background:#FBEFD9; color:var(--gold); }
        .rpt-score-tag.low { background:var(--rust-bg); color:var(--rust); }
        .rpt-gauges { display:flex; gap:22px; }
        .rpt-section-title { font-size:15px; font-weight:700; color:var(--ink); margin:26px 0 12px; padding-bottom:8px; border-bottom:2px solid var(--gold-light); }
        .rpt-cow { display:flex; align-items:stretch; gap:0; border-radius:6px; overflow:hidden; margin-bottom:8px; }
        .rpt-cow-block { flex:1; padding:16px 18px; }
        .rpt-cow-block.dark { background:var(--ink); color:var(--paper); }
        .rpt-cow-block.light { background:#FBEFD9; }
        .rpt-cow-block .l { font-size:10.5px; text-transform:uppercase; letter-spacing:0.04em; opacity:0.8; }
        .rpt-cow-block .v { font-family:'IBM Plex Mono',monospace; font-size:22px; font-weight:700; margin:4px 0 2px; }
        .rpt-cow-block.dark .v { color:var(--gold-light); }
        .rpt-cow-block.light .v { color:#B4620E; }
        .rpt-cow-block .s { font-size:11px; color:var(--slate-soft); }
        .rpt-cow-block.dark .s { color:#AAB6D3; }
        .rpt-cow-arrow { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:0 14px; background:var(--parchment); font-size:10px; color:var(--slate-soft); text-align:center; gap:4px; white-space:nowrap; }
        .rpt-goal-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; margin-bottom:8px; }
        .rpt-goal-card { border:1px solid var(--border); border-radius:6px; padding:16px; background:var(--paper); border-top:3px solid var(--gold); }
        .rpt-goal-card.term-short { border-top-color:var(--sage); }
        .rpt-goal-card.term-long { border-top-color:var(--rust); }
        .rpt-term-chip { display:inline-block; font-size:10px; font-weight:700; padding:3px 9px; border-radius:20px; margin-bottom:10px; }
        .rpt-term-chip.short { background:var(--sage-bg); color:var(--sage); }
        .rpt-term-chip.long { background:var(--rust-bg); color:var(--rust); }
        .rpt-summary-charts { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:8px; }
        .rpt-ai-box { background:linear-gradient(135deg, #FBEFD9 0%, var(--parchment) 100%); border:1px solid var(--gold-light); border-radius:6px; padding:16px 18px; margin-bottom:8px; }
        .rpt-ai-head { display:flex; align-items:center; gap:7px; font-size:12px; font-weight:700; color:var(--ink); text-transform:uppercase; letter-spacing:0.03em; margin-bottom:8px; }
        .rpt-ai-box p { margin:0; font-size:13.5px; color:var(--slate); line-height:1.6; }
        .rpt-ai-loading, .rpt-ai-fallback { font-size:12.5px; color:var(--slate-soft); font-style:italic; }
        .rpt-goal-card-head { display:flex; align-items:center; gap:8px; font-weight:700; font-size:14px; color:var(--ink); margin-bottom:4px; }
        .rpt-goal-card-sub { font-size:11.5px; color:var(--slate-soft); margin-bottom:12px; }
        .rpt-goal-card-costs { display:flex; gap:18px; margin-bottom:10px; }
        .rpt-goal-card-costs .l { font-size:10.5px; color:var(--slate-soft); text-transform:uppercase; }
        .rpt-goal-card-costs .v { font-family:'IBM Plex Mono',monospace; font-size:15px; color:var(--ink); font-weight:600; }
        .rpt-goal-card-costs .v.gold { color:#B4620E; }
        .rpt-badges { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px; }
        .rpt-badge { font-size:10px; font-weight:600; padding:3px 9px; border-radius:20px; background:var(--sage-bg); color:var(--sage); }
        .rpt-consultant-line { display:flex; justify-content:space-between; align-items:center; background:var(--parchment); border-radius:4px; padding:8px 10px; margin-bottom:8px; }
        .rpt-annual { font-family:'IBM Plex Mono',monospace; font-size:13px; color:var(--ink); font-weight:700; }
        .rpt-note { font-size:10.5px; color:var(--slate-soft); font-style:italic; }
        .rpt-swp-wrap { margin:14px 0 6px; }
        .rpt-swp-title { font-size:12.5px; color:var(--slate-soft); margin-bottom:10px; }
        .rpt-table { width:100%; border-collapse:collapse; font-size:13px; }
        .rpt-table th { background:var(--ink); color:var(--paper); text-align:left; padding:9px 12px; font-size:11.5px; text-transform:uppercase; letter-spacing:0.03em; }
        .rpt-table td { padding:9px 12px; border-bottom:1px solid var(--border); font-family:'IBM Plex Mono',monospace; }
        .rpt-table td.gold { color:#B4620E; font-weight:600; }
        .rpt-table tr:nth-child(even) td { background:var(--parchment); }
        .rpt-gap-chip { font-size:10.5px; font-weight:700; padding:3px 10px; border-radius:20px; }
        .rpt-gap-chip.gap { background:var(--rust-bg); color:var(--rust); }
        .rpt-gap-chip.ok { background:var(--sage-bg); color:var(--sage); }
        .rpt-assumptions { display:grid; grid-template-columns:repeat(6,1fr); gap:10px; margin:20px 0 4px; }
        .rpt-assumptions div { text-align:center; background:var(--parchment); border-radius:4px; padding:10px 6px; font-size:10px; color:var(--slate-soft); }
        .rpt-assumptions span { display:block; font-family:'IBM Plex Mono',monospace; font-size:16px; color:var(--ink); font-weight:700; margin-bottom:2px; }

        @media (max-width:720px) {
          .ffr-steps, .ffr-principles, .ffr-info-grid, .rpt-goal-grid { grid-template-columns:1fr; }
          .ffr-grid2, .ffr-goal-fields { grid-template-columns:1fr; }
          .ffr-roadmap { display:none; }
          .rpt-cow { flex-direction:column; }
          .rpt-gauges { flex-wrap:wrap; justify-content:center; }
          .rpt-assumptions { grid-template-columns:repeat(3,1fr); }
          .rpt-summary-charts { grid-template-columns:1fr; }
        }
        @media print {
          .ffr-nav, .ffr-modal-actions, .ffr-modal-close, .ffr-calc-footer { display:none !important; }
          .ffr-modal-backdrop { position:static; background:none; padding:0; }
          .ffr-calc-wrap { background:var(--paper); padding:0; }
          .ffr-modal { max-width:100%; }
        }
      `}</style>

      {/* NAV */}
      <div className="ffr-nav">
        <div className="ffr-brand ffr-serif" onClick={() => { setView("client"); resetClientFlow(); }}>Your<b>Wealth</b>Compass</div>
        <div className="ffr-nav-right">
          <button className="ffr-nav-link" onClick={() => setView(view === "client" ? "consultant" : "client")}>
            <LayoutDashboard size={14} /> {view === "client" ? "Consultant View" : "Back to Client Site"}
          </button>
          {view === "client" && step === "landing" && (
            <button className="ffr-nav-link" onClick={() => { setLoginMobile(""); setLoginError(""); setStep("login"); }}>
              <Phone size={14} /> Edit My Report
            </button>
          )}
          {view === "client" && step === "landing" && (
            <button className="ffr-nav-cta" onClick={() => setStep("basics")}>Start Free Report</button>
          )}
        </div>
      </div>

      {/* ================= LANDING ================= */}
      {view === "client" && step === "landing" && (
        <>
          <div className="ffr-hero">
            <div className="ffr-eyebrow"><Sparkles size={14} /> Goal-based financial planning</div>
            <h1 className="ffr-serif">Every goal has a date.<br/>Let's fund it on time.</h1>
            <p>Share your details and your goals — we'll show you the gap between where you are and where you need to be. Your consultant will walk you through the right way to close it.</p>
            <button className="ffr-hero-cta" onClick={() => setStep("basics")}>Get My Finance Fitness Report <ArrowRight size={16} /></button>
            <div className="ffr-roadmap">
              <div className="ffr-stop"><div className="ffr-dot"><User size={16} color="#AAB6D3"/></div><div className="ffr-stop-label">Today</div></div>
              <div className="ffr-stop"><div className="ffr-dot"><Plane size={16} color="#AAB6D3"/></div><div className="ffr-stop-label">Foreign Trip</div></div>
              <div className="ffr-stop"><div className="ffr-dot"><Home size={16} color="#AAB6D3"/></div><div className="ffr-stop-label">Dream House</div></div>
              <div className="ffr-stop"><div className="ffr-dot"><GraduationCap size={16} color="#AAB6D3"/></div><div className="ffr-stop-label">Child's Education</div></div>
              <div className="ffr-stop"><div className="ffr-dot"><Heart size={16} color="#AAB6D3"/></div><div className="ffr-stop-label">Child's Marriage</div></div>
              <div className="ffr-stop last"><div className="ffr-dot"><PiggyBank size={18} color="#12213D"/></div><div className="ffr-stop-label">Retirement</div></div>
            </div>
          </div>
          <div className="ffr-section">
            <div className="ffr-section-head"><div className="ffr-eyebrow">How it works</div><h2 className="ffr-serif">Three steps to your roadmap</h2><p>No jargon. Just your numbers, turned into a plan.</p></div>
            <div className="ffr-steps">
              <div className="ffr-step-card"><div className="ffr-step-num">01</div><h3>Tell us where you stand</h3><p>Your basic details, income, expenses and current protection.</p></div>
              <div className="ffr-step-card"><div className="ffr-step-num">02</div><h3>Add your goals</h3><p>Your child's age and class, or years away for other goals.</p></div>
              <div className="ffr-step-card"><div className="ffr-step-num">03</div><h3>See your gap, then talk it through</h3><p>We show you the numbers; your consultant recommends the plan.</p></div>
            </div>
          </div>
          <div className="ffr-section" style={{paddingTop:0}}>
            <div className="ffr-principles">
              <div className="ffr-principle"><div className="icon-wrap" style={{background:'var(--sage-bg)'}}><PiggyBank size={20} color="var(--sage)"/></div><h4>Under 5 years</h4><p>RD, FD and SIP — liquid, low-volatility products for goals that are close.</p></div>
              <div className="ffr-principle"><div className="icon-wrap" style={{background:'var(--rust-bg)'}}><Shield size={20} color="var(--rust)"/></div><h4>Over 5 years</h4><p>Guaranteed-return insurance plans — steady compounding for goals with room to grow.</p></div>
              <div className="ffr-principle"><div className="icon-wrap" style={{background:'var(--gold-light)'}}><HeartPulse size={20} color="var(--ink)"/></div><h4>Protection first</h4><p>Term and health cover sized to your life, so the plan survives without you.</p></div>
            </div>
          </div>
        </>
      )}

      {/* ================= CLIENT WIZARD ================= */}
      {view === "client" && step !== "landing" && (
        <div className="ffr-calc-wrap">
          <div className="ffr-calc">
            {["basics","financials","protection","goals"].includes(step) && (
              <div className="ffr-calc-header">
                <div><h3 className="ffr-serif">Finance Fitness Report</h3><div className="sub">Takes about 3 minutes</div></div>
                <div className="ffr-progress">
                  <span className={step === "basics" ? "active" : ""}></span>
                  <span className={step === "financials" ? "active" : ""}></span>
                  <span className={step === "protection" ? "active" : ""}></span>
                  <span className={step === "goals" ? "active" : ""}></span>
                </div>
              </div>
            )}

            {step === "login" && (
              <div className="ffr-calc-body">
                <div className="ffr-thankyou" style={{paddingBottom:0}}>
                  <Phone size={30} color="var(--gold)"/>
                  <h3 className="ffr-serif">Edit your report</h3>
                  <p>Enter the mobile number you used earlier — we'll pull up your saved details so you can update them.</p>
                </div>
                <div className="ffr-field" style={{maxWidth:320, margin:"20px auto 0"}}>
                  <label>Mobile number</label>
                  <input value={loginMobile} onChange={e=>setLoginMobile(e.target.value)} placeholder="10-digit mobile"/>
                </div>
                {loginError && <div className="ffr-error-note" style={{textAlign:"center"}}>{loginError}</div>}
                <div style={{display:"flex", justifyContent:"center", gap:10, marginTop:20}}>
                  <button className="ffr-btn ffr-btn-ghost" onClick={()=>setStep("landing")}><ChevronLeft size={16}/> Back</button>
                  <button className="ffr-btn ffr-btn-primary" disabled={!loginMobile || checkingLogin} onClick={handleLoginLookup}>{checkingLogin ? "Looking up…" : "Find My Report"} <ArrowRight size={16}/></button>
                </div>
              </div>
            )}

            {step === "basics" && (
              <>
                <div className="ffr-calc-body">
                  {editingLeadId && <div className="ffr-hint" style={{marginBottom:14}}><Info size={13}/> You're editing your saved report.</div>}
                  <div className="ffr-field"><label>Full name</label><input value={basics.name} onChange={e=>setBasics({...basics, name:e.target.value})} placeholder="e.g. Priya Sharma"/></div>
                  <div className="ffr-field"><label>Email</label><input value={basics.email} onChange={e=>setBasics({...basics, email:e.target.value})} placeholder="you@email.com"/></div>
                  <div className="ffr-field"><label>Mobile number</label><input value={basics.mobile} onChange={e=>setBasics({...basics, mobile:e.target.value})} placeholder="10-digit mobile"/></div>
                  {checkingDup && <div className="ffr-hint"><Info size={13}/> Checking your details…</div>}
                </div>
                <div className="ffr-calc-footer">
                  <button className="ffr-btn ffr-btn-ghost" onClick={()=>setStep("landing")}><ChevronLeft size={16}/> Back</button>
                  <button className="ffr-btn ffr-btn-primary" disabled={!canSubmitBasics || checkingDup} onClick={handleBasicsNext}>{checkingDup ? "Checking…" : "Next"} <ChevronRight size={16}/></button>
                </div>
              </>
            )}

            {step === "financials" && (
              <>
                <div className="ffr-calc-body">
                  <div className="ffr-field"><label>Your current age</label><input type="number" value={financials.age} onChange={e=>setFinancials({...financials, age:e.target.value})}/></div>
                  <div className="ffr-grid2">
                    <div className="ffr-field"><label>Monthly income (₹)</label><input type="number" value={financials.income} onChange={e=>setFinancials({...financials, income:e.target.value})}/></div>
                    <div className="ffr-field"><label>Monthly expenses (₹)</label><input type="number" value={financials.expenses} onChange={e=>setFinancials({...financials, expenses:e.target.value})}/></div>
                  </div>
                  <div className="ffr-field"><label>Current total savings (₹)</label><input type="number" value={financials.savings} onChange={e=>setFinancials({...financials, savings:e.target.value})}/></div>
                </div>
                <div className="ffr-calc-footer">
                  <button className="ffr-btn ffr-btn-ghost" onClick={()=>setStep("basics")}><ChevronLeft size={16}/> Back</button>
                  <button className="ffr-btn ffr-btn-primary" disabled={!canSubmitFinancials} onClick={()=>setStep("protection")}>Next <ChevronRight size={16}/></button>
                </div>
              </>
            )}

            {step === "protection" && (
              <>
                <div className="ffr-calc-body">
                  <div className="ffr-field">
                    <label>Do you have term insurance?</label>
                    <div className="ffr-yesno">
                      <button className={protection.termInsurance==="yes"?"active":""} onClick={()=>setProtection(prev=>({...prev, termInsurance:"yes"}))}>Yes, Active Cover</button>
                      <button className={protection.termInsurance==="no"?"active-no":""} onClick={()=>setProtection(prev=>({...prev, termInsurance:"no", termAmount:"0"}))}>No Active Cover</button>
                    </div>
                    {protection.termInsurance === "yes" && (
                      <div className="ffr-subfield ffr-field"><label>Cover amount (₹)</label><input type="number" value={protection.termAmount} onChange={e=>setProtection(prev=>({...prev, termAmount:e.target.value}))}/></div>
                    )}
                  </div>
                  <div className="ffr-grid2">
                    <div className="ffr-field"><label>Planned retirement age</label><input type="number" value={protection.retirementAge} onChange={e=>setProtection(prev=>({...prev, retirementAge:e.target.value}))}/></div>
                    <div className="ffr-field"><label>City</label><input value={protection.city} onChange={e=>setProtection(prev=>({...prev, city:e.target.value}))} placeholder="e.g. Delhi"/></div>
                  </div>
                  <div className="ffr-field">
                    <label>Do you have health insurance?</label>
                    <div className="ffr-yesno">
                      <button className={protection.healthInsurance==="yes"?"active":""} onClick={()=>setProtection(prev=>({...prev, healthInsurance:"yes"}))}>Yes, Active Cover</button>
                      <button className={protection.healthInsurance==="no"?"active-no":""} onClick={()=>setProtection(prev=>({...prev, healthInsurance:"no", healthAmount:"0"}))}>No Active Cover</button>
                    </div>
                    {protection.healthInsurance === "yes" && (
                      <div className="ffr-subfield ffr-field"><label>Cover amount (₹)</label><input type="number" value={protection.healthAmount} onChange={e=>setProtection(prev=>({...prev, healthAmount:e.target.value}))}/></div>
                    )}
                  </div>
                </div>
                <div className="ffr-calc-footer">
                  <button className="ffr-btn ffr-btn-ghost" onClick={()=>setStep("financials")}><ChevronLeft size={16}/> Back</button>
                  <button className="ffr-btn ffr-btn-primary" disabled={!canSubmitProtection} onClick={()=>setStep("goals")}>Next <ChevronRight size={16}/></button>
                </div>
              </>
            )}

            {step === "goals" && (
              <>
                <div className="ffr-calc-body">
                  {goals.map(g => (
                    <div className="ffr-goal-card" key={g.id}>
                      <div className="ffr-goal-top">
                        <span className="tag">{React.createElement(GOAL_META[g.type].Icon, {size:13})} {GOAL_META[g.type].label}</span>
                        <button className="ffr-remove" onClick={()=>removeGoal(g.id)}><Trash2 size={15}/></button>
                      </div>

                      <div className="ffr-field" style={{marginBottom:14}}>
                        <label>Goal type</label>
                        <select value={g.type} onChange={e=>changeGoalType(g.id, e.target.value)}>
                          {Object.entries(GOAL_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </div>

                      {g.type === "education" && (
                        <>
                          <div className="ffr-goal-fields" style={{gridTemplateColumns:"1fr 1fr"}}>
                            <div className="ffr-field" style={{marginBottom:0}}>
                              <label>Child's current class</label>
                              <select value={g.childClass} onChange={e=>updateGoal(g.id,{childClass:e.target.value})}>
                                {Array.from({length:12},(_,i)=>i+1).map(c => <option key={c} value={c}>Class {c}</option>)}
                                <option value={13}>Completed 12th / in UG</option>
                              </select>
                            </div>
                            <div className="ffr-field" style={{marginBottom:0}}><label>UG cost, today's value (₹)</label><input type="number" value={g.ugCost} onChange={e=>updateGoal(g.id,{ugCost:e.target.value})}/></div>
                          </div>
                          <div className="ffr-field" style={{marginTop:14}}>
                            <label>Planning for a Master's degree too?</label>
                            <div className="ffr-yesno">
                              <button className={g.pgPlanned==="yes"?"active":""} onClick={()=>updateGoal(g.id,{pgPlanned:"yes"})}>Yes</button>
                              <button className={g.pgPlanned==="no"?"active":""} onClick={()=>updateGoal(g.id,{pgPlanned:"no", pgCost:""})}>No</button>
                            </div>
                            {g.pgPlanned === "yes" && (
                              <div className="ffr-subfield ffr-field"><label>Master's cost, today's value (₹)</label><input type="number" value={g.pgCost} onChange={e=>updateGoal(g.id,{pgCost:e.target.value})}/></div>
                            )}
                          </div>
                        </>
                      )}

                      {g.type === "marriage" && (
                        <div className="ffr-goal-fields" style={{gridTemplateColumns:"1fr 1fr"}}>
                          <div className="ffr-field" style={{marginBottom:0}}><label>Child's current age</label><input type="number" value={g.childAge} onChange={e=>updateGoal(g.id,{childAge:e.target.value})}/></div>
                          <div className="ffr-field" style={{marginBottom:0}}><label>Marriage cost, today's value (₹)</label><input type="number" value={g.cost} onChange={e=>updateGoal(g.id,{cost:e.target.value})}/></div>
                        </div>
                      )}

                      {(g.type === "house" || g.type === "travel") && (
                        <div className="ffr-goal-fields" style={{gridTemplateColumns:"1fr 1fr"}}>
                          <div className="ffr-field" style={{marginBottom:0}}><label>Years to goal</label><input type="number" value={g.years} onChange={e=>updateGoal(g.id,{years:e.target.value})}/></div>
                          <div className="ffr-field" style={{marginBottom:0}}><label>Today's cost (₹)</label><input type="number" value={g.cost} onChange={e=>updateGoal(g.id,{cost:e.target.value})}/></div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="ffr-add-row">
                    <button className="ffr-add-goal" onClick={()=>setGoals([...goals, newGoal("education")])}><Plus size={14}/> Add education goal</button>
                    <button className="ffr-add-goal" onClick={()=>setGoals([...goals, newGoal("marriage")])}><Plus size={14}/> Add marriage goal</button>
                    <button className="ffr-add-goal" onClick={()=>setGoals([...goals, newGoal("house")])}><Plus size={14}/> Add other goal</button>
                  </div>
                  {saveError && <div className="ffr-error-note">Something went wrong saving your details. Please try again.</div>}
                </div>
                <div className="ffr-calc-footer">
                  <button className="ffr-btn ffr-btn-ghost" onClick={()=>setStep("protection")}><ChevronLeft size={16}/> Back</button>
                  <button className="ffr-btn ffr-btn-primary" disabled={!canSubmitGoals || saving} onClick={handleSubmit}>{saving ? "Saving…" : (editingLeadId ? "Update & See My Gap Report" : "Submit & See My Gap Report")} <ArrowRight size={16}/></button>
                </div>
              </>
            )}

            {step === "existing" && existingLead && (
              <div className="ffr-calc-body">
                <div className="ffr-thankyou" style={{paddingBottom:0}}>
                  <Info size={30} color="var(--gold)"/>
                  <h3 className="ffr-serif">Welcome back, {existingLead.name.split(" ")[0]}</h3>
                  <p>You've already completed this report with this email or mobile number. Here's what's on file — your consultant already has it too.</p>
                </div>
                <ReportBody lead={existingLead} audience="client" />
                <div style={{display:"flex", justifyContent:"center", gap:10, marginTop:20, flexWrap:"wrap"}}>
                  <button className="ffr-btn ffr-btn-primary" onClick={()=>setShowPdfModal(true)}><Printer size={15}/> Print Report Preview</button>
                  <button className="ffr-btn ffr-btn-ghost" onClick={()=>loadForEdit(existingLead)}>Edit Inputs</button>
                  <button className="ffr-btn ffr-btn-ghost" onClick={resetClientFlow}>Done</button>
                </div>
              </div>
            )}

            {step === "report" && submittedLead && (
              <div className="ffr-calc-body">
                <div className="ffr-thankyou" style={{paddingBottom:0}}>
                  <CheckCircle2 size={30} color="var(--sage)"/>
                  <h3 className="ffr-serif">Thank you, {submittedLead.name.split(" ")[0]}!</h3>
                  <p>Here's where you stand today. Your consultant will recommend the right products to close these gaps when you speak.</p>
                </div>
                <ReportBody lead={submittedLead} audience="client" />
                <div style={{display:"flex", justifyContent:"center", gap:10, marginTop:20}}>
                  <button className="ffr-btn ffr-btn-primary" onClick={()=>setShowPdfModal(true)}><Printer size={15}/> Print Report Preview</button>
                  <button className="ffr-btn ffr-btn-ghost" onClick={resetClientFlow}>Done</button>
                </div>
              </div>
            )}
            {showPdfModal && <EnterprisePdfDossier lead={openLead || submittedLead || existingLead} onClose={()=>setShowPdfModal(false)} />}
          </div>
        </div>
      )}

      {/* ================= CONSULTANT / CRM VIEW ================= */}
      {view === "consultant" && (
        <div className="ffr-cv-wrap">
          <div className="ffr-cv-head">
            <div><h2 className="ffr-serif">Client Submissions</h2><p>Full report with product recommendations — for your discovery call only.</p></div>
            <button className="ffr-refresh" onClick={loadLeads}><RefreshCw size={14}/> Refresh</button>
          </div>
          {loadingLeads && <div className="ffr-empty">Loading submissions…</div>}
          {!loadingLeads && leads.length === 0 && <div className="ffr-empty">No client submissions yet. Once a client completes the form, it will appear here.</div>}
          {!loadingLeads && leads.map((lead) => {
            const r = computeReport(lead);
            const termOk = r.termGap <= 0, healthOk = r.healthGap <= 0;
            return (
              <div className="ffr-lead-card" key={lead.id} onClick={()=>setOpenLead(lead)}>
                <div><div className="name">{lead.name}</div><div className="meta">{lead.city} · Age {lead.age} · {lead.mobile} · Submitted {new Date(lead.submittedAt).toLocaleString("en-IN")}{lead.updatedAt && lead.updatedAt !== lead.submittedAt ? ` · Updated ${new Date(lead.updatedAt).toLocaleString("en-IN")}` : ""}</div></div>
                <div className="ffr-lead-badges">
                  {lead.updatedAt && lead.updatedAt !== lead.submittedAt && <span className="ffr-mini-badge ok">Edited</span>}
                  <span className={`ffr-mini-badge ${termOk?"ok":"gap"}`}>{termOk ? <CheckCircle2 size={12}/> : <AlertTriangle size={12}/>} Term</span>
                  <span className={`ffr-mini-badge ${healthOk?"ok":"gap"}`}>{healthOk ? <CheckCircle2 size={12}/> : <AlertTriangle size={12}/>} Health</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {openLead && (() => {
        const lead = openLead;
        return (
          <div className="ffr-modal-backdrop" onClick={()=>setOpenLead(null)}>
            <div className="ffr-modal" onClick={e=>e.stopPropagation()}>
              <div className="ffr-modal-head"><h3 className="ffr-serif">{lead.name}'s Financial Fitness Report</h3><button className="ffr-modal-close" onClick={()=>setOpenLead(null)}><X size={20}/></button></div>
              <div className="ffr-modal-body">
                <ReportBody lead={lead} audience="consultant" />
              </div>
              <div className="ffr-modal-actions">
                <button className="ffr-btn ffr-btn-primary" onClick={()=>setShowPdfModal(true)}><FileText size={15}/> Render 10-Page PDF Dossier</button>
                <button className="ffr-btn ffr-btn-ghost" onClick={()=>setOpenLead(null)}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}

      {view === "client" && step === "landing" && (
        <>
          <div className="ffr-disclaimer">Figures are illustrative, based on standard assumptions (inflation and return rates by goal type, city-tier health baseline, income-multiple term cover) and are not guaranteed except where a product is explicitly guaranteed. Insurance is subject matter of solicitation.</div>
          <div className="ffr-footer">© {new Date().getFullYear()} YourWealthCompass — Replace with your business name & contact details.</div>
        </>
      )}
    </div>
  );
}

/* Small circular score gauge */
function CircleGauge({ value, label, size = 84, color }) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (clamp(value) / 100) * c;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="#E4DDCB" strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div style={{ marginTop: -size/2 - 10, fontFamily:"'IBM Plex Mono',monospace", fontSize: 20, color: "var(--ink)", fontWeight: 600 }}>{clamp(value)}</div>
      <div style={{ fontSize: 11, color: "var(--slate-soft)", textAlign: "center", maxWidth: 90 }}>{label}</div>
    </div>
  );
}

function scoreColor(v) {
  if (v >= 70) return "#4F7A6B";
  if (v >= 40) return "#C9962F";
  return "#A64B3C";
}

/* Shared report body. audience="client" hides specific product/bucket recommendations and shows only
   neutral plan categories + gaps. audience="consultant" adds the specific recommended bucket, amounts
   and a PPF call-out for the discovery call. */
function ReportBody({ lead, audience }) {
  const r = computeReport(lead);
  const isConsultant = audience === "consultant";
  const age = Number(lead.age) || 0;
  const genDate = new Date(lead.updatedAt || lead.submittedAt || Date.now()).toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" });

  const [aiInsight, setAiInsight] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function run() {
      setAiLoading(true);
      try {
        const prompt = `Write exactly 3 short sentences of plain-language financial insight for this client, based only on the numbers below. Be honest and encouraging, never alarmist. Do NOT recommend or name any specific investment product, scheme, or company — comment only on overall readiness and priorities.
Age: ${age}. Retirement age: ${lead.retirementAge}.
Overall Financial Health Score: ${r.scores.overallScore}/100 (Retirement Readiness ${r.scores.retirementReadiness}, Goal Preparedness ${r.scores.goalPreparedness}, Protection Strength ${r.scores.protectionStrength}).
Term insurance gap: ${INR(r.termGap)}. Health insurance gap: ${INR(r.healthGap)}. Emergency fund gap: ${INR(r.emergencyGap)}.
Total annual investment needed across all goals: ${INR(r.totalAnnual)}. Annual surplus available: ${INR(r.annualSurplus)}.
Number of short-term goals (≤4y10m): ${r.rows.filter(x=>x.bucket==="short").length}. Number of long-term goals (5y+): ${r.rows.filter(x=>x.bucket!=="short").length}.`;
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 250, messages: [{ role: "user", content: prompt }] }),
        });
        const data = await response.json();
        const text = ((data && data.content) || []).map((b) => b.text || "").join(" ").trim();
        if (!cancelled) setAiInsight(text || null);
      } catch (e) {
        if (!cancelled) setAiInsight(null);
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id, r.totalAnnual, r.scores.overallScore]);

  return (
    <div className="ffr-report">
      {/* banner */}
      <div className="rpt-banner">
        <div className="rpt-banner-top">
          <span className="rpt-pill">Financial Health Checkup</span>
          <span className="rpt-gen">Generated · {genDate}</span>
        </div>
        <h2 className="ffr-serif">Your Personalised<br/>Wealth Roadmap</h2>
        <p>Small savings today. Big dreams secured tomorrow.</p>
      </div>

      {/* profile + quick stats */}
      <div className="ffr-info-grid">
        <div className="ffr-info-item"><div className="l">Name</div><div className="v">{lead.name}</div></div>
        <div className="ffr-info-item"><div className="l">Age</div><div className="v">{lead.age} yrs</div></div>
        <div className="ffr-info-item"><div className="l">City</div><div className="v">{lead.city}</div></div>
        <div className="ffr-info-item"><div className="l">Retirement Age</div><div className="v">{lead.retirementAge} yrs</div></div>
        <div className="ffr-info-item"><div className="l">Monthly Income</div><div className="v">{INR_L(lead.income)}</div></div>
        <div className="ffr-info-item"><div className="l">Monthly Expenses</div><div className="v">{INR_L(lead.expenses)}</div></div>
        <div className="ffr-info-item"><div className="l">Current Savings</div><div className="v">{INR_L(lead.savings)}</div></div>
        <div className="ffr-info-item"><div className="l">Years to Retirement</div><div className="v">{r.retirement.yearsToRetire} yrs</div></div>
        {isConsultant && <>
          <div className="ffr-info-item"><div className="l">Email</div><div className="v">{lead.email}</div></div>
          <div className="ffr-info-item"><div className="l">Mobile</div><div className="v">{lead.mobile}</div></div>
        </>}
      </div>

      {/* health score */}
      <div className="rpt-score-card">
        <div className="rpt-score-main">
          <div className="rpt-score-num" style={{color: scoreColor(r.scores.overallScore)}}>{r.scores.overallScore}<span>/100</span></div>
          <div className="rpt-score-label">Overall Financial Health Score</div>
          <div className={`rpt-score-tag ${r.scores.overallScore>=70?"good":r.scores.overallScore>=40?"mid":"low"}`}>
            {r.scores.overallScore>=70?"On Track":r.scores.overallScore>=40?"Needs Improvement":"Needs Attention"}
          </div>
        </div>
        <div className="rpt-gauges">
          <CircleGauge value={r.scores.retirementReadiness} label="Retirement Readiness" color={scoreColor(r.scores.retirementReadiness)} />
          <CircleGauge value={r.scores.goalPreparedness} label="Goal Preparedness" color={scoreColor(r.scores.goalPreparedness)} />
          <CircleGauge value={r.scores.protectionStrength} label="Protection Strength" color={scoreColor(r.scores.protectionStrength)} />
        </div>
      </div>
      <div className="ffr-note-strip">This report shows where your money stands today and how much you need to invest each year to reach your goals.</div>

      {/* cost of waiting */}
      {r.costExample && (
        <>
          <div className="rpt-section-title">The Cost of Waiting</div>
          <div className="rpt-cow">
            <div className="rpt-cow-block dark"><div className="l">Today's Cost</div><div className="v">{INR_L(r.costExample.cost)}</div><div className="s">{r.costExample.label}, at today's prices</div></div>
            <div className="rpt-cow-arrow"><ArrowRight size={20} color="var(--gold)"/><span>{EDU_INFLATION}% inflation, {r.costExample.years.toFixed(0)} yrs</span></div>
            <div className="rpt-cow-block light"><div className="l">Future Cost</div><div className="v">{INR_L(r.costExample.fv)}</div><div className="s">the same goal, tomorrow's price</div></div>
          </div>
        </>
      )}

      {/* goals at a glance */}
      <div className="rpt-section-title">Your Goals at a Glance</div>
      <div className="rpt-goal-grid">
        {r.rows.map(row => (
          <div className={`rpt-goal-card ${row.bucket === "short" ? "term-short" : "term-long"}`} key={row.id}>
            <div className="rpt-goal-card-head">{React.createElement(row.Icon,{size:18, color:"var(--ink)"})}<span>{row.label}</span></div>
            <div className="rpt-goal-card-sub">{row.sub}</div>
            <span className={`rpt-term-chip ${row.bucket === "short" ? "short" : "long"}`}>{goalTimeframeLabel(row)}</span>
            <div className="rpt-goal-card-costs">
              <div><div className="l">Today</div><div className="v">{INR_L(row.cost)}</div></div>
              <div><div className="l">Future</div><div className="v gold">{INR_L(row.fv)}</div></div>
            </div>
            {isConsultant && (
              <div className="rpt-consultant-line">
                <span className={`ffr-badge ${row.bucket}`}>
                  {row.bucket==="short" ? "Recommend: RD/FD/SIP" : "Recommend: Guaranteed Plan"}
                  {row.bucket !== "short" && Number(age) < PPF_AGE_LIMIT ? " + PPF" : ""}
                </span>
                <span className="rpt-annual">{INR(row.annual)}/yr</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* retirement */}
      <div className="rpt-section-title">Retirement — Planning a Worry-Free Life</div>
      <div className="ffr-info-grid" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
        <div className="ffr-info-item"><div className="l">Monthly Expense Now</div><div className="v">{INR_L(lead.expenses)}</div></div>
        <div className="ffr-info-item"><div className="l">At Retirement ({RETIREMENT_INFLATION}% infl.)</div><div className="v gold">{INR_L(r.retirement.annualExpenseAtRetirement/12)}</div></div>
        <div className="ffr-info-item dark"><div className="l">Corpus Required</div><div className="v">{INR_L(r.retirement.corpusNeeded)}</div></div>
      </div>
      {isConsultant && (
        <div className="rpt-consultant-line" style={{marginTop:10}}>
          <span className="ffr-badge insurance">Recommend: Guaranteed Plan{Number(age) < PPF_AGE_LIMIT ? " + PPF" : ""}</span>
          <span className="rpt-annual">{INR(r.retirement.annual)}/yr</span>
        </div>
      )}
      <div className="rpt-swp-wrap">
        <div className="rpt-swp-title">Post-Retirement Withdrawal Plan (6.0% Guaranteed Annuity Phase Return)</div>
        <div className="ffr-chart-wrap" style={{height:180}}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={r.swpChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4DDCB" vertical={false}/>
              <XAxis dataKey="age" tick={{fontSize:11, fill:'#6B7280'}} axisLine={{stroke:'#E4DDCB'}} tickLine={false}/>
              <YAxis
                tick={{fontSize:11, fill:'#6B7280'}}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => {
                  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)} Cr`;
                  if (v >= 100000) return `₹${Math.round(v / 100000)} L`;
                  return `₹${v}`;
                }}
              />
              <Tooltip formatter={(v)=>INR_L(v)} contentStyle={{fontSize:12, borderRadius:4, border:'1px solid #E4DDCB'}}/>
              <Area type="monotone" dataKey="balance" stroke="#4F7A6B" fill="#E7EFEC" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <table className="rpt-table">
          <thead><tr><th>Age</th><th>Annual Withdrawal</th><th>Corpus Balance</th></tr></thead>
          <tbody>
            {r.swpTable.map(row => (
              <tr key={row.age}><td>{row.age}</td><td>{INR_L(row.withdrawal)}</td><td className="gold">{INR_L(row.balance)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* protection */}
      <div className="rpt-section-title">Protection — Your Family's Safety Shield</div>
      <div className={`ffr-risk-card ${r.termGap>0?"gap":"ok"}`}>
        <Shield size={20} color={r.termGap>0?"var(--rust)":"var(--sage)"}/>
        <div style={{flex:1}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <h4>Term Life Insurance</h4>
            <span className={`rpt-gap-chip ${r.termGap>0?"gap":"ok"}`}>{r.termGap>0 ? `Gap ${INR_L(r.termGap)}` : "Sufficient"}</span>
          </div>
          <p>Current cover: {lead.termInsurance==="yes" ? INR_L(lead.termAmount) : "₹0"} · Recommended: {INR_L(r.recommendedCover)}</p>
        </div>
      </div>
      <div className={`ffr-risk-card ${r.healthGap>0?"gap":"ok"}`}>
        <HeartPulse size={20} color={r.healthGap>0?"var(--rust)":"var(--sage)"}/>
        <div style={{flex:1}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <h4>Health Insurance</h4>
            <span className={`rpt-gap-chip ${r.healthGap>0?"gap":"ok"}`}>{r.healthGap>0 ? `Gap ${INR_L(r.healthGap)}` : "Sufficient"}</span>
          </div>
          <p>Current cover: {lead.healthInsurance==="yes" ? INR_L(lead.healthAmount) : "₹0"} · Recommended: {INR_L(r.healthTarget)}</p>
        </div>
      </div>
      <div className={`ffr-risk-card ${r.emergencyGap>0?"gap":"ok"}`}>
        <PiggyBank size={20} color={r.emergencyGap>0?"var(--rust)":"var(--sage)"}/>
        <div style={{flex:1}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <h4>Emergency Fund</h4>
            <span className={`rpt-gap-chip ${r.emergencyGap>0?"gap":"ok"}`}>{r.emergencyGap>0 ? `Build ${INR_L(r.emergencyGap)}` : "Sufficient"}</span>
          </div>
          <p>Current: {INR_L(r.emergencyCurrent)} · Required ({EMERGENCY_MONTHS} months): {INR_L(r.emergencyTarget)}</p>
        </div>
      </div>

      {/* summary page */}
      <div className="rpt-section-title">Summary — Your Goals & Required Investment</div>
      <table className="rpt-table" style={{marginBottom:16}}>
        <thead><tr><th>Goal</th><th>At Age</th><th>Years Left</th><th>Annual Investment</th></tr></thead>
        <tbody>
          {[...r.rows.map(row => ({ label: row.label, years: row.years })), { label: "Retirement", years: r.retirement.yearsToRetire }]
            .sort((a,b) => a.years - b.years)
            .map((g, i) => {
              const row = r.rows.find(x => x.label === g.label) || null;
              const annual = row ? row.annual : r.retirement.annual;
              return (
                <tr key={i}><td>{g.label}</td><td>{age + Math.round(g.years)}</td><td>{g.years.toFixed(1)} yrs</td><td className="gold">{INR_L(annual)}</td></tr>
              );
            })}
        </tbody>
      </table>

      <div className="rpt-summary-charts">
        <div className="ffr-chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={r.distribution} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                {r.distribution.map((d,i) => <Cell key={i} fill={["#24396A","#4F7A6B","#C9962F","#A64B3C","#6B7280","#B4620E"][i % 6]}/>)}
              </Pie>
              <Tooltip formatter={(v)=>INR(v)+"/yr"} contentStyle={{fontSize:12, borderRadius:4, border:'1px solid #E4DDCB'}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="ffr-chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...r.rows.map(row => ({ name: row.label.split(" ")[0], annual: Math.round(row.annual), bucket: row.bucket })), { name: "Retire", annual: Math.round(r.retirement.annual), bucket: "insurance" }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4DDCB" vertical={false}/>
              <XAxis dataKey="name" tick={{fontSize:11, fill:'#6B7280'}} axisLine={{stroke:'#E4DDCB'}} tickLine={false}/>
              <YAxis tick={{fontSize:11, fill:'#6B7280'}} axisLine={false} tickLine={false} tickFormatter={(v)=>`₹${Math.round(v/1000)}k`}/>
              <Tooltip formatter={(v)=>INR(v)+"/yr"} contentStyle={{fontSize:12, borderRadius:4, border:'1px solid #E4DDCB'}}/>
              <Bar dataKey="annual" radius={[3,3,0,0]}>
                {[...r.rows, { bucket: "insurance" }].map((row,i) => <Cell key={i} fill={isConsultant ? (row.bucket==="short" ? "#4F7A6B" : "#A64B3C") : "#24396A"}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="ffr-total-row"><span className="lbl">Total annual investment needed</span><span className="val">{INR_L(r.totalAnnual)}</span></div>
      {r.totalAnnual > r.annualSurplus ? (
        <div className="ffr-surplus-warn">This is {INR_L(r.totalAnnual - r.annualSurplus)} more than your current annual surplus ({INR_L(r.annualSurplus)}).</div>
      ) : (
        <div className="ffr-surplus-ok">Your annual surplus of {INR_L(r.annualSurplus)} covers this, with {INR_L(r.annualSurplus - r.totalAnnual)} to spare.</div>
      )}

      <div className="ffr-note-strip">
        {isConsultant
          ? "Recommendation badges and amounts above are for your discovery call only — do not share the specific product/bucket labels with the client."
          : "This shows the gap only. Your consultant will recommend the specific plan that best fits your risk appetite."}
      </div>

      <div className="rpt-section-title">AI-Generated Insight</div>
      <div className="rpt-ai-box">
        <div className="rpt-ai-head"><Sparkles size={15} color="var(--gold)"/> Personalised summary</div>
        {aiLoading && <div className="rpt-ai-loading">Generating your personalised insight…</div>}
        {!aiLoading && aiInsight && <p>{aiInsight}</p>}
        {!aiLoading && !aiInsight && <p className="rpt-ai-fallback">AI insight unavailable right now — your consultant can walk you through the numbers above.</p>}
      </div>

      <div className="rpt-assumptions">
        <div><span>{SHORT_TERM_RETURN}%</span>Short-term return (≤4y10m)</div>
        <div><span>{GUARANTEED_RETURN}%</span>Guaranteed plan return (5y+)</div>
        <div><span>{SWP_RETURN}%</span>Post-retirement return</div>
        <div><span>{EDU_INFLATION}%</span>Education inflation</div>
        <div><span>{MARRIAGE_INFLATION}%</span>Marriage inflation</div>
        <div><span>{RETIREMENT_INFLATION}%</span>Retirement inflation</div>
      </div>
      <div className="ffr-disclaimer" style={{padding:"16px 0 0"}}>This report is for informational purposes only and does not constitute financial, tax or investment advice. Projections are based on the assumptions above; actual results may vary.</div>
    </div>
  );
}
