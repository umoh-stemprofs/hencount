// Page timing harness (step 6). Mints a valid demo session cookie with the
// same iron-session secret, then times each page route with warm fetches.
// Run against dev (`npm run dev`) or production (`npm start`) on port 3001.
//
//   npx tsx scripts/timing.ts [runs] [port]
import "dotenv/config";
import { sealData } from "iron-session";
import { SESSION_COOKIE } from "../lib/session-config";

const ROUTES: { route: string; note: string }[] = [
  { route: "/", note: "dashboard" },
  { route: "/eggs", note: "flocks" },
  { route: "/eggs/flock_good/advice", note: "advice + charts" },
  { route: "/eggs/flock_good/sell", note: "sell eggs" },
  { route: "/market", note: "market + 90d chart" },
  { route: "/weather", note: "weather (live call)" },
  { route: "/settings", note: "farm settings" },
];

async function main() {
  const runs = Number(process.argv[2] ?? 2);
  const port = Number(process.argv[3] ?? 3001);
  const base = `http://127.0.0.1:${port}`;

  const sealed = await sealData(
    { userId: "usr_demo", email: "demo@hencount.test", name: "Chidi Okafor" },
    {
      password: process.env.SESSION_SECRET!,
      ttl: 60 * 60 * 24 * 7,
    },
  );
  const headers = { cookie: `${SESSION_COOKIE}=${sealed}` };

  console.log(`base ${base} · ${runs} warm run(s) per route\n`);
  for (const { route, note } of ROUTES) {
    const times: number[] = [];
    let status = 0;
    for (let i = 0; i < runs; i++) {
      const start = performance.now();
      const res = await fetch(`${base}${route}`, { headers, redirect: "manual" });
      await res.arrayBuffer();
      times.push(Math.round(performance.now() - start));
      status = res.status;
    }
    console.log(
      `${route.padEnd(30)} ${String(status).padEnd(4)} ${times.map((t) => `${t} ms`).join("  ")}   (${note})`,
    );
  }
}

main()
  .catch((error) => {
    console.error("timing failed:", error);
    process.exitCode = 1;
  })
  .then(() => process.exit());
