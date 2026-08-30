/**
 * AI Assistant Decision-Support Service for Land Acquisition
 * Smart India Hackathon Problem Statement 26017:
 * "Predictive Analytics System for Early Detection of Land Acquisition Delays"
 * 
 * Provides an intelligent decision-support conversational abstraction
 * grounded in actual project data, statutory milestones, and predictive risk indicators.
 */

import { Project, ChatMessage, AISession } from '../types';

export const INITIAL_AI_SESSIONS: AISession[] = [
  {
    id: 'session-1',
    title: 'Purulia NH-32 Risk & Litigation Assessment',
    timestamp: '2026-08-27 10:30 AM',
    projectId: 'P001',
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Why is the NH-32 Four-Laning project flagged as High Risk?',
        timestamp: '10:30 AM',
        relatedProjectId: 'P001',
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: `### 🎯 Risk & Delay Diagnosis: NH-32 Four-Laning (Purulia)

The project is flagged with a **Composite Risk Score of 84/100 (HIGH RISK)** and an estimated schedule delay of **~19 Months**.

#### 🔍 Major Risk Factors
- **Active Legal Disputes (91/100 Legal Risk)**: W.P. No. 14288/2022 in Calcutta High Court imposes an interim stay on 62 acres across Balarampur due to disputed circle rate multipliers.
- **Compensation Disbursement Lag (78/100 Compensation Risk)**: Only **44%** of compensation (₹38.2 Cr of ₹86.5 Cr) has been disbursed; 68 tribal tenancy title claims remain in dispute.
- **Stage-II Forest Clearance Delay (61/100 Environmental Risk)**: 38.4 hectares in the Joychandi elephant corridor buffer are pending MOEF&CC Stage-II clearance.
- **Regional Historical Precedents (88/100 Historical Risk)**: 2 of 3 previous corridor acquisitions in Purulia exceeded 18-month delay thresholds.

#### ⚡ Recommended Strategic Actions
1. **Convene Revenue Mediation**: Fast-track circle rate valuation revision for the 62 stayed acres before the High Court.
2. **Special Lok Adalat Camp**: Deploy a dedicated land tribunal team to resolve the 68 tribal tenancy title disputes.
3. **Forest Escrow Account**: Deposit Stage-II compensatory afforestation funds to expedite clearance.`,
        timestamp: '10:31 AM',
        relatedProjectId: 'P001',
        suggestedActions: [
          'What should the authority prioritize first?',
          'Are there any legal disputes?',
          'How much compensation is pending?',
          'Compare Purulia NH-32 with Durgapur Freight Hub',
        ],
      },
    ],
  },
  {
    id: 'session-2',
    title: 'East Kolkata Wetlands Statutory Clearance',
    timestamp: '2026-08-26 04:15 PM',
    projectId: 'P004',
    messages: [
      {
        id: 'msg-3',
        role: 'user',
        content: 'What are the major delay bottlenecks for the East Kolkata Wetlands Elevated Link?',
        timestamp: '04:15 PM',
        relatedProjectId: 'P004',
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content: `### 🎯 Corridor Bottlenecks: East Kolkata Wetlands Elevated Link

The project is categorized at **Critical Risk (Score: 89/100)** with an estimated delay of **~24 Months**.

#### 🔍 Major Roadblocks
- **Ramsar Site No. 1208 Restriction**: Requires special statutory clearance from the East Kolkata Wetlands Management Authority (EKWMA Act, 2006).
- **Livelihood Concerns**: Local bheri fishermen associations have raised resistance concerning 14 water bodies along the corridor alignment.
- **Compensation Progress**: ₹14.5 Cr disbursed out of ₹62.0 Cr required (23% disbursed).

#### ⚡ Recommended Strategic Actions
1. **Designate Eco-Restoration Endowment**: Allocate special environmental mitigation funds for wetland bio-retention.
2. **Pillar Alignment Modification**: Shift high-clearance pier engineering away from critical aquaculture nursery ponds.`,
        timestamp: '04:16 PM',
        relatedProjectId: 'P004',
      },
    ],
  },
];

/**
 * Helper to find a project mentioned in user query text
 */
function findMentionedProject(text: string, projects: Project[]): Project | null {
  const lower = text.toLowerCase();
  for (const p of projects) {
    if (
      lower.includes(p.id.toLowerCase()) ||
      lower.includes(p.name.toLowerCase()) ||
      lower.includes(p.district.toLowerCase()) ||
      (p.taluka && lower.includes(p.taluka.toLowerCase()))
    ) {
      return p;
    }
  }
  return null;
}

/**
 * Generate intelligent decision-support responses grounded in the active project dataset.
 * Accepts free-form natural language queries and extracts relevant facts.
 */
export async function queryAIAssistant(
  prompt: string,
  selectedProject: Project | null,
  allProjects: Project[]
): Promise<ChatMessage> {
  // Simulate minimal realistic processing latency
  await new Promise(resolve => setTimeout(resolve, 450));

  const lower = prompt.toLowerCase().trim();

  // If user mentioned a specific project in the prompt, prioritize that target
  const mentioned = findMentionedProject(prompt, allProjects);
  const targetProj = mentioned || selectedProject;

  // -------------------------------------------------------------
  // INTENT 1: WHY IS PROJECT DELAYED / EXPLAIN RISK / BIGGEST PROBLEMS / CAUSES
  // -------------------------------------------------------------
  if (
    lower.includes('why') ||
    lower.includes('delay') ||
    lower.includes('problem') ||
    lower.includes('cause') ||
    lower.includes('risk') ||
    lower.includes('explain') ||
    lower.includes('bottleneck') ||
    lower.includes('issue') ||
    lower.includes('reason') ||
    lower.includes('factor')
  ) {
    // If user is asking about which project is delayed across the whole dataset
    if (
      (lower.includes('which project') || lower.includes('what project') || lower.includes('all project')) &&
      (lower.includes('delay') || lower.includes('risk') || lower.includes('attention') || lower.includes('problem'))
    ) {
      const sorted = [...allProjects].sort((a, b) => b.risk.score - a.risk.score);
      const top3 = sorted.slice(0, 3);
      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `### 🚨 Critical Corridors Requiring Immediate Attention

Across the **${allProjects.length} monitored land acquisition corridors**, the projects facing the highest delay vulnerability are:

${top3
  .map(
    (p, i) => `**${i + 1}. ${p.name}** (${p.district}, ${p.state})
- **Risk Score**: **${p.risk.score}/100** (\`${p.risk.level}\`)
- **Estimated Delay**: **~${p.risk.estimatedDelayMonths} Months** (${Math.round(p.risk.delayProbability * 100)}% probability)
- **Primary Bottleneck**: ${p.risk.keyReasons[0] || 'Pending statutory compensation award'}
- **Acquisition Progress**: ${p.acquisitionProgressPct}% (${p.landAcquiredAcres}/${p.landRequiredAcres} acres acquired)`
  )
  .join('\n\n')}

#### ⚡ Strategic Recommendation
Prioritize executive review for **${top3[0]?.name}**, where delay risk is highest.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          `Inspect ${top3[0]?.name}`,
          'What should we do to reduce the risk?',
          'Are there any legal disputes?',
        ],
      };
    }

    if (!targetProj) {
      const highRisk = allProjects.find(p => p.risk.score >= 80) || allProjects[0];
      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `### 🎯 Project Risk Assessment

Please select a specific corridor on the map or project list to view its complete risk profile.

For example, looking at **${highRisk.name}** (${highRisk.district}):
- **Composite Risk Score**: **${highRisk.risk.score}/100** (\`${highRisk.risk.level}\`)
- **Estimated Delay**: **~${highRisk.risk.estimatedDelayMonths} Months**
- **Primary Cause**: ${highRisk.risk.keyReasons[0]}
- **Land Acquired**: ${highRisk.acquisitionProgressPct}% (${highRisk.landAcquiredAcres} of ${highRisk.landRequiredAcres} acres)`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          `Inspect ${highRisk.name}`,
          'Which project needs attention?',
          'What should we do to reduce the risk?',
        ],
      };
    }

    const { risk, name, district, state, landRequiredAcres, landAcquiredAcres, acquisitionProgressPct, compensation, legalIssues, budgetCr, targetCompletionYear } = targetProj;

    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `### 🎯 Risk & Delay Analysis: ${name}

**Location**: ${district}, ${state} | **Current Risk Score**: **${risk.score}/100 (${risk.level})**  
**Estimated Delay**: **~${risk.estimatedDelayMonths} Months** (${Math.round(risk.delayProbability * 100)}% probability) | **Target Year**: ${targetCompletionYear}

#### 🔍 Major Risk Factors
${risk.keyReasons.map((reason, idx) => `- **${reason}**`).join('\n')}

#### 📊 Key Quantitative Indicators
- **Land Acquisition Progress**: **${acquisitionProgressPct}%** (${landAcquiredAcres} of ${landRequiredAcres} acres possessed)
- **Compensation Disbursed**: **₹${compensation.disbursedCr} Cr** of **₹${compensation.totalRequiredCr} Cr** (${compensation.disbursedPct}% disbursed)
- **Pending Disputed Parcels**: **${compensation.totalDisputedCases} cases** across ${targetProj.affectedVillagesCount} revenue villages
- **Judicial Stays**: **${legalIssues.length} active court cases** impacting ${legalIssues.reduce((acc, l) => acc + (l.affectedAreaAcres || 0), 0)} acres
- **Total Project Budget**: ₹${budgetCr} Cr

#### ⚡ Recommended Strategic Next Steps
${targetProj.recommendations?.slice(0, 3).map((r, i) => `${i + 1}. **${r.title}**: ${r.expectedImpact}`).join('\n') || 'Review pending compensation awards with District Collector.'}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      relatedProjectId: targetProj.id,
      suggestedActions: [
        'What should we do to reduce the risk?',
        'Are there any legal disputes?',
        'How much compensation is pending?',
        'Compare this project with the others',
      ],
    };
  }

  // -------------------------------------------------------------
  // INTENT 2: RECOMMENDATIONS / WHAT SHOULD WE DO / MITIGATION / SOLUTIONS
  // -------------------------------------------------------------
  if (
    lower.includes('recommend') ||
    lower.includes('what should we do') ||
    lower.includes('how to reduce') ||
    lower.includes('reduce risk') ||
    lower.includes('mitigat') ||
    lower.includes('solution') ||
    lower.includes('action') ||
    lower.includes('prioritize') ||
    lower.includes('next step')
  ) {
    if (!targetProj) {
      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `### 📋 Authority Priority Guidance

Across the monitored infrastructure corridors, the recommended executive actions to prevent land acquisition delay are:

1. **Triage Judicial Stays**: File early vacation petitions for High Court interim stay orders holding up physical possession.
2. **Fast-Track Micro-Mediation**: Convene special Lok Adalats to resolve pending land valuation and circle rate multiplier disputes.
3. **Escrow for Statutory Clearances**: Complete compensatory afforestation land handovers with State Forest Departments.
4. **Direct Solatium Handover**: Accelerate RFCTLARR 2013 compensation award disbursement to beneficiary bank accounts.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          'Which project needs attention?',
          'Why is this project delayed?',
          'Are there any legal disputes?',
        ],
      };
    }

    const recs = targetProj.recommendations || [];
    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `### ⚡ Recommended Strategic Actions for ${targetProj.name}

*Targeted interventions to mitigate the projected **~${targetProj.risk.estimatedDelayMonths}-Month delay**:*

${recs.map((r, i) => `#### **Action ${i + 1}: ${r.title}** (Priority #${r.priority})
- **Trigger / Reason**: ${r.reason}
- **Expected Impact**: **${r.expectedImpact}**
- **Responsible Nodal Authority**: ${r.responsibleAuthority}
- **Target Implementation Window**: \`${r.actionTimeline}\``).join('\n\n')}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      relatedProjectId: targetProj.id,
      suggestedActions: [
        'Why is this project delayed?',
        'Are there any legal disputes?',
        'How much compensation is pending?',
        'Compare this project with the others',
      ],
    };
  }

  // -------------------------------------------------------------
  // INTENT 3: LEGAL DISPUTES / COURT STAYS / LITIGATION
  // -------------------------------------------------------------
  if (
    lower.includes('legal') ||
    lower.includes('dispute') ||
    lower.includes('court') ||
    lower.includes('stay') ||
    lower.includes('litigation') ||
    lower.includes('case') ||
    lower.includes('writ')
  ) {
    if (!targetProj) {
      const projectsWithLegal = allProjects.filter(p => p.legalIssues && p.legalIssues.length > 0);
      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `### ⚖️ Legal Disputes Across Monitored Projects

There are **${projectsWithLegal.length} projects** with active court stays or litigation proceedings:

${projectsWithLegal.map(p => `- **${p.name}** (${p.district}): ${p.legalIssues.length} active legal case(s) affecting ${p.legalIssues.reduce((a, b) => a + (b.affectedAreaAcres || 0), 0)} acres`).join('\n')}

Select a project to view specific case numbers, court venues, and stay details.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          `Inspect ${projectsWithLegal[0]?.name || allProjects[0].name}`,
          'Which project needs attention?',
          'What should we do to reduce the risk?',
        ],
      };
    }

    const legals = targetProj.legalIssues || [];
    if (legals.length === 0) {
      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `### ⚖️ Legal Status: ${targetProj.name}

**No active judicial stays or court litigations** are on record for this corridor. 

The legal risk factor is currently evaluated at a low severity index (**${targetProj.risk.factors?.legal || 15}/100**).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        relatedProjectId: targetProj.id,
        suggestedActions: [
          'How much compensation is pending?',
          'Why is this project delayed?',
          'What should we do to reduce the risk?',
        ],
      };
    }

    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `### ⚖️ Legal Disputes & Court Stays: ${targetProj.name}

This project has **${legals.length} active court proceeding(s)** causing right-of-way possession bottlenecks:

${legals.map((l, i) => `#### **Case ${i + 1}: ${l.caseNumber}** (\`${l.status}\`)
- **Court**: ${l.court}
- **Petitioner**: ${l.petitioner}
- **Subject Matter**: ${l.subject}
- **Stayed Land Area**: **${l.affectedAreaAcres} Acres** (${l.affectedParcelsCount} disputed land parcels)`).join('\n\n')}

#### ⚡ Legal Mitigation Recommendation
File an urgent application for early hearing and propose escrow deposit for the disputed solatium multipliers.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      relatedProjectId: targetProj.id,
      suggestedActions: [
        'How much compensation is pending?',
        'What should we do to reduce the risk?',
        'Explain the risk of this project.',
      ],
    };
  }

  // -------------------------------------------------------------
  // INTENT 4: COMPENSATION / DISBURSEMENTS / FINANCIAL AWARDS
  // -------------------------------------------------------------
  if (
    lower.includes('compensation') ||
    lower.includes('disburs') ||
    lower.includes('money') ||
    lower.includes('solatium') ||
    lower.includes('award') ||
    lower.includes('payment') ||
    lower.includes('pending')
  ) {
    if (!targetProj) {
      const totalReq = allProjects.reduce((sum, p) => sum + (p.compensation?.totalRequiredCr || 0), 0);
      const totalDis = allProjects.reduce((sum, p) => sum + (p.compensation?.disbursedCr || 0), 0);
      const totalDisputes = allProjects.reduce((sum, p) => sum + (p.compensation?.totalDisputedCases || 0), 0);

      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `### 💰 Compensation Summary Across Monitored Corridors

- **Total Compensation Required**: **₹${totalReq.toFixed(1)} Cr**
- **Total Compensation Disbursed**: **₹${totalDis.toFixed(1)} Cr** (${Math.round((totalDis / totalReq) * 100)}% overall)
- **Pending Disputed Land Parcels**: **${totalDisputes} total cases**

Select a specific corridor to inspect its RFCTLARR 2013 disbursement schedule and title disputes.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          `Inspect ${allProjects[0].name}`,
          'Which project needs attention?',
          'What should we do to reduce the risk?',
        ],
      };
    }

    const c = targetProj.compensation;
    const pendingAmount = (c.totalRequiredCr - c.disbursedCr).toFixed(1);

    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `### 💰 Compensation Status: ${targetProj.name}

#### 📊 Financial Breakdown (RFCTLARR Act 2013)
- **Total Award Required**: **₹${c.totalRequiredCr} Cr**
- **Amount Disbursed**: **₹${c.disbursedCr} Cr** (**${c.disbursedPct}%** completed)
- **Pending Amount**: **₹${pendingAmount} Cr**
- **Affected Families**: **${c.affectedFamilies} families**
- **Pending Disputed Parcels**: **${c.totalDisputedCases} parcels** under title/valuation challenge
- **R&R Package Status**: \`${c.rrPackageStatus || 'PENDING'}\`

#### ⚡ Compensation Action Plan
Conduct village-level disbursement camps and establish an escrow account for disputed title parcels to secure site possession without delay.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      relatedProjectId: targetProj.id,
      suggestedActions: [
        'Are there any legal disputes?',
        'What should we do to reduce the risk?',
        'Why is this project delayed?',
      ],
    };
  }

  // -------------------------------------------------------------
  // INTENT 5: R&R / RESETTLEMENT & REHABILITATION
  // -------------------------------------------------------------
  if (
    lower.includes('r&r') ||
    lower.includes('resettle') ||
    lower.includes('rehabilitat') ||
    lower.includes('families') ||
    lower.includes('colony') ||
    lower.includes('displaced')
  ) {
    if (!targetProj) {
      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `### 🏠 Rehabilitation & Resettlement (R&R) Overview

Please select a project to inspect specific R&R colony infrastructure, affected family counts, and plot handover progress.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          `Inspect ${allProjects[0].name}`,
          'Which project needs attention?',
        ],
      };
    }

    const c = targetProj.compensation;
    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `### 🏠 Rehabilitation & Resettlement (R&R): ${targetProj.name}

- **R&R Package Status**: **\`${c?.rrPackageStatus || 'In Progress'}\`**
- **Displaced / Affected Families**: **${targetProj.affectedFamiliesCount || c?.affectedFamilies || 0} Families**
- **Resettlement Colonies Planned**: **${c?.resettlementColoniesPlanned || 0} Sites**
- **Resettlement Colonies Handed Over**: **${c?.resettlementColoniesBuilt || 0} Sites**
- **Affected Revenue Mouzas**: **${targetProj.affectedVillagesCount} Villages**`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      relatedProjectId: targetProj.id,
      suggestedActions: [
        'How much compensation is pending?',
        'What should we do to reduce the risk?',
        'Why is this project delayed?',
      ],
    };
  }

  // -------------------------------------------------------------
  // INTENT 6: ENVIRONMENTAL / FOREST / WETLANDS
  // -------------------------------------------------------------
  if (
    lower.includes('environ') ||
    lower.includes('forest') ||
    lower.includes('wetland') ||
    lower.includes('clearance') ||
    lower.includes('tree') ||
    lower.includes('ecology') ||
    lower.includes('green')
  ) {
    if (!targetProj) {
      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `### 🌲 Environmental & Forest Clearances

Select a project to inspect its environmental clearance status, affected forest land, or Ramsar wetland restrictions.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [`Inspect ${allProjects[0].name}`],
      };
    }

    const envs = targetProj.environmentalFactors || [];
    if (envs.length === 0) {
      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `### 🌲 Environmental Clearances: ${targetProj.name}

No major statutory environmental or forest clearances are currently pending for this corridor.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        relatedProjectId: targetProj.id,
        suggestedActions: [
          'Why is this project delayed?',
          'Are there any legal disputes?',
          'What should we do to reduce the risk?',
        ],
      };
    }

    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `### 🌲 Environmental & Ecological Factors: ${targetProj.name}

${envs.map((e, i) => `#### **Feature ${i + 1}: ${e.name}** (\`${e.type}\`)
- **Clearance Status**: **\`${e.clearanceStatus}\`**
- **Covered Area**: ${e.areaAcres} Acres
- **Statute / Act**: ${e.statutoryAct}
- **Description**: ${e.description}`).join('\n\n')}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      relatedProjectId: targetProj.id,
      suggestedActions: [
        'What should we do to reduce the risk?',
        'Why is this project delayed?',
      ],
    };
  }

  // -------------------------------------------------------------
  // INTENT 7: PUBLIC SENTIMENT / OPPOSITION / SOCIAL
  // -------------------------------------------------------------
  if (
    lower.includes('sentiment') ||
    lower.includes('public') ||
    lower.includes('protest') ||
    lower.includes('opposi') ||
    lower.includes('social') ||
    lower.includes('community')
  ) {
    if (!targetProj || !targetProj.communitySentiment) {
      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `### 👥 Community Sentiment

Public sentiment data is grounded across monitored villages. Select a project to review specific community themes, concerns, and support levels.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }

    const s = targetProj.communitySentiment;
    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `### 👥 Public Sentiment & Social Acceptance: ${targetProj.name}

- **Overall Status**: **\`${s.status}\`**
- **Confidence Level**: **${s.confidence}** (Grounded across ${targetProj.affectedVillagesCount} revenue villages)
- **Top Local Concerns**: ${s.concerns?.join(', ') || 'Fair compensation multipliers and timely plot handover'}
- **Positive Themes**: ${s.positiveThemes?.join(', ') || 'Improved regional transport & economic connectivity'}
${s.notes ? `\n*Assessment Notes: ${s.notes}*` : ''}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      relatedProjectId: targetProj.id,
      suggestedActions: [
        'How much compensation is pending?',
        'What should we do to reduce the risk?',
      ],
    };
  }

  // -------------------------------------------------------------
  // INTENT 8: COMPARE PROJECTS / BENCHMARK
  // -------------------------------------------------------------
  if (
    lower.includes('compare') ||
    lower.includes('difference') ||
    lower.includes('benchmark') ||
    lower.includes('vs')
  ) {
    const projA = targetProj || allProjects[0];
    const projB = allProjects.find(p => p.id !== projA.id && p.risk.score >= 70) || allProjects[1] || allProjects[0];

    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `### ⚖️ Side-by-Side Project Comparison

| Metric | **${projA.name}** | **${projB.name}** |
| :--- | :--- | :--- |
| **District, State** | ${projA.district}, ${projA.state} | ${projB.district}, ${projB.state} |
| **Risk Score** | **${projA.risk.score}/100 (${projA.risk.level})** | **${projB.risk.score}/100 (${projB.risk.level})** |
| **Est. Delay** | **~${projA.risk.estimatedDelayMonths} Months** | **~${projB.risk.estimatedDelayMonths} Months** |
| **Land Required** | ${projA.landRequiredAcres} Acres | ${projB.landRequiredAcres} Acres |
| **Acquisition %** | ${projA.acquisitionProgressPct}% | ${projB.acquisitionProgressPct}% |
| **Active Stays** | ${projA.legalIssues?.length || 0} cases | ${projB.legalIssues?.length || 0} cases |
| **Compensation %** | ${projA.compensation?.disbursedPct || 0}% | ${projB.compensation?.disbursedPct || 0}% |

*You can also use the **"Compare Projects"** button in the top navigation bar for detailed radar chart comparison.*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        `Inspect ${projA.name}`,
        `Inspect ${projB.name}`,
        'Which project needs attention?',
      ],
    };
  }

  // -------------------------------------------------------------
  // INTENT 9: TIMELINE / MILESTONES
  // -------------------------------------------------------------
  if (
    lower.includes('timeline') ||
    lower.includes('milestone') ||
    lower.includes('gazette') ||
    lower.includes('3a') ||
    lower.includes('3d') ||
    lower.includes('3g') ||
    lower.includes('completion')
  ) {
    if (!targetProj) {
      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `### 📅 Statutory Timeline & Milestones

Please select a corridor to view statutory gazette notifications (Section 3A, 3D, 3G) and historical milestone progress.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }

    const t = targetProj.timeline || [];
    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `### 📅 Statutory Timeline & Milestones: ${targetProj.name}

- **Target Completion Year**: **${targetProj.targetCompletionYear}**
- **Historical Milestones**:
${t.map(m => `- **${m.year}**: **${m.title}** (${m.type}) — ${m.description}`).join('\n')}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      relatedProjectId: targetProj.id,
      suggestedActions: [
        'Why is this project delayed?',
        'What should we do to reduce the risk?',
      ],
    };
  }

  // -------------------------------------------------------------
  // DEFAULT / UNMATCHED QUERIES (STRICT: NO HALLUCINATION)
  // -------------------------------------------------------------
  if (targetProj) {
    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `### 🎯 Intelligence for ${targetProj.name} (${targetProj.district})

Here are the verified records available for this corridor:
- **Composite Risk**: **${targetProj.risk.score}/100 (${targetProj.risk.level})**
- **Estimated Schedule Delay**: **~${targetProj.risk.estimatedDelayMonths} Months** (${Math.round(targetProj.risk.delayProbability * 100)}% probability)
- **Land Acquisition Possession**: **${targetProj.acquisitionProgressPct}%** (${targetProj.landAcquiredAcres}/${targetProj.landRequiredAcres} acres)
- **Active Court Stays**: **${targetProj.legalIssues?.length || 0} cases**
- **Compensation Disbursed**: **₹${targetProj.compensation?.disbursedCr || 0} Cr** of **₹${targetProj.compensation?.totalRequiredCr || 0} Cr** (${targetProj.compensation?.disbursedPct || 0}%)

*Note: For queries outside statutory milestones, legal stays, compensation awards, and risk factors, information is not available in current project records.*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      relatedProjectId: targetProj.id,
      suggestedActions: [
        'Why is this project delayed?',
        'What are the biggest problems with this project?',
        'What should we do to reduce the risk?',
        'Are there any legal disputes?',
      ],
    };
  }

  return {
    id: `msg-${Date.now()}`,
    role: 'assistant',
    content: `### 🎯 LandIntel Decision Support Intelligence

I am your **AI Decision-Support Specialist for Land Acquisition Delay Prevention** (SIH Problem Statement 26017).

I can answer questions regarding:
- **Delay Causes & Risks**: *"Why is this project delayed?"* or *"Explain the risk factors"*
- **Action Plans**: *"What should we do to reduce the risk?"*
- **Legal Issues**: *"Are there any legal disputes or stay orders?"*
- **Compensation**: *"How much compensation is pending?"*
- **Critical Ranking**: *"Which project needs attention?"*
- **Comparative Analysis**: *"Compare this project with the others"*

*Please ask your question or select a quick prompt below:*`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    suggestedActions: [
      'Why is this project delayed?',
      'What should we do to reduce the risk?',
      'Which project needs attention?',
      'Are there any legal disputes?',
    ],
  };
}

