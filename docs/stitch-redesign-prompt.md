# Prompt: restyle HenCount to match the Stitch mockups, keeping charts and STEM rules

Work in `stem2026/hencount`. Redesign the app's visual layer so it matches the
Google Stitch mockups in `stitch_hencount_accessible_login_screen/`, while
keeping the charts, all logic, all routes and every STEM Agriculture rule
intact. This is a **presentation change, not a rebuild**.

## Source of truth

- Design system: `stitch_hencount_accessible_login_screen/clarity_calm_agricultural_standard/DESIGN.md`
  — read it fully first. It is authoritative for colour, type, spacing, shape,
  elevation, components and accessibility.
- Ten screens, each a folder with `code.html` (the exact intended markup and
  Tailwind classes) and `screen.png` (the intended result):

| Stitch folder | Route | Files to restyle |
|---|---|---|
| `hencount_log_in_mobile` | `/login` | `app/(auth)/login/page.tsx`, `components/LoginForm.tsx` |
| `hencount_make_an_account_desktop` | `/signup` | `app/(auth)/signup/page.tsx`, `components/SignupForm.tsx` |
| `hencount_home_desktop` | `/` | `app/(app)/page.tsx` |
| `hencount_my_hens_desktop` | `/eggs` | `app/(app)/eggs/page.tsx` |
| `hencount_add_today_s_eggs_desktop` | `/eggs/[flockId]/add` | `app/(app)/eggs/[flockId]/add/page.tsx`, `components/AddTodayForm.tsx` |
| `hencount_sell_eggs_desktop` | `/eggs/[flockId]/sell` | `app/(app)/eggs/[flockId]/sell/page.tsx`, `components/SellEggsForm.tsx` |
| `hencount_advice_for_mango_creek_layers_desktop` | `/eggs/[flockId]/advice` | `app/(app)/eggs/[flockId]/advice/page.tsx` |
| `hencount_prices_today_desktop` | `/market` | `app/(app)/market/page.tsx` |
| `hencount_weather_at_your_farm_desktop` | `/weather` | `app/(app)/weather/page.tsx` |
| `hencount_settings_desktop` | `/settings` | `app/(app)/settings/page.tsx`, `components/SettingsForm.tsx` |

Shell files touched by several screens: `app/(app)/layout.tsx`,
`app/(auth)/layout.tsx`, `components/NavLinks.tsx`, `tailwind.config.ts`,
`app/globals.css`, `components/StatCard.tsx`, `components/DataSourceBadge.tsx`,
`components/WeatherCard.tsx`, `components/EggPriceCard.tsx`, `components/HeatBanner.tsx`.

Open each `screen.png` in the browser alongside its `code.html` before you
edit the matching route. Match the mockup's structure and rhythm; where the
mockup shows invented placeholder numbers, wire in the real values the app
already computes.

## Read this first: the palette is already correct

`tailwind.config.ts` and `app/globals.css` already carry the right tokens —
canvas `#F7F8FA`, card `#FFFFFF`, border `#E4E7EC`, text `#101828`, muted
`#475467`, accent `#9A5B00`, success `#1B7F3B`, warning `#B54708`, danger
`#B42318`, info `#175CD3`, 12px card radius, Inter. **Do not churn these.**

The real gaps are typography scale, the shell, and component patterns:

1. **16 px type floor is violated.** `components/NavLinks.tsx` renders the
   phone bottom nav at `text-xs` (12 px). DESIGN.md prohibits anything below
   16 px anywhere. Fix it.
2. **Stat sizes are too small.** Stitch uses `display-stat` = 40 px / 700 for
   hero numbers; the app uses `text-4xl` (36 px). Move to 40 px.
3. **Body copy defaults to 18 px** (`body-lg`), not 16 px.
4. **Buttons are too short.** Stitch requires 52 px minimum, 56 px for primary
   actions, always with a left-aligned icon.
5. **Inputs are 54 px** with a 2 px border and a permanently visible label
   above — never placeholder-only.
6. **Focus ring is wrong.** `globals.css` uses 2 px outline / 2 px offset.
   Stitch requires a **3 px** stroke in `#9A5B00` separated by a **2 px white
   gap**.
7. **Active nav is wrong.** The app tints text (`bg-accent/10 text-accent`);
   Stitch fills the pill solid (`bg-[#9A5B00]` with white text).

## What to build

### 1. Tokens (`tailwind.config.ts`, `app/globals.css`)

Add the type scale as real Tailwind tokens so screens stop hard-coding
classes: `display-stat` 40/48 700, `headline-lg` 28/36 700, `headline-md`
24/32 700, `headline-sm` 20/28 600, `body-lg` 18/28 400, `body-lg-bold`
18/28 600, `label-lg` 18/24 600, `body-base` 16/24 400, `label-base` 16/20 600.
Keep the existing colour tokens. Add the spacing rhythm (`space-xs` 8,
`space-sm` 12, `space-md` 16, `space-lg` 24, `space-xl` 40) and the three
elevation levels from DESIGN.md (Level 1 data cards, Level 2 floating).
Fix the focus ring to 3 px + 2 px white gap. Keep the
`prefers-reduced-motion` block.

### 2. Shell (`app/(app)/layout.tsx`, `components/NavLinks.tsx`)

- Desktop sidebar: 256 px (`w-64`) or 288 px (`w-72`) — pick one and be
  consistent across screens; the mockups differ slightly between them.
- Sidebar brand: a 40×40 ochre rounded tile with an egg icon beside the
  wordmark, per `hencount_prices_today_desktop`.
- Nav items: **Home, Eggs, Prices, Weather, Settings** — adopt the mockup's
  words. The `/market` route keeps its URL; only its label changes to
  "Prices". Active item is a **solid** `#9A5B00` pill with white text and
  `aria-current="page"`.
- Sidebar footer: a "Barn Online" status row (tertiary dot + word) plus the
  "Decision-support tool. You decide." line, per the mockups.
- Top bar: 64–80 px, `backdrop-blur-xl`, subtle shadow.
- Main: `max-w-[1200px]` (home) / `max-w-7xl` (other pages), `px-8 py-6`.
- Phone: single column, 16 px side margin, sticky top bar, fixed 4-item
  bottom nav with **16 px** labels and icons — 12 px is not allowed.

### 3. Cards, badges, buttons, inputs

- **Cards**: white, 12 px radius, 1 px `#E4E7EC`, 24 px padding, Level 1
  shadow. Metric card pattern = small label row with trailing icon, then the
  40 px number, then an 16–18 px caption, exactly as in the mockups.
- **Badges**: `DataSourceBadge` keeps its `live | saved | simulated` contract
  and its icon + word rule, but restyle to the mockup's pill: tinted
  background, matching 1 px border, 16 px label. Success `#E8F5E9`/`#1B7F3B`,
  warning `#FEF0C7`/`#B54708`, danger `#FEE4E2`/`#B42318`, info
  `#EFF8FF`/`#175CD3`.
- **Buttons**: primary solid `#9A5B00`, white 18 px bold text, 56 px tall,
  left 24 px icon. Secondary white with a 2 px `#D0D5DD` border and `#101828`
  text, 52 px. Active state darkens 10 %; no micro-animation.
- **Inputs**: 54 px, 2 px `#D0D5DD`, white, 18 px text, focus border
  `#9A5B00`, label permanently above at 18 px semibold with a leading icon.
- **Numeric steppers** (Settings feed price, Add today, Sell eggs): the
  mockups use large 56×56 `+`/`−` tap targets flanking a 40 px number, with
  real `aria-label`s like "Decrease feed price by 10 Naira" and "Decrease by
  one tray". Add these — they are a genuine usability win for gloved hands and
  they are already in the mockups.

### 4. Charts — keep them, restyle only

This is the important constraint. **Keep** `components/charts/ProfitLineChart.tsx`,
`PriceLineChart.tsx`, `EggBarsChart.tsx`, `StockPieChart.tsx`, all of
`lib/charts.ts` and every file in `lib/charts.test.ts` (and the other 10 test
files). Do not change chart data shapes, series logic, the 7/30/90-day toggle,
gap handling, or the "View as table" behaviour.

Restyle to the mockups' chart language: ochre `#9A5B00` series at 4 px with
round caps, white-filled point circles with a 3 px ochre stroke and the final
point filled solid, grid lines in `#E9EDFF` at 1.5 px, axis labels 16 px in
`#475467`, and the dashed `#B42318` threshold line with its plain-English
legend ("Low line: check your hens if eggs go below this"). Recharts stays —
the mockups' inline SVG is a drawing, not an instruction to replace the chart
library.

Add the mockup's **accordion** pattern for the data table: a full-width
header button reading "Show numbers / A table of the last 7 days / Tap to
view" that expands the existing table. Keep the table itself.

### 5. Screen-specific notes from the mockups

- **Home**: 12-column desktop grid, 7 cols of content + 5 cols of charts.
  Big production card with an "Active Flock" chip, the 40 px egg count, "from
  380 hens (82 % laying rate)", and an "Add today's eggs" button; two
  side-by-side cards for money-today and eggs-in-store; the heat warning
  banner; then a two-row card with weather now and egg tray price. Charts
  move into the right column as accordions.
- **My hens**: three farm-wide stat tiles (total hens, total eggs, losses)
  above the per-flock cards.
- **Advice**: a large status headline ("Laying well. Keep going.") with the
  laying-rate and feed-per-hen stats beside it, then the chart accordions.
- **Weather**: a 40 px current temperature with condition, a "Next 5 days"
  list, and the existing demo/scenario switcher under the mockup's "System
  Scenarios" heading. Keep `DEMO_MODE` working.
- **Settings**: "My farm" and "Feed price" sections, the feed price rendered
  as a stepper.
- **Sell eggs**: stock count as a 40 px stat, a tray stepper, the live price,
  a running total, and the mockup's "Store Safety Rules" panel — that panel
  maps onto the existing "cannot sell more than stock" validation, so surface
  the real rule text there.
- **Login / signup**: single centred card, the error card pattern (tinted
  background, 2 px border, icon + sentence), a "Show/Hide" password toggle,
  then "Try demo account" and "Make an account" as full-width secondary
  buttons.

## Constraints — the official Agriculture rules

Authoritative source: `STEM Rules/STEM Festival software-senior.pdf`,
"Task Option 1 — Agriculture: The 'Agro-Analytics' Farm Dashboard".
`../../docs/00-global.md` §1 is a **derived** working summary (it says so
itself: "from the 3 official PDFs") — if the two ever disagree, the PDF wins.
`docs/rules-checklist.md` is this app's own proof sheet against both.

### Scoring this redesign actually moves

| Criterion | Pts | How the redesign touches it |
|---|---|---|
| API Integration | 25 | Unchanged, but live data must stay **legible** — a restyle that hides the Live/Saved/Simulated truth costs points here |
| Analytics Logic | 20 | Unchanged. Do not touch `lib/eggs.ts`, `lib/charts.ts`, `lib/dashboard.ts` |
| **UI/UX Excellence** | **15** | "Professionalness, layout, and clarity of the dashboard interface" — **this is the whole point of the task** |
| Code Structure | 15 | Token/class cleanup only; no logic reshuffling |
| **Innovation** | **15** | "Unique features like harvest alerts or historical price trends" — the accordion chart tables and large steppers are cheap wins here |
| Documentation | 10 | Unchanged |

### Mandated by the PDF — must survive verbatim

- **Data Visualization**: "advanced charts (line, bar, or pie) to represent
  inventory and market trends". Line, bar and pie must all still be present,
  each with "View as table".
- **Responsive Design**: "accessible and readable across different screen
  sizes".
- **API Connectivity**: "fetch and display data from at least one external
  source" — the Open-Meteo call must still be visible on screen.
- **Inventory Analytics**: the "Estimated Market Value" of stock from live
  prices.
- **Weather Intelligence**: forecasts for the farm's own coordinates.
- **Market Price Integration**: current prices for at least three crops.
- **Ethical Code → Transparency**: "Clearly state which parts of the data are
  live and which are simulated". This is the PDF's own justification for
  `DataSourceBadge` — icon + word, never colour alone.
- **Ethical Code → Security**: API keys in environment variables, never in
  the bundle or markup.
- **Ethical Code → Data Integrity**: displayed data must be accurate.
- **§9 Disclaimers**: "The system is a decision-support tool; users are
  responsible for final farm decisions." That is the footer line — keep it on
  every page including login and signup. The mockups show only this line; the
  app also carries a second sentence about simulated prices and sample
  thresholds needing expert review — keep both.

### This app's own quality bar (stricter than the PDF — do not relax it)

These come from `DESIGN.md` and `00-global.md`, not the competition PDF. They
are already met; breaking one is a regression a judge could still catch.

- **No text below 16 px.** Audit every class you touch — `text-xs`,
  `text-[12px]`, `text-[13px]`, `text-[14px]` must all go.
- **Touch targets 48 px minimum**; the mockups' 52/54/56 px are the target.
- **Colour never the only signal** for status.
- Money stays integer kobo, formatted only by `formatNaira()`. Dates stay
  `YYYY-MM-DD` in `APP_TZ`. Bad input stays one plain sentence.
- **Never invent a number.** Where a mockup shows a placeholder value, use
  the real computed value or the app's existing empty state.

## Verification — required before claiming done

1. `npm run tsc`, `npm run test`, `npm run lint`, `npm run scan:invariants`,
   `npm run build` — all clean. Existing tests must pass untouched.
2. **A green build does not prove the redesign.** Start the dev server and
   compare every route against its `screen.png` side by side in the browser.
3. Phone width (~390 px) **and** desktop (~1280 px) for every route —
   check nothing overflows, the bottom nav is tappable, and no text is
   clipped.
4. Keyboard-tab through every form: the 3 px focus ring must be visible on
   every interactive element.
5. Confirm the footer line renders on every page including login and signup.
6. Confirm the badges still say the truth (Live / Saved data / Simulated) on
   the dashboard, market, eggs, sell, advice and weather screens.
7. Confirm the charts still render, still toggle 7/30/90 days, still show
   gaps as gaps, and "View as table" still works.
8. Run `npm run scan:invariants` last — it guards the app-wide rules.
