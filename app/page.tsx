export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-12">
      <div className="rounded-card border border-border bg-surface p-8 shadow-card">
        <p className="text-sm font-medium text-accent">HenCount</p>
        <h1 className="mt-2 text-2xl font-semibold text-text">
          Eggs, feed and profit
        </h1>
        <p className="mt-3 leading-6 text-muted">
          Step 1 complete: database schema and seed data are in place — one
          flock per status (good, few eggs, too much feed, keep adding), egg
          sales, feed price and simulated egg-tray prices.
        </p>
        <p className="mt-3 leading-6 text-muted">
          Dashboard, forms and charts arrive in the next steps.
        </p>
      </div>
    </main>
  );
}
