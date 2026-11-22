# HealthMetrics interface system

## Purpose and authority

An adult health calculator with optional private history. Both calculator and history are task-oriented surfaces (Operate mode). This refinement retains the existing light emerald identity, bilingual content, calculation policy and account permissions. The existing workflow is the source of product truth; there are no invented patient statistics, forecasts or decorative data.

## Typography and palette

Self-hosted variable Noto Sans Thai supports Thai and English, weights 400–700; font-display swap and local preloads keep the interface usable while fonts load. Font files and the OFL license are in public/fonts. One family carries headings, controls and data; tabular numerals align measurements. Body is 16px, labels 14px, secondary metadata 12–14px. Headings use a fixed rem scale and restrained weights.

Tokens live in src/app/globals.css: background #F4F7F6, white surface, ink #192F29, muted #546B62, line #DBE5DF, primary forest #145B46 and soft accent #EAF3ED. Primary green identifies an action or selected state. Error, warning and BMI categories keep their semantic meanings. Focus uses a visible contrasting outline; selection and caret are themed.

## Layout and controls

A shared 1200px shell and compact app header connect Calculator and History. On narrow screens navigation wraps below brand and language controls. Account controls collapse into a short bar; authentication opens inline on explicit action and returns focus to its trigger when closed. The calculator remains available without signing in.

Calculator: short introduction, account bar, input form and results in two columns at 1024px+, stacked below that. Summary results precede the optional save form, with supporting tables below it. Formulas are disclosed on demand. Borders, space and type establish hierarchy; gradients, large drop shadows and decorative label rows are absent.

History: compact identity, date filtering and record list. Two-record comparisons show each metric's two values and signed difference together on mobile; desktop uses the corresponding table. Date, owner, edit/delete confirmation and formula version remain findable. No horizontal page scrolling is required.

Surfaces use a single border and 12–16px radius. Controls use 8px radius and 44px minimum action height. Shared hm-* classes define controls and layout. Use authored stroke SVG for meaningful interface icons; no emoji stand-ins. Motion is limited to short state feedback and respects reduced-motion preferences.

## Verification

Check both languages at 320, 375, 1024 and 1280px, long record titles, loading/empty/error states, keyboard account disclosure, form correction, data saving and mobile comparison. Tests retain isolated fictional accounts and measurement fixtures. Review screenshots of the actual pages; a detector is supporting evidence rather than proof of visual quality.

## Public demonstration

The demo inherits the calculator/history visual system. A persistent fictional-data banner and reset action distinguish sample interactions from account-backed records. Open on history with two selected examples so a portfolio reviewer can see comparison immediately. Calculator and sample history switch within the demo. Changes are local to the open page and reload restores the samples. The standalone deployment links to source instead of presenting account controls that have no backend.
