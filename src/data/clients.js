export const clients = [
  {
    id: "C003",
    name: "David & Sarah Chen",
    lastReview: "Oct 2025",
    nextReview: "2026-02-18",
    status: "Active",
    profile: {
      david: { age: 49, job: "Investment Banking Director", income: 245000 },
      sarah: { age: 47, job: "Arts Council Senior Manager", income: 72000 },
      children: [{ name: "Oliver", age: 16 }, { name: "Sophie", age: 13 }],
      location: "Richmond, TW9 1PQ"
    },
    financials: {
      combinedIncome: 317000,
      netWorth: 2850000,
      assets: {
        isa: 328200,
        savings: 125000,
        pensions: 859000, 
        premiumBonds: 50000,
        shareOptions: 235000,
        wine: 45000,
        juniorIsa: 50500
      },
      liabilities: {
        mortgage: 285000,
        rate: 0.0289,
        expiry: "2026-05"
      },
      isaAllowance: { david: 14600, sarah: 8200 } 
    },
    risks: [
      { type: "high", text: "Mortgage expires May 2026 (4 months)" },
      { type: "medium", text: "High equity allocation (75/25) approaching 55" },
      { type: "medium", text: "Sarah CI gap pending re-quote" }
    ],
    opportunities: [
      { text: "David bonus £60k expected March" },
      { text: "School fees ending 2031 (£72k/year freed)" }
    ]
  },
  {
    id: "C009",
    name: "Brian Potter",
    lastReview: "Jan 2026",
    nextReview: "2027-02-14",
    status: "Active",
    profile: {
      brian: { age: 68, job: "Retired Engineering Director", income: 52400 },
      status: "Widowed",
      children: [{ name: "Sarah", age: 39 }, { name: "Andrew", age: 36 }],
      location: "Guildford, GU2 9SD"
    },
    financials: {
      combinedIncome: 52400,
      netWorth: 1150000,
      assets: {
        isa: 285000,
        savings: 95000,
        pensions: 0, /* DB only */
        investments: 48000,
        inheritedIsa: 47000,
        premiumBonds: 50000
      },
      liabilities: { mortgage: 0 },
      isaAllowance: { brian: 20000 }
    },
    risks: [
      { type: "medium", text: "Emotional wellbeing / Isolation" },
      { type: "low", text: "Portfolio too conservative (40/60)" }
    ],
    opportunities: [
      { text: "Margaret's ISA transfer (£47k)" },
      { text: "Downsizing potential (release £200k+)" }
    ]
  },
  {
    id: "C011",
    name: "Keith & Maureen Lard",
    lastReview: "Jan 2026",
    nextReview: "2027-02-25",
    status: "Active",
    profile: {
      keith: { age: 65, job: "Mgmt Consultant", income: 95000 },
      maureen: { age: 63, job: "Retired Teacher", income: 22500 },
      children: 3,
      grandchildren: 5,
      location: "Dorking, RH4 2LP"
    },
    financials: {
      combinedIncome: 117500,
      netWorth: 3250000,
      assets: {
        isa: 610000,
        savings: 95000,
        pensions: 875000, /* Keith only, Maureen on DB */
        premiumBonds: 50000,
        propertyMain: 1200000,
        propertyHoliday: 280000
      },
      liabilities: { mortgage: 0 },
      isaAllowance: { keith: 12000, maureen: 20000 }
    },
    risks: [
      { type: "critical", text: "Keith retirement in 3 months - Withdrawal plan needed" },
      { type: "high", text: "IHT exposure ~£2.7m above nil rate bands" }
    ],
    opportunities: [
      { text: "Pension Tax Free Cash (£218k)" },
      { text: "Gifting strategy for 5 grandchildren" }
    ]
  },
  {
    id: "C008",
    name: "Lisa & Ahmed Rahman",
    lastReview: "Jan 2026",
    nextReview: "2027-03-15",
    status: "Active",
    profile: {
      lisa: { age: 37, job: "Digital Marketing Manager", income: 58000 },
      ahmed: { age: 39, job: "Civil Engineer", income: 52000 },
      children: [{ name: "Amelia", age: 4 }, { name: "Infant", age: 0 }],
      location: "Epsom, KT19 8QR"
    },
    financials: {
      combinedIncome: 110000,
      netWorth: 485000,
      assets: {
        isa: 41000,
        savings: 28000,
        pensions: 57000,
        juniorIsa: 6400
      },
      liabilities: {
        mortgage: 298000,
        rate: 0.0415,
        expiry: "2027-12"
      },
      isaAllowance: { lisa: 18400, ahmed: 19400 }
    },
    risks: [
      { type: "critical", text: "Ahmed NO Income Protection" },
      { type: "high", text: "Retirement shortfall trajectory" },
      { type: "medium", text: "No Family Income Benefit" }
    ],
    opportunities: [
      { text: "Completed emergency fund goal (nearly)" },
      { text: "Ahmed pension consolidation" }
    ]
  },
  {
    id: "C004",
    name: "Emma Thompson",
    lastReview: "Jan 2026",
    nextReview: "2027-03-12",
    status: "Active",
    profile: {
      emma: { age: 46, job: "Pharma Sales Director", income: 135000 },
      status: "Single",
      location: "Clapham, SW4 8PT"
    },
    financials: {
      combinedIncome: 135000,
      netWorth: 685000,
      assets: {
        isa: 95600,
        savings: 48000,
        pensions: 313000,
        premiumBonds: 20000
      },
      liabilities: {
        mortgage: 185000,
        rate: 0.0379,
        expiry: "2027-03"
      },
      isaAllowance: { emma: 20000 }
    },
    risks: [
      { type: "high", text: "Mortgage expiry March 2027 (refinance needed)" },
      { type: "medium", text: "100% Equity ISA allocation (Aggressive)" },
      { type: "medium", text: "Mother's potential care costs" }
    ],
    opportunities: [
      { text: "Tax Optimization (Pension sacrifice to <£125k)" },
      { text: "Max out ISA (£20k capacity)" }
    ]
  },
  {
    id: "C005",
    name: "Priya & Anil Patel",
    lastReview: "Jan 2026",
    nextReview: "2027-01-28",
    status: "Active",
    profile: {
      priya: { age: 40, job: "NHS GP Partner", income: 95000 },
      anil: { age: 42, job: "Data Consultant", income: 93000 },
      children: 3,
      location: "Surbiton, KT6 4DP"
    },
    financials: {
      combinedIncome: 188000,
      netWorth: 975000,
      assets: {
        isa: 84000,
        savings: 32000, /* Joint */
        emergency: 18000,
        pensions: 172000, /* Anil only counted here + Priya DB */
        juniorIsa: 25400,
        companyReserves: 45000
      },
      liabilities: {
        mortgage: 245000,
        rate: 0.0345,
        expiry: "2026-10"
      },
      isaAllowance: { priya: 11800, anil: 4200 }
    },
    risks: [
      { type: "critical", text: "Anil NO Income Protection" },
      { type: "high", text: "Mortgage expires Oct 2026 (Urgent)" },
      { type: "medium", text: "Emergency fund below target (£30k)" }
    ],
    opportunities: [
      { text: "Zara starting school (saves £9,600/yr)" },
      { text: "Anil company tax extraction optimization" }
    ]
  }
];
