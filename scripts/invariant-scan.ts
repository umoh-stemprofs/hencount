// Salt-invariant scan (00-global.md §3): "on every day at least one crop is
// rising and one is falling". Scans day by day over a multi-year window and
// prints counts plus the first failing days, if any.
// Run: npx tsx scripts/invariant-scan.ts
import { CATALOG } from "../lib/market/catalog";
import { changePctFor } from "../lib/market/generator";

function key(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function main() {
  const start = new Date(Date.UTC(2026, 0, 3)); // first day with a yesterday
  const end = new Date(Date.UTC(2028, 11, 31));
  let total = 0;
  let failures = 0;
  const firstFailures: string[] = [];

  for (let t = start.getTime(); t <= end.getTime(); t += 86_400_000) {
    const day = new Date(t);
    total++;
    const changes = CATALOG.map((meta) => changePctFor(meta.crop, day));
    const up = changes.some((pct) => (pct ?? 0) > 0);
    const down = changes.some((pct) => (pct ?? 0) < 0);
    if (!up || !down) {
      failures++;
      if (firstFailures.length < 12) {
        firstFailures.push(
          `${key(day)} up=${up} down=${down} [${changes
            .map((pct) => (pct === null ? "?" : pct.toFixed(2)))
            .join(", ")}]`,
        );
      }
    }
  }

  console.log(`days scanned: ${total}`);
  console.log(`failing days: ${failures}`);
  for (const line of firstFailures) console.log(`  ${line}`);
}

main();
