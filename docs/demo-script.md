# Demo video script — HenCount (5–7 minutes)

Record the browser full-screen (1080p), mic on. Start on the login page.
All timestamps are cumulative; keep the pace — click, talk, move on.

## 0:00–0:30 — Hook and login page

- Show `http://localhost:3001/login` (or the hosted URL).
- Say: "HenCount is a daily egg-and-feed logger for poultry farmers. Three
  numbers a day — hens, eggs, feed — turn into laying advice, today's
  profit, and a live value on the eggs still in your stock."
- Point at the footer: "Decision-support tool. You decide."

## 0:30–1:15 — Sign up, then wrong password, then demo login

- Click **Create account** → name, email, a password (say: "at least 8
  characters") → land on an empty dashboard with friendly "—" placeholders.
- Log out. On `/login`, type the demo email with a **wrong password** →
  show the sentence "Wrong email or password. Try again." (say: "the app
  never says which of the two was wrong").
- Click **Try demo account** (mention: this button only exists when
  `DEMO_MODE=true`). Land on Chidi's full dashboard.

## 1:15–2:15 — Dashboard: stat cards, charts, weather card

- **Stat cards**: Today's eggs 432 · Stock value ₦164,952 (Simulated badge)
  · Profit today ₦12,287 with "Revenue ₦59,932 · feed ₦47,645".
- **Bar chart** "Eggs per day, all flocks, last 7 days" (Saved data badge) —
  click **View as table** for two seconds.
- **Pie chart** "Share of egg stock value by flock" — point out the "Other"
  slice (max 5 slices rule).
- **Egg tray price card** (Simulated) and the **weather card** with the
  green **"Live · updated just now"** badge — say: "this one is a real
  external API call for the farm's own coordinates."

## 2:15–3:00 — Prove the live call (Network tab) ⭐ required by the rules

- Open DevTools → **Network** tab. Reload the page.
- Filter by `open-meteo` (or Doc): click the `weather` or dashboard request,
  open the **Server** or response preview, and show the JSON with
  `temperature_2m` etc. Say: "This is the real Open-Meteo API, called on the
  server for coordinates 4.8156, 7.0498 — Port Harcourt."
- Close DevTools. Open the **Weather page** → current conditions, 5-day
  forecast, "What this means for the hens".

## 3:00–3:45 — Market: 3+ crops, chart toggles

- `/market`: egg tray price ₦4,162 (Simulated badge), the 7-day price
  table with day-over-day changes.
- **"Other crops, same market feed"**: Maize, Tomato, Cassava cards with
  today's price and change % — say: "the rules need prices for at least
  three crops — same feed, same badge."
- Price history line chart: click **7 days → 30 days → 90 days** (the
  toggle animates), then **View as table**.

## 3:45–4:45 — Eggs: add today, overwrite, advice states

- `/eggs`: one card per flock with stock value badges. Click **Add today**
  on Mango Creek layers.
- Step 1: hens 100, eggs **150** → Next → show the inline sentence
  "Eggs cannot be more than hens." (the form stops you on step 1).
- Fix to 85 → Step 2: feed 12.5 kg → **Save** → "Saved today's log."
- Click **Add today** again → point at "Today is already logged… Saving
  again replaces it." Change a number, save → "Updated today's log."
- Open **Advice** for Mango Creek: pill **"Laying well"**, eggs per 100
  hens, feed per hen, profit today, line chart with the 60 % line, profit
  chart.
- Back to `/eggs`, open **Palm Grove layers → Advice**: "Few eggs". Then
  **Creek Side layers**: "Too much feed". Then **Point of lay pullets**:
  "Keep adding — add 3 days". Say: "one flock per state, so every rule
  outcome is visible."

## 4:45–5:30 — Sell eggs: oversell blocked, stock drops

- On any flock: **Sell eggs**. Stock card shows eggs in hand and "Worth
  ₦…".
- Try to sell **200** when stock is 90 → Save → "You cannot sell more eggs
  than you have in stock."
- Sell **30** at the pre-filled market price → "Sold 30 eggs." Recent sales
  list appears; back on `/eggs` the stock is 60 and the dashboard stock
  value has dropped — say: "the value follows the market price."

## 5:30–6:15 — Settings, alerts, honest labels

- `/settings`: farm name, coordinates with "Use my location", feed price
  per kg — save → "Saved."
- Dashboard: toggle the **"Demo: show heat alert"** switch (only visible in
  `DEMO_MODE`) → the amber banner "Hot day. Give cool water. Eggs may
  drop." appears — say: "in real use this comes from the forecast."
- Point at the badges one last time: Live (weather), Simulated (prices),
  Saved data (your logs) — and the footer disclaimer.

## 6:15–6:45 — Logout, wrap-up

- Log out → back on `/login`.
- Wrap: "Three numbers a day in, advice and profit out. Weather is live;
  prices are a clearly-labelled simulated feed that a real API can replace.
  Sample thresholds need an expert's review — the app says so everywhere.
  Decision-support tool: the farmer decides."

## Recording checklist

- [ ] Network tab step (2:15) shows the real open-meteo response — required
      by the Agriculture rules ("show the live API call").
- [ ] No console errors visible at any point.
- [ ] Both a red "Loss" day and green days visible on a chart (Harbour layers).
- [ ] Total runtime 5–7 minutes.
