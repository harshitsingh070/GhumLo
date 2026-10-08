---
target: frontend-react/src
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:D:\\Desktop\\Serp-Travel-Project\\frontend-react\\src"
timestamp: 2026-10-08T13-32-38Z
slug: frontend-react-src
---
Method: dual-agent (A: ses_ee44b3a0effem4EnRMNiDlP3Bg · B: ses_ee44b39e0ffetxBYwfqRfE9E53)

## Design Health Score – frontend-react/src (GhoomLo)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | 180s plan wait vs 2.2s step theater, no Cancel/elapsed |
| 2 | Match System / Real World | 2 | ISO dates in TripHero, DEL-code input, invented slot tags |
| 3 | User Control and Freedom | 2 | No Cancel, no Undo after recompute, modal no Esc |
| 4 | Consistency and Standards | 2 | 3 budget math variants, 2 heroes, Live vs Saved labels |
| 5 | Error Prevention | 1 | Only return>departure checked; no origin==dest/past-date/budget sanity |
| 6 | Recognition Rather Than Recall | 2 | Cross-page recall home→trip, map badge vs list numbering |
| 7 | Flexibility and Efficiency | 3 | NL Fill+manual+demo+prefill good; no recents/shortcuts |
| 8 | Aesthetic and Minimalist Design | 2 | 10-section dashboard always expanded, coral overuse |
| 9 | Error Recovery | 3 | ErrorState + Adjust search good; suggestions generic |
| 10 | Help and Documentation | 2 | How-it-works present; Travel-style tiers only title-tooltips |
| **Total** | | **21/40** | **Acceptable** |

## Design Specificity Verdict
Category-interchangeable SaaS travel template with INR/budget veneer. Coherent Inter-only scale, white glass-panel cards, coral/navy/gray could be fintech/HR. Hero + TripHero duplicate same veil+eyebrow+preview pattern. Headline/copy fits any AI planner. Missed GhoomLo wander/budget anxiety, India-specific realities (train/bus/family/monsoon/UPI), diet dropped after NL parse. Orphan TripBudgetCard donut never rendered; 4 competing budget widgets fragment trust.

Deterministic scan: 5 warnings (side-tab 2, overused-font 3) in ExchangeRateNote.jsx:27, PickCard.jsx:184, index.css:71,175,791. Inter hits confirm LLM Inter-only monotony. Side-tabs confirm card-accent sameness. Arial print hit is false positive (print fallback).

## What's Working
1. StickyBudgetSummary – single glance truth with role=status live.
2. LoadingProgress – labeled steps + determinate bar + skeletons.
3. Hotel picker transparency – rebuild cost stated, tier titles honest.

## Priority Issues
- [P1] Builder overwhelms – TripForm.jsx 6 inputs + NL + styles + demo at once, no steps.
- [P1] No commit path – TripPage after verdict has scroll/switch/slider but no Save/Book/share-link.
- [P1] Dashboard dump – 10 sections expanded, 3 budget maths, orphan donut.
- [P2] Map focus – showAll dots by default, name pills only for active, legend-as-nav subordinate.
- [P2] Wait gap – 180s timeout, no Cancel, supersede-abort invisible.

## Persona Red Flags
- Jordan (first-timer): Travel-style pills no price preview, DEL default, insider stats, invented tags.
- Sam (a11y): div role=button stops, map role=img no table, color-only Live/Cached, 11px muted contrast risk, icon-only controls, modal no trap/Esc.
- Casey (mobile): -mt-28 overlap, swap hidden on mobile, duplicate preview cards, sticky consumes height, interruption loses plan, carousel overshoot.

## Minor Observations
- TripHero ISO dates vs strip humanized; Header bell/avatar imply missing accounts; Destinations price duplicated; BADGE_COLORS dead; What-If slider max absurd.

## Questions to Consider
- If budget is product, why is real budget input smallest field while sample buffer dominates?
- What if 180s wait were core UX (cancel/background/partial) not spinner?
- Which budget widget would you kill to make one unquestionably true?
