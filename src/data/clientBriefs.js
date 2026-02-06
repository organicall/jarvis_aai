export const clientBriefs = {
  C003: {
    meetingDetails: { date: '18 Feb 2026, 10:00 AM', location: 'Office', type: 'Annual Review' },
    summary:
      "David (49) is a high-intensity investment banking director and Sarah (47) is a senior Arts Council manager; they are focused on family stability and retiring in 9 years. Key themes are mortgage expiry in May 2026, tax optimisation on David's income/bonus, and the planned Provence property purchase.",
    financialSnapshot: {
      netWorth: '£2.85m',
      income: '£317k combined',
      assets:
        'Richmond townhouse (£1.65m), ISAs £328k, pensions £859k+ (DB/SIPP), savings £125k, share options £235k, wine £45k, JISAs £50.5k',
      liabilities: 'Mortgage £285k @ 2.89% fixed to May 2026',
      riskProfile: 'Equity heavy (~75/25) approaching retirement'
    },
    goals: [
      { text: 'Retire David 58 / Sarah 57 with £120k/year income', why: 'Reduce work stress and maintain lifestyle' },
      { text: 'French property in Provence (£400k) in 3–5 years', why: 'Lifestyle goal with family focus' },
      { text: 'Fund university costs (£40k per child) and school fees', why: 'Education security for Oliver and Sophie' }
    ],
    criticalItems: [
      { text: 'Remortgage decision for £285k loan (expires May 2026)', urgency: 'Critical', deadline: 'Before May 2026', reason: 'Rate expiry and future property plans' },
      { text: 'Sarah CI re-quote (£150k) postponed due to hypertension', urgency: 'High', deadline: 'Re-quote in 2026', reason: 'Protection gap' },
      { text: 'Tax planning for high income and bonus', urgency: 'High', deadline: 'Before tax year end', reason: 'Loss of personal allowance and 45% band' }
    ],
    opportunities: [
      { heading: 'Bonus strategy', text: 'Use VCT + ISA + pension carry-forward for tax relief' },
      { heading: 'Pension optimisation', text: "David pension already increased; consider further planning for adjusted income" },
      { heading: 'School fees end 2031', text: '£72k/year cashflow released for retirement/property goals' }
    ],
    risks: [
      { heading: 'Career/Income risk', text: 'David considering lower-paid consulting role' },
      { heading: 'Currency/Property risk', text: 'Provence purchase adds FX and maintenance exposure' },
      { heading: 'Market risk', text: '£1m+ equities; de-risking to 60/40 by age 55' }
    ],
    talkingPoints: [
      {
        topic: 'Mortgage options',
        script: 'Your fix ends in May 2026. Shall we compare the 5-year (4.1%) vs 10-year (4.4%) options and how each impacts the Provence plan?'
      },
      {
        topic: 'Tax planning',
        script: "David, your adjusted income is still in the 45% band. We can map VCT, ISA, and pension carry-forward to reduce the drag on bonuses."
      },
      {
        topic: 'Protection gap',
        script: "Sarah, the CI re-quote is still outstanding. Are you comfortable if we push this to completion this quarter?"
      }
    ],
    emailTemplate:
      'Subject: Meeting Summary – Mortgage & Tax Planning\n\nDear David and Sarah,\n\nThank you for today. Summary of agreed actions:\n\n1) Mortgage – review 5-year vs 10-year fix and impact on Provence purchase\n2) Tax planning – map VCT/ISA/pension carry-forward for upcoming bonus\n3) Protection – proceed with Sarah CI re-quote\n\nI will send the mortgage comparison and updated tax plan before our next touchpoint.\n\nBest regards,\nJonathan'
  },
  C004: {
    meetingDetails: { date: '12 Mar 2027, 2:00 PM', location: 'Office', type: 'Annual Review' },
    summary:
      'Emma (46) is a high-earning pharma sales director with strong savings discipline and no dependants. Key themes are property/relationship decisions with Tom, mother’s care planning, and tax optimisation around commission and pensions.',
    financialSnapshot: {
      netWorth: '£685k',
      income: '£135k (salary + commission + car allowance)',
      assets: 'ISA £95.6k (100% equities), pensions £313k, savings £48k, premium bonds £20k, flat £495k',
      liabilities: 'Mortgage £185k @ 3.79% fixed to Mar 2027',
      riskProfile: 'High equity ISA allocation; good protection in place'
    },
    goals: [
      { text: 'Retire at 60 with £50k/year income', why: 'Long-term security with flexibility' },
      { text: 'Fund a career break at 50 (£60k pot)', why: 'Reduce burnout risk' },
      { text: 'Trade up to 3-bed house in 1–2 years', why: 'Lifestyle upgrade with partner options' }
    ],
    criticalItems: [
      { text: 'LPA registration (forms completed)', urgency: 'High', deadline: '2026', reason: 'Legal protection' },
      { text: 'Mother’s care planning', urgency: 'High', deadline: '2026', reason: 'Early dementia progressing' },
      { text: 'Property/relationship decision', urgency: 'Medium', deadline: '12–18 months', reason: 'Joint purchase scenarios' }
    ],
    opportunities: [
      { heading: 'Bonus sacrifice', text: 'Consider £10k commission sacrifice to pension (45% relief)' },
      { heading: 'Property scenarios', text: 'Short-term move-in and rent options improve monthly cashflow' },
      { heading: 'Sabbatical pot', text: '£800/month target achieves £60k by age 50' }
    ],
    risks: [
      { heading: 'Care costs', text: 'Mother’s care could require £2k/month contribution' },
      { heading: 'Relationship assets', text: 'Cohabitation without agreement creates legal grey areas' },
      { heading: 'Burnout risk', text: 'High-pressure role; career break likely necessary' }
    ],
    talkingPoints: [
      {
        topic: 'Property decision',
        script: 'Let’s compare the three scenarios with Tom and confirm which feels realistic for the next 12–18 months.'
      },
      {
        topic: 'Care planning',
        script: 'Your mother’s situation is progressing; can we agree a funding approach and whether LTC insurance is worth exploring?'
      },
      {
        topic: 'Tax optimisation',
        script: 'Your commission offers a chance to reduce 45% tax via pension sacrifice—shall we set an annual target?'
      }
    ],
    emailTemplate:
      'Subject: Summary – Property Options & Care Planning\n\nHi Emma,\n\nKey points from today:\n\n1) Property/relationship: review scenario A/B/C and decide the 12–18 month plan\n2) LPA registration: submit completed forms in 2026\n3) Mother’s care: agree a funding strategy and whether LTC cover is suitable\n4) Tax: consider £10k commission sacrifice to pension\n\nI will send the scenario comparison and next-step checklist shortly.\n\nBest,\nJonathan'
  },
  C005: {
    meetingDetails: { date: '28 Jan 2027, 4:00 PM', location: 'Office', type: 'Annual Review' },
    summary:
      'Priya (40) is an NHS GP partner and Anil (42) is a self-employed data consultant with three young children. Priorities are emergency fund completion, income protection for Anil, and consolidating fragmented pensions and ISA holdings.',
    financialSnapshot: {
      netWorth: '£975k',
      income: '£188k combined',
      assets: 'House £625k, ISAs £84k, pensions £172k+ DB, savings £32k, emergency £18k, JISAs £25.4k, company reserves £45k',
      liabilities: 'Mortgage £245k @ 3.45% fixed to Oct 2026',
      riskProfile: 'Balanced; key risk is protection gap'
    },
    goals: [
      { text: 'Retire at 60 with £70k/year income', why: 'Family security in 18–20 years' },
      { text: 'Build emergency fund to £30k', why: 'Self-employment stability' },
      { text: 'Fund university costs (£35k per child)', why: 'Education planning' }
    ],
    criticalItems: [
      { text: 'Anil income protection remains declined', urgency: 'Critical', deadline: 'Revisit 2026', reason: 'Single income exposure for family and mortgage' },
      { text: 'Emergency fund gap (£18k → £30k)', urgency: 'High', deadline: '2026', reason: 'Buffer for business variability' },
      { text: 'Wills + LPAs not started', urgency: 'High', deadline: '2026', reason: 'Estate planning gap with 3 children' }
    ],
    opportunities: [
      { heading: 'Childcare savings', text: '£800/month from Sept 2025 can accelerate emergency fund and JISAs' },
      { heading: 'Pension consolidation', text: 'Reduce charges by ~£809/year by consolidating four pensions' },
      { heading: 'Loft conversion funding', text: 'Use company reserves + savings option C for tax efficiency' }
    ],
    risks: [
      { heading: 'Business concentration', text: '60% revenue from two clients' },
      { heading: 'Protection gap', text: 'No IP for Anil with dependent family' },
      { heading: 'Admin inertia', text: 'Delayed pension consolidation and estate planning' }
    ],
    talkingPoints: [
      {
        topic: 'Protection',
        script: 'Anil, the income protection decision is still the biggest gap. Can we agree a timeframe to re-quote after the emergency fund is topped up?'
      },
      {
        topic: 'Emergency fund plan',
        script: 'With Zara starting school, the £800/month savings can get you to £30k this year—shall we automate that?'
      },
      {
        topic: 'Pension consolidation',
        script: 'Let’s complete the consolidation paperwork to save ~£800/year in fees—do you want us to handle execution?'
      }
    ],
    emailTemplate:
      'Subject: Summary – Emergency Fund, Protection & Consolidation\n\nDear Priya and Anil,\n\nSummary of actions:\n\n1) Use childcare savings to complete the £30k emergency fund\n2) Revisit income protection for Anil once the fund is complete\n3) Complete pension consolidation (forms to be signed)\n4) Start wills and LPAs (solicitor booking)\n\nI will send the consolidation pack and a proposed savings schedule.\n\nBest,\nJonathan'
  },
  C008: {
    meetingDetails: { date: '15 Mar 2027, 2:00 PM', location: 'Office', type: 'Annual Review' },
    summary:
      'Lisa (37) and Ahmed (39) are managing post-maternity cashflow pressure with two young children. Key themes are childcare costs, rebuilding the emergency fund, and addressing missing critical illness cover.',
    financialSnapshot: {
      netWorth: '£485k',
      income: '£110k combined',
      assets: 'House £475k, ISAs £41k, savings £28k, pensions £57k+ LGPS DB, JISA £6.4k',
      liabilities: 'Mortgage £298k @ 4.15% fixed to Dec 2027',
      riskProfile: 'Cautious; liquidity tight due to childcare'
    },
    goals: [
      { text: 'Increase emergency fund to £35k', why: 'Two-child household security' },
      { text: 'Manage childcare costs (£2,400/month)', why: 'Short-term cashflow stability' },
      { text: 'Plan house extension (£65k) post-2028', why: 'Space for growing family' }
    ],
    criticalItems: [
      { text: 'Critical illness cover deferred', urgency: 'High', deadline: '2026', reason: 'Young family and mortgage exposure' },
      { text: 'Emergency fund below target', urgency: 'High', deadline: 'Summer 2026', reason: 'Buffer during childcare years' },
      { text: 'Wills update in progress', urgency: 'Medium', deadline: '2026', reason: 'Second child added' }
    ],
    opportunities: [
      { heading: 'Tax-Free Childcare', text: '~£5,760/year support for two children' },
      { heading: 'Pension catch-up', text: 'Resume contributions now maternity has ended' },
      { heading: 'Long-term extension plan', text: 'Target 2029–2030 when childcare falls' }
    ],
    risks: [
      { heading: 'Cashflow strain', text: 'Childcare increase consumes surplus' },
      { heading: 'Protection gap', text: 'No CI cover for either partner' },
      { heading: 'Career dissatisfaction', text: 'Ahmed tempted by private-sector role' }
    ],
    talkingPoints: [
      {
        topic: 'Childcare budget',
        script: 'Let’s map the next 12 months of cashflow with the £2,400/month childcare cost and confirm affordability.'
      },
      {
        topic: 'Critical illness cover',
        script: 'CI protection was deferred during maternity—are you comfortable reinstating quotes this year?'
      },
      {
        topic: 'Emergency fund',
        script: 'You’re at £28k; with £300/month contributions you reach £35k by summer 2026.'
      }
    ],
    emailTemplate:
      'Subject: Summary – Childcare Budget & Protection\n\nDear Lisa and Ahmed,\n\nKey actions agreed:\n\n1) Monitor childcare cashflow and maintain £300/month emergency fund top-up\n2) Refresh critical illness quotes in 2026\n3) Complete wills update to include the new baby\n\nI will send updated protection quotes and a cashflow summary.\n\nBest,\nJonathan'
  },
  C009: {
    meetingDetails: { date: '14 Feb 2027, 11:00 AM', location: 'Office (over tea)', type: 'Annual Review' },
    summary:
      'Brian (68) is a widower adjusting to life after Margaret’s death and feels overwhelmed by financial complexity. Key themes are simplifying accounts, supporting daughter Sarah, and evaluating downsizing and cash deployment.',
    financialSnapshot: {
      netWorth: '£1.15m',
      income: '£52.4k/year (DB + State + investments)',
      assets: 'Home £625k (no mortgage), ISAs £285k + £47k inherited, savings £95k, premium bonds £50k, investments £48k',
      liabilities: 'No mortgage',
      riskProfile: 'Very conservative (40/60) with inflation risk'
    },
    goals: [
      { text: 'Simplify finances to 2–3 providers', why: 'Reduce overwhelm and admin burden' },
      { text: 'Consider downsizing to a bungalow (~£450k)', why: 'Mobility and maintenance' },
      { text: 'Support daughter Sarah (£30k)', why: 'Family stability and fairness' }
    ],
    criticalItems: [
      { text: "Transfer Margaret's ISA (£47k) into Brian's name", urgency: 'High', deadline: '2026', reason: 'Spousal ISA transfer pending' },
      { text: 'Account consolidation plan', urgency: 'High', deadline: '2026', reason: '8 savings accounts + multiple platforms' },
      { text: 'Agree Sarah support structure', urgency: 'Medium', deadline: '2026', reason: 'Gift vs loan vs inheritance advance' }
    ],
    opportunities: [
      { heading: 'Cash deployment', text: 'Invest excess £115k cash gradually with low-risk allocation' },
      { heading: 'Downsizing benefits', text: 'Release ~£150k and reduce costs/maintenance' },
      { heading: 'Travel plans', text: 'Australia and Europe trips are affordable from surplus' }
    ],
    risks: [
      { heading: 'Loneliness/health', text: 'Emotional wellbeing and mobility concerns' },
      { heading: 'Inflation erosion', text: 'Very conservative allocation' },
      { heading: 'Family tension', text: 'Support for Sarah without Andrew’s awareness' }
    ],
    talkingPoints: [
      {
        topic: 'Simplification',
        script: "Brian, let’s reduce the number of accounts and put a step-by-step plan in place so it feels manageable."
      },
      {
        topic: 'Sarah support',
        script: 'We should decide whether the £30k is a gift, loan, or inheritance advance and make it transparent to Andrew.'
      },
      {
        topic: 'Downsizing',
        script: 'Would you like to continue bungalow viewings, or pause until it feels right? Either way we can plan for the cash release.'
      }
    ],
    emailTemplate:
      'Subject: Summary – ISA Transfer & Simplification\n\nDear Brian,\n\nThank you for today. Summary:\n\n1) Prepare paperwork for Margaret’s ISA transfer\n2) Build a simple consolidation plan to reduce the number of accounts\n3) Decide on the best structure for Sarah’s £30k support\n\nI will draft the consolidation plan and ISA transfer documents for your review.\n\nBest regards,\nJonathan'
  },
  C011: {
    meetingDetails: { date: '25 Feb 2027, 10:00 AM', location: 'Office', type: 'Annual Review' },
    summary:
      'Keith (65) is a self-employed management consultant retiring in April 2026 and Maureen (63) is a retired teacher. Key themes are retirement income strategy, extracting £180k company reserves tax-efficiently, and decisions around the holiday home.',
    financialSnapshot: {
      netWorth: '£3.25m',
      income: '£117.5k household',
      assets: 'Main residence £1.2m, holiday home £280k, ISAs £710k, pensions £1m+, savings £180k, discretionary portfolio £220k, company reserves £180k',
      liabilities: 'No mortgage',
      riskProfile: 'Moderate; de-risking underway'
    },
    goals: [
      { text: 'Retire April 2026 with £75k/year income', why: 'Confirmed retirement date' },
      { text: 'World cruise in 2027 (£55k)', why: 'Major lifestyle goal' },
      { text: 'Grandchildren gifts £10k each', why: 'Legacy planning' }
    ],
    criticalItems: [
      { text: 'Company reserve extraction (£180k)', urgency: 'Critical', deadline: 'Before liquidation in 2026', reason: 'Tax efficiency and retirement funding' },
      { text: 'Retirement income strategy', urgency: 'High', deadline: '2026', reason: 'Drawdown planning and cashflow certainty' },
      { text: 'Holiday home decision', urgency: 'Medium', deadline: '2026', reason: 'Lifestyle vs financial neutrality' }
    ],
    opportunities: [
      { heading: 'Employer pension contribution', text: 'Use £180k company contribution (Option C) to save corp tax' },
      { heading: 'Travel planning', text: 'Cruise balance £44k due Oct 2026' },
      { heading: 'Downsizing optionality', text: 'Consider in 5–10 years for flexibility' }
    ],
    risks: [
      { heading: 'Tax planning risk', text: 'Improper extraction of company reserves' },
      { heading: 'Longevity/cashflow', text: '25+ year retirement horizon' },
      { heading: 'Family support', text: 'Potential additional support for Daniel' }
    ],
    talkingPoints: [
      {
        topic: 'Company extraction',
        script: 'We should confirm Option C for the £180k reserves and map the pension carry-forward usage this year.'
      },
      {
        topic: 'Retirement cashflow',
        script: 'Let’s finalise the drawdown plan to hit £75k/year with a sustainable withdrawal rate.'
      },
      {
        topic: 'Holiday home',
        script: 'Financially neutral either way—do you want to keep it for lifestyle or simplify before retirement?' }
    ],
    emailTemplate:
      'Subject: Summary – Retirement Plan & Company Extraction\n\nDear Keith and Maureen,\n\nSummary of today’s key actions:\n\n1) Confirm Option C for extracting £180k company reserves via pension contribution\n2) Finalise the retirement income drawdown plan (£75k/year target)\n3) Decide on the holiday home direction\n\nI will send the extraction plan and updated retirement projections.\n\nBest regards,\nJonathan'
  }
};
