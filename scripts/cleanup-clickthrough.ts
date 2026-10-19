// One-off cleanup (step 6): removes the throwaway account the click-through
// created (judge-ada@test.dev). Cascade deletes its farm, flocks, logs,
// sales, feed price and weather snapshots. The seeded demo account is
// never touched. Run: npx tsx scripts/cleanup-clickthrough.ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const result = await db.user.deleteMany({
    where: { email: "judge-ada@test.dev" },
  });
  console.log(`Deleted ${result.count} click-through test account(s).`);
}

main()
  .catch((error) => {
    console.error("Cleanup failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
