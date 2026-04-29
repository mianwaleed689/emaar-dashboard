# DXB ANALYTICS - ALL 33 TABS DEFINITION & PLAN

## TAB DEFINITIONS & WIRING PLAN

### MARKET INTELLIGENCE GROUP
─────────────────────────────────────────────────────

Overview (423L - HAS REAL DATA)
  PURPOSE: Executive dashboard — KPIs, market pulse, quick wins
  SHOWS: Total transactions, avg yield, top communities, pipeline value
  NEEDS: liveNeighbourhoods → top 3 yielding communities widget
  PRIORITY: HIGH — agents see this first
  STATUS: Partially built, needs community widget

Market (565L - UNKNOWN)  
  PURPOSE: Dubai market trends — price growth, demand, supply
  SHOWS: Price index, transaction trends, sentiment
  NEEDS: liveNeighbourhoods → community price trends
  PRIORITY: HIGH
  STATUS: Unclear — needs audit

DLD Volumes (419L - PLACEHOLDER)
  PURPOSE: Real DLD transaction data by area
  SHOWS: Volume by community, off-plan vs ready, top areas
  NEEDS: liveNeighbourhoods → dldTransactions field
  PRIORITY: HIGH — we have real DLD data now
  STATUS: Placeholder — needs rebuild with DLD data

Price History (361L - SEED DATA)
  PURPOSE: Historical PPSF trends by community
  SHOWS: Price per sqft over time, appreciation %
  NEEDS: Historical DLD data (not yet available)
  PRIORITY: MED — needs historical data
  STATUS: Seed data — wire community PPSF

Neighbourhoods (630L - HAS REAL DATA)
  PURPOSE: Community intelligence hub
  SHOWS: 259 communities — yield, facilities, landmarks, scores
  STATUS: WORLD CLASS - Session 14 ✅

─────────────────────────────────────────────────────
### PROPERTY EXPLORER GROUP
─────────────────────────────────────────────────────

Launch Calendar (1724L - PLACEHOLDER)
  PURPOSE: Upcoming Dubai project launches
  SHOWS: Launch date, developer, community, payment plan, price
  NEEDS: liveNeighbourhoods → community yield + score per launch
  PRIORITY: HIGH — agents use daily
  STATUS: Large file, needs community panel per launch

Projects (2308L - HAS REAL DATA)
  PURPOSE: All Dubai projects catalog
  SHOWS: Project cards with details, community intel tab
  STATUS: Community Intel tab added Session 15 ✅

Map (382L - HAS REAL DATA)
  PURPOSE: Interactive map of all projects/communities
  SHOWS: Pins by yield/PPSF/volume layers
  NEEDS: Community popup with yield, score, facilities
  PRIORITY: HIGH — visual selling tool
  STATUS: liveNeighbourhoods wired, popups need enhancement

Handover (1419L - PLACEHOLDER)
  PURPOSE: Project completion timeline
  SHOWS: Handover dates, construction %, developer track record
  NEEDS: liveNeighbourhoods → community context per project
  PRIORITY: MED
  STATUS: Large file, needs community panel

Service Charges (140L - PLACEHOLDER)
  PURPOSE: RERA service charge by community
  STATUS: WORLD CLASS - Session 15 ✅

─────────────────────────────────────────────────────
### INVESTMENT TOOLS GROUP
─────────────────────────────────────────────────────

Yields (281L - HAS REAL DATA)
  PURPOSE: Rental yield rankings
  STATUS: WORLD CLASS - Session 15 ✅

STR vs LTR (238L - HAS REAL DATA)
  PURPOSE: Short vs long term rental comparison
  STATUS: WORLD CLASS - Session 15 ✅

Mortgage (389L - HAS REAL DATA)
  PURPOSE: UAE mortgage calculator with bank comparison
  SHOWS: Monthly payments, bank rates, amortization
  NEEDS: Community PPSF to auto-fill property price
  STATUS: Community picker added Session 15 ✅

Investment Score (191L - HAS REAL DATA)
  PURPOSE: Community investment score rankings
  STATUS: WORLD CLASS - Session 15 ✅

Flip (389L - HAS REAL DATA)
  PURPOSE: Property flip ROI calculator
  SHOWS: Buy/sell/reno costs, ROI scenarios
  NEEDS: Community PPSF auto-fill
  STATUS: Community picker added Session 15 ✅

Golden Visa (179L - HAS REAL DATA)
  PURPOSE: UAE Golden Visa eligible communities
  STATUS: WORLD CLASS - Session 15 ✅

DXB Estimate (181L - HAS REAL DATA)
  PURPOSE: AVM property valuation
  STATUS: WORLD CLASS - Session 15 ✅

─────────────────────────────────────────────────────
### CRM GROUP
─────────────────────────────────────────────────────

My Leads (1046L - HAS REAL DATA)
  PURPOSE: Lead management CRM
  SHOWS: Lead cards, pipeline, follow-ups, WhatsApp
  NEEDS: Community suggestions per budget
  STATUS: Community suggestions added Session 15 ✅

Team (460L - PLACEHOLDER)
  PURPOSE: Agent management
  SHOWS: Agent list, performance, leads assigned
  NEEDS: Community performance per agent
  PRIORITY: MED
  STATUS: Built but needs community performance data

Pipeline (452L - PLACEHOLDER)
  PURPOSE: Deal pipeline by stage
  SHOWS: Deals by stage, value, community
  NEEDS: liveNeighbourhoods → community context per deal
  PRIORITY: HIGH
  STATUS: Has community field, needs NBHD wiring

Listings (513L - PLACEHOLDER)
  PURPOSE: Property listings management
  SHOWS: Listed properties, price, community
  NEEDS: liveNeighbourhoods → community PPSF comparison
  PRIORITY: HIGH
  STATUS: Needs community data wiring

Portfolio (262L - SEED DATA)
  PURPOSE: Investment portfolio tracker
  SHOWS: Properties owned, yield, value, P&L
  NEEDS: liveNeighbourhoods → community data per holding
  PRIORITY: MED
  STATUS: Seed data, needs real community wiring

Agency (353L - PLACEHOLDER)
  PURPOSE: Agency profile and settings
  SHOWS: Agency info, subscription, branding
  NEEDS: Nothing from communities
  PRIORITY: LOW
  STATUS: Admin/settings tab — no community data needed

Compliance (227L - PLACEHOLDER)
  PURPOSE: RERA compliance tracking
  SHOWS: License status, permits, violations
  NEEDS: Nothing from communities
  PRIORITY: LOW
  STATUS: Regulatory tab — no community data needed

─────────────────────────────────────────────────────
### DEVELOPER INTELLIGENCE GROUP
─────────────────────────────────────────────────────

Banking (980L - PLACEHOLDER)
  PURPOSE: UAE bank mortgage rates comparison
  SHOWS: Bank rates, products, eligibility
  NEEDS: Nothing from communities directly
  PRIORITY: MED — standalone banking data
  STATUS: Large file, may already have content

Currency (240L - PLACEHOLDER)
  PURPOSE: Currency exchange rates
  SHOWS: AED vs major currencies, trends
  NEEDS: Nothing from communities
  PRIORITY: LOW — utility tab
  STATUS: Simple live data tab

Competitors (627L - PLACEHOLDER)
  PURPOSE: Competitor developer analysis
  SHOWS: Developer rankings, project count, delivery record
  NEEDS: Nothing from communities directly
  PRIORITY: MED
  STATUS: Needs developer data

Risk (300L - UNKNOWN)
  PURPOSE: Market risk assessment
  SHOWS: Supply risk, oversupply areas, price risk
  NEEDS: liveNeighbourhoods → supplyRisk field per community
  PRIORITY: HIGH — investors need this
  STATUS: Unknown — needs audit

Financials (937L - UNKNOWN)
  PURPOSE: Developer financial health
  SHOWS: Developer financials, escrow, delivery rate
  NEEDS: Nothing from communities directly
  PRIORITY: MED
  STATUS: Large file, needs audit

Dev Portal (379L - PLACEHOLDER)
  PURPOSE: Developer project portal
  SHOWS: Developer projects, availability, pricing
  NEEDS: Nothing from communities directly
  PRIORITY: LOW
  STATUS: Placeholder

Developer Health (498L - PLACEHOLDER)
  PURPOSE: Developer health scoring
  SHOWS: Delivery rate, escrow, complaints, rating
  NEEDS: Nothing from communities directly
  PRIORITY: MED
  STATUS: Has project data, needs enhancement

Intelligence (558L - PLACEHOLDER)
  PURPOSE: AI market intelligence
  SHOWS: AI insights, market predictions, alerts
  NEEDS: liveNeighbourhoods → all data for AI analysis
  PRIORITY: HIGH — premium feature
  STATUS: Placeholder, needs AI integration

Marketing (713L - PLACEHOLDER)
  PURPOSE: Marketing tools for agencies
  SHOWS: Brochure generator, social posts, reports
  NEEDS: liveNeighbourhoods → community data for reports
  PRIORITY: MED
  STATUS: Placeholder

─────────────────────────────────────────────────────
## WIRING PRIORITY PLAN

### NEEDS COMMUNITY DATA (wire liveNeighbourhoods):
HIGH: Overview, DLD Volumes, Launch Calendar, Map popup, 
      Pipeline, Listings, Risk, Intelligence
MED:  Market, Handover, Portfolio, Team, Marketing

### DOES NOT NEED COMMUNITY DATA:
Agency, Compliance, Currency, Dev Portal — standalone tabs

### NEEDS REBUILD (placeholder/seed data):
HIGH: DLD Volumes, Launch Calendar, Risk
MED:  Portfolio, Pipeline, Listings, Developer Health

### ALREADY WORLD CLASS:
Neighbourhoods, Yields, Investment Score, Service Charges,
Golden Visa, DXB Estimate, STR vs LTR, Projects

─────────────────────────────────────────────────────
## SESSION 16 PLAN

1. DLD Volumes → rebuild with real transaction data (we have it)
2. Overview → add top communities widget
3. Launch Calendar → add community intel panel per launch
4. Risk tab → wire community supplyRisk data
5. Pipeline + Listings → wire community context