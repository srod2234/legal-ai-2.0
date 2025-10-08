# LEGAL 3.0 FRONTEND DESIGN SPECIFICATION
## Enterprise Legal Intelligence Platform - Ultra-Detailed UI/UX Blueprint

---

## **DESIGN PHILOSOPHY & POSITIONING**

LEGAL 3.0 transforms from a simple chat interface into a **premium legal intelligence command center** that justifies $50K-250K enterprise pricing. The interface must convey the sophistication of Bloomberg Terminal combined with the intuitive ease of modern consumer apps. Every pixel should communicate "cutting-edge legal technology" to managing partners and "powerful efficiency tool" to working attorneys. The design language should be unmistakably professional yet approachable, data-rich yet scannable, and complex yet intuitive.

---

## **DETAILED SIDEBAR NAVIGATION**

### **Sidebar Specifications (240px width, fixed position)**
- **Background**: #1e293b (dark slate)
- **Logo Area**: 60px height, centered firm logo with "LEGAL AI 3.0" subtitle in #f8fafc
- **Navigation Items**: Each 48px height with 16px padding, rounded-md hover states

**Navigation Structure:**
```
🏠 Dashboard               [Active: #3b82f6 bg, #ffffff text]
📊 Risk Intelligence      [Hover: #334155 bg, #e2e8f0 text]
⚖️  Contract Analysis     [Default: transparent bg, #94a3b8 text]
🔍 Case Research
📂 Practice Areas         [Expandable with chevron]
   └── 🩺 Personal Injury
   └── 🏢 M&A / Corporate
   └── 👥 Employment Law
   └── 🏘️  Real Estate
📈 Predictive Analytics
📁 Document Management
⚙️  Administration        [Admin only]
```

### **Sidebar Footer (Always visible at bottom)**
- **User Profile**: 40px avatar + name + role
- **Firm Badge**: Small firm logo + subscription tier
- **Quick Actions**: Settings gear icon + logout

---

## **MAIN DASHBOARD LAYOUT (Ultra-Specific)**

### **Top Header Bar (64px height, sticky)**
- **Background**: #ffffff with 1px border-bottom #e5e7eb
- **Left**: Breadcrumb navigation (Dashboard > Risk Intelligence)
- **Center**: Global search bar (400px width, #f3f4f6 background, magnifying glass icon)
- **Right**: Notification bell (red dot if alerts) + user avatar dropdown

### **Dashboard Grid System (16px gap between all elements)**

#### **Row 1: Critical Metrics (4 cards, equal width)**

**Card 1: Risk Alert Summary**
```
┌─────────────────────────────────┐
│ 🚨 HIGH-RISK CONTRACTS         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                              8  │ ← 48px font, #dc2626 color
│ ──────────────────────────────── │
│ • Employment Agreement #447     │ ← 14px font, clickable
│ • M&A Contract - TechCorp       │
│ • Real Estate Lease #334        │
│ ──────────────────────────────── │
│ View All Risks →                │ ← Link button, #3b82f6
└─────────────────────────────────┘
```
- **Dimensions**: 300px width × 180px height
- **Background**: #ffffff with #ef4444 left border (4px)
- **Padding**: 20px all sides
- **Hover**: Subtle shadow elevation

**Card 2: Active Cases**
```
┌─────────────────────────────────┐
│ ⚖️  ACTIVE LITIGATION           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                             23  │ ← 48px font, #3b82f6 color
│ ──────────────────────────────── │
│ • 15 in Discovery Phase         │
│ • 5 Settlement Negotiations     │
│ • 3 Trial Preparation          │
│ ──────────────────────────────── │
│ Case Management →               │
└─────────────────────────────────┘
```

**Card 3: Settlement Predictions**
```
┌─────────────────────────────────┐
│ 💰 SETTLEMENT INSIGHTS          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                       $2.3M     │ ← 36px font, #059669 color
│ ──────────────────────────────── │
│ Predicted Total Value           │
│ ↗️ +18% vs Last Quarter         │ ← Green arrow, #10b981
│ ──────────────────────────────── │
│ View Predictions →              │
└─────────────────────────────────┘
```

**Card 4: AI Insights**
```
┌─────────────────────────────────┐
│ 🤖 AI RECOMMENDATIONS           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                             12  │ ← 48px font, #8b5cf6 color
│ ──────────────────────────────── │
│ New recommendations ready       │
│ 🔥 3 require immediate action   │
│ ──────────────────────────────── │
│ Review All →                    │
└─────────────────────────────────┘
```

#### **Row 2: Risk Visualization Dashboard**

**Risk Heat Map Widget (2/3 width)**
```
┌──────────────────────────────────────────────────────────────┐
│ CONTRACT RISK HEAT MAP                    📅 Last 30 Days     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                              │
│ Risk Score Over Time                                         │
│    10 ┤                                                      │
│     9 ┤     🔴                          🔴                   │ ← Red dots for critical
│     8 ┤        🔴     🟡                                     │
│     7 ┤              🟡     🟢     🟡                        │
│     6 ┤                        🟢                           │
│     5 ┤ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ ← Baseline
│       └────────────────────────────────────────────────────│
│        Week 1   Week 2   Week 3   Week 4                    │
│                                                              │
│ Legend: 🔴 Critical (8-10)  🟡 Medium (5-7)  🟢 Low (1-4)   │
└──────────────────────────────────────────────────────────────┘
```

**Recent Case Law Updates (1/3 width)**
```
┌─────────────────────────────────────┐
│ 📚 CASE LAW UPDATES                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│ 🆕 Johnson v. TechCorp (2024)       │ ← New badge
│    Employment termination          │
│    ⚡ Affects 3 contracts           │ ← Lightning = urgent
│    ────────────────────             │
│                                     │
│ 📈 Martinez v. Global Finance       │ ← Trending up icon
│    Contract dispute trends          │
│    📊 Similar to Case #447          │
│    ────────────────────             │
│                                     │
│ ⚖️  State Employment Law Update     │
│    Non-compete restrictions         │
│    🔄 Review 12 contracts           │ ← Refresh needed
│                                     │
│ View All Updates →                  │
└─────────────────────────────────────┘
```

#### **Row 3: Detailed Analytics**

**Settlement Probability Chart (1/2 width)**
```
┌──────────────────────────────────────────────────┐
│ SETTLEMENT PROBABILITY ANALYSIS                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                  │
│ Current Active Cases:                            │
│                                                  │
│ Case #447: Employment Dispute                    │
│ ████████████████░░░░ 67% chance of settlement    │ ← Progress bar
│ Expected: $85K - $120K                          │
│                                                  │
│ Case #332: Contract Breach                       │
│ ██████████████████░░ 89% chance of settlement    │
│ Expected: $45K - $67K                           │
│                                                  │
│ Case #129: M&A Dispute                          │
│ ██████░░░░░░░░░░░░░░ 34% chance of settlement    │
│ Expected: $200K - $350K                         │
│                                                  │
│ [View Detailed Analysis]  [Export Report]       │
└──────────────────────────────────────────────────┘
```

**Firm Performance Metrics (1/2 width)**
```
┌──────────────────────────────────────────────────┐
│ FIRM PERFORMANCE DASHBOARD                       │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                  │
│ Research Time Saved:     -67% ↗️               │ ← Green arrow up
│ Risk Prediction Accuracy: 94% ↗️               │
│ Client Satisfaction:     4.8/5 ⭐              │
│ Settlement Success Rate: +23% ↗️               │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ Attorney Performance:                        │ │
│ │                                              │ │
│ │ Sarah Chen (Partner)      Win Rate: 92%     │ │
│ │ ████████████████████░     Revenue: $1.2M    │ │
│ │                                              │ │
│ │ Mike Rodriguez (Senior)   Win Rate: 87%     │ │
│ │ ████████████████░░░░░     Revenue: $890K    │ │
│ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

---

## **CONTRACT ANALYSIS PAGE (Ultra-Detailed)**

### **Split-Screen Layout (60/40 split)**

**Left Panel: Document Viewer (60% width)**
```
┌──────────────────────────────────────────────────────────────┐
│ 📄 Employment_Agreement_v3.pdf          [⚙️] [📤] [🖨️]     │ ← Action buttons
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                              │
│ Page 1 of 12                                    🔍 150%     │ ← Zoom control
│                                                              │
│ ┌────────────────────────────────────────────────────────┐   │
│ │                EMPLOYMENT AGREEMENT                    │   │
│ │                                                        │   │
│ │ This Agreement is entered into between TechCorp       │   │
│ │ Inc. ("Company") and John Smith ("Employee")...       │   │
│ │                                                        │   │
│ │ 2. TERMINATION CLAUSE                                  │   │
│ │ ████████████████████████████████████████████████████   │   │ ← Red highlight
│ │ Employee may be terminated at will without cause or   │   │
│ │ notice at the sole discretion of the Company...       │   │
│ │ ████████████████████████████████████████████████████   │   │
│ │                                                        │   │
│ │ 3. NON-COMPETE AGREEMENT                              │   │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │   │ ← Yellow highlight
│ │ Employee agrees not to compete in the same industry   │   │
│ │ for a period of 12 months following termination...    │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ [←] [→] Page Navigation                                      │
└──────────────────────────────────────────────────────────────┘
```

**Right Panel: Analysis Dashboard (40% width)**

**Risk Summary Card (Top)**
```
┌─────────────────────────────────────────┐
│ 🚨 OVERALL RISK ASSESSMENT              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                         │
│     ⚠️ HIGH RISK                        │ ← Large, centered
│        7.8/10                          │ ← Bold, red color
│                                         │
│ 🔴 2 Critical Issues Found              │
│ 🟡 3 Medium Risk Clauses                │
│ 🟢 8 Standard Clauses                   │
│                                         │
│ Last Updated: 2 minutes ago             │
│ Confidence Score: 94%                   │
└─────────────────────────────────────────┘
```

**Detailed Clause Analysis (Scrollable)**
```
┌─────────────────────────────────────────┐
│ 📋 CLAUSE-BY-CLAUSE BREAKDOWN           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                         │
│ 🔴 TERMINATION CLAUSE (Sec. 2)          │ ← Matches highlight
│ Risk Score: 9.2/10                      │
│ ─────────────────────                   │
│ ⚖️  Precedent Issues:                   │
│ • Johnson v. TechCorp (2024)            │
│   Similar clause ruled unenforceable    │
│ • State employment law conflicts        │
│                                         │
│ 💡 Recommendations:                     │
│ • Add "for cause" requirements          │
│ • Include severance provisions          │
│ • Specify notice period                 │
│                                         │
│ [View Related Cases] [Generate Fix]     │
│                                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                         │
│ 🟡 NON-COMPETE CLAUSE (Sec. 3)          │
│ Risk Score: 6.4/10                      │
│ ─────────────────────                   │
│ ⚖️  Legal Issues:                       │
│ • 12-month period exceeds state limit   │
│ • Geographic scope too broad            │
│                                         │
│ 📊 Enforceability: 32%                  │
│ Similar cases favor employee 68%        │
│                                         │
│ 💡 Recommendations:                     │
│ • Reduce to 6 months maximum            │
│ • Narrow geographic scope               │
│ • Add consideration clause              │
│                                         │
│ [View Comparable Cases] [Draft Revision]│
│                                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                         │
│ 🟢 IP ASSIGNMENT (Sec. 5)               │
│ Risk Score: 2.1/10                      │
│ ─────────────────────                   │
│ ✅ Standard industry language           │
│ ✅ 97% enforceability rate              │
│ ✅ No precedent issues found            │
│                                         │
└─────────────────────────────────────────┘
```

---

## **CASE RESEARCH PAGE SPECIFICATIONS**

### **Advanced Search Interface (Top section)**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🔍 LEGAL PRECEDENT RESEARCH                                                    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                              │
│ Search Query: [employment termination wrongful discharge        ] [🔍 Search]│ ← 600px input
│                                                                              │
│ Filters: [📍 Jurisdiction ▼] [📅 Date Range ▼] [⚖️ Court Level ▼] [📊 Outcome ▼]│
│         [    California   ] [Last 5 Years  ] [All Courts    ] [All Outcomes]│
│                                                                              │
│ Advanced: ☑️ Similar Facts  ☑️ Settlement Data  ☐ Appeals Only  ☐ Class Action│
└──────────────────────────────────────────────────────────────────────────────┘
```

### **Search Results Grid (Card Layout)**
```
┌─────────────────────────────────────────┐ ┌─────────────────────────────────────────┐
│ 📑 Johnson v. TechCorp Industries        │ │ 📑 Martinez v. Global Finance Corp       │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                         │ │                                         │
│ 🏛️  9th Circuit Court of Appeals        │ │ 🏛️  California Supreme Court            │
│ 📅 March 15, 2024                       │ │ 📅 August 22, 2023                      │
│ ⚖️  Plaintiff Victory                    │ │ ⚖️  Defendant Victory                    │
│ 💰 Settlement: $340,000                  │ │ 💰 No Damages Awarded                   │
│                                         │ │                                         │
│ 🎯 Relevance Score: 94%                  │ │ 🎯 Relevance Score: 87%                  │
│ 📄 Similar Facts: Contract termination   │ │ 📄 Similar Facts: Employment dispute     │
│                                         │ │                                         │
│ "At-will termination clauses            │ │ "Proper documentation defeats wrongful   │
│ unenforceable when coupled with         │ │ termination claims when performance      │
│ non-compete restrictions..."            │ │ issues are well documented..."          │
│                                         │ │                                         │
│ [📖 Read Full Case] [📝 Add to Brief]    │ │ [📖 Read Full Case] [⚖️ Compare Facts]    │
│ [📎 Cite in Document] [⭐ Save]          │ │ [📎 Cite in Document] [📋 Note Differences]│
└─────────────────────────────────────────┘ ┌─────────────────────────────────────────┘
```

### **Right Sidebar: Research Tools**
```
┌─────────────────────────────────────────┐
│ 📊 SEARCH ANALYTICS                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                         │
│ 2,847 cases found                       │
│ 🔽 Filtered to: 23 relevant             │
│                                         │
│ Outcome Trends:                         │
│ ┌─Plaintiff Wins────┐                   │
│ │ ████████░░░░░░░░░░ │ 42%               │
│ └───────────────────┘                   │
│ ┌─Defendant Wins────┐                   │
│ │ ████████████░░░░░░ │ 58%               │
│ └───────────────────┘                   │
│                                         │
│ Settlement Range:                       │
│ • Median: $125,000                      │
│ • Range: $45K - $750K                   │
│ • Avg Duration: 8.3 months              │
│                                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                         │
│ 💾 SAVED SEARCHES                       │
│ • Employment termination                │
│ • Non-compete enforcement               │
│ • Contract breach damages               │
│                                         │
│ 📁 RESEARCH BRIEFS                      │
│ • Case #447 Research (12 cases)         │
│ • M&A Due Diligence (8 cases)          │
│ • Employment Law Update (15 cases)      │
│                                         │
│ [📤 Export Results] [📬 Share Research]  │
└─────────────────────────────────────────┘
```

---

## **PRACTICE AREA MODULE: PERSONAL INJURY**

### **PI Case Dashboard Layout**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🩺 PERSONAL INJURY CASE MANAGER                                               │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                              │
│ Case: Motor Vehicle Accident - Sarah Johnson vs. TransCorp Logistics         │
│ Date of Incident: March 15, 2024  |  Case Number: PI-2024-0447              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────┐ ┌─────────────────────────────┐ ┌──────────────────────────────┐
│ 🏥 MEDICAL ASSESSMENT       │ │ 📊 DAMAGES CALCULATION      │ │ ⚖️ SETTLEMENT PREDICTOR       │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━ │ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━ │ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                             │ │                             │ │                              │
│ Primary Injury:             │ │ Medical Expenses:           │ │ Predicted Settlement:        │
│ 🧠 Traumatic Brain Injury   │ │ 💰 Current: $47,000         │ │ 💰 $125,000                  │
│                             │ │ 📈 Projected: $23,000       │ │                              │
│ Severity Score: 8.2/10      │ │ Total Medical: $70,000      │ │ Confidence: 76%              │
│ 🔴 Severe                   │ │                             │ │                              │
│                             │ │ Lost Wages:                 │ │ Settlement Range:            │
│ Treatment Duration:         │ │ 💼 Past: $15,000            │ │ • Low: $95,000               │
│ ⏱️ 6 months ongoing         │ │ 📅 Future: $28,000          │ │ • High: $165,000             │
│                             │ │ Total Lost Wages: $43,000   │ │                              │
│ Recovery Prognosis:         │ │                             │ │ Trial Risk Assessment:       │
│ 📊 65% full recovery       │ │ Pain & Suffering (AI Est):  │ │ 🎯 Plaintiff Win: 67%        │
│                             │ │ 💭 $78,000                  │ │ 📈 Expected Award: $185K     │
│ [📋 View Medical Records]   │ │                             │ │                              │
│                             │ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━ │ │ [📊 Detailed Analysis]       │
│                             │ │ TOTAL DEMAND: $191,000      │ │ [⚖️ Settlement Strategy]      │
└─────────────────────────────┘ └─────────────────────────────┘ └──────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ 📈 COMPARABLE CASES ANALYSIS                                                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                              │
│ 347 similar MVA cases found with TBI | Filtered by: Severity, Age, State    │
│                                                                              │
│ ┌─Case A: Thompson v. LogiTrans─────┐ ┌─Case B: Chen v. FastDelivery───────┐ │
│ │ 🎯 Match Score: 94%              │ │ 🎯 Match Score: 89%                │ │
│ │ TBI Severity: 8.5/10             │ │ TBI Severity: 7.8/10               │ │
│ │ Age: 34 (vs 32)                  │ │ Age: 29 (vs 32)                    │ │
│ │ Settlement: $185,000             │ │ Settlement: $142,000               │ │
│ │ Duration: 14 months              │ │ Duration: 11 months                │ │
│ │ [📄 View Details]                │ │ [📄 View Details]                  │ │
│ └─────────────────────────────────┘ └───────────────────────────────────┘ │
│                                                                              │
│ Statistical Analysis:                                                        │
│ • Average Settlement: $156,000 (±$34,000)                                   │
│ • Settlement Range: $98K - $245K                                           │
│ • Trial vs Settlement: 73% settle, 27% go to trial                         │
│ • Average Duration: 12.4 months                                            │
│                                                                              │
│ [📊 View All 347 Cases] [📈 Trend Analysis] [📋 Generate Report]             │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## **EXACT COLOR SPECIFICATIONS & INTERACTIONS**

### **Color Palette (Hex Codes)**
```
Primary Colors:
- Deep Blue: #1e3a8a (navigation, primary buttons)
- Charcoal: #374151 (text, secondary elements)
- Gold Accent: #d97706 (highlights, premium elements)

Risk Colors:
- Critical Red: #dc2626 (high risk, alerts)
- Warning Amber: #f59e0b (medium risk, caution)
- Success Green: #059669 (low risk, positive)

UI Colors:
- Background: #f9fafb (main background)
- Card Background: #ffffff (card backgrounds)
- Border: #e5e7eb (subtle borders)
- Text Primary: #111827 (main text)
- Text Secondary: #6b7280 (secondary text)
- Text Muted: #9ca3af (muted text)

Interactive States:
- Hover Background: #f3f4f6
- Active Background: #e5e7eb
- Focus Ring: #3b82f6 (2px outline)
```

### **Typography Scale**
```
Display: 48px, font-weight: 700 (hero numbers)
Heading 1: 36px, font-weight: 600 (page titles)
Heading 2: 24px, font-weight: 600 (section titles)
Heading 3: 20px, font-weight: 500 (card titles)
Body Large: 16px, font-weight: 400 (main content)
Body: 14px, font-weight: 400 (standard text)
Caption: 12px, font-weight: 400 (small text)

Fonts:
- UI Text: 'Inter', sans-serif
- Legal Documents: 'Crimson Pro', serif
- Monospace: 'JetBrains Mono', monospace (code/citations)
```

### **Button Specifications**
```
Primary Button:
- Background: #3b82f6
- Text: #ffffff
- Padding: 12px 24px
- Border-radius: 8px
- Font-weight: 500
- Hover: #2563eb
- Active: #1d4ed8

Secondary Button:
- Background: transparent
- Text: #374151
- Border: 1px solid #d1d5db
- Padding: 12px 24px
- Border-radius: 8px
- Hover: #f9fafb background

Danger Button:
- Background: #dc2626
- Text: #ffffff
- Hover: #b91c1c

Small Button:
- Padding: 8px 16px
- Font-size: 14px
```

### **Card Component Specifications**
```
Standard Card:
- Background: #ffffff
- Border: 1px solid #e5e7eb
- Border-radius: 12px
- Padding: 24px
- Shadow: 0 1px 3px rgba(0,0,0,0.1)
- Hover Shadow: 0 4px 12px rgba(0,0,0,0.15)

Metric Card:
- Min-height: 180px
- Display metric in 48px font
- Include trend indicator (arrow + percentage)
- Bottom action link in brand color

Alert Card:
- Left border: 4px solid (color based on severity)
- Background tint matching alert level
- Icon in top-left corner
```

This ultra-detailed specification provides pixel-perfect guidance for AI frontend tools to generate the sophisticated enterprise legal interface that positions LEGAL 3.0 as a premium $50K-250K platform.