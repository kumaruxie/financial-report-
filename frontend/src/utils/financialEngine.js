import { GraduationCap, Heart, Home, Plane, Shield, PiggyBank, HeartPulse, AlertTriangle } from "lucide-react";

/* ---------------- constants & assumptions ---------------- */
export const EDU_INFLATION = 8;        // 6.5–8% band requested, education at the upper end
export const MARRIAGE_INFLATION = 7;   // mid-band
export const RETIREMENT_INFLATION = 7;   // 7% inflation assumption
export const HOUSE_INFLATION = 7;
export const TRAVEL_INFLATION = 6;
export const MARRIAGE_AGE = 26.5;      // midpoint of the 25–28 "good marriage age" band
export const UG_DURATION = 3.5;        // midpoint of 3–4 years
export const LIFE_EXPECTANCY = 85;     // standard planning assumption for corpus longevity
export const SHORT_TERM_RETURN = 8;    // blended RD/FD/SIP, short-term goals
export const SHORT_TERM_MAX_YEARS = 4 + 10/12; // up to 4 yrs 10 months = short-term; 5 yrs+ = long-term
export const GUARANTEED_RETURN = 6;    // guaranteed-return insurance plan, goals >5 years
export const SWP_RETURN = 8;           // 8% post-retirement withdrawal-phase return
export const EMERGENCY_MONTHS = 9;     // months of expenses held as an emergency buffer
export const PPF_AGE_LIMIT = 35;       // PPF suggested as an additional long-term option below this age

export const METROS = [
  "delhi", "mumbai", "bangalore", "bengaluru", "chennai", "kolkata", 
  "hyderabad", "pune", "ahmedabad", "gurgaon", "gurugram", "noida"
];

export const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));

export const GOAL_META = {
  education: { label: "Child's Higher Education", Icon: GraduationCap },
  marriage:  { label: "Child's Marriage",         Icon: Heart },
  house:     { label: "Dream House",               Icon: Home },
};

export const GOAL_TYPES = GOAL_META;

export const TYPE_DEFAULTS = {
  education: { childClass: 8, ugCost: 800000, pgPlanned: "no", pgCost: "" },
  marriage:  { childAge: 5, cost: 1500000 },
  house:     { years: 5, cost: 4000000 },
};

export const DEFAULT_GOALS = [];

export const INR = (n) => "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");

export const INR_L = (n) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 10000000) return "₹" + (v / 10000000).toFixed(2) + " Cr";
  if (Math.abs(v) >= 100000) return "₹" + (v / 100000).toFixed(2) + " L";
  return INR(v);
};

export const INR_EXACT = INR;

/* ---------------- core formulas ---------------- */
// Future value: FV = PV x (1+i)^n
export function futureValue(pv, inflationPct, years) {
  return (Number(pv) || 0) * Math.pow(1 + (Number(inflationPct) || 0) / 100, Math.max(0, Number(years) || 0));
}

// Annual SIP/RD/premium required (annuity-due, annual compounding)
export function annualRequired(fv, annualReturnPct, years) {
  const r = (Number(annualReturnPct) || 0) / 100;
  const n = Math.max(1, Math.round(Number(years) || 1));
  if (r === 0) return fv / n;
  return fv / (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
}

export function coverMultiplier(age) {
  const a = Number(age) || 0;
  if (a <= 35) return 20;
  if (a <= 45) return 15;
  if (a <= 55) return 10;
  return 8;
}

export function healthBaseline(city, age) {
  const isMetro = METROS.includes((city || "").trim().toLowerCase());
  let base = isMetro ? 1000000 : 500000;
  if (Number(age) > 45) base += 300000;
  return base;
}

export function computeRetirement(age, retirementAge, monthlyExpenses) {
  const yearsToRetire = Math.max(1, (Number(retirementAge) || 60) - (Number(age) || 0));
  const postRetireYears = Math.max(1, LIFE_EXPECTANCY - (Number(retirementAge) || 60));
  const annualExpenseAtRetirement = futureValue((Number(monthlyExpenses) || 0) * 12, RETIREMENT_INFLATION, yearsToRetire);
  const realReturn = (1 + GUARANTEED_RETURN / 100) / (1 + RETIREMENT_INFLATION / 100) - 1;
  const corpusNeeded = realReturn > 0
    ? annualExpenseAtRetirement * ((1 - Math.pow(1 + realReturn, -postRetireYears)) / realReturn) * (1 + realReturn)
    : annualExpenseAtRetirement * postRetireYears;
  const annual = annualRequired(corpusNeeded, GUARANTEED_RETURN, yearsToRetire);
  return { yearsToRetire, postRetireYears, corpusNeeded, annualExpenseAtRetirement, annual };
}

export function simulateSWP(corpusNeeded, annualExpenseAtRetirement, retirementAge, postRetireYears) {
  const table = [], chart = [];
  let opening = Number(corpusNeeded) || 0;
  let baseExpense = Number(annualExpenseAtRetirement) || 0;
  const retAge = Number(retirementAge) || 60;
  const n = Math.max(1, Number(postRetireYears) || 25);
  const returnRate = (Number(SWP_RETURN) || 8) / 100;
  const inflRate = (Number(RETIREMENT_INFLATION) || 7) / 100;

  for (let y = 0; y <= n; y++) {
    const currentAge = retAge + y;
    const withdrawal = y === 0 ? baseExpense : baseExpense * Math.pow(1 + inflRate, y);
    const returnAmount = opening * returnRate;
    const netChange = returnAmount - withdrawal;
    const closing = Math.max(0, opening + netChange);

    const point = {
      age: currentAge,
      year: y,
      opening: Math.round(opening),
      returnAmount: Math.round(returnAmount),
      withdrawal: Math.round(withdrawal),
      netChange: Math.round(netChange),
      closing: Math.round(closing),
      balance: Math.round(closing),
    };

    chart.push(point);
    if (y % 5 === 0 || y === n) {
      table.push(point);
    }

    opening = closing;
  }

  const firstYearWithdrawal = chart[0]?.withdrawal || 0;
  const finalYearWithdrawal = chart[chart.length - 1]?.withdrawal || 0;
  const finalClosingCorpus = chart[chart.length - 1]?.closing || 0;
  const realRate = ((1 + returnRate) / (1 + inflRate) - 1) * 100;

  return {
    table,
    chart,
    kpi: {
      initialCorpus: corpusNeeded,
      firstYearWithdrawal,
      finalYearWithdrawal,
      finalClosingCorpus,
      realRate: realRate.toFixed(1),
      isSustainable: finalClosingCorpus > 0,
    }
  };
}

export function goalTimeframeLabel(row) {
  return row.bucket === "short" ? "Short-Term Goal (≤ 4y 10m)" : "Long-Term Goal (5y+)";
}

export function buildGoalRows(goals) {
  const rows = [];
  const list = Array.isArray(goals) ? goals : [];
  
  list.forEach((g) => {
    if (g.type === "education") {
      const yearsTo12th = Math.max(0, 12 - (Number(g.childClass) || 12));
      const ugFV = futureValue(Number(g.ugCost || g.cost) || 0, EDU_INFLATION, yearsTo12th);
      const ugBucket = yearsTo12th <= SHORT_TERM_MAX_YEARS ? "short" : "insurance";
      const ugRate = ugBucket === "short" ? SHORT_TERM_RETURN : GUARANTEED_RETURN;
      const ugAnnual = annualRequired(ugFV, ugRate, Math.max(yearsTo12th, 0.1));
      rows.push({
        id: (g.id || Math.random()) + "-ug",
        groupId: g.id,
        type: "education",
        Icon: GraduationCap,
        label: "Under-graduation",
        sub: `starts in ${yearsTo12th} yr${yearsTo12th === 1 ? "" : "s"} (after Class 12)`,
        years: yearsTo12th,
        cost: Number(g.ugCost || g.cost) || 0,
        fv: ugFV,
        bucket: ugBucket,
        annual: ugAnnual,
        monthly: ugAnnual / 12,
      });

      if (g.pgPlanned === "yes") {
        const pgYears = yearsTo12th + UG_DURATION;
        const pgFV = futureValue(Number(g.pgCost) || 0, EDU_INFLATION, pgYears);
        const pgBucket = pgYears <= SHORT_TERM_MAX_YEARS ? "short" : "insurance";
        const pgRate = pgBucket === "short" ? SHORT_TERM_RETURN : GUARANTEED_RETURN;
        const pgAnnual = annualRequired(pgFV, pgRate, pgYears);
        rows.push({
          id: (g.id || Math.random()) + "-pg",
          groupId: g.id,
          type: "education",
          Icon: GraduationCap,
          label: "Masters",
          sub: `starts in ~${pgYears.toFixed(1)} yrs (after UG)`,
          years: pgYears,
          cost: Number(g.pgCost) || 0,
          fv: pgFV,
          bucket: pgBucket,
          annual: pgAnnual,
          monthly: pgAnnual / 12,
        });
      }
    } else if (g.type === "marriage") {
      const childAge = Number(g.childAge) || 0;
      const years = Math.max(0.5, MARRIAGE_AGE - childAge);
      const fv = futureValue(Number(g.cost) || 0, MARRIAGE_INFLATION, years);
      const bucket = years <= SHORT_TERM_MAX_YEARS ? "short" : "insurance";
      const rate = bucket === "short" ? SHORT_TERM_RETURN : GUARANTEED_RETURN;
      const annual = annualRequired(fv, rate, years);
      rows.push({
        id: String(g.id || Math.random()),
        groupId: g.id,
        type: "marriage",
        Icon: Heart,
        label: "Child's Marriage",
        sub: `at target marriage age ~${MARRIAGE_AGE}, in ${years.toFixed(1)} yrs`,
        years,
        cost: Number(g.cost) || 0,
        fv,
        bucket,
        annual,
        monthly: annual / 12,
      });
    } else {
      const meta = GOAL_META[g.type] || { label: g.label || "Life Goal", Icon: Home };
      const inflation = HOUSE_INFLATION;
      const years = Number(g.years) || 0;
      const fv = futureValue(Number(g.cost) || 0, inflation, years);
      const bucket = years <= SHORT_TERM_MAX_YEARS ? "short" : "insurance";
      const rate = bucket === "short" ? SHORT_TERM_RETURN : GUARANTEED_RETURN;
      const annual = annualRequired(fv, rate, Math.max(years, 0.1));
      rows.push({
        id: String(g.id || Math.random()),
        groupId: g.id,
        type: g.type,
        Icon: meta.Icon,
        label: meta.label,
        sub: `${years} yrs away`,
        years,
        cost: Number(g.cost) || 0,
        fv,
        bucket,
        annual,
        monthly: annual / 12,
      });
    }
  });

  return rows;
}

export function computeReport(lead) {
  if (!lead) return null;

  const age = Number(lead.age) || 0;
  const retirementAge = Number(lead.retirementAge) || 60;
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

  // REALISTIC & ACCURATE SCORE COMPUTATION MATH:
  // 1. Retirement Readiness: surplus coverage of required retirement SIP + liquid savings buffer ratio
  const monthlyRetirementReq = (retirement.annual || 0) / 12;
  const retSurplusCoverage = monthlyRetirementReq > 0 ? Math.min(1.0, Math.max(0, monthlySurplus * 0.5) / monthlyRetirementReq) : 1.0;
  const retSavingsBuffer = Math.min(1.0, savings / Math.max(1, income * 6));
  const retirementReadiness = clamp(Math.round((retSurplusCoverage * 70) + (retSavingsBuffer * 30)));

  // 2. Goal Preparedness: surplus ratio available for annual goal funding + existing savings backing
  const goalSurplusCoverage = goalsAnnual > 0 ? Math.min(1.0, Math.max(0, annualSurplus) / goalsAnnual) : 1.0;
  const goalPreparedness = clamp(Math.round((goalSurplusCoverage * 65) + (retSavingsBuffer * 35)));

  // 3. Protection Strength: term & health insurance gap coverage
  const termRatio = recommendedCover > 0 ? Math.min(1.0, currentTerm / recommendedCover) : (currentTerm > 0 ? 1.0 : 0);
  const healthRatio = healthTarget > 0 ? Math.min(1.0, currentHealth / healthTarget) : (currentHealth > 0 ? 1.0 : 0);
  const protectionStrength = clamp(Math.round((termRatio * 60 + healthRatio * 40) * 100));

  // Overall Financial Health Score (Weighted average)
  const overallScore = clamp(Math.round((retirementReadiness * 0.35) + (goalPreparedness * 0.35) + (protectionStrength * 0.30)));

  // Priority Ranking Engine
  const priorities = [];
  if (termGap > 0 || healthGap > 0) {
    const termExplanation = currentTerm > 0
      ? `Active Term Cover: ${INR_L(currentTerm)} (Recommended Top-Up: ${INR_L(termGap)})`
      : `Term Cover Gap: ${INR_L(termGap)}`;
    const healthExplanation = currentHealth > 0
      ? `Active Health Cover: ${INR_L(currentHealth)} (Recommended Top-Up: ${INR_L(healthGap)})`
      : `Health Cover Gap: ${INR_L(healthGap)}`;

    priorities.push({
      level: 1,
      tag: currentTerm > 0 || currentHealth > 0 ? "PRIORITY 1: TOP-UP COVER NEEDED" : "PRIORITY 1: URGENT ACTION",
      title: "Risk Protection Shield Top-Up",
      type: "protection",
      desc: `Your active insurance cover provides a great baseline. To fully protect your income (15x HLV rule) and future goals, an additional top-up is recommended (${termGap > 0 ? termExplanation : ""}${termGap > 0 && healthGap > 0 ? " | " : ""}${healthGap > 0 ? healthExplanation : ""}).`,
      color: "#F87171",
      bgColor: "rgba(239, 68, 68, 0.12)",
      borderColor: "rgba(239, 68, 68, 0.35)"
    });
  }
  priorities.push({
    level: priorities.length + 1,
    tag: `PRIORITY ${priorities.length + 1}: HIGH IMPORTANCE`,
    title: "Retirement Foundation",
    type: "retirement",
    desc: `Build your ${INR_L(retirement.corpusNeeded)} corpus target over ${retirement.yearsToRetire} years with a monthly SIP of ${INR_L(Math.round(retirement.annual / 12))}/mo.`,
    color: "var(--accent-gold)",
    bgColor: "rgba(201, 154, 75, 0.12)",
    borderColor: "rgba(201, 154, 75, 0.35)"
  });
  if (rows.length > 0) {
    priorities.push({
      level: priorities.length + 1,
      tag: `PRIORITY ${priorities.length + 1}: SCHEDULED TARGETS`,
      title: "Milestone Life Goals",
      type: "goals",
      desc: `Fund ${rows.length} milestone goals requiring total annual investment of ${INR_L(Math.round(goalsAnnual))}/yr.`,
      color: "var(--accent-teal)",
      bgColor: "rgba(95, 168, 160, 0.12)",
      borderColor: "rgba(95, 168, 160, 0.35)"
    });
  }

  // Cost of waiting example
  const costExample = rows.length ? rows.reduce((a, b) => (b.fv > a.fv ? b : a), rows[0]) : null;

  // Distribution of annual investment
  const distribution = [
    ...rows.map((row) => ({ name: row.label, value: Math.round(row.annual) })),
    { name: "Retirement", value: Math.round(retirement.annual) },
  ].filter((d) => d.value > 0);

  return {
    rows,
    retirement,
    swpTable: swp.table,
    swpChartData: swp.chart,
    swpKpi: swp.kpi,
    swpSchedule: swp.table.map(t => ({ age: t.age, openingCorpus: t.opening, returnAmount: t.returnAmount, annualWithdrawal: t.withdrawal, remainingCorpus: t.closing })),
    distribution,
    goalsAnnual,
    totalAnnual,
    monthlySurplus,
    annualSurplus,
    recommendedCover,
    currentTerm,
    termGap,
    healthTarget,
    currentHealth,
    healthGap,
    emergencyTarget,
    emergencyCurrent,
    emergencyGap,
    scores: { retirementReadiness, goalPreparedness, protectionStrength, overallScore },
    priorities,
    costExample,
  };
}
