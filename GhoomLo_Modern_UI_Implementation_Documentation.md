# GhoomLo — Modern Glassmorphic Travel UI/UX Implementation Specification

## 1. Purpose

This document defines the complete visual system and implementation rules for redesigning GhoomLo into a modern premium travel-planning application.

The target aesthetic is a **dark cinematic travel dashboard + glassmorphism** interface:

- Deep navy/teal background
- Large destination photography
- Frosted translucent panels
- Coral/orange primary actions
- Cyan/teal secondary accents
- Large rounded cards
- Soft borders and shadows
- Dense but organized travel information
- Strong visual hierarchy
- Minimal navigation
- Image-driven destination discovery

The redesign is primarily a **frontend/UI transformation**. Existing backend APIs, search logic, SerpApi integration, itinerary generation, AI logic, pricing calculations, weather, map data, and business logic should remain intact unless an API contract must change.

---

# 2. Design Goals

## Primary goals

1. Make GhoomLo look like a production-grade travel startup rather than a prototype.
2. Create one coherent visual language across the entire application.
3. Reduce the feeling of endless vertically stacked cards.
4. Make the destination imagery the visual anchor.
5. Make trip cost and itinerary immediately understandable.
6. Integrate the AI assistant into the trip experience instead of presenting it as an isolated chatbot.
7. Make the UI feel modern on desktop while remaining responsive.
8. Preserve all existing functionality.

## Do NOT

- Do not create a second navbar.
- Do not add unnecessary navigation bars.
- Do not replace working backend functionality just for visual changes.
- Do not duplicate the same budget summary throughout the page.
- Do not use excessive borders around every element.
- Do not use random gradients everywhere.
- Do not use generic stock-looking placeholders when real destination images are available.
- Do not create a completely different design for every page.
- Do not hard-code fake API data into production components.
- Do not remove useful existing features just to simplify the design.

---

# 3. Reference Aesthetic

The target visual direction combines:

- Travel dashboard
- Premium SaaS
- Dark glassmorphism
- Cinematic destination photography
- Modern fintech-style data cards
- Airbnb/Booking-style travel discovery
- Linear-style spacing and typography discipline

The interface should feel:

**Premium + cinematic + intelligent + trustworthy + practical**

It should NOT feel:

**Gaming + cyberpunk + overly neon + cluttered + futuristic for the sake of being futuristic**

---

# 4. Global Design Tokens

## 4.1 Background

Primary page background:

```css
--bg-primary: #061B24;
--bg-secondary: #082733;
--bg-deep: #04141B;
```

Recommended subtle background gradient:

```css
background:
  radial-gradient(circle at 80% 0%, rgba(31, 104, 130, 0.28), transparent 32%),
  radial-gradient(circle at 10% 20%, rgba(255, 112, 91, 0.10), transparent 30%),
  #061B24;
```

Keep gradients subtle.

---

# 5. Color System

## Brand colors

```css
--brand-coral: #FF725E;
--brand-coral-hover: #FF624D;
--brand-coral-soft: rgba(255, 114, 94, 0.15);

--brand-teal: #20C7C9;
--brand-teal-soft: rgba(32, 199, 201, 0.14);

--brand-gold: #F7C948;
```

## Text

```css
--text-primary: #F7FAFC;
--text-secondary: #B8C7CC;
--text-muted: #7F969E;
```

## Surfaces

```css
--surface-glass: rgba(15, 43, 53, 0.68);
--surface-glass-light: rgba(255, 255, 255, 0.08);
--surface-card: rgba(9, 38, 48, 0.88);
--surface-hover: rgba(255, 255, 255, 0.10);
```

## Borders

```css
--border-glass: rgba(255, 255, 255, 0.16);
--border-soft: rgba(255, 255, 255, 0.09);
```

## Status

```css
--success: #43D17C;
--warning: #F7C948;
--danger: #FF725E;
--info: #48B8FF;
```

---

# 6. Typography

Use:

```text
Primary: Inter
Display/headings: Manrope
```

If the project already has a suitable font, do not add unnecessary dependencies.

## Heading scale

```css
Hero:        clamp(42px, 5vw, 72px)
H1:          40px
H2:          28px
H3:          20px
H4:          16px
Body:        14–16px
Small:       12–13px
```

Hero heading:

```css
font-weight: 800;
line-height: 0.98;
letter-spacing: -0.04em;
```

Regular headings:

```css
font-weight: 700;
letter-spacing: -0.025em;
```

Avoid excessive uppercase text.

Uppercase labels should only be used for small category labels:

```css
font-size: 11px;
font-weight: 700;
letter-spacing: 0.18em;
```

---

# 7. Border Radius

Use a deliberate radius hierarchy.

```css
--radius-sm: 10px;
--radius-md: 14px;
--radius-lg: 20px;
--radius-xl: 28px;
--radius-pill: 999px;
```

Hero and major dashboard containers:

```css
border-radius: 28px;
```

Cards:

```css
border-radius: 18px;
```

Inputs:

```css
border-radius: 12px;
```

Pills:

```css
border-radius: 999px;
```

---

# 8. Glassmorphism System

Glass should not be applied to everything.

## Main glass panel

```css
.glass-panel {
  background: rgba(10, 39, 49, 0.70);
  border: 1px solid rgba(255,255,255,0.14);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  box-shadow:
    0 20px 60px rgba(0,0,0,0.28),
    inset 0 1px 0 rgba(255,255,255,0.06);
}
```

## Light glass

```css
.glass-light {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.13);
  backdrop-filter: blur(18px);
}
```

## Important rule

Do not use:

```css
backdrop-filter: blur(40px);
```

everywhere.

Too much blur makes the interface muddy and hurts readability.

---

# 9. Navigation

There must be **exactly ONE primary navbar**.

## Desktop structure

```text
┌─────────────────────────────────────────────────────────────┐
│ GhoomLo │ Explore │ Plan Trip │ Destinations │ How it works │
│         │          Search                  Bell Avatar  CTA │
└─────────────────────────────────────────────────────────────┘
```

Recommended height:

```text
68–76px
```

The navbar should float over the hero rather than consume a separate giant section.

## Navbar

```css
background: rgba(4, 24, 32, 0.72);
border: 1px solid rgba(255,255,255,0.12);
backdrop-filter: blur(20px);
border-radius: 18px;
```

## Navigation

Active page:

```text
color: #FF725E
```

Active indicator:

```text
2px coral line
```

## Search

Search field:

```text
Search destinations, hotels, experiences...
```

Rounded pill.

---

# 10. Hero Section

The hero is the visual centerpiece.

## Structure

```text
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  SMART TRAVEL PLANNING               DESTINATION IMAGE     │
│                                                            │
│  Plan unforgettable                    Dubai skyline      │
│  trips with GhoomLo.                  sunset imagery      │
│                                                            │
│  description                           trip preview card  │
│                                                            │
│  feature  feature  feature                                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

Use a real destination image as the background.

Recommended hero height:

```text
500–620px
```

Do not put the trip form above the hero.

The hero should establish the product value proposition first.

---

# 11. Hero Copy

Recommended:

```text
SMART TRAVEL PLANNING

Plan unforgettable
trips with GhoomLo.
```

Accent:

```text
GhoomLo.
```

in coral.

Supporting text:

```text
Find flights, stays and experiences that fit your budget.
Compare real options and get a complete trip plan in one place.
```

Feature pills:

```text
✈ Real-time prices
Flights, hotels & more

▣ Budget friendly
Trips within your budget

✦ AI powered
Smart itineraries instantly
```

---

# 12. Trip Preview Card

Place a floating card on the right side of the hero.

Example:

```text
YOUR TRIP TO DUBAI

10 Oct → 13 Oct 2026
2 travelers

₹74,112
₹60,000 budget

23% over budget

Flight              ₹58,830
Hotel                ₹15,282

[ View Full Plan → ]
```

The card should visually overlap the hero image.

---

# 13. Trip Builder

Place the main trip builder immediately below/overlapping the hero.

It should be a single wide glass panel.

## Structure

```text
From
DEL – Delhi

To
Dubai, UAE

Dates
10 Oct – 13 Oct 2026

Travelers
2

Budget
₹60,000

[ Find my trip → ]
```

Second row:

```text
Travel style
[ Saver ] [ Balanced ] [ Comfort ]

[ Family ] [ Couple ] [ Friends ] [ Solo ]

□ Show only budget friendly options
```

Do not use the old large beige form.

---

# 14. Trip Dashboard

After searching, the page becomes a dashboard.

Recommended 3-column layout:

```text
┌───────────────┬───────────────────────────────┬───────────────┐
│ Trip Overview │ Itinerary + Map              │ Trip Budget   │
│               │                               │               │
│ destination   │ Day navigation               │ total cost    │
│ dates         │ activities                   │ flight        │
│ travelers     │ map                          │ hotel         │
│ weather       │                               │ warning       │
└───────────────┴───────────────────────────────┴───────────────┘
```

Suggested widths:

```text
25% / 50% / 25%
```

---

# 15. Trip Overview Card

Include:

- Destination image
- Destination
- Dates
- Traveler count
- Rating
- Short description
- Weather
- Currency
- Visa status

Example:

```text
Dubai, UAE

10 Oct – 13 Oct 2026 · 2 Travelers

A perfect mix of modern city life,
stunning architecture, beaches and adventure.

28°C   Pleasant
AED    Local currency
Visa   On arrival
```

---

# 16. Itinerary + Map

This should be one unified module.

Top navigation:

```text
Itinerary | Map | Cost | AI Guide | Good to Know | Vlogs
```

Left side:

```text
Day 1
Fri, 10 Oct

Day 2
Sat, 11 Oct

Day 3
Sun, 12 Oct
```

Middle:

```text
Arrive in Dubai
10:20 AM · Dubai International Airport

Check in to Hotel
02:00 PM

The Dubai Mall
Shopping · 4–5 hrs

The Dubai Fountain
Show · 1 hr
```

Right:

Interactive map.

Important behavior:

- Selecting an activity highlights its map marker.
- Selecting a marker highlights the activity.
- Day switch changes map route.
- Map uses the existing map provider/data.
- Do not replace the map logic merely for styling.

---

# 17. Budget Card

Budget must be highly visible but not repetitive.

Example:

```text
TRIP BUDGET

₹74,112
of ₹60,000

23% over budget

████████████████░░

✈ Flight
₹58,830
79%

▣ Hotel
₹15,282
21%

[ View Full Plan → ]
```

Use coral for over-budget.

Use teal/green for within-budget.

---

# 18. AI Assistant

The AI assistant should appear as a premium contextual panel.

Title:

```text
Your AI Trip Assistant
```

Subtitle:

```text
Ask anything about your Dubai trip.
```

Suggested questions:

```text
How can I reduce the cost?

What should I pack for Dubai?

Best time to visit Dubai?

Suggest restaurants near my hotel

Create a day-wise shopping plan
```

Input:

```text
Ask anything...
[ → ]
```

Do not make it look like ChatGPT copied into the website.

It should be visually native to GhoomLo.

---

# 19. Popular Experiences

Horizontal carousel.

Card structure:

```text
┌──────────────────┐
│                  │
│    IMAGE         │
│                  │
│ ♥                │
├──────────────────┤
│ Burj Khalifa     │
│ Attraction       │
│ ★ 4.8            │
└──────────────────┘
```

Recommended 5–6 visible cards on desktop.

Do not create giant cards.

Image ratio:

```text
4 / 3
```

---

# 20. Trip Tools

Use compact icon tiles.

```text
Cost Optimizer
Save up to 30%

Packing List
Smart checklist

Weather
Live forecast

Visa Information
Entry requirements

Restaurants
Top rated places

YouTube Videos
Travel guides
```

Grid:

```text
3 columns desktop
2 columns tablet
1 column mobile
```

---

# 21. Cost Optimization

Instead of a giant orange section:

```text
WAYS TO REDUCE THE COST
```

make it a recommendation card.

Example:

```text
Save ₹5,094

Stay 2 nights instead of 3.

This reduces your trip by ₹5,094.

[ Apply suggestion ]
```

The action should be clear.

---

# 22. Weather

Compact card:

```text
DUBAI · CURRENT WEATHER

34°C
Sunny

Humidity 58%
Wind 21 km/h
```

Do not dedicate excessive vertical space to weather.

---

# 23. Good-to-Know / Visa

Use compact expandable cards.

```text
Visa requirements
Entry requirements
Safety
Best season
Local currency
Transport
```

The detailed information can open in an expandable panel/modal.

---

# 24. Vlogs

Use YouTube thumbnails in a horizontal carousel.

Each card:

```text
IMAGE
Title
Channel · Duration
```

Never show broken images.

Fallback:

```text
background image
+
play icon
```

---

# 25. Component Architecture

Recommended React structure:

```text
src/
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── PageShell.tsx
│   │   └── GlassPanel.tsx
│   │
│   ├── hero/
│   │   ├── Hero.tsx
│   │   ├── HeroFeature.tsx
│   │   └── TripPreviewCard.tsx
│   │
│   ├── trip-builder/
│   │   ├── TripBuilder.tsx
│   │   ├── LocationField.tsx
│   │   ├── DateField.tsx
│   │   ├── TravelerField.tsx
│   │   ├── BudgetField.tsx
│   │   └── TravelStyleSelector.tsx
│   │
│   ├── trip/
│   │   ├── TripOverview.tsx
│   │   ├── TripBudget.tsx
│   │   ├── Itinerary.tsx
│   │   ├── ItineraryDay.tsx
│   │   ├── ActivityItem.tsx
│   │   ├── TripMap.tsx
│   │   └── TripTabs.tsx
│   │
│   ├── ai/
│   │   ├── AIAssistant.tsx
│   │   ├── SuggestedQuestion.tsx
│   │   └── AIInput.tsx
│   │
│   ├── discovery/
│   │   ├── ExperienceCarousel.tsx
│   │   ├── ExperienceCard.tsx
│   │   ├── RestaurantCard.tsx
│   │   └── DestinationCard.tsx
│   │
│   └── tools/
│       ├── TripTools.tsx
│       ├── CostOptimizer.tsx
│       ├── PackingList.tsx
│       ├── WeatherCard.tsx
│       ├── VisaCard.tsx
│       └── VlogCarousel.tsx
│
├── pages/
│   ├── Home.tsx
│   ├── PlanTrip.tsx
│   ├── TripResults.tsx
│   └── Destinations.tsx
│
├── styles/
│   ├── tokens.css
│   ├── glass.css
│   └── animations.css
│
└── assets/
```

Adapt this structure to the project's existing architecture rather than blindly recreating it.

---

# 26. CSS Architecture

Create centralized design tokens.

Example:

```css
:root {
  --bg-primary: #061B24;
  --bg-secondary: #082733;

  --surface: rgba(10, 39, 49, 0.72);
  --surface-light: rgba(255,255,255,0.08);

  --text-primary: #F7FAFC;
  --text-secondary: #B8C7CC;
  --text-muted: #7F969E;

  --coral: #FF725E;
  --teal: #20C7C9;
  --gold: #F7C948;

  --border: rgba(255,255,255,0.14);

  --shadow-lg:
    0 24px 70px rgba(0,0,0,0.30);

  --radius-card: 20px;
  --radius-large: 28px;
}
```

---

# 27. Buttons

Primary:

```css
background: #FF725E;
color: white;
border-radius: 12px;
padding: 13px 20px;
font-weight: 700;
```

Hover:

```css
transform: translateY(-1px);
filter: brightness(1.05);
```

Secondary:

```css
background: rgba(255,255,255,0.08);
border: 1px solid rgba(255,255,255,0.14);
color: #fff;
```

Do not use huge gradients.

---

# 28. Inputs

Inputs should be dark glass.

```css
background: rgba(255,255,255,0.07);
border: 1px solid rgba(255,255,255,0.12);
color: white;
border-radius: 12px;
```

Focus:

```css
border-color: rgba(255,114,94,0.75);
box-shadow: 0 0 0 3px rgba(255,114,94,0.12);
```

---

# 29. Cards

Default:

```css
background: rgba(9,38,48,0.82);
border: 1px solid rgba(255,255,255,0.11);
border-radius: 20px;
box-shadow: 0 18px 50px rgba(0,0,0,0.20);
```

Cards should have hierarchy.

Do not make every card identical.

Use:

- Hero cards
- Information cards
- Data cards
- Interactive cards
- Media cards

---

# 30. Image Rules

Images are extremely important in this theme.

Use:

```css
object-fit: cover;
```

Use dark overlays when text appears over images:

```css
background:
linear-gradient(
  to top,
  rgba(0,0,0,0.75),
  rgba(0,0,0,0.05)
);
```

Never place white text directly on a bright photograph without an overlay.

---

# 31. Animations

Keep animations subtle.

Page:

```css
animation: fadeUp 0.45s ease;
```

Cards:

```css
transition:
  transform 180ms ease,
  border-color 180ms ease,
  background 180ms ease;
```

Hover:

```css
transform: translateY(-3px);
```

Do NOT animate everything.

No excessive parallax.

No constant floating animations.

---

# 32. Responsive Design

## Desktop

At >= 1280px:

```text
Full dashboard
3-column layout
Large hero
6 experience cards where possible
```

## Tablet

768–1279px:

```text
2-column dashboard
Collapse trip overview where necessary
```

## Mobile

<768px:

```text
Single column
Navbar becomes compact
Hero image above text or background
Trip builder stacks vertically
Map moves below itinerary
AI assistant becomes a full-width card
Experience carousel becomes horizontal scroll
Trip tools become 2-column
```

---

# 33. Mobile Navigation

Desktop:

```text
GhoomLo | Explore | Plan Trip | Destinations | How it works | Search | Account
```

Mobile:

```text
GhoomLo                         ☰
```

Use a drawer for navigation.

Do not keep the desktop navbar compressed into unreadable text.

---

# 34. Accessibility

Required:

- Keyboard navigation
- Visible focus states
- Semantic buttons
- Proper labels
- Alt text for images
- Color contrast
- No information conveyed only by color
- Reduced motion support

Example:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

# 35. Existing Data Integration

Do NOT replace existing data structures just to implement the theme.

Map existing data into UI components.

Example:

```tsx
<TripOverview
  destination={trip.destination}
  dates={trip.dates}
  travelers={trip.travelers}
  weather={weather}
/>

<TripBudget
  total={trip.total}
  budget={trip.budget}
  flight={trip.flight}
  hotel={trip.hotel}
/>

<Itinerary
  days={trip.itinerary}
/>
```

Keep API calls outside purely presentational components where possible.

---

# 36. Important API/UI Separation

Use this architecture:

```text
API / Services
      ↓
State / Data Transformation
      ↓
Page Container
      ↓
UI Components
      ↓
Design System
```

Avoid:

```text
Component
  ↓
fetch()
  ↓
API
  ↓
business logic
  ↓
formatting
```

inside every visual component.

---

# 37. Icons

Use one icon library consistently.

Recommended:

```text
Lucide React
```

Examples:

```text
Plane
Hotel
MapPin
Calendar
Users
Wallet
Sparkles
CloudSun
Heart
Star
Navigation
Utensils
Briefcase
Play
```

Do not mix 4 different icon styles.

---

# 38. Maps

The map should visually match the dark theme around it while maintaining geographic readability.

Use:

- rounded container
- clipped map
- floating controls
- branded markers
- numbered itinerary markers
- hotel marker
- route line

The map itself does not need to become completely dark if that harms geographic readability.

---

# 39. Loading States

Do not show blank cards while APIs load.

Use skeletons:

```text
████████████████
████████
████████████
```

with subtle animated shimmer.

Example:

```css
.skeleton {
  background:
    linear-gradient(
      90deg,
      rgba(255,255,255,.05),
      rgba(255,255,255,.10),
      rgba(255,255,255,.05)
    );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

---

# 40. Error States

Example:

```text
We couldn't find flights for these dates.

Try:
• Different dates
• Another airport
• A higher budget

[ Change search ]
```

Do not display raw API errors.

---

# 41. Empty States

Example:

```text
No saved trips yet.

Start planning your next adventure.

[ Plan a trip → ]
```

---

# 42. Budget States

## Within budget

Use teal/green:

```text
✓ Within budget
₹34,440 / ₹60,000
```

## Near budget

Use gold:

```text
⚠ Near your budget
₹55,400 / ₹60,000
```

## Over budget

Use coral:

```text
! ₹14,112 over budget
₹74,112 / ₹60,000
```

---

# 43. Page Structure

## Home

```text
Navbar
Hero
Trip Builder
Popular Destinations
How GhoomLo Works
Features
CTA
Footer
```

## Plan Trip

```text
Navbar
Trip Builder
Search/loading state
Results
```

## Trip Results

```text
Navbar
Compact Trip Status
Trip Overview
Flight + Hotel
Itinerary + Map
AI Assistant
Popular Experiences
Trip Tools
Cost Optimization
Weather
Good to Know
Vlogs
Footer
```

## Destinations

```text
Navbar
Search
Featured destinations
Destination grid
Filters
```

---

# 44. Critical UX Rule

The user should understand these five things within the first few seconds:

1. Where am I going?
2. When am I going?
3. How much will it cost?
4. What will I do?
5. Why did GhoomLo choose this trip?

Everything else is secondary.

---

# 45. AI Coding Instructions

When using an AI coding agent, give it this instruction:

```text
You are redesigning the existing GhoomLo travel application.

IMPORTANT:
This is a UI/UX redesign, not a backend rewrite.

First inspect the complete existing repository.

Identify:
- framework
- routing
- components
- API/service layer
- state management
- CSS/Tailwind configuration
- existing trip data models
- map implementation
- image handling
- AI assistant implementation
- flight/hotel integrations

Do not modify working business logic unless required.

Implement the new GhoomLo design system from the provided UI specification.

TARGET STYLE:
- dark cinematic travel dashboard
- deep navy/teal background
- glassmorphism
- coral primary accent
- teal secondary accent
- large destination photography
- rounded 18–28px cards
- subtle borders
- soft shadows
- modern typography
- premium SaaS/travel aesthetic

CRITICAL:
There must be exactly ONE primary navbar.

Do not create duplicate navigation bars.

The page hierarchy should be:

Navbar
Hero
Trip Builder
Trip Dashboard
Trip Overview
Itinerary + Map
Trip Budget
AI Trip Assistant
Popular Experiences
Trip Tools
Cost Optimization
Weather
Good to Know
Vlogs
Footer

Preserve every existing working feature.

Replace the presentation layer instead of rewriting backend logic.

Use reusable components.

Create centralized design tokens.

Do not hard-code API data.

Use existing API responses.

Use existing map implementation.

Use real images returned by the application.

Add graceful fallbacks for missing images.

Make the interface responsive.

Desktop must look like a premium travel dashboard.

Mobile must become a single-column travel planning experience.

Before coding:
1. Inspect repository.
2. Identify current architecture.
3. Create a UI migration plan.
4. Identify reusable existing components.
5. Identify components that need replacement.
6. Implement the design system.
7. Implement layout.
8. Implement components.
9. Connect existing data.
10. Test every existing interaction.

Do not stop after creating a static mockup.

The final result must be an actual working UI connected to the existing application.
```

---

# 46. AI Agent Execution Strategy

Do NOT ask an AI coding agent:

```text
"Make my website modern."
```

That produces inconsistent results.

Instead execute in phases.

## Phase 1 — Audit

Ask AI to inspect:

```text
Do not change code.

Analyze the repository and produce:
- architecture
- routes
- components
- API services
- state management
- styling system
- reusable components
- existing data models
- technical debt
- UI components that can be reused
- UI components that should be replaced
```

## Phase 2 — Design System

Then:

```text
Implement only:
- color tokens
- typography
- spacing
- radius
- shadows
- glass utilities
- buttons
- inputs
- cards
- badges
- tabs
- skeletons
```

Do not redesign pages yet.

## Phase 3 — Navbar + Hero

Implement:

```text
Navbar
Hero
Trip preview
```

Verify.

## Phase 4 — Trip Builder

Implement:

```text
Trip builder
Travel style
Search state
Loading state
```

Verify existing search functionality.

## Phase 5 — Results Dashboard

Implement:

```text
Trip overview
Budget
Flight
Hotel
Itinerary
Map
```

## Phase 6 — AI

Implement:

```text
AI assistant
Suggested questions
Context
Input
Loading
Errors
```

Keep the existing AI backend.

## Phase 7 — Discovery

Implement:

```text
Popular places
Restaurants
Attractions
Vlogs
```

## Phase 8 — Tools

Implement:

```text
Cost optimizer
Packing
Weather
Visa
```

## Phase 9 — Responsive

Test:

```text
1440px
1280px
1024px
768px
430px
390px
```

## Phase 10 — Polish

Fix:

- spacing
- typography
- image ratios
- overflow
- animations
- accessibility
- loading states
- error states
- mobile navigation

---

# 47. AI Review Prompt

After implementation, give the coding AI this:

```text
Review the entire GhoomLo UI against the design specification.

Do not add new features.

Check only:

1. Is there exactly one navbar?
2. Is the visual hierarchy correct?
3. Are cards excessively repetitive?
4. Are borders overused?
5. Is the glass effect subtle?
6. Is the coral accent used consistently?
7. Is typography consistent?
8. Are destination images prominent?
9. Is budget information easy to understand?
10. Is itinerary connected visually to the map?
11. Does AI assistant feel native to the product?
12. Are all existing API results still displayed?
13. Are loading states implemented?
14. Are broken images handled?
15. Is the mobile layout usable?
16. Are there horizontal overflow problems?
17. Are buttons and controls consistent?
18. Are accessibility states present?

Fix every issue you find.

Do not rewrite working business logic.
```

---

# 48. Definition of Done

The redesign is complete only when:

- [ ] Exactly one navbar
- [ ] Dark cinematic background
- [ ] Glassmorphism used consistently
- [ ] Coral CTA system implemented
- [ ] Hero redesigned
- [ ] Trip builder redesigned
- [ ] Trip dashboard redesigned
- [ ] Budget visualization redesigned
- [ ] Flight card redesigned
- [ ] Hotel card redesigned
- [ ] Itinerary redesigned
- [ ] Map integrated with itinerary
- [ ] AI assistant redesigned
- [ ] Popular places redesigned
- [ ] Restaurant cards redesigned
- [ ] Vlogs redesigned
- [ ] Weather redesigned
- [ ] Visa information redesigned
- [ ] Cost optimizer redesigned
- [ ] Packing list redesigned
- [ ] Loading states implemented
- [ ] Error states implemented
- [ ] Empty states implemented
- [ ] Broken images handled
- [ ] Desktop responsive
- [ ] Tablet responsive
- [ ] Mobile responsive
- [ ] Existing APIs still work
- [ ] Existing search still works
- [ ] Existing map still works
- [ ] Existing itinerary still works
- [ ] Existing AI still works
- [ ] No duplicate navbar
- [ ] No unnecessary duplicated content
- [ ] No fake hard-coded production data
- [ ] No console errors
- [ ] No horizontal overflow
- [ ] Accessibility reviewed

---

# 49. Final Visual Target

The final GhoomLo interface should feel like:

```text
        CINEMATIC TRAVEL IMAGE
                 +
        PREMIUM GLASS UI
                 +
       REAL-TIME TRAVEL DATA
                 +
          AI ASSISTANT
                 +
       SMART BUDGET PLANNING
```

The goal is not simply to make the existing UI darker.

The goal is to make the product look like a **cohesive premium travel platform**.

The visual identity should be recognizable immediately as GhoomLo.
